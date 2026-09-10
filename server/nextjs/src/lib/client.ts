"use client";

/** Client-side session + API helpers. The API lives on the same origin. */

export type ChatUser = { id: number | string; name: string; email: string };

export type ChatMessage = {
  id: string;
  body: string;
  user_id: number | string;
  user_name: string;
  created_at: string;
};

const TOKEN_KEY = "chat.token";
const USER_KEY = "chat.user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): ChatUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ChatUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: ChatUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/** Socket address: build-time env, otherwise same host with ws/wss. */
export function getWsUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

export class ServerDownError extends Error {
  constructor(message = "سرور در دسترس نیست") {
    super(message);
    this.name = "ServerDownError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ServerDownError();
  } finally {
    clearTimeout(timer);
  }

  if (res.status >= 500) throw new ServerDownError();

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error((body["message"] as string) || "درخواست ناموفق بود");
  return body as T;
}

type AuthResponse = { token: string; user: ChatUser };

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return request<AuthResponse>("/api/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, password_confirmation: password }),
  });
}

export function fetchHistory() {
  return request<{ messages: ChatMessage[] }>("/api/messages");
}

export function sendMessage(body: string) {
  return request<{ message: ChatMessage }>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
