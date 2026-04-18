# Better Auth Migration Guide

> A comprehensive guide for migrating from Supabase Auth to Better Auth in Clean Architecture TypeScript projects.

## Overview

Better Auth is a framework-agnostic authentication framework for TypeScript. Unlike Supabase Auth (an external service), Better Auth runs in your codebase with your database, giving you full ownership of authentication data.

### Key Differences from Supabase Auth

| Aspect | Supabase Auth | Better Auth |
|--------|---------------|-------------|
| **Hosting** | External service | Self-hosted in your codebase |
| **Session Type** | JWT tokens | Cookie-based sessions |
| **Database** | Supabase-managed | Your own database (Drizzle, Prisma, etc.) |
| **Data Ownership** | Supabase controls auth data | You control all auth data |
| **Type Safety** | Generated types | Native TypeScript |
| **Extensibility** | Limited | 50+ plugins |

## Installation

### Server Installation

```bash
npm install better-auth
```

### Client Installation

```bash
# For React
npm install better-auth/react

# For Vue
npm install better-auth/vue

# For Svelte
npm install better-auth/svelte

# For Vanilla JS
npm install better-auth/client
```

### Drizzle Adapter Installation

```bash
npm install @better-auth/drizzle-adapter
```

## Environment Configuration

Create a `.env` file:

```bash
# Required: 32+ character secret for encryption
BETTER_AUTH_SECRET=your-secret-key-min-32-chars

# Required: Base URL of your app
BETTER_AUTH_URL=http://localhost:3000

# Optional: For secret rotation (comma-separated)
BETTER_AUTH_SECRETS=old-secret,new-secret
```

Generate a secret:
```bash
openssl rand -base64 32
```

## Basic Setup

### Server Configuration (`auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // Your Drizzle instance

export const auth = betterAuth({
  // Database configuration
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  
  // Authentication methods
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Auto sign-in after sign-up
  },
  
  // Social providers (optional)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Refresh every 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,          // 5 minute cache
    },
  },
});
```

### Client Configuration (`auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // Omit if same domain
});

// Export specific methods for convenience
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

### Framework Integration

#### Next.js App Router

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

#### Hono

```typescript
import { Hono } from "hono";
import { auth } from "./auth";

const app = new Hono();

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

#### Express

```typescript
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();

// Express v4
app.all("/api/auth/*", toNodeHandler(auth));

// Express v5
app.all("/api/auth/{*any}", toNodeHandler(auth));

// Must mount JSON middleware AFTER Better Auth handler
app.use(express.json());
```

## Email OTP Configuration

### Server Setup

```typescript
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [
    emailOTP({
      // Required: Implement email sending
      async sendVerificationOTP({ email, otp, type }) {
        // type: "sign-in" | "email-verification" | "forget-password"
        await sendEmail({
          to: email,
          subject: type === "sign-in" ? "Sign In Code" : "Verification Code",
          body: `Your code is: ${otp}`,
        });
      },
      
      // Optional configuration
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3,
      resendStrategy: "rotate", // or "reuse"
      storeOTP: "plain", // or "encrypted", "hashed"
      
      // Enable email change with OTP
      changeEmail: {
        enabled: true,
        verifyCurrentEmail: false, // Set true for extra security
      },
      
      // Override default email verification to use OTP
      overrideDefaultEmailVerification: true,
    }),
  ],
});
```

### Client Setup

```typescript
import { createAuthClient } from "better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});
```

### Email OTP Usage Patterns

#### Sign In with OTP

```typescript
// 1. Send OTP
await authClient.emailOtp.sendVerificationOtp({
  email: "user@example.com",
  type: "sign-in",
});

// 2. Verify OTP and sign in
await authClient.signIn.emailOtp({
  email: "user@example.com",
  otp: "123456",
  name: "John Doe", // For new users
});
```

#### Email Verification

```typescript
// 1. Send verification OTP
await authClient.emailOtp.sendVerificationOtp({
  email: "user@example.com",
  type: "email-verification",
});

