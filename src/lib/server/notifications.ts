import "server-only";

import { adminMessaging } from "@/lib/firebase/admin";
import { notificationContainsPrivateData } from "@/lib/lifecycle";

export type NotificationPayload = {
  title: string;
  body: string;
  type: string;
  resourceId: string;
};

export async function sendSafeNotification(tokens: string[], payload: NotificationPayload) {
  if (notificationContainsPrivateData(`${payload.title} ${payload.body}`)) {
    throw new Error("Notification payload contains forbidden private data.");
  }
  if (tokens.length === 0) return;
  await adminMessaging.sendEachForMulticast({
    tokens: tokens.slice(0, 500),
    notification: { title: payload.title, body: payload.body },
    data: { type: payload.type, resourceId: payload.resourceId },
    webpush: {
      fcmOptions: {
        link: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/matches/${payload.resourceId}`,
      },
    },
  });
}
