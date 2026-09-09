import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { writeAudit } from "./audit";
import { selectCandidates, type MatchableDonor } from "./matching";
import { sendPrivacySafePush, type SafeNotification } from "./notifications";
import { createMatchesSchema, matchResponseSchema, revealSchema } from "./schemas";
import { assertActiveTimestamp, parseInput, requireAuth, requireOrganizationRole } from "./security";

export async function createMatchesHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(createMatchesSchema, request.data);
  const db = getFirestore();
  const requestSnapshot = await db.doc(`bloodRequests/${input.requestId}`).get();

  if (!requestSnapshot.exists) {
    throw new HttpsError("not-found", "Blood request not found.");
  }
  if (requestSnapshot.get("status") !== "ACTIVE") {
    throw new HttpsError("failed-precondition", "Only active requests can be matched.");
  }
  assertActiveTimestamp(requestSnapshot.get("expiresAt"));

  const requesterId = requestSnapshot.get("requesterId") as string;
  const organizationId = requestSnapshot.get("organizationId") as string | null;
  if (requesterId !== auth.uid && !auth.admin) {
    if (!organizationId) {
      throw new HttpsError("permission-denied", "You cannot match this request.");
    }
    await requireOrganizationRole(organizationId, auth.uid, ["OWNER", "COORDINATOR"]);
  }

  const profileSnapshots = await db.collection("donorProfiles")
    .where("bloodType", "==", requestSnapshot.get("bloodTypeNeeded"))
    .where("availability", "in", ["AVAILABLE_NOW", "AVAILABLE_TODAY"])
    .limit(100)
    .get();

  const donors = await Promise.all(profileSnapshots.docs.map(async (profile) => {
    const user = await db.doc(`users/${profile.id}`).get();
    return {
      id: profile.id,
      bloodType: profile.get("bloodType"),
      availability: profile.get("availability"),
      accountState: user.get("accountState") ?? "SUSPENDED",
    } as MatchableDonor;
  }));

  const candidates = selectCandidates(donors, {
    bloodTypeNeeded: requestSnapshot.get("bloodTypeNeeded"),
    status: "ACTIVE",
  }, input.maximumCandidates);

  const matchExpiry = Timestamp.fromDate(new Date(input.expiresAt));
  const batch = db.batch();
  const created: Array<{ matchId: string; candidateId: string }> = [];

  for (const candidate of candidates) {
    const duplicate = await db.collection("matches")
      .where("requestId", "==", input.requestId)
      .where("candidateId", "==", candidate.id)
      .limit(1)
      .get();
    if (!duplicate.empty) continue;

    const matchRef = db.collection("matches").doc();
    created.push({ matchId: matchRef.id, candidateId: candidate.id });
    batch.set(matchRef, {
      requestId: input.requestId,
      requesterId,
      organizationId,
      candidateId: candidate.id,
      candidateType: "INDIVIDUAL",
      status: "PENDING",
      policy: "EXACT_TYPE_AND_AVAILABILITY_V1",
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: matchExpiry,
    });
    batch.set(db.collection("notifications").doc(), {
      userId: candidate.id,
      type: "MATCH_AVAILABLE",
      resourceId: matchRef.id,
      title: "Blood donation request",
      body: `${requestSnapshot.get("bloodTypeNeeded")} blood is needed near ${requestSnapshot.get("coarseLocation.township")}.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  await Promise.all(created.map(async ({ matchId, candidateId }) => {
    const tokenDocs = await db.collection("deviceTokens").where("userId", "==", candidateId).get();
    const notification: SafeNotification = {
      title: "Blood donation request",
      body: `${requestSnapshot.get("bloodTypeNeeded")} blood is needed near ${requestSnapshot.get("coarseLocation.township")}. Open B+ to review.`,
      type: "MATCH_AVAILABLE",
      resourceId: matchId,
    };
    return sendPrivacySafePush(tokenDocs.docs.map((doc) => doc.get("token")), notification);
  }));

  await Promise.all(created.map(({ matchId }) => writeAudit({
    actorId: auth.uid,
    action: "MATCH_CREATED",
    resourceType: "MATCH",
    resourceId: matchId,
    metadata: { requestId: input.requestId },
  })));

  return { created: created.length };
}

export async function respondToMatchHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(matchResponseSchema, request.data);
  const db = getFirestore();
  let conversationId: string | null = null;

  await db.runTransaction(async (transaction) => {
    const matchRef = db.doc(`matches/${input.matchId}`);
    const match = await transaction.get(matchRef);
    if (!match.exists) throw new HttpsError("not-found", "Match not found.");
    if (match.get("candidateId") !== auth.uid) {
      throw new HttpsError("permission-denied", "This invitation is not for you.");
    }
    if (match.get("status") !== "PENDING") {
      throw new HttpsError("failed-precondition", "This invitation has already been answered.");
    }
    assertActiveTimestamp(match.get("expiresAt"));

    const bloodRequest = await transaction.get(db.doc(`bloodRequests/${match.get("requestId")}`));
    if (!bloodRequest.exists || bloodRequest.get("status") !== "ACTIVE") {
      throw new HttpsError("failed-precondition", "The blood request is no longer active.");
    }

    transaction.update(matchRef, {
      status: input.response,
      respondedAt: FieldValue.serverTimestamp(),
      acceptedAt: input.response === "ACCEPTED" ? FieldValue.serverTimestamp() : null,
    });

    const consentRef = db.collection("consentEvents").doc();
    transaction.set(consentRef, {
      matchId: input.matchId,
      actorId: auth.uid,
      action: input.response === "ACCEPTED" ? "CONSENT_GRANTED" : "DECLINED",
      scopes: input.response === "ACCEPTED" ? ["PRECISE_DESTINATION", "MATCH_CHAT"] : [],
      policyVersion: "2026-09-v1",
      timestamp: FieldValue.serverTimestamp(),
    });

    if (input.response === "ACCEPTED") {
      const conversationRef = db.collection("conversations").doc();
      conversationId = conversationRef.id;
      transaction.set(conversationRef, {
        matchId: input.matchId,
        participantIds: [match.get("requesterId"), auth.uid],
        status: "ACTIVE",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: match.get("expiresAt"),
      });
      transaction.update(matchRef, { conversationId: conversationRef.id });
    }
  });

  await writeAudit({
    actorId: auth.uid,
    action: input.response === "ACCEPTED" ? "MATCH_ACCEPTED" : "MATCH_DECLINED",
    resourceType: "MATCH",
    resourceId: input.matchId,
  });
  if (input.response === "ACCEPTED") {
    await writeAudit({
      actorId: auth.uid,
      action: "CONSENT_GRANTED",
      resourceType: "MATCH",
      resourceId: input.matchId,
      metadata: { policyVersion: "2026-09-v1" },
    });
    await writeAudit({
      actorId: auth.uid,
      action: "CHAT_CREATED",
      resourceType: "CONVERSATION",
      resourceId: conversationId!,
      metadata: { matchId: input.matchId },
    });
  }

  return { status: input.response, conversationId };
}

export async function revealMatchHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(revealSchema, request.data);
  const db = getFirestore();
  const match = await db.doc(`matches/${input.matchId}`).get();

  if (!match.exists) throw new HttpsError("not-found", "Match not found.");
  if (match.get("status") !== "ACCEPTED") {
    throw new HttpsError("failed-precondition", "An accepted match is required.");
  }
  assertActiveTimestamp(match.get("expiresAt"));
  if (![match.get("candidateId"), match.get("requesterId")].includes(auth.uid) && !auth.admin) {
    throw new HttpsError("permission-denied", "You are not a participant in this match.");
  }

  const privateRequest = await db.doc(`requestPrivate/${match.get("requestId")}`).get();
  const preciseDestination = auth.uid === match.get("candidateId")
    ? privateRequest.get("preciseDestination") ?? null
    : null;

  await writeAudit({
    actorId: auth.uid,
    action: "LOCATION_REVEALED",
    resourceType: "MATCH",
    resourceId: input.matchId,
    metadata: { scope: preciseDestination ? "PRECISE_DESTINATION" : "NO_PRECISE_DATA" },
  });

  return {
    preciseDestination,
    conversationId: match.get("conversationId") ?? null,
    expiresAt: match.get("expiresAt").toDate().toISOString(),
  };
}
