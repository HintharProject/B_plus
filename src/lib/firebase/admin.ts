import "server-only";

import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  || "b-plus-local";

if (
  process.env.NODE_ENV !== "production"
  && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
) {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
}

function getCredential() {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }
  return undefined;
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const credential = getCredential();
  // Route Handlers may be imported during `next build` without runtime secrets.
  // Defer credentialed use until a request actually touches Admin services.
  return initializeApp({
    projectId,
    ...(credential ? { credential } : {}),
  });
}

function createLazyService<T extends object>(factory: () => T): T {
  let instance: T | undefined;
  return new Proxy({} as T, {
    get(_target, property, receiver) {
      instance ??= factory();
      const value = Reflect.get(instance, property, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const adminAuth = createLazyService<Auth>(() => getAuth(getAdminApp()));
export const adminDb = createLazyService<Firestore>(() => getFirestore(getAdminApp()));
export const adminMessaging = createLazyService<Messaging>(() => getMessaging(getAdminApp()));
