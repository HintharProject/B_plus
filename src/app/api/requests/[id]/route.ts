import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";

const actionSchema = z.object({ action: z.enum(["CANCEL", "CLOSE"]) });

async function authorize(request: NextRequest, id: string) {
  const auth = await requireUser(request);
  const snapshot = await adminDb.doc(`bloodRequests/${id}`).get();
  if (!snapshot.exists) throw new HttpError(404, "NOT_FOUND", "Blood request not found.");
  if (snapshot.get("requesterId") !== auth.uid && auth.admin !== true) {
    const organizationId = snapshot.get("organizationId") as string | null;
    if (!organizationId) throw new HttpError(403, "FORBIDDEN", "Access denied.");
    await requireOrganizationRole(organizationId, auth.uid, ["OWNER", "COORDINATOR", "VIEWER"]);
  }
  return { auth, snapshot };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { snapshot } = await authorize(request, id);
    const expired = ["ACTIVE", "PENDING_VERIFICATION"].includes(snapshot.get("status"))
      && snapshot.get("expiresAt").toMillis() <= Date.now();
    if (expired) {
      await snapshot.ref.update({ status: "EXPIRED", expiredAt: FieldValue.serverTimestamp() });
    }
    return NextResponse.json({
      request: {
        id: snapshot.id,
        ...snapshot.data(),
        status: expired ? "EXPIRED" : snapshot.get("status"),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { auth, snapshot } = await authorize(request, id);
    const input = actionSchema.parse(await request.json());
    if (!["ACTIVE", "PENDING_VERIFICATION"].includes(snapshot.get("status"))) {
      throw new HttpError(409, "INVALID_STATE", "This request is no longer active.");
    }
    const status = input.action === "CANCEL" ? "CANCELLED" : "CLOSED";
    await snapshot.ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
    await writeAudit(
      auth.uid,
      input.action === "CANCEL" ? "REQUEST_CANCELLED" : "REQUEST_CLOSED",
      "BLOOD_REQUEST",
      id,
    );
    return NextResponse.json({ status });
  } catch (error) {
    return jsonError(error);
  }
}
