import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export async function writeAudit(
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  await adminDb.collection("auditLogs").add({
    actorId,
    action,
    resourceType,
    resourceId,
    metadata,
    timestamp: FieldValue.serverTimestamp(),
  });
}