// 2. Verify email
await authClient.emailOtp.verifyEmail({
  email: "user@example.com",
  otp: "123456",
});
```

#### Password Reset

```typescript
// 1. Request password reset
await authClient.emailOtp.requestPasswordReset({
  email: "user@example.com",
});

// 2. Reset password with OTP
await authClient.emailOtp.resetPassword({
  email: "user@example.com",
  otp: "123456",
  password: "new-secure-password",
});
```

## Database Schema Generation

### Generate Drizzle Schema

```bash
npx auth@latest generate
```

This generates:
- `user` table
- `session` table
- `account` table (for OAuth)
- `verification` table (for OTP, email verification)

### Apply Migration

```bash
# Generate migration file
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

### Direct Migration (Kysely only)

```bash
npx auth@latest migrate
```

### Core Schema Structure

```typescript
// Users table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sessions table
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Accounts table (OAuth)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"), // For credentials
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Session Management Patterns

### Client-Side Session Access

```typescript
// React hook
const { data: session, isPending, error } = authClient.useSession();

// One-time fetch
const { data: session, error } = await authClient.getSession();
```

### Server-Side Session Access

```typescript
// Next.js App Router
import { auth } from "./auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers(),
});
```

### Session Configuration

```typescript
export const auth = betterAuth({
  session: {
    // Session expiration (default: 7 days)
    expiresIn: 60 * 60 * 24 * 7,
    
    // Refresh interval (default: 1 day)
    updateAge: 60 * 60 * 24,
    
    // Freshness check (default: 1 day)
    freshAge: 60 * 60 * 24,
    
    // Disable automatic refresh
    disableSessionRefresh: false,
    
    // Defer refresh for read-replica setups
    deferSessionRefresh: false,
    
    // Cookie caching
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      strategy: "compact", // "compact" | "jwt" | "jwe"
    },
  },
});
```

### Session Revocation

```typescript
// Revoke specific session
await authClient.revokeSession({ token: "session-token" });

// Revoke all other sessions
await authClient.revokeOtherSessions();

// Revoke all sessions
await authClient.revokeSessions();

// Revoke on password change
await authClient.changePassword({
  currentPassword,
  newPassword,
  revokeOtherSessions: true,
});
```

## Cookie Configuration

### Basic Cookie Settings

```typescript
export const auth = betterAuth({
  advanced: {
    // Custom cookie prefix (default: "better-auth")
    cookiePrefix: "my-app",
    
    // Force secure cookies (default: only in production)
    useSecureCookies: true,
    
    // Cross-subdomain cookies
    crossSubDomainCookies: {
      enabled: true,
      domain: "example.com",
    },
    
    // Trusted origins for CORS
    trustedOrigins: [
      "https://example.com",
      "https://app.example.com",
    ],
  },
});
```

### Custom Cookie Names

```typescript
export const auth = betterAuth({
  advanced: {
    cookies: {
      session_token: {
        name: "custom_session",
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        },
      },
    },
  },
});
```

### Safari ITP Handling

For cross-domain setups (e.g., `api.example.com` and `app.example.com`):

```typescript
export const auth = betterAuth({
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: "example.com",
    },
  },
  trustedOrigins: [
    "https://app.example.com",
    "https://api.example.com",
  ],
});
```

Or use a reverse proxy to make API appear as same-domain.

## Migration from Supabase Auth

### Step 1: Dual-Run Strategy

1. Keep Supabase Auth running during migration
2. Add Better Auth alongside
3. Gradually migrate users

### Step 2: User Data Migration

```typescript
// Export from Supabase
const { data: users } = await supabase.auth.admin.listUsers();

