import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { bloodRequestInputSchema } from "@/lib/domain";
import { writeAudit } from "@/lib/server/audit";
import { jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const snapshots = await adminDb.collection("bloodRequests")
      .where("requesterId", "==", auth.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return NextResponse.json({
      requests: snapshots.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: ["ACTIVE", "PENDING_VERIFICATION"].includes(doc.get("status"))
          && doc.get("expiresAt").toMillis() <= Date.now()
          ? "EXPIRED"
          : doc.get("status"),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const input = bloodRequestInputSchema.parse(await request.json());
    let organizationVerified = false;
    if (input.organizationId) {
      await requireOrganizationRole(input.organizationId, auth.uid, ["OWNER", "COORDINATOR"]);
      const organization = await adminDb.doc(`organizations/${input.organizationId}`).get();
      organizationVerified = organization.exists
        && organization.get("verificationStatus") === "VERIFIED";
    }

    const requestRef = adminDb.collection("bloodRequests").doc();
    const status = input.organizationId && organizationVerified ? "ACTIVE" : "PENDING_VERIFICATION";
    const batch = adminDb.batch();
    const { preciseDestination, ...safeInput } = input;
    batch.set(requestRef, {
      ...safeInput,
      requesterId: auth.uid,
      organizationId: input.organizationId ?? null,
      neededBy: Timestamp.fromDate(new Date(input.neededBy)),
      expiresAt: Timestamp.fromDate(new Date(input.expiresAt)),
      status,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (preciseDestination) {
      batch.set(adminDb.doc(`requestPrivate/${requestRef.id}`), {
        requestId: requestRef.id,
        preciseDestination,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    await writeAudit(auth.uid, "REQUEST_CREATED", "BLOOD_REQUEST", requestRef.id, { status });

    return NextResponse.json({ requestId: requestRef.id, status }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
