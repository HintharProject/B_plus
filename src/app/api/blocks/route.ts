import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { jsonError, requireUser } from "@/lib/server/http";

const blockSchema = z.object({
  blockedUserId: z.string().trim().min(1).max(128),
  blocked: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const input = blockSchema.parse(await request.json());
    const ref = adminDb.doc(`blocks/${auth.uid}_${input.blockedUserId}`);
    if (input.blocked) {
      await ref.set({
        ownerId: auth.uid,
        blockedUserId: input.blockedUserId,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      await ref.delete();
    }
    await writeAudit(auth.uid, input.blocked ? "USER_BLOCKED" : "USER_UNBLOCKED", "USER", input.blockedUserId);
    return NextResponse.json({ blocked: input.blocked });
  } catch (error) {
    return jsonError(error);
  }
}
