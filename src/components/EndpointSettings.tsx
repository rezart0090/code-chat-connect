import { useEffect, useState } from "react";
import { getApiBase, getWsUrl, saveEndpoints } from "@/lib/chat-config";

/** Lets the operator point the app at their Next.js API and socket server. */
export function EndpointSettings({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState("");
  const [ws, setWs] = useState("");

  useEffect(() => {
    setApi(getApiBase());
    setWs(getWsUrl());
  }, [open]);

  return (
    <div className="text-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        تنظیم آدرس سرور
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-card/70 p-4">
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">آدرس سرور API</span>
            <input
              dir="ltr"
              className="field font-mono text-xs"
              placeholder="https://my-api.onrender.com"
              value={api}
              onChange={(e) => setApi(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted-foreground">آدرس سرور سوکت</span>
            <input
              dir="ltr"
              className="field font-mono text-xs"
              placeholder="wss://my-socket.onrender.com"
              value={ws}
              onChange={(e) => setWs(e.target.value)}
            />
          </label>
          <button
            className="btn-primary w-full"
            onClick={() => {
              saveEndpoints(api, ws);
              setOpen(false);
              onSaved?.();
            }}
          >
            ذخیره
          </button>
        </div>
      )}
    </div>
  );
}
