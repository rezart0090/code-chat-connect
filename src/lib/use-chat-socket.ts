import { useCallback, useEffect, useRef, useState } from "react";
import { getToken, getWsUrl } from "./chat-config";
import type { ChatMessage } from "./chat-api";

export type SocketStatus = "connecting" | "online" | "offline";

type Options = {
  enabled: boolean;
  onMessage: (message: ChatMessage) => void;
};

/**
 * Keeps a WebSocket open to the chat socket server and retries with a
 * capped backoff. While it cannot connect the status stays "offline" so the
 * UI can ask the customer to wait.
 */
export function useChatSocket({ enabled, onMessage }: Options) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [retryIn, setRetryIn] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const url = getWsUrl();
    if (!url) {
      setStatus("offline");
      return;
    }

    setStatus((s) => (s === "online" ? s : "connecting"));

    let socket: WebSocket;
    try {
      const token = getToken();
      socket = new WebSocket(token ? `${url}?token=${encodeURIComponent(token)}` : url);
    } catch {
      setStatus("offline");
      scheduleRetry();
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => {
      attemptRef.current = 0;
      setRetryIn(0);
      setStatus("online");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as
          | { type: "message"; message: ChatMessage }
          | { type: string };
        if (payload && "message" in payload && payload.type === "message") {
          onMessageRef.current(payload.message);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    socket.onerror = () => socket.close();

    socket.onclose = () => {
      socketRef.current = null;
      setStatus("offline");
      scheduleRetry();
    };

    function scheduleRetry() {
      attemptRef.current += 1;
      const delay = Math.min(30, 2 ** Math.min(attemptRef.current, 4));
      setRetryIn(delay);
      const tick = setInterval(() => setRetryIn((v) => (v > 0 ? v - 1 : 0)), 1000);
      const t = setTimeout(() => {
        clearInterval(tick);
        connect();
      }, delay * 1000);
      timersRef.current.push(t as unknown as ReturnType<typeof setTimeout>);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    connect();
    const timers = timersRef;
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, connect]);

  const send = useCallback((body: string) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type: "message", body }));
    return true;
  }, []);

  const reconnectNow = useCallback(() => {
    attemptRef.current = 0;
    setRetryIn(0);
    socketRef.current?.close();
    connect();
  }, [connect]);

  return { status, retryIn, send, reconnectNow };
}
