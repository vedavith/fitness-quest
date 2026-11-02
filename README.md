# 90-Day Fitness Quest

A gamified 90-day fitness plan: follow today's workout, steps and meals, tap
**Finish Day**, and earn up to 120 XP. Product requirements live in
[`docs/user-stories-raw.txt`](docs/user-stories-raw.txt) (exported from the
"90-Day Fitness Quest: App User Stories" doc).

## Layout

| Path   | Stack                                   | Responsibility |
|--------|-----------------------------------------|----------------|
| `app/` | React Native + Expo (iOS, Android, web) | Screens, exercise images, logging, offline storage |
| `api/` | PHP 8.3 + Laravel, MySQL                | Accounts, plan data, sync, XP, levels, streaks, badges |

The server is the source of truth for XP (US-805). The core rules are in
`api/app/Domain/XpRules.php`; plan data for the app is in `app/src/plan.ts`.

## Getting started

API (PHP 8.3 and MySQL 8). Create the database once:

```sql
CREATE DATABASE fitness_quest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fitness_quest'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL ON fitness_quest.* TO 'fitness_quest'@'localhost';
```

Then put that password in `DB_PASSWORD` in `api/.env`:

```bash
cd api && composer install && cp .env.example .env && php artisan key:generate
php artisan migrate && php artisan serve
php artisan test   # tests use an in-memory SQLite database, not MySQL
```

App (iOS, Android and web from one codebase):

```bash
cd app && npm install
npx expo start          # press w for web, or scan the QR code with Expo Go
npm run typecheck
```

Set `EXPO_PUBLIC_API_URL` to point the app at your API (defaults to `http://localhost:8000`).
The app works fully offline without an account; signing in syncs it to the API.

## Deploying

See [docs/DEPLOY.md](docs/DEPLOY.md) for hosting on Ubuntu with Apache, PHP-FPM and MySQL
(live address: https://fitness-quest.entity-forge.dev).

## What's built (MVP progress)

| Area | Stories | Status |
|------|---------|--------|
| Onboarding and Today screen | US-101, 102, 103 | Done |
| Workouts, targets, set logging, rest timer, ratings | US-201, 205–209 | Done |
| Exercise images | US-202, 203, 204 | Placeholders; images not yet supplied |
| Steps (manual), split guidance, recovery target | US-301, 302, 304, 702 | Done |
| Meals, dinner rotation, lunch choice, off-plan meals | US-401–406 | Done |
| Finish Day, XP, bonus, levels, streaks | US-501–506 | Done |
| Finish yesterday until noon | US-507 | Done |
| Weight and waist check-ins, 12-week tracker, goals | US-601–603 | Done |
| Safety stop, XP caps, adaptation limits, guidance, sleep | US-701–706 | Done |
| Accounts, offline sync, server-confirmed XP | US-801, 803, 804, 805 | Done (password reset not yet) |

### API

All routes are under `/api` and use Sanctum bearer tokens.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/register`, `/login`, `/logout` | Accounts |
| GET/PUT | `/profile` | Starting details and start date |
| GET | `/days`, `/days/{day}` | Day logs with server XP |
| PUT | `/days/{day}` | Upsert a day (idempotent, last write wins) |
| POST | `/days/{day}/finish` | Finish Day; awards XP once |
| GET/POST | `/check-ins` | Weight and waist check-ins |
| GET | `/summary` | Total XP, level, current streak |

## Roadmap

1. **MVP** — the 34 Must stories (daily plan, exercise images, logging, Finish Day, XP, levels, tracking, safety, accounts, sync)
2. **v1.1** — the 14 Should stories (reminders, step sync, streaks, badges, corrections, data controls)
3. **Later** — the 2 Could stories (XP history, PDF export)

## Open items

- 18 exercise images + 7 daily cover images still needed (see the image checklist in the doc); confirm licensing.
- Password reset (part of US-801) needs a mail provider; not built yet.
- Confirm the assumptions listed in the doc (90 vs 84 days, post-week-2 training, 8k steps, platforms).

_Not medical advice. Confirm targets with a doctor or registered dietitian._
