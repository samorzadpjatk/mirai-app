# Notification Worker

Microservice that listens to Supabase Realtime for `INSERT` events on the `public.Notification` table and sends webPush events based on the db contents.

## Setup

1. Install

```sh
pnpm -w i
```

2. Configure env

Copy `.env.example` to `.env`. Fill in the vapid public keys - generate them using `node -e "console.log(require('web-push').generateVAPIDKeys())"` (run from `apps/notification-sender` dir)

3. Run locally

```sh
pnpm --filter @integral-2025-app/notification-worker dev
```
