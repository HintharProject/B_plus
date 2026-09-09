import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireUser } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const messageSchema = z.object({ content: z.string().trim().min(1).max(2000) });

async function authorize(request: NextRequest, id: string) {
  const auth = await requireUser(request);
  const conversation = await adminDb.doc(`conversations/${id}`).get();
  if (!conversation.exists) throw new HttpError(404, "NOT_FOUND", "Conversation not found.");
  if (!(conversation.get("participantIds") as string[]).includes(auth.uid)) {
    throw new HttpError(403, "NOT_PARTICIPANT", "You are not a participant.");
  }
  return { auth, conversation };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { conversation } = await authorize(request, id);
    const expired = conversation.get("expiresAt").toMillis() <= Date.now();
    if (conversation.get("status") === "ACTIVE" && expired) {
      await conversation.ref.update({
        status: "READ_ONLY",
        expiredAt: FieldValue.serverTimestamp(),
      });
    }
    const messages = await adminDb.collection(`conversations/${id}/messages`)
      .orderBy("createdAt", "asc")
      .limit(200)
      .get();
    return NextResponse.json({
      conversation: {
        id,
        ...conversation.data(),
        status: expired ? "READ_ONLY" : conversation.get("status"),
      },
      messages: messages.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { auth, conversation } = await authorize(request, id);
    await enforceRateLimit(auth.uid, "send_message", 60, 60);
    const input = messageSchema.parse(await request.json());
    if (
      conversation.get("status") !== "ACTIVE"
      || conversation.get("expiresAt").toMillis() <= Date.now()
    ) {
      throw new HttpError(409, "READ_ONLY", "This conversation is read-only.");
    }
    const others = (conversation.get("participantIds") as string[])
      .filter((participantId) => participantId !== auth.uid);
    const blocks = await Promise.all(
      others.map((participantId) => adminDb.doc(`blocks/${participantId}_${auth.uid}`).get()),
    );
    if (blocks.some((block) => block.exists)) {
      throw new HttpError(403, "BLOCKED", "Messaging is unavailable.");
    }

    const ref = adminDb.collection(`conversations/${id}/messages`).doc();
    await ref.set({
      conversationId: id,
      senderId: auth.uid,
      content: input.content,
      readBy: [auth.uid],
      createdAt: FieldValue.serverTimestamp(),
    });
    await writeAudit(auth.uid, "MESSAGE_SENT", "MESSAGE", ref.id, { conversationId: id });
    return NextResponse.json({ messageId: ref.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
