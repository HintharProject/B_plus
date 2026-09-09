import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";

const memberSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  role: z.enum(["OWNER", "COORDINATOR", "VIEWER"]),
});
const responseSchema = z.object({ response: z.enum(["ACCEPT", "DECLINE"]) });

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    const { id } = await context.params;
    await requireOrganizationRole(id, auth.uid, ["OWNER", "COORDINATOR", "VIEWER"]);
    const members = await adminDb.collection("organizationMembers")
      .where("organizationId", "==", id)
      .limit(100)
      .get();
    return NextResponse.json({
      members: members.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    const { id } = await context.params;
    await requireOrganizationRole(id, auth.uid, ["OWNER"]);
    const input = memberSchema.parse(await request.json());
    const ref = adminDb.doc(`organizationMembers/${id}_${input.userId}`);
    const existing = await ref.get();
    await ref.set({
      organizationId: id,
      ...input,
      status: existing.get("status") === "ACTIVE" ? "ACTIVE" : "PENDING",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeAudit(auth.uid, "ORGANIZATION_MEMBER_UPDATED", "ORGANIZATION_MEMBER", `${id}_${input.userId}`, {
      role: input.role,
      status: existing.get("status") === "ACTIVE" ? "ACTIVE" : "PENDING",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    const { id } = await context.params;
    const input = responseSchema.parse(await request.json());
    const ref = adminDb.doc(`organizationMembers/${id}_${auth.uid}`);
    const membership = await ref.get();
    if (!membership.exists || membership.get("status") !== "PENDING") {
      throw new HttpError(409, "NO_PENDING_MEMBERSHIP", "No pending membership.");
    }
    const status = input.response === "ACCEPT" ? "ACTIVE" : "DECLINED";
    await ref.update({ status, respondedAt: FieldValue.serverTimestamp() });
    await writeAudit(auth.uid, "ORGANIZATION_MEMBERSHIP_RESPONDED", "ORGANIZATION_MEMBER", ref.id, { status });
    return NextResponse.json({ status });
  } catch (error) {
    return jsonError(error);
  }
}
