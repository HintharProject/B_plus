import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { donorProfileInputSchema } from "@/lib/domain";
import { writeAudit } from "@/lib/server/audit";
import { jsonError, requireUser } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const profile = await adminDb.doc(`donorProfiles/${auth.uid}`).get();
    return NextResponse.json({ profile: profile.exists ? profile.data() : null });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const input = donorProfileInputSchema.parse(await request.json());

    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.doc(`users/${auth.uid}`);
      const profileRef = adminDb.doc(`donorProfiles/${auth.uid}`);
      const user = await transaction.get(userRef);
      const existingProfile = await transaction.get(profileRef);
      const roles = new Set<string>(user.get("roles") ?? ["REQUESTER"]);
      roles.add("DONOR");
      transaction.set(userRef, {
        roles: [...roles],
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(profileRef, {
        ...input,
        userId: auth.uid,
        accountState: "ACTIVE",
        eligibilityState: "FACILITY_CONFIRMATION_REQUIRED",
        createdAt: existingProfile.exists
          ? existingProfile.get("createdAt")
          : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await writeAudit(auth.uid, "DONOR_PROFILE_UPDATED", "DONOR_PROFILE", auth.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
