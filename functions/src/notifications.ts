import { getMessaging } from "firebase-admin/messaging";

const forbiddenNotificationPatterns = [
  /\+?95[\s-]?\d{6,}/i,
  /\b\d{1,3}\.\d{4,}\s*,\s*\d{1,3}\.\d{4,}\b/,
  /\b(phone|address|coordinates?|message content)\b/i,
];

export type SafeNotification = {
  title: string;
  body: string;
  type: "MATCH_AVAILABLE" | "MATCH_ACCEPTED" | "MATCH_EXPIRED" | "NEW_MESSAGE";
  resourceId: string;
};

export function assertPrivacySafeNotification(notification: SafeNotification) {
  const content = `${notification.title} ${notification.body}`;
  if (forbiddenNotificationPatterns.some((pattern) => pattern.test(content))) {
    throw new Error("Notification payload may contain private information.");
  }
}

export async function sendPrivacySafePush(
  tokens: string[],
  notification: SafeNotification,
) {
  assertPrivacySafeNotification(notification);
  if (tokens.length === 0) return;

  await getMessaging().sendEachForMulticast({
    tokens: tokens.slice(0, 500),
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: {
      type: notification.type,
      resourceId: notification.resourceId,
    },
  });
}
