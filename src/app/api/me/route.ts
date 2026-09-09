import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
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
