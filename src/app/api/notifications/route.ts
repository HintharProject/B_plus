import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { HttpError, jsonError, requireUser } from "@/lib/server/http";

const readSchema = z.object({ notificationId: z.string().min(1).max(128) });

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const notifications = await adminDb.collection("notifications")
      .where("userId", "==", auth.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return NextResponse.json({
      notifications: notifications.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const input = readSchema.parse(await request.json());
    const ref = adminDb.doc(`notifications/${input.notificationId}`);
    const notification = await ref.get();
    if (!notification.exists || notification.get("userId") !== auth.uid) {
      throw new HttpError(404, "NOT_FOUND", "Notification not found.");
    }
    await ref.update({ read: true, readAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
