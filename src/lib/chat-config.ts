/**
 * Connection settings for the external Laravel API and the WebSocket server.
 * Values can be baked in via env vars, or set by the user at runtime and kept
 * in localStorage (handy while the server is still being deployed to Render).
 */

const API_KEY = "chat.apiBase";
const WS_KEY = "chat.wsUrl";

const ENV_API_BASE = (import.meta.env['VITE_CHAT_API_BASE'] as string | undefined) ?? "";
const ENV_WS_URL = (import.meta.env['VITE_CHAT_WS_URL'] as string | undefined) ?? "";

function read(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key)?.trim() || fallback;
}

export function getApiBase(): string {
  return read(API_KEY, ENV_API_BASE).replace(/\/+$/, "");
}

export function getWsUrl(): string {
  return read(WS_KEY, ENV_WS_URL).replace(/\/+$/, "");
}

export function saveEndpoints(apiBase: string, wsUrl: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(API_KEY, apiBase.trim());
  window.localStorage.setItem(WS_KEY, wsUrl.trim());
}

export const TOKEN_KEY = "chat.token";
export const USER_KEY = "chat.user";

export type ChatUser = { id: number | string; name: string; email: string };

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
