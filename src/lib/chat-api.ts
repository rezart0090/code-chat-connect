import { getApiBase, getToken, type ChatUser } from "./chat-config";

/** Thrown when the Laravel server is unreachable (down, sleeping, or not set). */
export class ServerDownError extends Error {
  constructor(message = "سرور در دسترس نیست") {
    super(message);
    this.name = "ServerDownError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  if (!base) throw new ServerDownError("آدرس سرور تنظیم نشده است");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
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

  if (res.status >= 500 || res.status === 502 || res.status === 503) {
    throw new ServerDownError();
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((body["message"] as string) || "درخواست ناموفق بود");
  }
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

export type ChatMessage = {
  id: string;
  body: string;
  user_id: number | string;
  user_name: string;
  created_at: string;
};

export function fetchHistory() {
  return request<{ messages: ChatMessage[] }>("/api/messages");
}

export function sendMessage(body: string) {
  return request<{ message: ChatMessage }>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function pingServer(): Promise<boolean> {
  try {
    await request<unknown>("/api/health");
    return true;
  } catch {
    return false;
  }
}
