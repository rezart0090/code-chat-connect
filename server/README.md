# برنامه‌ی گفتگو (دو سرویس: Next.js و سوکت)

کل برنامه فقط از **دو سرویس** تشکیل شده و روی [Render](https://render.com) مستقر می‌شود:

```
server/
├── nextjs/   ← رابط کاربری فارسی + API (ثبت‌نام، ورود، پیام‌ها) با Prisma
└── socket/   ← سرور WebSocket برای پخش زنده‌ی پیام‌ها
```

## ۱) سرویس Next.js (برنامه + API)

- Build command: `npm install && npm run build`
- Start command: `npm start`
- یک دیتابیس رایگان PostgreSQL بسازید و به سرویس وصل کنید.

متغیرهای محیطی:

| نام | توضیح |
| --- | --- |
| `DATABASE_URL` | آدرس دیتابیس PostgreSQL از پنل Render |
| `JWT_SECRET` | یک رشته‌ی تصادفی برای امضای توکن ورود |
| `SOCKET_URL` | آدرس داخلی سرور سوکت، مثل `http://chat-socket:3000` |
| `SOCKET_SECRET` | یک رشته‌ی تصادفی، مشترک با سرور سوکت |
| `NEXT_PUBLIC_SOCKET_URL` | آدرس عمومی سوکت برای مرورگر، مثل `wss://chat-socket.onrender.com` |

جدول‌های دیتابیس هنگام build با `prisma db push` ساخته می‌شوند.

صفحات: `/` (ورود و ثبت‌نام) و `/chat` (اتاق گفتگو).
مسیرهای API: `/api/health`, `/api/register`, `/api/login`, `/api/me`, `/api/logout`,
`/api/messages` (GET و POST). ورود با توکن Bearer انجام می‌شود.

## ۲) سرویس سوکت

- Build command: `npm install`
- Start command: `npm start`
- متغیرها: `SOCKET_SECRET` (همان مقدار سرویس Next.js) و `API_URL` که روی آدرس داخلی
  سرویس Next.js تنظیم می‌شود تا توکن کاربران بررسی شود.

> سرویس‌های رایگان Render پس از بی‌کاری خاموش می‌شوند. در آن حالت برنامه پیام
> «لطفاً منتظر بمانید» را نشان می‌دهد، پیام‌ها را در صف نگه می‌دارد و پس از
> بیدار شدن سرور خودکار ارسال می‌کند.
