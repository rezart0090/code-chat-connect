import type { SocketStatus } from "@/lib/use-chat-socket";

type Props = {
  status: SocketStatus;
  retryIn: number;
  onRetry: () => void;
};

export function ConnectionBanner({ status, retryIn, onRetry }: Props) {
  if (status === "online") return null;

  const connecting = status === "connecting";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        connecting
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-warning/40 bg-warning/10 text-warning"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          connecting ? "bg-accent" : "bg-warning"
        } animate-pulse-soft`}
        aria-hidden
      />
      <p className="font-medium">
        {connecting
          ? "در حال اتصال به سرور گفتگو…"
          : "سرور گفتگو در دسترس نیست. لطفاً چند لحظه منتظر بمانید؛ اتصال به‌صورت خودکار برقرار می‌شود."}
      </p>
      {!connecting && (
        <span className="text-warning/80">
          {retryIn > 0 ? `تلاش بعدی تا ${retryIn} ثانیه` : "در حال تلاش مجدد…"}
        </span>
      )}
      <button
        onClick={onRetry}
        className="ms-auto rounded-md border border-current/40 px-3 py-1 text-xs font-semibold transition-colors hover:bg-current/10"
      >
        تلاش مجدد
      </button>
    </div>
  );
}
