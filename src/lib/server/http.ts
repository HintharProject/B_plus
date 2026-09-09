import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHENTICATED", "Authentication is required.");
  }
  try {
    return await adminAuth.verifyIdToken(authorization.slice(7), true);
  } catch {
    throw new HttpError(401, "INVALID_TOKEN", "Your session is invalid or expired.");
  }
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireUser(request);
  if (user.admin !== true) {
    throw new HttpError(403, "ADMIN_REQUIRED", "Administrator access is required.");
  }
  return user;
}

export async function requireOrganizationRole(
  organizationId: string,
  uid: string,
  roles: string[],
) {
  const member = await adminDb.doc(`organizationMembers/${organizationId}_${uid}`).get();
  if (!member.exists || member.get("status") !== "ACTIVE" || !roles.includes(member.get("role"))) {
    throw new HttpError(403, "ORGANIZATION_ROLE_REQUIRED", "Organization permission is required.");
  }
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "The submitted data is invalid." } },
      { status: 400 },
    );
  }
  console.error("Unhandled API error", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "The request could not be completed." } },
    { status: 500 },
  );
}