// Import to Better Auth (users must reset password)
for (const user of users) {
  await auth.api.createUser({
    body: {
      email: user.email,
      name: user.user_metadata.name,
      // Password must be set via reset flow
    },
  });
}
```

### Step 3: Email OTP Migration Flow

```typescript
// Use Email OTP for seamless migration
// 1. User enters email
// 2. Send OTP via Better Auth
// 3. User verifies with OTP
// 4. Prompt to set new password
// 5. User now has Better Auth account
```

### Step 4: Switch API Endpoints

Replace Supabase client calls:

```typescript
// Before (Supabase)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// After (Better Auth)
const { data, error } = await authClient.signIn.email({
  email,
  password,
});
```

### Step 5: Cleanup

After all users migrated:
1. Disable Supabase Auth
2. Remove Supabase auth client code
3. Keep Supabase database (if using for data)

## Mobile App Integration

### Expo/React Native

```typescript
// Use expo package
import { createAuthClient } from "better-auth/expo";

export const authClient = createAuthClient({
  baseURL: "https://api.example.com",
});
```

### Cookie Handling in Mobile

Mobile apps should:
1. Store session token securely (Keychain/Keystore)
2. Include token in API requests
3. Handle token refresh

```typescript
// Secure storage helper
import * as SecureStore from "expo-secure-store";

async function getSessionToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("session_token");
}

async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync("session_token", token);
}
```

### Backend API Pattern for Mobile

```typescript
// Mobile calls your backend API
// Backend uses Better Auth server-side

// apps/backend-server/src/auth/router.ts
app.post("/auth/mobile/sign-in", async (c) => {
  const { email, otp } = await c.req.json();
  
  const result = await auth.api.signInEmailOTP({
    body: { email, otp },
    asResponse: true,
  });
  
  // Extract and return session token for mobile storage
  const sessionToken = extractTokenFromCookie(result);
  return c.json({ token: sessionToken });
});
```

## Clean Architecture Integration

### Domain Layer (Port Definition)

```typescript
// packages/domain/src/auth/ports/AuthPort.ts
import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";

export interface IAuthPort {
  signInWithEmail(email: string, password: string): Effect.Effect<
    { user: User; session: Session },
    IPortError,
    never
  >;
  
  signInWithOTP(email: string, otp: string): Effect.Effect<
    { user: User; session: Session },
    IPortError,
    never
  >;
  
  sendOTP(email: string, type: OTPType): Effect.Effect<
    void,
    IPortError,
    never
  >;
  
  getSession(token: string): Effect.Effect<
    Session | null,
    IPortError,
    never
  >;
  
  signOut(token: string): Effect.Effect<
    void,
    IPortError,
    never
  >;
}

export type OTPType = "sign-in" | "email-verification" | "forget-password";
```

### Adapter Layer (Better Auth Gateway)

```typescript
// packages/adapters/src/auth/gateways/BetterAuthGateway.ts
import { Effect, Data } from "effect";
import type { IAuthPort } from "@mirai-app/domain";

export class BetterAuthGateway implements IAuthPort {
  constructor(private auth: typeof import("./auth").auth) {}
  
  signInWithEmail(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.auth.api.signInEmail({
          body: { email, password },
          asResponse: true,
        });
        
        // Parse response and return domain types
        return { user: parseUser(result), session: parseSession(result) };
      },
      catch: (error) => new AuthError({ cause: error }),
    });
  }
  
  signInWithOTP(email: string, otp: string) {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.auth.api.signInEmailOTP({
          body: { email, otp },
          asResponse: true,
        });
        
        return { user: parseUser(result), session: parseSession(result) };
      },
      catch: (error) => new AuthError({ cause: error }),
    });
  }
  
  sendOTP(email: string, type: OTPType) {
    return Effect.tryPromise({
      try: async () => {
        await this.auth.api.sendVerificationOTP({
          body: { email, type },
        });
      },
      catch: (error) => new AuthError({ cause: error }),
    });
  }
  
  // ... other methods
}

