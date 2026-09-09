"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { apiRequest } from "@/lib/api";
import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Locale } from "@/lib/i18n";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string, locale: Locale) => Promise<void>;
  register: (name: string, email: string, password: string, locale: Locale) => Promise<void>;
  signInWithGoogle: (locale: Locale) => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/unauthorized-domain":
        return "auth.unauthorizedDomain";
      case "auth/popup-blocked":
        return "auth.popupBlocked";
      case "auth/popup-closed-by-user":
        return "auth.popupClosed";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "auth.invalidCredential";
      case "auth/too-many-requests":
        return "auth.tooManyRequests";
      case "auth/email-already-in-use":
        return "auth.emailInUse";
      default:
        return "auth.genericError";
    }
  }
  return "auth.genericError";
}

async function bootstrap(displayName: string, locale: Locale) {
  await apiRequest("/account/bootstrap", {
    method: "POST",
    body: JSON.stringify({ displayName, locale }),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const { auth } = getFirebaseServices();
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string, locale: Locale) => {
    const { auth } = getFirebaseServices();
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await bootstrap(
      credential.user.displayName ?? email.split("@")[0] ?? "B+ user",
      locale,
    );
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    locale: Locale,
  ) => {
    const { auth } = getFirebaseServices();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    await bootstrap(name, locale);
  }, []);

  const signInWithGoogle = useCallback(async (locale: Locale) => {
    const { auth } = getFirebaseServices();
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    await bootstrap(credential.user.displayName ?? "B+ user", locale);
  }, []);

  const resendVerification = useCallback(async () => {
    if (!user) throw new Error("Authentication is required.");
    await sendEmailVerification(user);
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    const { auth } = getFirebaseServices();
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOut = useCallback(async () => {
    const { auth } = getFirebaseServices();
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    configured: isFirebaseConfigured,
    signIn,
    register,
    signInWithGoogle,
    resendVerification,
    resetPassword,
    signOut,
  }), [loading, register, resendVerification, resetPassword, signIn, signInWithGoogle, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
