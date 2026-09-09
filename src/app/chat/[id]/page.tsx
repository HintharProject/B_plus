"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Send, ArrowLeft, Flag, ShieldOff } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";

type Message = {
  id: string;
  senderId: string;
  content: string;
};

function ConversationView() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [status, setStatus] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    try {
      const result = await apiRequest<{
        conversation: { status: string; matchId: string; participantIds: string[] };
        messages: Message[];
      }>(`/conversations/${params.id}`);
      setMessages(result.messages);
      setReadOnly(result.conversation.status !== "ACTIVE");
      setMatchId(result.conversation.matchId);
      setOtherUserId(
        result.conversation.participantIds.find((id) => id !== user?.uid) ?? "",
      );
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }, [params.id, t, user?.uid]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, [load]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiRequest(`/conversations/${params.id}`, {
        method: "POST",
        body: JSON.stringify({ content: data.get("content") }),
      });
      form.reset();
      await load();
    } catch {
      setStatus(t("errors.offline"));
    }
  }

  return (
    /* Full-height chat layout — flex column so input stays at bottom */
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Chat header */}
      <div className="sticky top-[60px] z-10 border-b border-stone-100 bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={matchId ? `/matches/${matchId}` : "/matches"}
            className="flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{t("nav.matches")}</span>
          </Link>
          <h1 className="text-sm font-black">{t("chat.title")}</h1>
          <div className="flex items-center gap-1">
            {matchId && (
              <Link
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-brand-700"
                href={`/reports/new?targetType=MATCH&targetId=${matchId}`}
                title={t("chat.report")}
                id="report-link"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
            {otherUserId && (
              <button
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-red-600"
                title={t("chat.block")}
                id="block-btn"
                onClick={async () => {
                  try {
                    await apiRequest("/blocks", {
                      method: "POST",
                      body: JSON.stringify({ blockedUserId: otherUserId, blocked: true }),
                    });
                    setStatus(t("chat.blocked"));
                  } catch {
                    setStatus(t("errors.offline"));
                  }
                }}
              >
                <ShieldOff className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages area — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-stone-400">
              No messages yet. Start the coordination.
            </p>
          )}
          {messages.map((message) => {
            const isMine = message.senderId === user?.uid;
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${
                    isMine
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-stone-100 text-stone-800"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — sticky at bottom */}
      <div className="sticky bottom-0 border-t border-stone-100 bg-cream/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-2xl">
          {status && (
            <p className="notice notice-warning mb-3 text-xs" role="status">{status}</p>
          )}
          {readOnly ? (
            <p className="notice notice-warning text-xs">{t("chat.readOnly")}</p>
          ) : (
            <form className="flex items-end gap-2" onSubmit={send}>
              <label className="sr-only" htmlFor="chat-message">{t("chat.placeholder")}</label>
              <textarea
                className="field mt-0 min-h-[44px] flex-1 resize-none py-3 leading-snug"
                id="chat-message"
                name="content"
                placeholder={t("chat.placeholder")}
                maxLength={2000}
                autoComplete="off"
                rows={1}
                required
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                className="button button-primary h-[44px] w-[44px] shrink-0 p-0"
                id="send-btn"
                aria-label={t("chat.send")}
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <AuthGuard><ConversationView /></AuthGuard>;
}
