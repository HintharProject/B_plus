import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, requireUser } from "@/lib/server/http";

const tokenSchema = z.object({ token: z.string().trim().min(20).max(4096) });

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const input = tokenSchema.parse(await request.json());
    const hash = createHash("sha256").update(input.token).digest("hex");
    await adminDb.doc(`deviceTokens/${auth.uid}_${hash}`).set({
      userId: auth.uid,
      token: input.token,
      platform: "WEB",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
