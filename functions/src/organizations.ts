import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { writeAudit } from "./audit";
import { adminReviewSchema, memberResponseSchema, memberSchema, organizationSchema } from "./schemas";
import { parseInput, requireAdmin, requireAuth, requireOrganizationRole } from "./security";

export async function createOrganizationHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(organizationSchema, request.data);
  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc();
  const memberRef = db.doc(`organizationMembers/${organizationRef.id}_${auth.uid}`);
  const batch = db.batch();

  batch.set(organizationRef, {
    ...input,
    verificationStatus: "PENDING",
    createdBy: auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(memberRef, {
    organizationId: organizationRef.id,
    userId: auth.uid,
    role: "OWNER",
    status: "ACTIVE",
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  await writeAudit({
    actorId: auth.uid,
    action: "ORGANIZATION_CREATED",
    resourceType: "ORGANIZATION",
    resourceId: organizationRef.id,
  });

  return { organizationId: organizationRef.id, verificationStatus: "PENDING" };
}

export async function setOrganizationMemberHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(memberSchema, request.data);
  if (!auth.admin) {
    await requireOrganizationRole(input.organizationId, auth.uid, ["OWNER"]);
  }

  const organization = await getFirestore().doc(`organizations/${input.organizationId}`).get();
  if (!organization.exists) throw new HttpsError("not-found", "Organization not found.");

  const memberRef = getFirestore().doc(`organizationMembers/${input.organizationId}_${input.userId}`);
  const existing = await memberRef.get();
  await memberRef.set({
    ...input,
    status: existing.get("status") === "ACTIVE" ? "ACTIVE" : "PENDING",
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
  }, { merge: true });

  await writeAudit({
    actorId: auth.uid,
    action: "ORGANIZATION_MEMBER_UPDATED",
    resourceType: "ORGANIZATION_MEMBER",
    resourceId: `${input.organizationId}_${input.userId}`,
    metadata: { role: input.role },
  });

  return { ok: true };
}

export async function respondToOrganizationMembershipHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(memberResponseSchema, request.data);
  const ref = getFirestore().doc(`organizationMembers/${input.organizationId}_${auth.uid}`);
  const membership = await ref.get();
  if (!membership.exists || membership.get("status") !== "PENDING") {
    throw new HttpsError("failed-precondition", "No pending membership.");
  }
  const status = input.response === "ACCEPT" ? "ACTIVE" : "DECLINED";
  await ref.update({ status, respondedAt: FieldValue.serverTimestamp() });
  await writeAudit({
    actorId: auth.uid,
    action: "ORGANIZATION_MEMBER_UPDATED",
    resourceType: "ORGANIZATION_MEMBER",
    resourceId: ref.id,
    metadata: { status },
  });
  return { status };
}

export async function reviewOrganizationHandler(request: CallableRequest<unknown>) {
  const auth = requireAdmin(request);
  const input = parseInput(adminReviewSchema, request.data);
  const ref = getFirestore().doc(`organizations/${input.organizationId}`);
  const organization = await ref.get();
  if (!organization.exists) throw new HttpsError("not-found", "Organization not found.");

  await ref.update({
    verificationStatus: input.status,
    reviewNote: input.note ?? "",
    reviewedBy: auth.uid,
    reviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await writeAudit({
    actorId: auth.uid,
    action: "ORGANIZATION_REVIEWED",
    resourceType: "ORGANIZATION",
    resourceId: input.organizationId,
    metadata: { status: input.status },
  });

  return { verificationStatus: input.status };
}
