import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  registerDeviceTokenHandler,
  reportAbuseHandler,
  sendMessageHandler,
} from "./communication";
import {
  createMatchesHandler,
  respondToMatchHandler,
  revealMatchHandler,
} from "./matches";
import {
  createOrganizationHandler,
  respondToOrganizationMembershipHandler,
  reviewOrganizationHandler,
  setOrganizationMemberHandler,
} from "./organizations";
import {
  createBloodRequestHandler,
  updateRequestStatusHandler,
} from "./requests";
import { bootstrapUserHandler, setDonorProfileHandler } from "./users";

initializeApp();
setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 20,
  concurrency: 40,
});

export const bootstrapUser = onCall(bootstrapUserHandler);
export const setDonorProfile = onCall(setDonorProfileHandler);
export const createBloodRequest = onCall(createBloodRequestHandler);
export const updateRequestStatus = onCall(updateRequestStatusHandler);
export const createMatches = onCall(createMatchesHandler);
export const respondToMatch = onCall(respondToMatchHandler);
export const revealMatch = onCall(revealMatchHandler);
export const sendMessage = onCall(sendMessageHandler);
export const reportAbuse = onCall(reportAbuseHandler);
export const registerDeviceToken = onCall(registerDeviceTokenHandler);
export const createOrganization = onCall(createOrganizationHandler);
export const setOrganizationMember = onCall(setOrganizationMemberHandler);
export const respondToOrganizationMembership = onCall(respondToOrganizationMembershipHandler);
export const reviewOrganization = onCall(reviewOrganizationHandler);

export const expireMatchesAndRequests = onSchedule("every 15 minutes", async () => {
  const db = getFirestore();
  const now = Timestamp.now();
  const [matches, requests] = await Promise.all([
    db.collection("matches").where("status", "in", ["PENDING", "ACCEPTED"]).where("expiresAt", "<=", now).limit(400).get(),
    db.collection("bloodRequests").where("status", "==", "ACTIVE").where("expiresAt", "<=", now).limit(400).get(),
  ]);
  const batch = db.batch();
  matches.docs.forEach((match) => {
    batch.update(match.ref, { status: "EXPIRED", expiredAt: FieldValue.serverTimestamp() });
    const conversationId = match.get("conversationId");
    if (conversationId) {
      batch.update(db.doc(`conversations/${conversationId}`), {
        status: "READ_ONLY",
        expiredAt: FieldValue.serverTimestamp(),
      });
    }
  });
  requests.docs.forEach((request) => {
    batch.update(request.ref, { status: "EXPIRED", expiredAt: FieldValue.serverTimestamp() });
  });
  await batch.commit();
});
