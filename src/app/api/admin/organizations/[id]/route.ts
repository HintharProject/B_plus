import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireAdmin } from "@/lib/server/http";

const reviewSchema = z.object({
  status: z.enum(["VERIFIED", "SUSPENDED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await context.params;
    const input = reviewSchema.parse(await request.json());
    const ref = adminDb.doc(`organizations/${id}`);
    if (!(await ref.get()).exists) throw new HttpError(404, "NOT_FOUND", "Organization not found.");
    await ref.update({
      verificationStatus: input.status,
      reviewNote: input.note ?? "",
      reviewedBy: auth.uid,
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAudit(auth.uid, "ORGANIZATION_REVIEWED", "ORGANIZATION", id, {
      status: input.status,
    });
    return NextResponse.json({ verificationStatus: input.status });
  } catch (error) {
    return jsonError(error);
  }
}
