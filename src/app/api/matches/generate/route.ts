import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { BLOOD_COMPATIBILITY, type BloodType, getBloodCompatibilityScore } from "@/lib/domain";
import { getDistanceKm, resolveLocationCoordinates } from "@/lib/geo";
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
    await enforceRateLimit(auth.uid, "generate_matches", 20, 3600);
    const input = inputSchema.parse(await request.json());

    const requestSnapshot = await adminDb.doc(`bloodRequests/${input.requestId}`).get();
    if (!requestSnapshot.exists) {
      throw new HttpError(404, "NOT_FOUND", "Blood request not found.");
    }
    if (requestSnapshot.get("status") !== "ACTIVE") {
      throw new HttpError(409, "INVALID_STATE", "Only an active request can be matched.");
    }
    if (requestSnapshot.get("expiresAt").toMillis() <= Date.now()) {
      throw new HttpError(409, "EXPIRED", "This request has expired.");
    }

    const organizationId = requestSnapshot.get("organizationId") as string | null;
    const requesterId = requestSnapshot.get("requesterId") as string;

    // The requester, an org coordinator, or an admin can generate matches
    if (requesterId !== auth.uid && !auth.admin) {
      if (!organizationId) throw new HttpError(403, "FORBIDDEN", "Access denied.");
      await requireOrganizationRole(organizationId, auth.uid, ["OWNER", "COORDINATOR"]);
    }

    const bloodTypeNeeded = requestSnapshot.get("bloodTypeNeeded") as BloodType;
    const requestCoords = resolveLocationCoordinates(
      requestSnapshot.get("coarseLocation.township"),
      requestSnapshot.get("coarseLocation.stateRegion"),
      requestSnapshot.get("coordinates"),
    );

    // 1. Compatible Blood Types using medical ABO/Rh matrix
    const compatibleBloodTypes = BLOOD_COMPATIBILITY[bloodTypeNeeded] ?? [bloodTypeNeeded];

    // Query active donors with compatible blood types.
    // Note: Firestore does not support multiple 'in' clauses in a single query;
    // availability is filtered in memory.
    const profileSnapshots = await adminDb.collection("donorProfiles")
      .where("bloodType", "in", compatibleBloodTypes)
      .limit(100)
      .get();

    // 2. Compute distance, blood score, and availability for each candidate
    const candidatesWithDistance = (
      await Promise.all(
        profileSnapshots.docs.map(async (profile) => {
          if (profile.id === requesterId) return null;
          const availability = profile.get("availability") as string;
          if (availability !== "AVAILABLE_NOW" && availability !== "AVAILABLE_TODAY") return null;

          const userDoc = await adminDb.doc(`users/${profile.id}`).get();
          if (userDoc.get("accountState") === "SUSPENDED") return null;

          const donorCoords = resolveLocationCoordinates(
            profile.get("coarseLocation.township"),
            profile.get("coarseLocation.stateRegion"),
            profile.get("coordinates"),
          );

          const distanceKm = getDistanceKm(requestCoords, donorCoords);
          const bloodScore = getBloodCompatibilityScore(profile.get("bloodType"), bloodTypeNeeded);
          const availabilityRank = profile.get("availability") === "AVAILABLE_NOW" ? 0 : 1;

          return {
            id: profile.id,
            profile,
            distanceKm,
            bloodScore,
            availabilityRank,
          };
        }),
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    // 3. Sort candidates: Nearest distance first, then availability, then exact blood match
    candidatesWithDistance.sort((a, b) => {
      // Expanding radius priority: group by distance
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.availabilityRank !== b.availabilityRank) {
        return a.availabilityRank - b.availabilityRank;
      }
      return b.bloodScore - a.bloodScore;
    });

    // 4. Query nearby verified organizations
    const orgSnapshots = await adminDb.collection("organizations")
      .where("verificationStatus", "==", "VERIFIED")
      .limit(30)
      .get();

    const nearbyOrgs = orgSnapshots.docs
      .filter((doc) => doc.id !== organizationId)
      .map((doc) => {
        const orgCoords = resolveLocationCoordinates(
          doc.get("coarseLocation.township"),
          doc.get("coarseLocation.stateRegion"),
          doc.get("coordinates"),
        );
        const distanceKm = getDistanceKm(requestCoords, orgCoords);
        return { id: doc.id, distanceKm, name: doc.get("name") };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3); // Up to 3 nearest verified orgs

    // 5. Existing matches check
    const existingMatches = await adminDb.collection("matches")
      .where("requestId", "==", input.requestId)
      .get();
    const existingCandidateIds = new Set(existingMatches.docs.map((doc) => doc.get("candidateId")));

    const newDonorCandidates = candidatesWithDistance
      .filter((c) => !existingCandidateIds.has(c.id))
      .slice(0, input.maximumCandidates);

    const newOrgCandidates = nearbyOrgs.filter((org) => !existingCandidateIds.has(org.id));

    // Prepare batch
    const batch = adminDb.batch();
    const created: Array<{ matchId: string; candidateId: string; type: string; distanceKm: number }> = [];

    // Create donor matches
    for (const item of newDonorCandidates) {
      const matchRef = adminDb.collection("matches").doc();
      const userDoc = await adminDb.doc(`users/${item.id}`).get();
      const locale: Locale = isLocale(userDoc.get("locale")) ? userDoc.get("locale") : "my";

      const notifTitle = translate(locale, "notification.matchTitle");
      const notifBody = `${bloodTypeNeeded} · ${translate(locale, "notification.matchBodyPrefix")} ${requestSnapshot.get("coarseLocation.township")} (${item.distanceKm} km).`;

      batch.set(matchRef, {
        requestId: input.requestId,
        requesterId,
        organizationId,
        candidateId: item.id,
        candidateType: "INDIVIDUAL",
        distanceKm: item.distanceKm,
        status: "PENDING",
        policy: "COMPATIBILITY_AND_DISTANCE_V2",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: requestSnapshot.get("expiresAt"),
      });

      batch.set(adminDb.collection("notifications").doc(), {
        userId: item.id,
        type: "MATCH_AVAILABLE",
        resourceId: matchRef.id,
        title: notifTitle,
        body: notifBody,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      created.push({ matchId: matchRef.id, candidateId: item.id, type: "INDIVIDUAL", distanceKm: item.distanceKm });
    }

    // Create organization matches
    for (const org of newOrgCandidates) {
      const matchRef = adminDb.collection("matches").doc();
      batch.set(matchRef, {
        requestId: input.requestId,
        requesterId,
        organizationId,
        candidateId: org.id,
        candidateType: "ORGANIZATION",
        distanceKm: org.distanceKm,
        status: "PENDING",
        policy: "LOCATION_NEARBY_ORG_V1",
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: requestSnapshot.get("expiresAt"),
      });
      created.push({ matchId: matchRef.id, candidateId: org.id, type: "ORGANIZATION", distanceKm: org.distanceKm });
    }

    await batch.commit();

    // Audit logs
    await Promise.all(
      created.map(({ matchId, type, distanceKm }) =>
        writeAudit(auth.uid, "MATCH_CREATED", "MATCH", matchId, {
          requestId: input.requestId,
          type,
          distanceKm,
        }),
      ),
    );

    // Push notifications for donor candidates
    await Promise.all(
      newDonorCandidates.map(async (candidate) => {
        const tokens = await adminDb.collection("deviceTokens").where("userId", "==", candidate.id).get();
        const userDoc = await adminDb.doc(`users/${candidate.id}`).get();
        const locale: Locale = isLocale(userDoc.get("locale")) ? userDoc.get("locale") : "my";

        try {
          await sendSafeNotification(tokens.docs.map((doc) => doc.get("token")), {
            title: translate(locale, "notification.matchTitle"),
            body: `${bloodTypeNeeded} · ${translate(locale, "notification.matchBodyPrefix")} ${requestSnapshot.get("coarseLocation.township")} (${candidate.distanceKm} km). ${translate(locale, "notification.openApp")}`,
            type: "MATCH_AVAILABLE",
            resourceId: input.requestId,
          });
        } catch {
          console.error("Push delivery failed for candidate", candidate.id);
        }
      }),
    );

    return NextResponse.json({
      created: created.length,
      donorsMatched: newDonorCandidates.length,
      organizationsAlerted: newOrgCandidates.length,
    });
  } catch (error) {
    return jsonError(error);
  }
}
