import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { jsonError, requireUser } from "@/lib/server/http";

const inputSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  locale: z.enum(["my", "en"]),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const input = inputSchema.parse(await request.json());
    const ref = adminDb.doc(`users/${auth.uid}`);
    const existing = await ref.get();

    await ref.set({
      displayName: input.displayName,
      locale: input.locale,
      emailVerified: auth.email_verified === true,
      roles: existing.exists ? existing.get("roles") : ["REQUESTER"],
      accountState: existing.exists ? existing.get("accountState") : "ACTIVE",
      createdAt: existing.exists ? existing.get("createdAt") : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (!existing.exists) {
      await writeAudit(auth.uid, "USER_REGISTERED", "USER", auth.uid);
    }

    return NextResponse.json({ created: !existing.exists });
  } catch (error) {
    return jsonError(error);
  }
}
