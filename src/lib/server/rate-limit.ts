import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { HttpError } from "@/lib/server/http";

export async function enforceRateLimit(
  uid: string,
  action: string,
  maximum: number,
  windowSeconds: number,
) {
  const id = `${uid}_${action}`;
  const ref = adminDb.doc(`rateLimits/${id}`);
  const now = Date.now();

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const windowStartedAt = snapshot.get("windowStartedAt")?.toMillis?.() ?? 0;
    const inWindow = now - windowStartedAt < windowSeconds * 1000;
    const count = inWindow ? (snapshot.get("count") ?? 0) : 0;
    if (count >= maximum) {
      throw new HttpError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
    }
    transaction.set(ref, {
      uid,
      action,
      count: count + 1,
      windowStartedAt: inWindow
        ? snapshot.get("windowStartedAt")
        : Timestamp.fromMillis(now),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
