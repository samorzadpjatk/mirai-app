# Notification Sender

Microservice that listens to Supabase Realtime for `INSERT` events on the `public.Notification` table and sends push notifications via Expo Push Notification service to mobile devices.

## Setup

1. Install

```sh
pnpm -w i
```

2. Configure env

Copy `.env.example` to `.env`. Update the Supabase URL and anon key as needed.

3. Run locally

```sh
pnpm --filter @integral-2025-app/notification-sender dev
```
