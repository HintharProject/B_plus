import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { organizationInputSchema } from "@/lib/domain";
import { writeAudit } from "@/lib/server/audit";
import { jsonError, requireUser } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function GET() {
  try {
    const organizations = await adminDb.collection("organizations")
      .where("verificationStatus", "==", "VERIFIED")
      .limit(100)
      .get();
    return NextResponse.json({
      organizations: organizations.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    await enforceRateLimit(auth.uid, "create_organization", 3, 86400);
    const input = organizationInputSchema.parse(await request.json());
    const organizationRef = adminDb.collection("organizations").doc();
    const batch = adminDb.batch();
    batch.set(organizationRef, {
      ...input,
      verificationStatus: "PENDING",
      createdBy: auth.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(adminDb.doc(`organizationMembers/${organizationRef.id}_${auth.uid}`), {
      organizationId: organizationRef.id,
      userId: auth.uid,
      role: "OWNER",
      status: "ACTIVE",
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    await writeAudit(auth.uid, "ORGANIZATION_CREATED", "ORGANIZATION", organizationRef.id);
    return NextResponse.json({
      organizationId: organizationRef.id,
      verificationStatus: "PENDING",
    }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
