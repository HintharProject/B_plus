import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";

const memberSchema = z.object({
  userId: z.string().trim().min(1).max(160),
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

    const enriched = await Promise.all(
      members.docs.map(async (doc) => {
        const data = doc.data();
        let userDisplayName: string | null = null;
        let userEmail: string | null = null;
        try {
          const userDoc = await adminDb.doc(`users/${data.userId}`).get();
          if (userDoc.exists) {
            userDisplayName = userDoc.get("displayName") ?? null;
            userEmail = userDoc.get("email") ?? null;
          }
          if (!userEmail) {
            const authRecord = await adminAuth.getUser(data.userId as string);
            userEmail = authRecord.email ?? null;
            userDisplayName = userDisplayName ?? authRecord.displayName ?? null;
          }
        } catch {
          // ignore lookup failure
        }
        return {
          id: doc.id,
          ...data,
          userDisplayName,
          userEmail,
        };
      }),
    );

    return NextResponse.json({ members: enriched });
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

    let targetUserId = input.userId.trim();
    if (targetUserId.includes("@")) {
      try {
        const userRecord = await adminAuth.getUserByEmail(targetUserId);
        targetUserId = userRecord.uid;
      } catch {
        throw new HttpError(
          404,
          "NOT_FOUND",
          `No registered account found with email "${targetUserId}". Please ask them to sign up first, or provide their User ID.`,
        );
      }
    }

    const ref = adminDb.doc(`organizationMembers/${id}_${targetUserId}`);
    const existing = await ref.get();
    await ref.set({
      organizationId: id,
      userId: targetUserId,
      role: input.role,
      status: existing.get("status") === "ACTIVE" ? "ACTIVE" : "PENDING",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
    }, { merge: true });

    await writeAudit(auth.uid, "ORGANIZATION_MEMBER_UPDATED", "ORGANIZATION_MEMBER", `${id}_${targetUserId}`, {
      role: input.role,
      status: existing.get("status") === "ACTIVE" ? "ACTIVE" : "PENDING",
    });

    return NextResponse.json({ ok: true, userId: targetUserId });
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    const { id } = await context.params;
    await requireOrganizationRole(id, auth.uid, ["OWNER"]);
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");
    if (!targetUserId) throw new HttpError(400, "BAD_REQUEST", "userId parameter required.");
    const ref = adminDb.doc(`organizationMembers/${id}_${targetUserId}`);
    await ref.delete();
    await writeAudit(auth.uid, "ORGANIZATION_MEMBER_REMOVED", "ORGANIZATION_MEMBER", `${id}_${targetUserId}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
