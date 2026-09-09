import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireUser } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request);
    await enforceRateLimit(auth.uid, "reveal_match", 30, 3600);
    const { id } = await context.params;
    const match = await adminDb.doc(`matches/${id}`).get();
    if (!match.exists) throw new HttpError(404, "NOT_FOUND", "Match not found.");
    if (match.get("status") !== "ACCEPTED") {
      throw new HttpError(409, "NOT_ACCEPTED", "An accepted match is required.");
    }
    if (match.get("expiresAt").toMillis() <= Date.now()) {
      throw new HttpError(409, "EXPIRED", "This match has expired.");
    }
    if (![match.get("candidateId"), match.get("requesterId")].includes(auth.uid)) {
      throw new HttpError(403, "NOT_PARTICIPANT", "You are not a participant.");
    }

    const privateRequest = await adminDb.doc(`requestPrivate/${match.get("requestId")}`).get();
    const preciseDestination = match.get("candidateId") === auth.uid
      ? privateRequest.get("preciseDestination") ?? null
      : null;
    await writeAudit(auth.uid, "LOCATION_REVEALED", "MATCH", id, {
      scope: preciseDestination ? "PRECISE_DESTINATION" : "NO_PRECISE_DATA",
    });

    return NextResponse.json({
      preciseDestination,
      conversationId: match.get("conversationId") ?? null,
      expiresAt: match.get("expiresAt").toDate().toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
