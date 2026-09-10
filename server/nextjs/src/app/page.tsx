"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, login, register, saveSession, ServerDownError } from "@/lib/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/chat");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setServerDown(false);
    try {
      const res =
        mode === "login" ? await login(email, password) : await register(name, email, password);
      saveSession(res.token, res.user);
      router.replace("/chat");
    } catch (err) {
      if (err instanceof ServerDownError) setServerDown(true);
      else setError(err instanceof Error ? err.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <div className="card">
        <h1>دِوچت</h1>
        <p className="muted">گفتگوی زنده با برنامه‌نویس</p>

        {serverDown && (
          <div className="banner" style={{ marginTop: 16 }}>
            <span>سرور گفتگو در دسترس نیست. لطفاً چند لحظه منتظر بمانید.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              <span>نام</span>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}
          <label>
            <span>ایمیل</span>
            <input
              dir="ltr"
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>رمز عبور</span>
            <input
              dir="ltr"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn" disabled={busy}>
            {busy ? "لطفاً صبر کنید…" : mode === "login" ? "ورود" : "ثبت‌نام"}
          </button>
        </form>

        <button className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "حساب ندارید؟ ثبت‌نام کنید" : "قبلاً ثبت‌نام کرده‌اید؟ ورود"}
        </button>
      </div>
    </main>
  );
}
