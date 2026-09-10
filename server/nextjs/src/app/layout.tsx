import "./globals.css";

export const metadata = {
  title: "دِوچت — گفتگوی آنلاین با برنامه‌نویس",
  description: "گفتگوی زنده برنامه‌نویس و مشتری، با اطلاع‌رسانی وضعیت سرور و اتصال خودکار.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
