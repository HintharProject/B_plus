import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { jsonError, requireUser } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const [candidate, requester] = await Promise.all([
      adminDb.collection("matches").where("candidateId", "==", auth.uid).limit(50).get(),
      adminDb.collection("matches").where("requesterId", "==", auth.uid).limit(50).get(),
    ]);
    const unique = new Map([...candidate.docs, ...requester.docs].map((doc) => [doc.id, doc]));
    const matches = await Promise.all([...unique.values()].map(async (doc) => {
      const bloodRequest = await adminDb.doc(`bloodRequests/${doc.get("requestId")}`).get();
      const expired = ["PENDING", "ACCEPTED"].includes(doc.get("status"))
        && doc.get("expiresAt").toMillis() <= Date.now();
      return {
        id: doc.id,
        ...doc.data(),
        status: expired ? "EXPIRED" : doc.get("status"),
        request: bloodRequest.exists ? {
          bloodTypeNeeded: bloodRequest.get("bloodTypeNeeded"),
          urgency: bloodRequest.get("urgency"),
          hospital: bloodRequest.get("hospital"),
          coarseLocation: bloodRequest.get("coarseLocation"),
          neededBy: bloodRequest.get("neededBy"),
        } : null,
      };
    }));

    return NextResponse.json({ matches });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    await adminDb.collection("notifications")
      .where("userId", "==", auth.uid)
      .where("read", "==", false)
      .get()
      .then(async (snapshot) => {
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => batch.update(doc.ref, {
          read: true,
          readAt: FieldValue.serverTimestamp(),
        }));
        await batch.commit();
      });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
