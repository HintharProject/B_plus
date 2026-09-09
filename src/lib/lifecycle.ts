export type MatchStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED" | "COMPLETED";
export type RequestStatus = "PENDING_VERIFICATION" | "ACTIVE" | "CANCELLED" | "CLOSED" | "EXPIRED";

export function isExpired(expiresAtMillis: number, nowMillis = Date.now()) {
  return expiresAtMillis <= nowMillis;
}

export function canRespondToMatch(
  status: MatchStatus,
  requestStatus: RequestStatus,
  expiresAtMillis: number,
  nowMillis = Date.now(),
) {
  return status === "PENDING"
    && requestStatus === "ACTIVE"
    && !isExpired(expiresAtMillis, nowMillis);
}

export function canRevealMatch(
  status: MatchStatus,
  isParticipant: boolean,
  expiresAtMillis: number,
  nowMillis = Date.now(),
) {
  return status === "ACCEPTED"
    && isParticipant
    && !isExpired(expiresAtMillis, nowMillis);
}

export function notificationContainsPrivateData(content: string) {
  const forbidden = [
    /\+?95[\s-]?\d{6,}/i,
    /\b\d{1,3}\.\d{4,}\s*,\s*\d{1,3}\.\d{4,}\b/,
    /\b(phone|exact address|coordinates?|private message)\b/i,
  ];
  return forbidden.some((pattern) => pattern.test(content));
}
