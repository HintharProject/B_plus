import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = process.env.NEXT_PUBLIC_ENABLE_FIREBASE === "true"
  && Object.values(firebaseConfig).every(Boolean);

let services: { app: FirebaseApp; auth: Auth; db: Firestore; functions: Functions } | null = null;
let emulatorsConnected = false;

export function getFirebaseServices() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }
  if (services) return services;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(
    app,
    process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "asia-southeast1",
  );

  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
    && typeof window !== "undefined"
    && !emulatorsConnected
  ) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    emulatorsConnected = true;
  }

  services = { app, auth, db, functions };
  return services;
}
