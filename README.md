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

```bash
cd api && composer install && cp .env.example .env && php artisan key:generate
php artisan test
```

```bash
cd app && npm install && npx expo start
```

## Roadmap

1. **MVP** — the 34 Must stories (daily plan, exercise images, logging, Finish Day, XP, levels, tracking, safety, accounts, sync)
2. **v1.1** — the 14 Should stories (reminders, step sync, streaks, badges, corrections, data controls)
3. **Later** — the 2 Could stories (XP history, PDF export)

## Open items

- 18 exercise images + 7 daily cover images still needed (see the image checklist in the doc); confirm licensing.
- Confirm the assumptions listed in the doc (90 vs 84 days, post-week-2 training, 8k steps, platforms).

_Not medical advice. Confirm targets with a doctor or registered dietitian._
