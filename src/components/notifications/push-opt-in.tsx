"use client";

import { useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { getFirebaseServices } from "@/lib/firebase/client";

export function PushOptIn() {
  const { t } = useLocale();
  const [status, setStatus] = useState("");

  async function enable() {
    try {
      if (!await isSupported()) throw new Error("Unsupported");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Not granted");
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const { app } = getFirebaseServices();
      const token = await getToken(getMessaging(app), {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      if (!token) throw new Error("No token");
      await apiRequest("/device-tokens", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setStatus(t("notification.enabled"));
    } catch {
      setStatus(t("notification.unavailable"));
    }
  }

  return (
    <div className="card mt-6 p-5">
      <button className="button button-secondary" onClick={enable}>{t("notification.enable")}</button>
      {status ? <p className="mt-3 text-sm text-stone-600" role="status">{status}</p> : null}
    </div>
  );
}
