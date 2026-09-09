import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

export type AuthContext = {
  uid: string;
  admin: boolean;
};

export function requireAuth(request: CallableRequest<unknown>): AuthContext {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return {
    uid: request.auth.uid,
    admin: request.auth.token.admin === true,
  };
}

export function requireAdmin(request: CallableRequest<unknown>): AuthContext {
  const auth = requireAuth(request);
  if (!auth.admin) {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }
  return auth;
}

export async function requireOrganizationRole(
  organizationId: string,
  uid: string,
  allowedRoles: ReadonlyArray<"OWNER" | "COORDINATOR" | "VIEWER">,
) {
  const member = await getFirestore()
    .doc(`organizationMembers/${organizationId}_${uid}`)
    .get();

  if (
    !member.exists
    || member.get("status") !== "ACTIVE"
    || !allowedRoles.includes(member.get("role"))
  ) {
    throw new HttpsError("permission-denied", "Active organization membership is required.");
  }
}

export function parseInput<T>(parser: { safeParse: (data: unknown) => { success: true; data: T } | { success: false } }, data: unknown): T {
  const result = parser.safeParse(data);
  if (!result.success) {
    throw new HttpsError("invalid-argument", "The submitted data is invalid.");
  }
  return result.data;
}

export function assertActiveTimestamp(expiresAt: FirebaseFirestore.Timestamp) {
  if (expiresAt.toMillis() <= Date.now()) {
    throw new HttpsError("failed-precondition", "This item has expired.");
  }
}
