import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const uid = args.find((arg) => arg !== "confirm" && arg !== "--confirm");
const confirmed = args.includes("confirm") || args.includes("--confirm");

if (!uid || !confirmed) {
  console.error("Usage: npm run admin:set -- <firebase-uid> confirm");
  console.error("Example: npm run admin:set -- 1WsLq8vlZFMaB7SXc1sXNGhBRN73 confirm");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
if (!projectId) {
  console.error("FIREBASE_ADMIN_PROJECT_ID is required in .env.local.");
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
console.log(`Admin claim set for UID ${uid}. The user must sign out and sign in again.`);
