import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "دِوچت — راهنمای اجرای سرور گفتگو" },
      {
        name: "description",
        content:
          "کد کامل دِوچت شامل سرویس Next.js (رابط کاربری و API) و سرور سوکت است؛ راهنمای استقرار روی Render.",
      },
      { property: "og:title", content: "دِوچت — راهنمای اجرای سرور گفتگو" },
      {
        property: "og:description",
        content: "دو سرویس: Next.js برای رابط کاربری و API، و سرور سوکت برای پیام زنده.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card/70 p-6">
        <h1 className="text-xl font-semibold text-foreground">دِوچت</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          کل برنامه (رابط کاربری فارسی، ورود و ثبت‌نام، و API) داخل سرویس Next.js در پوشه‌ی{" "}
          <code className="font-mono text-xs">server/nextjs</code> قرار دارد و پیام‌های زنده از
          سرویس دوم در <code className="font-mono text-xs">server/socket</code> پخش می‌شود.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>۱) سرویس Next.js را روی Render مستقر کنید؛ همان آدرس، صفحه‌ی گفتگو را نشان می‌دهد.</li>
          <li>۲) سرویس سوکت را مستقر کنید و آدرس آن را در متغیر NEXT_PUBLIC_SOCKET_URL بگذارید.</li>
          <li>
            ۳) راهنمای کامل در <code className="font-mono text-xs">server/README.md</code> است.
          </li>
        </ul>
      </div>
    </main>
  );
}
