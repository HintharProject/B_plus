import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [uid, confirmation] = process.argv.slice(2);
if (!uid || confirmation !== "--confirm") {
  console.error("Usage: npm run admin:set -- <firebase-uid> --confirm");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
if (!projectId) {
  console.error("FIREBASE_ADMIN_PROJECT_ID is required.");
  process.exit(1);
}

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
const credential = process.env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey
  ? cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    })
  : applicationDefault();

const app = getApps()[0] ?? initializeApp({ projectId, credential });
const auth = getAuth(app);
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log(`Admin claim set for UID ${uid}. The user must sign in again.`);
