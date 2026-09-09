import { FieldValue, getFirestore } from "firebase-admin/firestore";

export type AuditAction =
  | "USER_REGISTERED"
  | "DONOR_PROFILE_UPDATED"
  | "REQUEST_CREATED"
  | "REQUEST_CANCELLED"
  | "REQUEST_CLOSED"
  | "MATCH_CREATED"
  | "MATCH_ACCEPTED"
  | "MATCH_DECLINED"
  | "MATCH_EXPIRED"
  | "CONSENT_GRANTED"
  | "LOCATION_REVEALED"
  | "CHAT_CREATED"
  | "MESSAGE_SENT"
  | "REPORT_CREATED"
  | "ORGANIZATION_CREATED"
  | "ORGANIZATION_REVIEWED"
  | "ORGANIZATION_MEMBER_UPDATED"
  | "ADMIN_ACTION";

type AuditEvent = {
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export function createAuditEvent(event: AuditEvent) {
  return {
    ...event,
    timestamp: FieldValue.serverTimestamp(),
    metadata: event.metadata ?? {},
  };
}

export async function writeAudit(event: AuditEvent) {
  await getFirestore().collection("auditLogs").add(createAuditEvent(event));
}
