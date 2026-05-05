# Notification Sender Setup

## Overview

This guide covers setting up the notification sender service.

## Prerequisites

- Bun 1.3.6+
- Firebase project (for Android notifications)
- Apple Developer account (for iOS notifications)

## Installation

```bash
cd apps/notification-sender
bun install
```

## Configuration

### Environment Variables

```bash
# .env.dev
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
FIREBASE_SERVICE_ACCOUNT_KEY=...
APNS_KEY_PATH=...
APNS_KEY_ID=...
APNS_TEAM_ID=...
```

### Firebase Setup

1. Create Firebase project
2. Download service account key
3. Add to environment variables

### Apple Push Notifications

1. Create APNS key in Apple Developer
2. Download .p8 file
3. Configure key ID and team ID

## Running the Worker

### Development

```bash
bun run dev
```

Runs with hot reload and watches for changes.

### Production

```bash
bun run start
```

## How Notifications Work

### 1. Create Notification

```typescript
// In backend server
await prisma.notification.create({
  data: {
    userId: 'user-123',
    title: 'New Event',
    body: 'You have a new event invitation',
    data: { eventId: 'event-456' },
    status: 'pending',
  }
});
```

### 2. Realtime Trigger

```typescript
// In notification sender
supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications' },
    (payload) => {
      queue.add(payload.new);
    }
  )
  .subscribe();
```

### 3. Send Notification

```typescript
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendNotification(notification) {
  const pushTokens = await getUserPushTokens(notification.userId);
  
  const messages = pushTokens.map(token => ({
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data,
  }));
  
  const chunks = expo.chunkPushNotifications(messages);
  
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
```

## Queue Processing

### Bull Queue (Redis-backed)

```typescript
import Queue from 'bull';

const notificationQueue = new Queue('notifications', {
  redis: { port: 6379, host: '127.0.0.1' }
});

notificationQueue.process(async (job) => {
  return sendNotification(job.data);
});
```

## Error Handling

### Retry Logic

```typescript
notificationQueue.process(async (job) => {
  try {
    return await sendNotification(job.data);
  } catch (error) {
    // Retry 3 times
    if (job.attemptsMade < 3) {
      throw error;
    }
    // Mark as failed
    await markFailed(job.data.id, error.message);
  }
});
```

## Monitoring

### Worker Health

```typescript
// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    queueLength: await notificationQueue.count(),
    processed: await notificationQueue.getCompletedCount(),
    failed: await notificationQueue.getFailedCount(),
  };
});
```

## Deployment

### Docker

```dockerfile
FROM oven/bun:1.3.13

WORKDIR /app
COPY . .
RUN bun install

CMD ["bun", "run", "start"]
```

### Environment

Run as background service:

```bash
# Using systemd
systemctl enable notification-sender
systemctl start notification-sender
```

## Troubleshooting

### Notifications Not Sending

1. Check push tokens are valid
2. Verify Firebase/Apple credentials
3. Check queue is processing
4. Review worker logs

### High Queue Length

1. Scale up worker instances
2. Check for rate limiting
3. Review database performance

## Further Reading

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
