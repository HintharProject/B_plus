import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { jsonError, requireAdmin, requireUser } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const reportSchema = z.object({
  targetType: z.enum(["USER", "REQUEST", "MATCH", "MESSAGE", "ORGANIZATION"]),
  targetId: z.string().trim().min(1).max(128),
  reason: z.enum(["SPAM", "HARASSMENT", "FAKE_REQUEST", "PRIVACY", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const reports = await adminDb.collection("reports")
      .where("status", "==", "OPEN")
      .limit(100)
      .get();
    return NextResponse.json({
      reports: reports.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    await enforceRateLimit(auth.uid, "create_report", 10, 3600);
    const input = reportSchema.parse(await request.json());
    const ref = adminDb.collection("reports").doc();
    await ref.set({
      ...input,
      reporterId: auth.uid,
      status: "OPEN",
      createdAt: FieldValue.serverTimestamp(),
    });
    await writeAudit(auth.uid, "REPORT_CREATED", "REPORT", ref.id, {
      targetType: input.targetType,
    });
    return NextResponse.json({ reportId: ref.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
