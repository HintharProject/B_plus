"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  resourceId: string;
  read: boolean;
};

export function NotificationList() {
  const { t } = useLocale();
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    apiRequest<{ notifications: NotificationItem[] }>("/notifications")
      .then((result) => setItems(result.notifications))
      .catch(() => undefined);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="card mt-6 p-5">
      <h2 className="font-black">{t("notification.matchTitle")}</h2>
      <div className="mt-4 divide-y">
        {items.map((item) => (
          <Link
            className={`block py-3 text-sm ${item.read ? "text-stone-500" : "font-bold"}`}
            href={`/matches/${item.resourceId}`}
            key={item.id}
            onClick={() => {
              void apiRequest("/notifications", {
                method: "PATCH",
                body: JSON.stringify({ notificationId: item.id }),
              });
            }}
          >
            <span className="block">{item.title}</span>
            <span className="mt-1 block font-normal">{item.body}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