class AuthError extends Data.TaggedError("AuthError")<{ cause: unknown }> 
  implements IPortError {
  readonly message = "Authentication failed";
}
```

## Common Patterns

### Protected Route Middleware

```typescript
// middleware.ts (Next.js)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

### Custom Session Data

```typescript
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    customSession(async ({ user, session }) => {
      // Fetch additional data
      const roles = await getUserRoles(user.id);
      const preferences = await getUserPreferences(user.id);
      
      return {
        user: {
          ...user,
          roles,
          preferences,
        },
        session,
      };
    }),
  ],
});
```

### Server Action with Auth

```typescript
// Next.js Server Action
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createPost(data: PostData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  // Create post with session.user.id
  return await db.insert(posts).values({
    ...data,
    authorId: session.user.id,
  });
}
```

## Pitfalls to Avoid

### 1. Don't Mix JWT and Cookie Patterns

Better Auth uses cookie-based sessions. Don't try to use JWT-style bearer tokens.

### 2. Handle Cookie Cache Invalidation

```typescript
// Revoked sessions may remain active until cache expires
// For critical operations, force cache refresh:

const session = await authClient.getSession({
  query: { disableCookieCache: true },
});
```

### 3. Don't Forget Headers in Server Context

```typescript
// Wrong - missing headers
const session = await auth.api.getSession({});

// Correct - pass headers
const session = await auth.api.getSession({
  headers: request.headers,
});
```

### 4. Implement Email OTP Send Function Properly

```typescript
// Don't await email sending (timing attacks)
emailOTP({
  async sendVerificationOTP({ email, otp, type }) {
    // Fire and forget
    sendEmail({ to: email, otp }).catch(console.error);
  },
});

// Or use waitUntil for serverless
emailOTP({
  async sendVerificationOTP({ email, otp, type }) {
    waitUntil(sendEmail({ to: email, otp }));
  },
});
```

### 5. Database Schema Migrations

Always run migrations after adding plugins:
```bash
npx auth@latest generate
npx drizzle-kit migrate
```

### 6. Cross-Domain Safari Issues

Safari ITP blocks third-party cookies. Use:
- Reverse proxy (recommended)
- Cross-subdomain cookies with shared parent domain
- Custom domain routing

### 7. Secret Rotation

Use `BETTER_AUTH_SECRETS` for rotation, not `BETTER_AUTH_SECRET`:
```bash
# Old and new secrets
BETTER_AUTH_SECRETS=old-secret,new-secret
```

### 8. Type Safety with Separate Client/Server

When client and server are in different projects:
```typescript
// Export auth type from server
export type { auth } from "./auth";

// Import on client for type inference
import type { auth } from "@server/auth";
const authClient = createAuthClient({
  plugins: [customSessionClient<typeof auth>()],
});
```

## Testing

### Unit Testing

```typescript
import { describe, it, expect } from "vitest";
import { auth } from "./auth";

describe("Auth", () => {
  it("should create user", async () => {
    const user = await auth.api.signUpEmail({
      body: {
        email: "test@example.com",
        password: "securepassword",
        name: "Test User",
      },
    });
    
    expect(user.email).toBe("test@example.com");
  });
});
```

### Integration Testing with Test Database

```typescript
import { createTestDb } from "./test-utils";

const testDb = createTestDb();
const testAuth = betterAuth({
  database: drizzleAdapter(testDb, { provider: "pg" }),
  emailAndPassword: { enabled: true },
});

// Run tests against testAuth
```

## Resources

- **Official Docs**: https://www.better-auth.com/docs
- **GitHub**: https://github.com/better-auth/better-auth
- **MCP Server**: https://mcp.better-auth.com/mcp
- **LLMs.txt**: https://www.better-auth.com/llms.txt
- **Plugin Directory**: https://www.better-auth.com/docs/plugins

## Version

This guide is current as of Better Auth v1.x
