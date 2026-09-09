import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { isExactAvailableCandidate } from "@/lib/domain";
import { isLocale, translate, type Locale } from "@/lib/i18n";
import { writeAudit } from "@/lib/server/audit";
import { HttpError, jsonError, requireOrganizationRole, requireUser } from "@/lib/server/http";
import { sendSafeNotification } from "@/lib/server/notifications";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const inputSchema = z.object({
  requestId: z.string().trim().min(8).max(128),
  maximumCandidates: z.number().int().min(1).max(20).default(10),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    await enforceRateLimit(auth.uid, "generate_matches", 10, 3600);
    const input = inputSchema.parse(await request.json());
    const requestSnapshot = await adminDb.doc(`bloodRequests/${input.requestId}`).get();
    if (!requestSnapshot.exists) throw new HttpError(404, "NOT_FOUND", "Blood request not found.");
    if (requestSnapshot.get("status") !== "ACTIVE") {
      throw new HttpError(409, "INVALID_STATE", "Only an active verified request can be matched.");
    }
    if (requestSnapshot.get("expiresAt").toMillis() <= Date.now()) {
      throw new HttpError(409, "EXPIRED", "This request has expired.");
    }

    const organizationId = requestSnapshot.get("organizationId") as string | null;
    if (requestSnapshot.get("requesterId") !== auth.uid && auth.admin !== true) {
      if (!organizationId) throw new HttpError(403, "FORBIDDEN", "Access denied.");
      await requireOrganizationRole(organizationId, auth.uid, ["OWNER", "COORDINATOR"]);
    }
    if (organizationId) {
      const organization = await adminDb.doc(`organizations/${organizationId}`).get();
      if (!organization.exists || organization.get("verificationStatus") !== "VERIFIED") {
        throw new HttpError(409, "ORGANIZATION_NOT_VERIFIED", "The organization must be verified.");
      }
    }

    const profileSnapshots = await adminDb.collection("donorProfiles")
      .where("bloodType", "==", requestSnapshot.get("bloodTypeNeeded"))
      .where("availability", "in", ["AVAILABLE_NOW", "AVAILABLE_TODAY"])
      .limit(100)
      .get();

    const eligible = (
      await Promise.all(profileSnapshots.docs.map(async (profile) => {
        if (profile.id === requestSnapshot.get("requesterId")) return null;
        const user = await adminDb.doc(`users/${profile.id}`).get();
        const candidate = {
          bloodType: profile.get("bloodType") as string,
          availability: profile.get("availability") as string,
          accountState: (user.get("accountState") as string | undefined) ?? "SUSPENDED",
        };
        if (!isExactAvailableCandidate(candidate, {
          bloodTypeNeeded: requestSnapshot.get("bloodTypeNeeded"),
          status: requestSnapshot.get("status"),
        })) return null;
        return profile;
      }))
    ).filter((profile): profile is typeof profileSnapshots.docs[number] => profile !== null)
      .sort((left, right) => {
        const rank = { AVAILABLE_NOW: 0, AVAILABLE_TODAY: 1 };
        return rank[left.get("availability") as keyof typeof rank]
          - rank[right.get("availability") as keyof typeof rank];
      })
      .slice(0, input.maximumCandidates);

    const existing = await adminDb.collection("matches")
      .where("requestId", "==", input.requestId)
      .get();
    const existingCandidates = new Set(existing.docs.map((doc) => doc.get("candidateId")));
    const candidates = eligible.filter((profile) => !existingCandidates.has(profile.id));
    const candidateLocales = new Map(await Promise.all(candidates.map(async (candidate) => {
      const user = await adminDb.doc(`users/${candidate.id}`).get();
      const locale = user.get("locale");
      return [candidate.id, isLocale(locale) ? locale : "my"] as [string, Locale];
    })));
    const batch = adminDb.batch();
    const created: Array<{ matchId: string; candidateId: string }> = [];

    for (const candidate of candidates) {
      const matchRef = adminDb.collection("matches").doc();
      const locale = candidateLocales.get(candidate.id) ?? "my";
      const notificationTitle = translate(locale, "notification.matchTitle");
      const notificationBody = `${requestSnapshot.get("bloodTypeNeeded")} · ${translate(locale, "notification.matchBodyPrefix")} ${requestSnapshot.get("coarseLocation.township")}.`;
      created.push({ matchId: matchRef.id, candidateId: candidate.id });
      batch.set(matchRef, {
        requestId: input.requestId,
        requesterId: requestSnapshot.get("requesterId"),
        organizationId,
        candidateId: candidate.id,
        candidateType: "INDIVIDUAL",
        status: "PENDING",
        policy: "EXACT_TYPE_AND_AVAILABILITY_V1",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: requestSnapshot.get("expiresAt"),
      });
      batch.set(adminDb.collection("notifications").doc(), {
        userId: candidate.id,
        type: "MATCH_AVAILABLE",
        resourceId: matchRef.id,
        title: notificationTitle,
        body: notificationBody,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    await Promise.all(created.map(({ matchId }) => writeAudit(
      auth.uid,
      "MATCH_CREATED",
      "MATCH",
      matchId,
      { requestId: input.requestId },
    )));
    await Promise.all(created.map(async ({ matchId, candidateId }) => {
      const tokens = await adminDb.collection("deviceTokens").where("userId", "==", candidateId).get();
      const locale = candidateLocales.get(candidateId) ?? "my";
      try {
        await sendSafeNotification(tokens.docs.map((doc) => doc.get("token")), {
          title: translate(locale, "notification.matchTitle"),
          body: `${requestSnapshot.get("bloodTypeNeeded")} · ${translate(locale, "notification.matchBodyPrefix")} ${requestSnapshot.get("coarseLocation.township")}. ${translate(locale, "notification.openApp")}`,
          type: "MATCH_AVAILABLE",
          resourceId: matchId,
        });
      } catch {
        console.error("Push delivery failed", { matchId });
      }
    }));

    return NextResponse.json({ created: created.length });
  } catch (error) {
    return jsonError(error);
  }
}
