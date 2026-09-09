# سرور گفتگو (Next.js + Prisma + سوکت)

این پوشه کد سمت سرور است و **داخل این پروژه اجرا نمی‌شود**؛ آن را روی
[Render](https://render.com) مستقر کنید و سپس آدرس‌ها را در برنامه ثبت کنید.

```
server/
├── nextjs/   ← API با Next.js و Prisma: ثبت‌نام، ورود، ذخیره و خواندن پیام‌ها
└── socket/   ← سرور WebSocket برای پخش زنده‌ی پیام‌ها
```

## ۱) استقرار سرویس Next.js

1. محتوای `server/nextjs` را در یک ریپازیتوری قرار دهید (یا از همین ریپو با
   `rootDir: nextjs` استفاده کنید).
2. در Render یک سرویس Web از نوع Node بسازید.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
3. یک دیتابیس رایگان PostgreSQL در Render بسازید و به سرویس وصل کنید.

متغیرهای محیطی لازم:

| نام | توضیح |
| --- | --- |
| `DATABASE_URL` | آدرس دیتابیس PostgreSQL از پنل Render |
| `JWT_SECRET` | یک رشته‌ی تصادفی برای امضای توکن ورود |
| `SOCKET_URL` | آدرس داخلی سرور سوکت، مثل `http://chat-socket:3000` |
| `SOCKET_SECRET` | یک رشته‌ی تصادفی، مشترک با سرور سوکت |
| `FRONTEND_ORIGIN` | آدرس این برنامه، برای CORS |

جدول‌های دیتابیس هنگام build با `prisma db push` از روی
`prisma/schema.prisma` ساخته می‌شوند.

مسیرهای API: `/api/health`, `/api/register`, `/api/login`, `/api/me`,
`/api/logout`, `/api/messages` (GET و POST). ورود با توکن Bearer انجام می‌شود.

## ۲) استقرار سرور سوکت

پوشه‌ی `server/socket` یک سرویس Node است:

- Build command: `npm install`
- Start command: `npm start`
- متغیرها: `SOCKET_SECRET` (همان مقدار سرویس API) و `LARAVEL_URL` که باید روی
  آدرس داخلی سرویس Next.js تنظیم شود (نام متغیر برای سازگاری حفظ شده است).

## ۳) اتصال برنامه

در صفحه‌ی ورود روی «تنظیم آدرس سرور» بزنید و وارد کنید:

- آدرس API: `https://<نام-سرویس>.onrender.com`
- آدرس سوکت: `wss://<نام-سرویس-سوکت>.onrender.com`

یا همان مقادیر را به‌عنوان `VITE_CHAT_API_BASE` و `VITE_CHAT_WS_URL` تنظیم کنید.

> سرویس‌های رایگان Render پس از بی‌کاری خاموش می‌شوند. در آن حالت برنامه پیام
> «لطفاً منتظر بمانید» را نشان می‌دهد، پیام‌ها را در صف نگه می‌دارد و پس از
> بیدار شدن سرور خودکار ارسال می‌کند.
