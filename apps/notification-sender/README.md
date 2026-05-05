# @mirai-app/notification-sender

Microservice that listens to Supabase Realtime for `INSERT` events on the `public.Notification` table and sends push notifications via Expo Push Notification service to mobile devices.

## Setup

### 1. Installation

```sh
bun install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`. Update the Supabase URL and anon key as needed.

```env
SUPABASE_URL="http://localhost:8000"
SUPABASE_ANON_KEY="your-anon-key"
EXPO_PUSH_ACCESS_TOKEN="your-expo-push-token"
```

### 3. Run Locally

```sh
cd apps/notification-sender && bun run dev
```

## Architecture

The notification sender follows a microservice architecture:

1. **Supabase Realtime**: Listens for database changes
2. **Event Processing**: Processes notification events
3. **Expo Integration**: Sends push notifications via Expo service
4. **Error Handling**: Manages failed notifications and retries

## Monitoring

Check logs for notification delivery status and errors:

```bash
# View logs
bun run dev

# Check for specific errors
grep "ERROR" logs/notification-sender.log
```

## Testing

This package uses [Vitest](https://vitest.dev/) for testing. See [root TESTING.md](../../TESTING.md) for repo-wide testing conventions.

### Test Commands

```bash
# Run tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage report
bun run test:coverage
```

### Testing Approach

Tests cover:

- Notification delivery logic
- Expo Push Notification service integration
- Error handling and retry mechanisms
- Mock Supabase Realtime for testing

## More Information

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Monorepo Documentation](../../README.md)
