import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { login, register, ServerDownError } from "@/lib/chat-api";
import { getToken, saveSession } from "@/lib/chat-config";
import { EndpointSettings } from "@/components/EndpointSettings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ورود و ثبت‌نام | دِوچت" },
      {
        name: "description",
        content:
          "وارد حساب خود شوید یا ثبت‌نام کنید تا گفتگوی زنده با برنامه‌نویس را آغاز کنید.",
      },
      { property: "og:title", content: "ورود و ثبت‌نام | دِوچت" },
      {
        property: "og:description",
        content: "حساب بسازید و گفتگوی زنده با برنامه‌نویس را شروع کنید.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    if (getToken()) navigate({ to: "/chat", replace: true });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setServerDown(false);
    try {
      const res =
        mode === "login"
          ? await login(email, password)
          : await register(name, email, password);
      saveSession(res.token, res.user);
      navigate({ to: "/chat" });
    } catch (err) {
      if (err instanceof ServerDownError) {
        setServerDown(true);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
            &lt;/&gt; dev-chat
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">گفتگوی زنده با برنامه‌نویس</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            سؤال پروژه‌تان را بپرسید و پاسخ را همان لحظه بگیرید.
          </p>
        </div>

        <div className="surface p-6">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-secondary/60 p-1 text-sm">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-md px-3 py-2 font-medium transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "ورود" : "ثبت‌نام"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <label className="block space-y-1.5">
                <span className="text-xs text-muted-foreground">نام و نام خانوادگی</span>
                <input
                  className="field"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً رضا محمدی"
                />
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">ایمیل</span>
              <input
                dir="ltr"
                type="email"
                className="field font-mono text-sm"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">رمز عبور</span>
              <input
                dir="ltr"
                type="password"
                className="field font-mono text-sm"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            {serverDown && (
              <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-3 text-xs leading-6 text-warning">
                سرور در حال حاضر پاسخ نمی‌دهد. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "لطفاً منتظر بمانید…" : mode === "login" ? "ورود" : "ساخت حساب"}
            </button>
          </form>
        </div>

        <div className="mt-6 flex justify-center">
          <EndpointSettings />
        </div>
      </div>
    </main>
  );
}
