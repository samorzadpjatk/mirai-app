# Authentication System

This document describes the Mirai application's authentication system, now powered by **Better Auth**.

## Overview

The authentication system follows Clean Architecture principles with:

- **Domain Layer**: Defines `IAuthPort` interface (contracts, not implementations)
- **Use-Cases Layer**: Orchestrates auth flows via `AuthPortTag` (Effect Context.Tag)
- **Adapters Layer**: Contains `BetterAuthGateway` (Better Auth SDK integration)
- **Frameworks Layer**: Configures Better Auth with Drizzle adapter

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Application Layer (apps/)                                        │
│  ├── backend-server: /api/auth/* REST endpoints                 │
│  ├── native: React Native with SecureStore                      │
│  └── web: Browser with httpOnly cookies                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Frameworks Layer (packages/frameworks/)                          │
│  ├── createBetterAuth() - Better Auth factory                   │
│  ├── DI Layer wiring (Layer.succeed, Layer.mergeAll)            │
│  └── Auth stores (SecureStore for mobile, cookies for web)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Adapters Layer (packages/adapters/)                            │
│  └── BetterAuthGateway - implements IAuthPort                 │
│      • Wraps Better Auth API in Effect.tryPromise               │
│      • Maps errors to domain error types                        │
│      • Provides verifyAccess() for resource authorization       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Use-Cases Layer (packages/use-cases/)                            │
│  └── AuthPortTag - Effect Context.Tag<IAuthPort>                │
│      Effect.gen(function* () {                                     │
│        const auth = yield* AuthPortTag;                          │
│        return yield* auth.signIn(...);                           │
│      })                                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Domain Layer (packages/domain/)                                    │
│  ├── IAuthPort interface - authentication contract                │
│  └── Auth error types - AuthSessionExpiredError, etc.           │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Methods

### 1. Email and Password

Traditional email/password authentication with secure password hashing.

**Endpoints:**
- `POST /api/auth/sign-up/email` - Create new account
- `POST /api/auth/sign-in/email` - Authenticate with credentials

### 2. One-Time Password (OTP)

Passwordless authentication via email OTP.

**Endpoints:**
- `POST /api/auth/send-verification-otp` - Request OTP
- `POST /api/auth/sign-in/email-otp` - Authenticate with OTP

**Use Cases:**
- Mobile app convenience
- Password reset flow
- User migration from Supabase Auth

### 3. Session Management

Cookie-based session management with automatic refresh.

**Endpoints:**
- `GET /api/auth/get-session` - Retrieve current session
- `POST /api/auth/sign-out` - Invalidate session

**Session Configuration:**
- Expiration: 7 days
- Refresh window: 1 day before expiry
- Storage: httpOnly, secure, sameSite=strict cookies

## Session Storage by Platform

| Platform | Storage Mechanism | Security |
|----------|-------------------|----------|
| Web (Browser) | httpOnly cookies | XSS protection, automatic browser management |
| iOS (Native) | SecureStore (Keychain) | Hardware-backed encryption |
| Android (Native) | SecureStore (Keystore) | Hardware-backed encryption |
| GraphQL API | Cookie header | Session cookie from Better Auth |

## GraphQL Authentication

GraphQL endpoints use cookie-based session validation via Better Auth:

```typescript
// apps/backend-server/src/server/graphql.ts
const buildAuthContext = async (
  cookieHeader: string,
  db: DrizzleDb,
  betterAuth: BetterAuthInstance,
): Promise<AuthContext | null> => {
  // Validate session using Better Auth's cookie-based sessions
  const response = await betterAuth.api.getSession({
    headers: new Headers({ Cookie: cookieHeader }),
  });

  if (!response?.user || !response?.session) {
    return null; // Anonymous context
  }

  // Fetch user role and trip roles from database
  // Return populated AuthContext
};
```

**Key Points:**
- Better Auth uses cookie-based sessions (not JWT Bearer tokens)
- Session cookie is extracted from `Cookie` header
- Better Auth validates the session and returns user/session info
- Falls back to anonymous context if no valid session

## Error Handling

All authentication errors use domain-specific error types:

| Error | Cause | HTTP Status |
|-------|-------|-------------|
| `AuthSessionExpiredError` | Invalid or expired session | 401 |
| `PermissionDeniedError` | Insufficient permissions | 403 |
| `UserAlreadyExistsError` | Duplicate registration | 409 |
| `RateLimitError` | Too many attempts | 429 |
| `AuthenticationError` | Invalid credentials | 401 |

## Configuration

### Environment Variables

```bash
# Required
BETTER_AUTH_SECRET=<32-character-secret>
BETTER_AUTH_URL=https://api.mirai.app
DATABASE_URL=postgresql://...

# Optional (for dual-run period)
USE_BETTER_AUTH=true
```

### Better Auth Factory

```typescript
// packages/frameworks/src/better-auth/index.ts
export const createBetterAuth = (db: Database) => betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/api/auth",
  emailAndPassword: { enabled: true },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Integrate with notification service
      },
      expiresIn: 300, // 5 minutes
    }),
  ],
  session: {
    expiresIn: 604800,  // 7 days
    updateAge: 86400,   // 1 day
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    },
  },
});
```

## Usage in Code

### Using AuthPort in Use Cases

```typescript
import { Effect } from "effect";
import { AuthPortTag } from "@mirai-app/use-cases";

const protectedOperation = Effect.gen(function* () {
  const authPort = yield* AuthPortTag;
  
  // Verify access before operation
  yield* authPort.verifyAccess({
    token: authToken,
    resourceType: "trip",
    resourceId: tripId,
    requiredPermission: "write",
  });
  
  // Proceed with protected operation
  return yield* performOperation();
});
```

### Gateway-Level Auth Protection

```typescript
// In gateway implementation
import { AuthPortTag } from "@mirai-app/use-cases";

export class TripDrizzleGateway implements ITripPort {
  findById(id: TripId, authToken?: string) {
    return Effect.gen(function* () {
      // Verify auth if token provided
      if (authToken) {
        const authPort = yield* AuthPortTag;
        yield* authPort.verifyAccess({
          token: authToken,
          resourceType: "trip",
          resourceId: TripId.toString(id),
          requiredPermission: "read",
        });
      }
      
      // Proceed with database query
      const result = yield* databaseQuery();
      return result;
    });
  }
}
```

## Migration from Supabase Auth

The system supports migration from Supabase Auth using an OTP-based flow:

1. User logs in with existing Supabase credentials
2. System sends OTP to verified email
3. User verifies OTP
4. New account created in Better Auth
5. User continues with new session

See [Migration Runbook](./migration-runbook.md) for production deployment procedures.

## Testing

### Unit Tests

```typescript
import { createTestLayer, runWithTestLayer } from "@mirai-app/frameworks/di";

const testLayer = createTestLayer();

const result = await runWithTestLayer(
  testLayer,
  Effect.gen(function* () {
    const auth = yield* AuthPortTag;
    return yield* auth.verifyToken("test-token");
  }),
);
```

### Integration Tests

Test actual Better Auth flows with a test database:

```bash
cd packages/adapters
bun test src/auth/gateways/better-auth/__tests__/
```

## Security Considerations

1. **Password Security**: Argon2id hashing (via Better Auth)
2. **Session Security**: httpOnly, secure, sameSite=strict cookies
3. **Rate Limiting**: Built-in rate limiting on auth endpoints
4. **CSRF Protection**: Automatic CSRF token validation
5. **Session Fixation Protection**: New session ID on privilege change

## Documentation

- [Architecture Decision Record](./adr/001-better-auth-migration.md) - Migration rationale
- [Developer Setup Guide](./better-auth-setup.md) - Local development setup
- [Migration Runbook](./migration-runbook.md) - Production deployment
- [Better Auth Documentation](https://www.better-auth.com/) - Official framework docs

## Troubleshooting

### Common Issues

**Issue**: Session not persisting on mobile
**Solution**: Verify SecureStore is properly configured and cookie jar is enabled.

**Issue**: OTP emails not sending
**Solution**: Check `sendVerificationOTP` callback implementation in Better Auth config.

**Issue**: Database connection errors
**Solution**: Verify `DATABASE_URL` and ensure Better Auth tables exist via `drizzle-kit migrate`.

---

**Last Updated**: 2026-04-18  
**Status**: Active - Better Auth deployed  
**Migration Phase**: Dual-run (Supabase Auth retained for rollback)
