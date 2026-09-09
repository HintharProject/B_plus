import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { writeAudit } from "./audit";
import { deviceTokenSchema, messageSchema, reportSchema } from "./schemas";
import { assertActiveTimestamp, parseInput, requireAuth } from "./security";

export async function sendMessageHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(messageSchema, request.data);
  const db = getFirestore();
  const conversation = await db.doc(`conversations/${input.conversationId}`).get();

  if (!conversation.exists) throw new HttpsError("not-found", "Conversation not found.");
  if (!conversation.get("participantIds").includes(auth.uid)) {
    throw new HttpsError("permission-denied", "You are not a participant.");
  }
  if (conversation.get("status") !== "ACTIVE") {
    throw new HttpsError("failed-precondition", "This conversation is read-only.");
  }
  assertActiveTimestamp(conversation.get("expiresAt"));

  const blockChecks = await Promise.all(
    (conversation.get("participantIds") as string[])
      .filter((participantId) => participantId !== auth.uid)
      .map((participantId) => db.doc(`blocks/${participantId}_${auth.uid}`).get()),
  );
  if (blockChecks.some((block) => block.exists)) {
    throw new HttpsError("permission-denied", "Messaging is unavailable.");
  }

  const messageRef = db.collection(`conversations/${input.conversationId}/messages`).doc();
  await messageRef.set({
    conversationId: input.conversationId,
    senderId: auth.uid,
    content: input.content,
    createdAt: FieldValue.serverTimestamp(),
    readBy: [auth.uid],
  });
  await writeAudit({
    actorId: auth.uid,
    action: "MESSAGE_SENT",
    resourceType: "MESSAGE",
    resourceId: messageRef.id,
    metadata: { conversationId: input.conversationId },
  });

  return { messageId: messageRef.id };
}

export async function reportAbuseHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(reportSchema, request.data);
  const ref = getFirestore().collection("reports").doc();

  await ref.set({
    reporterId: auth.uid,
    ...input,
    status: "OPEN",
    createdAt: FieldValue.serverTimestamp(),
  });
  await writeAudit({
    actorId: auth.uid,
    action: "REPORT_CREATED",
    resourceType: "REPORT",
    resourceId: ref.id,
    metadata: { targetType: input.targetType },
  });

  return { reportId: ref.id };
}

export async function registerDeviceTokenHandler(request: CallableRequest<unknown>) {
  const auth = requireAuth(request);
  const input = parseInput(deviceTokenSchema, request.data);
  const tokenId = Buffer.from(input.token).toString("base64url").slice(0, 120);

  await getFirestore().doc(`deviceTokens/${auth.uid}_${tokenId}`).set({
    userId: auth.uid,
    token: input.token,
    platform: input.platform,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { ok: true };
}
