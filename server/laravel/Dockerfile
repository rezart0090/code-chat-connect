# Laravel API for Render (Docker web service)
FROM php:8.3-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libpq-dev libzip-dev \
 && docker-php-ext-install pdo pdo_pgsql zip \
 && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . /app

RUN composer install --no-dev --optimize-autoloader --no-interaction

ENV PORT=8000
EXPOSE 8000

CMD php artisan migrate --force \
 && php artisan config:cache \
 && php artisan serve --host=0.0.0.0 --port=${PORT}
