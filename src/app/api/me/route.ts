import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { userProfileUpdateSchema } from "@/lib/domain";
import { writeAudit } from "@/lib/server/audit";
import { jsonError, requireUser } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const [user, donor, memberships] = await Promise.all([
      adminDb.doc(`users/${auth.uid}`).get(),
      adminDb.doc(`donorProfiles/${auth.uid}`).get(),
      adminDb.collection("organizationMembers").where("userId", "==", auth.uid).get(),
    ]);

    return NextResponse.json({
      id: auth.uid,
      email: auth.email ?? null,
      emailVerified: auth.email_verified === true,
      profile: user.exists ? user.data() : null,
      donorProfile: donor.exists ? donor.data() : null,
      memberships: memberships.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      isAdmin: auth.admin === true,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const input = userProfileUpdateSchema.parse(await request.json());
    const userRef = adminDb.doc(`users/${auth.uid}`);
    const donorRef = adminDb.doc(`donorProfiles/${auth.uid}`);

    const batch = adminDb.batch();
    batch.set(userRef, {
      ...input,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Keep contact info in sync with donor profile if it exists
    if (input.phone !== undefined || input.telegram !== undefined) {
      const donorDoc = await donorRef.get();
      if (donorDoc.exists) {
        batch.set(donorRef, {
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.telegram !== undefined ? { telegram: input.telegram } : {}),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }

    await batch.commit();
    await writeAudit(auth.uid, "USER_PROFILE_UPDATED", "USER", auth.uid, input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
