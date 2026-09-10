"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearSession,
  fetchHistory,
  getStoredUser,
  getToken,
  sendMessage,
  ServerDownError,
  type ChatMessage,
  type ChatUser,
} from "@/lib/client";
import { useChatSocket } from "@/lib/useChatSocket";

type Pending = { id: string; body: string };

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [draft, setDraft] = useState("");
  const [apiDown, setApiDown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    setUser(getStoredUser());
  }, [router]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  const { status, retryIn, reconnectNow } = useChatSocket({
    enabled: Boolean(user),
    onMessage: addMessage,
  });

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchHistory();
      setMessages(res.messages);
      setApiDown(false);
    } catch (err) {
      if (err instanceof ServerDownError) setApiDown(true);
    }
  }, []);

  useEffect(() => {
    if (user) void loadHistory();
  }, [user, loadHistory]);

  // Retry queued messages as soon as the server answers again.
  useEffect(() => {
    if (apiDown || queue.length === 0) return;
    const next = queue[0]!;
    let cancelled = false;
    (async () => {
      try {
        const res = await sendMessage(next.body);
        if (cancelled) return;
        addMessage(res.message);
        setQueue((q) => q.filter((p) => p.id !== next.id));
      } catch (err) {
        if (err instanceof ServerDownError) setApiDown(true);
        else setQueue((q) => q.filter((p) => p.id !== next.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiDown, queue, addMessage]);

  // Poll while the server is asleep so the UI recovers by itself.
  useEffect(() => {
    if (!apiDown) return;
    const t = setInterval(() => void loadHistory(), 5000);
    return () => clearInterval(t);
  }, [apiDown, loadHistory]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, queue]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const pending: Pending = { id: `p-${Date.now()}`, body };
    setQueue((q) => [...q, pending]);
  }

  function logout() {
    clearSession();
    router.replace("/");
  }

  const offline = apiDown || status !== "online";

  return (
    <main className="chat">
      <div className="topbar">
        <div>
          <strong>اتاق گفتگو</strong>
          <p className="muted">
            <span className={`dot ${status}`} />
            {apiDown
              ? "سرور در دسترس نیست"
              : status === "online"
                ? "متصل"
                : status === "connecting"
                  ? "در حال اتصال…"
                  : "قطع"}
          </p>
        </div>
        <button className="link" onClick={logout}>
          خروج
        </button>
      </div>

      {offline && (
        <div className="banner">
          <span>
            سرور گفتگو در دسترس نیست. لطفاً چند لحظه منتظر بمانید؛ پیام‌های شما پس از برگشت
            اتصال ارسال می‌شوند.
            {retryIn > 0 && ` (تلاش دوباره تا ${retryIn} ثانیه)`}
          </span>
          <button
            onClick={() => {
              reconnectNow();
              void loadHistory();
            }}
          >
            تلاش دوباره
          </button>
        </div>
      )}

      <div className="messages" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg${String(m.user_id) === String(user?.id) ? " mine" : ""}`}>
            <span className="who">{m.user_name}</span>
            {m.body}
          </div>
        ))}
        {queue.map((p) => (
          <div key={p.id} className="msg mine pending">
            <span className="who">در حال ارسال…</span>
            {p.body}
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={submit}>
        <input
          className="field"
          placeholder="پیام خود را بنویسید…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn">ارسال</button>
      </form>
    </main>
  );
}
