# Deploying to an Ubuntu server with Apache

This guide puts Fitness Quest at **https://fitness-quest.entity-forge.dev**,
next to the site already served on `entity-forge.dev`. That site is not changed.

| Piece | Where it runs |
|-------|---------------|
| Web app (Expo build) | Static files in `/var/www/fitness-quest/app/dist`, served by Apache |
| API (Laravel) | `/var/www/fitness-quest/api`, run by PHP-FPM; Apache sends `/api/*` and `/up` to it |
| Database | MySQL on the same server |

Commands assume Ubuntu 24.04 and a user with `sudo`. On Ubuntu 22.04, add the
`ppa:ondrej/php` PPA first to get PHP 8.3.

> **HTTPS is required.** All `.dev` domains are HTTPS-only in browsers, so the
> site won't open over plain HTTP. Step 8 sets up the certificate.

## 1. DNS

At your DNS provider for `entity-forge.dev`, add an **A record**:

| Name | Type | Value |
|------|------|-------|
| `fitness-quest` | A | your server's public IP |

Check it from the server (it may take a few minutes):

```bash
dig +short fitness-quest.entity-forge.dev
```

## 2. Install packages

```bash
sudo apt update
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-bcmath php8.3-zip unzip git certbot python3-certbot-apache
```

If MySQL isn't installed yet:

```bash
sudo apt install -y mysql-server
```

Composer:

```bash
curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer
```

Node.js 22 (to build the web app):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
```

Apache modules (your main site keeps working; PHP-FPM runs alongside `mod_php` if you use it):

```bash
sudo a2enmod proxy_fcgi setenvif headers
```

## 3. Database

```bash
sudo mysql
```

```sql
CREATE DATABASE fitness_quest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fitness_quest'@'localhost' IDENTIFIED BY 'CHOOSE-A-LONG-PASSWORD';
GRANT ALL ON fitness_quest.* TO 'fitness_quest'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Get the code

```bash
sudo mkdir -p /var/www/fitness-quest && sudo chown "$USER":www-data /var/www/fitness-quest
git clone https://github.com/vedavith/fitness-quest.git /var/www/fitness-quest
```

## 5. Configure the API

```bash
cd /var/www/fitness-quest/api && cp .env.example .env && nano .env
```

Set these values:

```ini
APP_NAME="Fitness Quest"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://fitness-quest.entity-forge.dev
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fitness_quest
DB_USERNAME=fitness_quest
DB_PASSWORD=CHOOSE-A-LONG-PASSWORD
```

Then make the file readable only by you and the web server:

```bash
chmod 640 .env && sudo chgrp www-data .env
```

## 6. Build and deploy

```bash
cd /var/www/fitness-quest && ./deploy/deploy.sh
```

This installs PHP packages, generates the app key on the first run, creates the
database tables, builds the web app and reloads PHP-FPM.

## 7. Apache site

```bash
sudo cp /var/www/fitness-quest/deploy/apache-fitness-quest.conf /etc/apache2/sites-available/fitness-quest.conf
sudo a2ensite fitness-quest
sudo apache2ctl configtest
sudo systemctl reload apache2
```

`configtest` must say `Syntax OK` before you reload.

## 8. HTTPS certificate

```bash
sudo certbot --apache -d fitness-quest.entity-forge.dev
```

Certbot adds an HTTPS virtual host and renews the certificate automatically.
Choose to redirect HTTP to HTTPS when asked.

## 9. Check it

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://fitness-quest.entity-forge.dev/up
```

It should print `200`. Then open https://fitness-quest.entity-forge.dev in a
browser, set up your plan, and use **Sign in to sync** to create your account.
The web app finds the API on the same address automatically.

For the iPhone and Android apps, build them with the API address set:

```bash
EXPO_PUBLIC_API_URL=https://fitness-quest.entity-forge.dev npx expo start
```

## Updating

After pushing changes to GitHub:

```bash
cd /var/www/fitness-quest && ./deploy/deploy.sh
```

## Backups

A nightly database dump (add with `crontab -e`; create `~/backups` first and
keep the password in `~/.my.cnf` so it isn't in the crontab):

```bash
15 3 * * * mysqldump fitness_quest | gzip > ~/backups/fitness_quest-$(date +\%F).sql.gz
```

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Browser can't connect | DNS (step 1) and that the certificate was issued (step 8) |
| `503` or `502` on `/api` | `sudo systemctl status php8.3-fpm` |
| `500` on `/api` | `tail -50 /var/www/fitness-quest/api/storage/logs/laravel.log` |
| Apache errors | `sudo tail -50 /var/log/apache2/fitness-quest-error.log` |
| Sign-in works but sync says "Unauthenticated" | `setenvif` module enabled (step 2) |
