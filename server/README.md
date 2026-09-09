# سرور گفتگو (لاراول + سوکت)

این پوشه کد سمت سرور است و **داخل این پروژه اجرا نمی‌شود**؛ آن را روی
[Render](https://render.com) مستقر کنید و سپس آدرس‌ها را در برنامه ثبت کنید.

```
server/
├── laravel/   ← API: ثبت‌نام، ورود، ذخیره و خواندن پیام‌ها
└── socket/    ← سرور WebSocket برای پخش زنده‌ی پیام‌ها
```

## ۱) استقرار لاراول

1. محتوای `server/laravel` را در یک ریپازیتوری جدا قرار دهید.
2. `composer create-project laravel/laravel .` را اجرا کنید و سپس فایل‌های این
   پوشه را روی پروژه کپی کنید (فایل‌ها همان مسیرهای استاندارد لاراول را دارند).
3. `composer require laravel/sanctum` و `php artisan migrate` را اجرا کنید.
4. در Render یک سرویس Web از نوع Docker یا PHP بسازید.

متغیرهای محیطی لازم:

| نام | توضیح |
| --- | --- |
| `APP_KEY` | خروجی `php artisan key:generate --show` |
| `DB_CONNECTION` | `pgsql` (دیتابیس رایگان Render) |
| `DATABASE_URL` | از پنل Render |
| `SOCKET_URL` | آدرس داخلی سرور سوکت، مثل `http://chat-socket:3000` |
| `SOCKET_SECRET` | یک رشته‌ی تصادفی، مشترک با سرور سوکت |
| `FRONTEND_ORIGIN` | آدرس این برنامه، برای CORS |

## ۲) استقرار سرور سوکت

پوشه‌ی `server/socket` یک سرویس Node است:

- Build command: `npm install`
- Start command: `npm start`
- متغیرها: `SOCKET_SECRET` (همان مقدار لاراول) و `LARAVEL_URL`

## ۳) اتصال برنامه

در صفحه‌ی ورود روی «تنظیم آدرس سرور» بزنید و وارد کنید:

- آدرس لاراول: `https://<نام-سرویس>.onrender.com`
- آدرس سوکت: `wss://<نام-سرویس-سوکت>.onrender.com`

یا همان مقادیر را به‌عنوان `VITE_CHAT_API_BASE` و `VITE_CHAT_WS_URL` تنظیم کنید.

> سرویس‌های رایگان Render پس از بی‌کاری خاموش می‌شوند. در آن حالت برنامه پیام
> «لطفاً منتظر بمانید» را نشان می‌دهد، پیام‌ها را در صف نگه می‌دارد و پس از
> بیدار شدن سرور خودکار ارسال می‌کند.
