#!/usr/bin/env bash
# Build and (re)deploy Fitness Quest on the server. Run from the repo root:
#   cd /var/www/fitness-quest && ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Pulling latest code"
git pull --ff-only

echo "==> API: PHP dependencies, migrations, caches"
cd api
composer install --no-dev --optimize-autoloader --no-interaction
grep -q '^APP_KEY=base64:' .env || php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ..

echo "==> Web app: build"
cd app
npm ci --no-audit --no-fund
npx expo export --platform web --output-dir dist
cd ..

echo "==> Permissions"
sudo chgrp -R www-data api/storage api/bootstrap/cache
sudo chmod -R ug+rwX api/storage api/bootstrap/cache
sudo find api/storage api/bootstrap/cache -type d -exec chmod g+s {} +

echo "==> Reloading PHP-FPM"
sudo systemctl reload php8.3-fpm

echo "Done. Check: curl -s https://fitness-quest.entity-forge.dev/up"
