import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { writeAudit } from "./audit";
import { requestActionSchema, requestSchema } from "./schemas";
import { parseInput, requireAuth, requireOrganizationRole } from "./security";

export async function createBloodRequestHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(requestSchema, request.data);
  const db = getFirestore();

  let organizationVerified = false;
  if (input.organizationId) {
    await requireOrganizationRole(input.organizationId, auth.uid, ["OWNER", "COORDINATOR"]);
    const organization = await db.doc(`organizations/${input.organizationId}`).get();
    organizationVerified = organization.exists
      && organization.get("verificationStatus") === "VERIFIED";
  }

  const requestRef = db.collection("bloodRequests").doc();
  const privateRef = db.doc(`requestPrivate/${requestRef.id}`);
  const status = input.organizationId && organizationVerified ? "ACTIVE" : "PENDING_VERIFICATION";
  const batch = db.batch();

  batch.set(requestRef, {
    requesterId: auth.uid,
    organizationId: input.organizationId ?? null,
    bloodTypeNeeded: input.bloodTypeNeeded,
    urgency: input.urgency,
    coarseLocation: input.coarseLocation,
    hospital: input.hospital,
    neededBy: Timestamp.fromDate(new Date(input.neededBy)),
    unitsRequired: input.unitsRequired,
    additionalInstructions: input.additionalInstructions ?? "",
    status,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(input.expiresAt)),
  });

  if (input.preciseDestination) {
    batch.set(privateRef, {
      requestId: requestRef.id,
      preciseDestination: input.preciseDestination,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  batch.set(db.collection("auditLogs").doc(), {
    actorId: auth.uid,
    action: "REQUEST_CREATED",
    resourceType: "BLOOD_REQUEST",
    resourceId: requestRef.id,
    timestamp: FieldValue.serverTimestamp(),
    metadata: { status },
  });
  await batch.commit();

  return { requestId: requestRef.id, status };
}

export async function updateRequestStatusHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(requestActionSchema, request.data);
  const db = getFirestore();
  const ref = db.doc(`bloodRequests/${input.requestId}`);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new HttpsError("not-found", "Blood request not found.");
  }

  const isOwner = snapshot.get("requesterId") === auth.uid;
  if (!isOwner && !auth.admin) {
    const organizationId = snapshot.get("organizationId") as string | null;
    if (!organizationId) {
      throw new HttpsError("permission-denied", "You cannot update this request.");
    }
    await requireOrganizationRole(organizationId, auth.uid, ["OWNER", "COORDINATOR"]);
  }

  const currentStatus = snapshot.get("status");
  if (!["ACTIVE", "PENDING_VERIFICATION"].includes(currentStatus)) {
    throw new HttpsError("failed-precondition", "This request is no longer active.");
  }

  const status = input.action === "CANCEL" ? "CANCELLED" : "CLOSED";
  await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
  await writeAudit({
    actorId: auth.uid,
    action: input.action === "CANCEL" ? "REQUEST_CANCELLED" : "REQUEST_CLOSED",
    resourceType: "BLOOD_REQUEST",
    resourceId: input.requestId,
  });

  return { status };
}
