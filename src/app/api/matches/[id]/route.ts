import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const responseSchema = z.object({ response: z.enum(["ACCEPTED", "DECLINED"]) });

async function getAuthorizedMatch(request: NextRequest, id: string) {
  const auth = await requireUser(request);
  const match = await adminDb.doc(`matches/${id}`).get();
  if (!match.exists) throw new HttpError(404, "NOT_FOUND", "Match not found.");
  const directlyAllowed = [match.get("candidateId"), match.get("requesterId")].includes(auth.uid);
  if (!directlyAllowed && auth.admin !== true) {
    const organizationId = match.get("organizationId") as string | null;
    if (!organizationId) throw new HttpError(403, "FORBIDDEN", "Access denied.");
    await requireOrganizationRole(organizationId, auth.uid, ["OWNER", "COORDINATOR", "VIEWER"]);
  }
  return { auth, match };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { auth, match } = await getAuthorizedMatch(request, id);
    const expired = ["PENDING", "ACCEPTED"].includes(match.get("status"))
      && match.get("expiresAt").toMillis() <= Date.now();
    if (expired) {
      await match.ref.update({ status: "EXPIRED", expiredAt: FieldValue.serverTimestamp() });
      const conversationId = match.get("conversationId");
      if (conversationId) {
        await adminDb.doc(`conversations/${conversationId}`).update({
          status: "READ_ONLY",
          expiredAt: FieldValue.serverTimestamp(),
        });
      }
      await writeAudit("SYSTEM", "MATCH_EXPIRED", "MATCH", id);
    }
    const bloodRequest = await adminDb.doc(`bloodRequests/${match.get("requestId")}`).get();
    return NextResponse.json({
      match: {
        id,
        ...match.data(),
        status: expired ? "EXPIRED" : match.get("status"),
        isCandidate: match.get("candidateId") === auth.uid,
        request: bloodRequest.exists ? {
          bloodTypeNeeded: bloodRequest.get("bloodTypeNeeded"),
          urgency: bloodRequest.get("urgency"),
          hospital: bloodRequest.get("hospital"),
          coarseLocation: bloodRequest.get("coarseLocation"),
          neededBy: bloodRequest.get("neededBy"),
          additionalInstructions: bloodRequest.get("additionalInstructions"),
        } : null,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await requireUser(request);
    await enforceRateLimit(auth.uid, "respond_match", 30, 3600);
    const input = responseSchema.parse(await request.json());
    let conversationId: string | null = null;

    await adminDb.runTransaction(async (transaction) => {
      const matchRef = adminDb.doc(`matches/${id}`);
      const match = await transaction.get(matchRef);
      if (!match.exists) throw new HttpError(404, "NOT_FOUND", "Match not found.");
      if (match.get("candidateId") !== auth.uid) {
        throw new HttpError(403, "NOT_CANDIDATE", "This invitation is not for you.");
      }
      if (match.get("status") !== "PENDING") {
        throw new HttpError(409, "ALREADY_ANSWERED", "This match has already been answered.");
      }
      if (match.get("expiresAt").toMillis() <= Date.now()) {
        throw new HttpError(409, "EXPIRED", "This match has expired.");
      }
      const bloodRequest = await transaction.get(adminDb.doc(`bloodRequests/${match.get("requestId")}`));
      if (!bloodRequest.exists || bloodRequest.get("status") !== "ACTIVE") {
        throw new HttpError(409, "REQUEST_INACTIVE", "The blood request is no longer active.");
      }

      transaction.update(matchRef, {
        status: input.response,
        respondedAt: FieldValue.serverTimestamp(),
        acceptedAt: input.response === "ACCEPTED" ? FieldValue.serverTimestamp() : null,
      });
      transaction.set(adminDb.collection("consentEvents").doc(), {
        matchId: id,
        actorId: auth.uid,
        action: input.response === "ACCEPTED" ? "CONSENT_GRANTED" : "DECLINED",
        scopes: input.response === "ACCEPTED" ? ["PRECISE_DESTINATION", "MATCH_CHAT"] : [],
        policyVersion: "2026-09-v1",
        timestamp: FieldValue.serverTimestamp(),
      });
      if (input.response === "ACCEPTED") {
        const conversationRef = adminDb.collection("conversations").doc();
        conversationId = conversationRef.id;
        transaction.set(conversationRef, {
          matchId: id,
          participantIds: [match.get("requesterId"), auth.uid],
          status: "ACTIVE",
          expiresAt: match.get("expiresAt"),
          createdAt: FieldValue.serverTimestamp(),
        });
        transaction.update(matchRef, { conversationId });
      }
    });

    await writeAudit(
      auth.uid,
      input.response === "ACCEPTED" ? "MATCH_ACCEPTED" : "MATCH_DECLINED",
      "MATCH",
      id,
    );
    if (input.response === "ACCEPTED") {
      await writeAudit(auth.uid, "CONSENT_GRANTED", "MATCH", id, {
        policyVersion: "2026-09-v1",
      });
      await writeAudit(auth.uid, "CHAT_CREATED", "CONVERSATION", conversationId!, { matchId: id });
    }
    return NextResponse.json({ status: input.response, conversationId });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { auth, match } = await getAuthorizedMatch(request, id);
    await adminDb.runTransaction(async (transaction) => {
      const current = await transaction.get(match.ref);
      if (current.get("status") !== "ACCEPTED") {
        throw new HttpError(409, "INVALID_STATE", "Only an accepted match can be cancelled.");
      }
      transaction.update(current.ref, {
        status: "CANCELLED",
        cancelledBy: auth.uid,
        cancelledAt: FieldValue.serverTimestamp(),
      });
      const conversationId = current.get("conversationId");
      if (conversationId) {
        transaction.update(adminDb.doc(`conversations/${conversationId}`), {
          status: "READ_ONLY",
          closedAt: FieldValue.serverTimestamp(),
        });
      }
      transaction.set(adminDb.collection("consentEvents").doc(), {
        matchId: id,
        actorId: auth.uid,
        action: "CONSENT_REVOKED",
        scopes: [],
        policyVersion: "2026-09-v1",
        timestamp: FieldValue.serverTimestamp(),
      });
    });
    await writeAudit(auth.uid, "CONSENT_REVOKED", "MATCH", id);
    return NextResponse.json({ status: "CANCELLED" });
  } catch (error) {
    return jsonError(error);
  }
}
