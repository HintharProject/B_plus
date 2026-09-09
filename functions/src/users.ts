import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { writeAudit } from "./audit";
import { bootstrapUserSchema, donorProfileSchema } from "./schemas";
import { parseInput, requireAuth } from "./security";

export async function bootstrapUserHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(bootstrapUserSchema, request.data);
  const ref = getFirestore().doc(`users/${auth.uid}`);
  const existing = await ref.get();

  if (!existing.exists) {
    await ref.set({
      displayName: input.displayName,
      locale: input.locale,
      roles: ["REQUESTER"],
      accountState: "ACTIVE",
      emailVerified: request.auth?.token.email_verified === true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAudit({
      actorId: auth.uid,
      action: "USER_REGISTERED",
      resourceType: "USER",
      resourceId: auth.uid,
    });
  }

  return { created: !existing.exists };
}

export async function setDonorProfileHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(donorProfileSchema, request.data);
  const db = getFirestore();

  await db.runTransaction(async (transaction) => {
    const userRef = db.doc(`users/${auth.uid}`);
    const profileRef = db.doc(`donorProfiles/${auth.uid}`);
    const user = await transaction.get(userRef);
    const existingProfile = await transaction.get(profileRef);
    const roles = new Set<string>(user.get("roles") ?? ["REQUESTER"]);
    roles.add("DONOR");

    transaction.set(userRef, {
      roles: [...roles],
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(profileRef, {
      userId: auth.uid,
      ...input,
      eligibilityState: "FACILITY_CONFIRMATION_REQUIRED",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: existingProfile.exists
        ? existingProfile.get("createdAt")
        : FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await writeAudit({
    actorId: auth.uid,
    action: "DONOR_PROFILE_UPDATED",
    resourceType: "DONOR_PROFILE",
    resourceId: auth.uid,
  });

  return { ok: true };
}
