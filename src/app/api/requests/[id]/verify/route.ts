import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";

const inputSchema = z.object({ organizationId: z.string().min(1).max(128) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    const { id } = await context.params;
    const input = inputSchema.parse(await request.json());
    await requireOrganizationRole(input.organizationId, auth.uid, ["OWNER", "COORDINATOR"]);
    const [organization, bloodRequest] = await Promise.all([
      adminDb.doc(`organizations/${input.organizationId}`).get(),
      adminDb.doc(`bloodRequests/${id}`).get(),
    ]);
    if (!organization.exists || organization.get("verificationStatus") !== "VERIFIED") {
      throw new HttpError(409, "ORGANIZATION_NOT_VERIFIED", "A verified organization is required.");
    }
    if (!bloodRequest.exists) throw new HttpError(404, "NOT_FOUND", "Blood request not found.");
    if (bloodRequest.get("status") !== "PENDING_VERIFICATION") {
      throw new HttpError(409, "INVALID_STATE", "This request is not pending verification.");
    }

    await bloodRequest.ref.update({
      organizationId: input.organizationId,
      status: "ACTIVE",
      verifiedBy: auth.uid,
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAudit(auth.uid, "REQUEST_VERIFIED", "BLOOD_REQUEST", id, {
      organizationId: input.organizationId,
    });
    return NextResponse.json({ status: "ACTIVE" });
  } catch (error) {
    return jsonError(error);
  }
}
