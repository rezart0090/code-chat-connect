import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchHistory,
  sendMessage,
  ServerDownError,
  type ChatMessage,
} from "@/lib/chat-api";
import { clearSession, getStoredUser, getToken, type ChatUser } from "@/lib/chat-config";
import { useChatSocket } from "@/lib/use-chat-socket";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { EndpointSettings } from "@/components/EndpointSettings";

export const Route = createFileRoute("/chat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "اتاق گفتگو | دِوچت" },
      {
        name: "description",
        content: "گفتگوی زنده با برنامه‌نویس، همراه با نمایش وضعیت اتصال سرور.",
      },
      { property: "og:title", content: "اتاق گفتگو | دِوچت" },
      {
        property: "og:description",
        content: "پیام بفرستید و پاسخ برنامه‌نویس را به‌صورت زنده ببینید.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/", replace: true });
      return;
    }
    setUser(getStoredUser());
  }, [navigate]);

  const handleIncoming = useCallback((message: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  const { status, retryIn, send, reconnectNow } = useChatSocket({
    enabled: Boolean(user),
    onMessage: handleIncoming,
  });

  // Load history whenever the connection comes back up.
  useEffect(() => {
    if (status !== "online") return;
    let cancelled = false;
    fetchHistory()
      .then((res) => {
        if (!cancelled) setMessages(res.messages);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  // Flush queued messages once the server answers again.
  useEffect(() => {
    if (status !== "online" || pending.length === 0) return;
    const queue = [...pending];
    setPending([]);
    (async () => {
      for (const body of queue) {
        try {
          const res = await sendMessage(body);
          handleIncoming(res.message);
        } catch {
          setPending((prev) => [...prev, body]);
        }
      }
    })();
  }, [status, pending, handleIncoming]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setNotice(null);

    if (status !== "online") {
      setPending((prev) => [...prev, body]);
      setNotice("سرور گفتگو در دسترس نیست. پیام شما ذخیره شد و به‌محض اتصال ارسال می‌شود.");
      return;
    }

    try {
      const res = await sendMessage(body);
      handleIncoming(res.message);
      send(body);
    } catch (err) {
      setPending((prev) => [...prev, body]);
      setNotice(
        err instanceof ServerDownError
          ? "سرور پاسخ نداد. لطفاً منتظر بمانید؛ پیام شما در صف ارسال است."
          : "ارسال پیام ناموفق بود. دوباره تلاش می‌کنیم.",
      );
    }
  }

  function handleLogout() {
    clearSession();
    navigate({ to: "/", replace: true });
  }

  if (!user) return null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="surface flex flex-wrap items-center gap-3 px-4 py-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status === "online"
              ? "bg-success"
              : status === "connecting"
                ? "bg-accent animate-pulse-soft"
                : "bg-warning animate-pulse-soft"
          }`}
          aria-hidden
        />
        <div>
          <h1 className="text-base font-semibold leading-tight">اتاق گفتگو</h1>
          <p className="text-xs text-muted-foreground">
            {status === "online" ? "متصل" : status === "connecting" ? "در حال اتصال" : "قطع"} ·{" "}
            {user.name}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="ms-auto rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          خروج
        </button>
      </header>

      <ConnectionBanner status={status} retryIn={retryIn} onRetry={reconnectNow} />

      <section className="surface flex min-h-[55vh] flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && pending.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
            هنوز پیامی نیست. اولین سؤال خود را بنویسید.
          </p>
        )}

        {messages.map((m) => {
          const mine = String(m.user_id) === String(user.id);
          return (
            <article
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-7 ${
                mine
                  ? "self-start bg-bubble-self text-bubble-self-foreground"
                  : "self-end bg-secondary text-secondary-foreground"
              }`}
            >
              {!mine && (
                <p className="mb-1 text-xs font-semibold text-primary">{m.user_name}</p>
              )}
              <p className="whitespace-pre-wrap">{m.body}</p>
            </article>
          );
        })}

        {pending.map((body, i) => (
          <article
            key={`pending-${i}`}
            className="max-w-[85%] self-start rounded-2xl border border-dashed border-warning/50 bg-warning/10 px-4 py-2.5 text-sm leading-7 text-warning"
          >
            <p className="whitespace-pre-wrap">{body}</p>
            <p className="mt-1 text-xs opacity-80">در صف ارسال — منتظر اتصال سرور</p>
          </article>
        ))}

        <div ref={bottomRef} />
      </section>

      {notice && (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
          {notice}
        </p>
      )}

      <form onSubmit={handleSend} className="surface flex items-end gap-2 p-3">
        <textarea
          rows={1}
          className="field resize-none"
          placeholder="پیام خود را بنویسید…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend(e as unknown as React.FormEvent);
            }
          }}
        />
        <button type="submit" className="btn-primary shrink-0">
          ارسال
        </button>
      </form>

      <div className="flex justify-center pb-4">
        <EndpointSettings onSaved={reconnectNow} />
      </div>
    </main>
  );
}
