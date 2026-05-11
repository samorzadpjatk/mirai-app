# @mirai-app/notification-sender - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Background worker service for sending push notifications to mobile devices. Processes notification queues and delivers through Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNS).

## Tech Stack

- **Runtime**: Bun
- **Notifications**: Expo Server SDK
- **API**: oRPC Client
- **Testing**: Vitest

## Key Files

```
apps/notification-sender/
├── src/
│   ├── index.ts          # Worker entry point
│   ├── worker.ts         # Notification worker
│   ├── providers/        # Notification providers
│   │   ├── fcm.ts        # Firebase Cloud Messaging
│   │   └── apns.ts       # Apple Push Notifications
│   └── queue.ts          # Queue processing
├── package.json
└── AGENTS.md             # This file
```

## Development Commands

```bash
# Start worker with hot reload
bun run dev

# Start production worker
bun run start

# Code quality
bun run lint
bun run typecheck

# Testing
bun run test
bun run test:watch
```

## Dependencies

### Internal

- `@mirai-app/orpc` - oRPC client for API calls
- `@mirai-app/db` - Database access
- `@mirai-app/supabase` - Supabase realtime

### External

- `expo-server-sdk` - Expo push notifications
- `@orpc/client` - oRPC client

## How It Works

1. **Listens to database** for new notifications via Supabase Realtime
2. **Processes queue** of pending notifications
3. **Sends via provider** (FCM for Android, APNS for iOS)
4. **Updates status** in database

## Architecture

```
Database/Supabase
     │
     │ Realtime
     ▼
Notification Worker
     │
     ├──▶ FCM ───▶ Android Devices
     └──▶ APNS ───▶ iOS Devices
```

## Links

- [Setup guide](../../docs/apps/notification-sender/setup.md)
- [Root AGENTS.md](../../AGENTS.md)
