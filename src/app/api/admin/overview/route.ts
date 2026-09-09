import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, requireAdmin } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const [organizations, reports, audit] = await Promise.all([
      adminDb.collection("organizations").where("verificationStatus", "==", "PENDING").limit(50).get(),
      adminDb.collection("reports").where("status", "==", "OPEN").limit(50).get(),
      adminDb.collection("auditLogs").orderBy("timestamp", "desc").limit(100).get(),
    ]);
    return NextResponse.json({
      organizations: organizations.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      reports: reports.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      audit: audit.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
