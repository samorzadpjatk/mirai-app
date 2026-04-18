# Better Auth Developer Setup Guide

This guide covers local development setup for the Better Auth authentication system.

## Prerequisites

- Node.js 20+ (LTS recommended)
- Bun package manager
- PostgreSQL 14+ (local or remote)
- Supabase account (for database hosting - optional if self-hosting)
- Redis (for EventBus/background jobs) - optional for local dev, uses in-memory fallback

## Installation

### 1. Install Dependencies

Better Auth and related packages are included in the monorepo. Run:

```bash
bun install
```

Required packages (already in package.json):
- `better-auth` - Core authentication framework
- `@better-auth/drizzle-adapter` - Drizzle ORM adapter

### 2. Environment Variables

Create or update your `.env.local` file in `apps/backend-server/`:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=your-32-character-secret-key-here-min
BETTER_AUTH_URL=http://localhost:3000

# Database (same as existing)
DATABASE_URL=postgresql://user:password@localhost:5432/mirai

# Supabase (for database - auth features not used)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (for EventBus and background jobs)
REDIS_EVENTBUS_HOST=localhost
REDIS_EVENTBUS_PORT=6380
REDIS_EVENTBUS_DB=1

# Feature flag (for dual-run period)
USE_BETTER_AUTH=true
```

**Note**: `BETTER_AUTH_SECRET` must be at least 32 characters for production security.

### 3. Database Setup

Better Auth requires specific tables. Run the migration:

```bash
# Generate Drizzle migration for Better Auth tables
cd packages/frameworks
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

This creates the following tables:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth connections
- `verification` - OTP codes and verification tokens

### 4. Start Development Server

```bash
# Start the backend server
cd apps/backend-server
bun dev

# Or from root with Turbo
bun dev
```

The server will be available at `http://localhost:3000`.

Better Auth endpoints are mounted at `/api/auth/*`.

## Testing Authentication Flows

### Manual Testing with cURL

#### Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123",
    "name": "Test User"
  }'
```

#### Sign In with Password

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123"
  }'
```

#### Request OTP (for OTP-based sign-in)

```bash
curl -X POST http://localhost:3000/api/auth/send-verification-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "type": "sign-in"
  }'
```

#### Sign In with OTP

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
  "otp": "123456"
  }'
```

#### Get Session

```bash
curl http://localhost:3000/api/auth/get-session \
  -H "Cookie: better-auth.session_token=your-session-cookie"
```

#### Sign Out

```bash
curl -X POST http://localhost:3000/api/auth/sign-out \
  -H "Cookie: better-auth.session_token=your-session-cookie"
```

### Testing with GraphQL Playground

GraphQL endpoint is at `http://localhost:3000/api/graphql`.

Authentication is handled via cookies automatically by the browser. When you sign in via Better Auth at `/api/auth/*`, the session cookie is set and will be sent with all GraphQL requests.

For testing in GraphQL Playground:
1. First sign in via the REST endpoints (this sets the session cookie)
2. GraphQL requests will automatically include the cookie
3. The server validates the session via `betterAuth.api.getSession()`

## Mobile Development (React Native)

### Setup

The mobile app uses a cookie jar pattern with SecureStore for session persistence.

```typescript
// apps/native/src/stores/auth/better-auth.ts
import { createAuthStore } from "@mirai-app/frameworks/stores/auth";

export const useAuthStore = createAuthStore({
  storage: SecureStore,
  baseURL: "http://localhost:3000/api/auth",
});
```

### Testing on Device

1. Ensure your phone and development machine are on the same network
2. Update the baseURL to use your machine's local IP:
   ```typescript
   baseURL: "http://192.168.1.100:3000/api/auth"
   ```
3. Run the native app:
   ```bash
   cd apps/native
   bun start
   ```

## Environment-Specific Configuration

### Local Development

```bash
# .env.local
BETTER_AUTH_SECRET=dev-secret-not-for-production-use-32-chars
BETTER_AUTH_URL=http://localhost:3000
USE_BETTER_AUTH=true
```

### Staging

```bash
# .env.staging
BETTER_AUTH_SECRET=<32-char-secret-from-vault>
BETTER_AUTH_URL=https://api-staging.mirai.app
USE_BETTER_AUTH=true
```

### Production

```bash
# .env.production
BETTER_AUTH_SECRET=<32-char-secret-from-secure-vault>
BETTER_AUTH_URL=https://api.mirai.app
USE_BETTER_AUTH=true
```

## Debugging

### Enable Better Auth Debug Logging

Set the debug flag in `packages/frameworks/src/better-auth/index.ts`:

```typescript
export const createBetterAuth = (db: Database) => betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/api/auth",
  debug: process.env.NODE_ENV === "development", // Enable debug logging
  // ... rest of config
});
```

### Common Issues

#### Issue: Session not persisting

**Solution**: Check cookie configuration. In development, cookies may not be set properly without `secure: false`:

```typescript
session: {
  cookie: {
    secure: process.env.NODE_ENV === "production", // false for local dev
  },
}
```

#### Issue: Database connection errors

**Solution**: Verify `DATABASE_URL` is correctly set and the database is running:

```bash
# Test database connection
bun run -e "require('packages/frameworks/src/drizzle/client').createDrizzleClient(process.env.DATABASE_URL)"
```

#### Issue: OTP emails not sending

**Solution**: Check the `sendVerificationOTP` callback in Better Auth configuration. For local testing, log to console:

```typescript
emailOTP({
  async sendVerificationOTP({ email, otp, type }) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    // Integrate with your email service for staging/prod
  },
})
```

## Testing

### Unit Tests

Run auth-related unit tests:

```bash
bun test packages/adapters/src/auth/gateways/better-auth
```

### Integration Tests

Run full auth flow tests:

```bash
bun test:integration tests/integration/auth
```

### Load Testing

Use k6 for load testing auth endpoints:

```bash
cd tests/load
k6 run auth-load-test.js
```

## Migration Testing

To test the migration flow locally:

1. Create a user in Supabase Auth (legacy)
2. Trigger OTP migration flow via `/api/auth/migrate/initiate`
3. Verify OTP received (check console logs in dev)
4. Complete migration via `/api/auth/migrate/complete`
5. Verify user can log in with Better Auth

## References

- [Architecture Decision Record](./adr/001-better-auth-migration.md) - Migration rationale
- [Migration Runbook](./migration-runbook.md) - Production deployment steps
- [Better Auth Documentation](https://www.better-auth.com/) - Official framework docs
- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars conventions
