# Web App Reimplementation Design

> **Reimplement pjapp-main web admin app in new_tech_stack**
> Migrate from tRPC + Supabase + Tailwind to GraphQL/urql + Better Auth + Tamagui

**Date**: 2026-04-18  
**Approach**: Big Bang (all 30 pages at once)  
**Status**: Design Complete → Ready for Implementation

---

## Executive Summary

Reimplement the MIRAI admin web application (`apps/web` from `pjapp-main`) using the new tech stack in `new_tech_stack` branch. The current app uses tRPC with tanstack-react-query, Supabase auth, and Tailwind CSS. The new implementation uses Effect-based DI, Better Auth, GraphQL with urql hooks, and Tamagui UI.

### Scope
- **30+ admin pages**: dashboard, users, groups, trips, rewards, challenges, coins, schedules, notifications, activity
- **Authentication**: Migrate from Supabase to Better Auth with email + OTP
- **Data Layer**: Replace tRPC with auto-generated urql hooks from GraphQL schema
- **UI**: Replace Tailwind with Tamagui components from `@mirai-app/ui`
- **Storage**: Use SeaweedFS + tusd instead of Supabase Storage

---

## Phase 1: Architecture Overview

### Current State (pjapp-main)

| Layer | Technology |
|-------|------------|
| Framework | Astro + React |
| API | tRPC (HTTP + WebSocket) |
| State | tanstack-react-query |
| Auth | Supabase Auth with cookies |
| UI | Tailwind CSS + custom components |
| Storage | Supabase Storage |
| Icons | react-icons |

### New Architecture (new_tech_stack)

| Layer | Technology |
|-------|------------|
| Framework | Astro + React |
| API | GraphQL (HTTP + WebSocket) |
| State | urql normalized cache |
| Auth | Better Auth with email + OTP |
| UI | Tamagui via `@mirai-app/ui` |
| Storage | SeaweedFS + tusd |
| Icons | @tamagui/lucide-icons |

### Infrastructure Ready in new_tech_stack

- ✅ **Effect DI**: Full Layer composition via `@mirai-app/frameworks/di`
- ✅ **Better Auth**: Configured with Drizzle adapter at `/api/auth/*`
- ✅ **GraphQL Schema**: Pothos schema defined for all admin domains
- ✅ **urql hooks**: Placeholder ready, needs `sync:schema` to generate
- ✅ **Tamagui UI**: Component library with Button, Card, Input, Select
- ✅ **SeaweedFS**: Storage gateway implemented in adapters

---

## Phase 2: Auth Migration (Better Auth)

### Key Changes

| Aspect | pjapp-main (Supabase) | new_tech_stack (Better Auth) |
|--------|----------------------|------------------------------|
| Auth Provider | Supabase Auth | Better Auth with Drizzle adapter |
| Session Storage | Cookie (`sb-access-token`) | Cookie (Better Auth manages) |
| OTP Flow | Supabase email OTP | Better Auth emailOTP plugin |
| Auth Check | Middleware → tRPC `user.getMy` | Middleware → Better Auth `/session` |
| Client Library | `@mirai-app/auth/client` | `@mirai-app/frameworks/auth/client` |

### Middleware Pattern

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

const PUBLIC_ROUTES = new Set(["/login", "/api/auth/*"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Let Better Auth endpoints through
  if (pathname.startsWith("/api/auth")) {
    return next();
  }

  // Check session via Better Auth
  const response = await fetch(`${context.url.origin}/api/auth/session`, {
    headers: {
      cookie: context.request.headers.get("cookie") || "",
    },
  });

  if (!response.ok) {
    if (PUBLIC_ROUTES.has(pathname)) return next();
    return context.redirect("/login");
  }

  const { user } = await response.json();
  
  // Check admin role
  if (pathname !== "/login" && user?.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  if (pathname === "/login" && user) {
    return context.redirect("/");
  }

  return next();
});
```

### Auth Provider Pattern

```typescript
// src/components/AuthProvider.tsx
"use client";

import { createBetterAuthClient } from "@mirai-app/frameworks/better-auth/client";
import { betterAuthStore } from "@mirai-app/frameworks/auth/store";
import { useEffect } from "react";
import { env } from "../lib/env";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const client = createBetterAuthClient({
      baseURL: env.apiUrl,
      basePath: "/api/auth",
    });
    
    betterAuthStore.getState().initialize({ client });
    
    // Sync cookies on auth state change
    const unsubscribe = betterAuthStore.subscribe((state) => {
      if (state.session?.token) {
        document.cookie = `session_token=${state.session.token}; Path=/; SameSite=Lax`;
      }
    });
    
    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
```

### Login Form Pattern

```typescript
// src/components/LoginForm.tsx
"use client";

import { betterAuthStore } from "@mirai-app/frameworks/auth/store";
import { Button, Input, Text, YStack } from "@mirai-app/ui";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    
    const { error } = await betterAuthStore.getState().sendVerificationOtp(email, "sign-in");
    
    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);
    
    const { error } = await betterAuthStore.getState().verifyEmail({ email, otp });
    
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <YStack gap="$4" padding="$4" maxWidth={400}>
      <Text fontSize="$8" fontWeight="bold">Admin Login</Text>
      
      {step === "email" ? (
        <>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button onPress={sendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </>
      ) : (
        <>
          <Text>Enter OTP sent to {email}</Text>
          <Input
            placeholder="OTP Code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button onPress={verifyOtp} disabled={loading}>
            {loading ? "Verifying..." : "Verify & Login"}
          </Button>
          <Button variant="outlined" onPress={() => setStep("email")}>
            Back
          </Button>
        </>
      )}
      
      {error && <Text color="$red10">{error}</Text>}
    </YStack>
  );
}
```

---

## Phase 3: Data Layer (urql hooks)

### Key Changes

| Aspect | pjapp-main (tRPC) | new_tech_stack (GraphQL/urql) |
|--------|-------------------|------------------------------|
| API Client | `@mirai-app/trpc/client` | `@mirai-app/frameworks/graphql/client` |
| Data Fetching | `useTRPCClient()` + tanstack-query | `useXxxQuery()` / `useXxxMutation()` hooks |
| Caching | React Query cache | urql's normalized cache |
| Real-time | tRPC subscriptions | urql subscriptions with `graphql-ws` |
| Auth Token | Manual header injection | Automatic via urql auth exchange |

### Prerequisite: Generate urql Hooks

Before implementation, run schema sync:

```bash
bun run --filter=@mirai-app/frameworks sync:schema
```

This generates:
- `packages/frameworks/src/graphql/client/generated/types.ts` - TypeScript types
- `packages/frameworks/src/graphql/client/generated/operations.ts` - GraphQL operations
- `packages/frameworks/src/graphql/client/generated/urql.ts` - React hooks

### urql Provider Setup

```typescript
// src/components/providers/GraphQLProvider.tsx
"use client";

import { createClient, Provider } from "urql";
import { authExchange } from "@urql/exchange-auth";
import { cacheExchange } from "@urql/exchange-graphcache";
import { subscriptionExchange } from "@urql/exchange-subscription";
import { createClient as createWSClient } from "graphql-ws";
import { betterAuthStore } from "@mirai-app/frameworks/auth/store";
import { env } from "../../lib/env";

const wsClient = createWSClient({
  url: env.graphqlWsUrl,
  connectionParams: () => {
    const token = betterAuthStore.getState().session?.token;
    return { Authorization: token ? `Bearer ${token}` : "" };
  },
});

const client = createClient({
  url: env.graphqlUrl,
  exchanges: [
    cacheExchange({}),
    authExchange(async (utils) => ({
      addAuthToOperation(operation) {
        const token = betterAuthStore.getState().session?.token;
        if (!token) return operation;
        return utils.appendHeaders(operation, {
          Authorization: `Bearer ${token}`,
        });
      },
      didAuthError(error) {
        return error.response?.status === 401;
      },
      async refreshAuth() {},
    })),
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query || "" };
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink);
            return { unsubscribe };
          },
        };
      },
    }),
  ],
});

export function GraphQLProvider({ children }: { children: React.ReactNode }) {
  return <Provider value={client}>{children}</Provider>;
}
```

### Hook Migration Examples

**User List:**
```typescript
// pjapp-main: tRPC
const { data: users, isLoading } = useTRPCClient().user.getAll.useQuery();

// new_tech_stack: urql
const [{ data, fetching, error }] = useGetAllUsersQuery();
const users = data?.users?.edges?.map(e => e.node) ?? [];
```

**Create User:**
```typescript
// pjapp-main: tRPC
const mutation = useTRPCClient().user.create.useMutation();
await mutation.mutateAsync({ email, firstName, lastName });

// new_tech_stack: urql
const [result, createUser] = useCreateUserMutation();
const { error } = await createUser({ input: { email, firstName, lastName } });
```

**Real-time Notifications:**
```typescript
// new_tech_stack: urql subscription
useNotificationReceivedSubscription({}, (prev, data) => {
  toast.success(data.notificationReceived.title);
  return prev;
});
```

### Custom Hooks for Admin Patterns

```typescript
// src/hooks/useAdminList.ts
"use client";

import { useMemo } from "react";

interface UseAdminListOptions<T> {
  data: { edges?: Array<{ node: T }> } | null | undefined;
  fetching: boolean;
  error: Error | undefined;
}

export function useAdminList<T>({ data, fetching, error }: UseAdminListOptions<T>) {
  const items = useMemo(() => {
    return data?.edges?.map(edge => edge.node) ?? [];
  }, [data]);

  return {
    items,
    isLoading: fetching,
    error: error?.message ?? null,
  };
}
```

```typescript
// src/hooks/useTripContext.ts
"use client";

import { useMemo, useState, useEffect } from "react";
import { useGetMyTripsQuery } from "@mirai-app/frameworks/graphql/client";

const ACTIVE_TRIP_KEY = "admin:selectedTripId";

export function useTripContext() {
  const [{ data, fetching }] = useGetMyTripsQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const trips = useMemo(() => 
    data?.myTrips?.edges?.map(e => e.node) ?? [],
    [data]
  );

  const selectedTrip = useMemo(() => 
    trips.find(t => t.id === selectedId) ?? trips[0] ?? null,
    [trips, selectedId]
  );

  useEffect(() => {
    if (selectedTrip && selectedTrip.id !== selectedId) {
      setSelectedId(selectedTrip.id);
      localStorage.setItem(ACTIVE_TRIP_KEY, selectedTrip.id);
    }
  }, [selectedTrip, selectedId]);

  return {
    trips,
    selectedTrip,
    setSelectedTrip: (trip: { id: string; name: string } | null) => {
      setSelectedId(trip?.id ?? null);
      if (trip) localStorage.setItem(ACTIVE_TRIP_KEY, trip.id);
    },
    isLoading: fetching,
  };
}
```

---

## Phase 4: UI Layer (Tamagui)

### Key Changes

| Aspect | pjapp-main (Tailwind) | new_tech_stack (Tamagui) |
|--------|----------------------|--------------------------|
| Styling | Tailwind utility classes | Tamagui styled components + tokens |
| Theme | CSS custom properties | Tamagui theme system (light/dark) |
| Components | Custom React components | `@mirai-app/ui` (Tamagui-based) |
| Layout | CSS Flexbox/Grid | Tamagui Stack, XStack, YStack |
| Responsive | Tailwind breakpoints | Tamagui `useMedia()` |
| Icons | react-icons | @tamagui/lucide-icons |

### Component Migration Mapping

| pjapp-main Component | Tamagui Equivalent |
|---------------------|-------------------|
| `components/ui/Button.tsx` | `Button` from `@mirai-app/ui` |
| `components/ui/Card.tsx` | `Card` from `@mirai-app/ui` |
| `components/ui/Input.tsx` | `Input` from `@mirai-app/ui` |
| `components/ui/Select.tsx` | `Select` from `@mirai-app/ui` |
| `components/ui/Modal.tsx` | `Sheet` from `@mirai-app/ui` |
| `components/ui/LoadingSpinner.tsx` | `Spinner` from `@mirai-app/ui` |
| `components/ui/ErrorMessage.tsx` | `ErrorMessage` from `@mirai-app/ui` |

### Layout Structure

```typescript
// src/layouts/Layout.astro
---
import { TamaguiProvider } from "@mirai-app/ui";
import { config } from "@mirai-app/ui/tamagui.config";
import "../styles/tamagui.css";
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin | MIRAI</title>
  </head>
  <body>
    <TamaguiProvider config={config} defaultTheme="dark">
      <slot />
    </TamaguiProvider>
  </body>
</html>
```

### Component Examples

**User Card:**
```tsx
// pjapp-main: Tailwind
<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
  <h3 className="text-lg font-semibold text-slate-900">{user.firstName}</h3>
  <p className="text-sm text-slate-600">{user.email}</p>
  <button className="mt-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
    Edit
  </button>
</div>

// new_tech_stack: Tamagui
<Card elevate bordered padding="$4" gap="$2">
  <Text fontSize="$6" fontWeight="bold" color="$color12">
    {user.firstName}
  </Text>
  <Text fontSize="$3" color="$color10">
    {user.email}
  </Text>
  <Button theme="active" marginTop="$2">
    Edit
  </Button>
</Card>
```

**Page Layout:**
```tsx
// new_tech_stack: Tamagui stacks
<YStack flex={1} backgroundColor="$background">
  <Header />
  <ScrollView flex={1} padding="$4" paddingBottom="$20">
    {children}
  </ScrollView>
  <MobileNav />
</YStack>
```

**Form Pattern:**
```tsx
// src/components/CreateUserForm.tsx
"use client";

import { Button, Card, Input, Label, Spinner, Text, YStack } from "@mirai-app/ui";
import { useState } from "react";
import { useCreateUserMutation } from "@mirai-app/frameworks/graphql/client";

export function CreateUserForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [result, createUser] = useCreateUserMutation();

  const handleSubmit = async () => {
    await createUser({ input: { firstName, lastName, email } });
  };

  if (result.fetching) {
    return <Spinner size="large" />;
  }

  return (
    <Card elevate padding="$4">
      <YStack gap="$3">
        <Text fontSize="$7" fontWeight="bold">Create User</Text>
        
        <YStack>
          <Label>First Name</Label>
          <Input value={firstName} onChangeText={setFirstName} />
        </YStack>
        
        <YStack>
          <Label>Last Name</Label>
          <Input value={lastName} onChangeText={setLastName} />
        </YStack>
        
        <YStack>
          <Label>Email</Label>
          <Input value={email} onChangeText={setEmail} keyboardType="email-address" />
        </YStack>
        
        {result.error && (
          <Text color="$red10">{result.error.message}</Text>
        )}
        
        <Button onPress={handleSubmit} theme="active">
          Create
        </Button>
      </YStack>
    </Card>
  );
}
```

---

## Phase 5: Complete Page Migration Plan

### File Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── providers/
│   │   │   ├── GraphQLProvider.tsx      # urql client setup
│   │   │   ├── GlobalProviders.tsx      # Auth + GraphQL + Trip context
│   │   │   └── PageContent.tsx          # Route-to-component mapping
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Top navigation
│   │   │   ├── MobileNav.tsx            # Bottom mobile nav
│   │   │   └── TripSelector.tsx         # Trip context switcher
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx            # Better Auth OTP form
│   │   │   ├── LogoutButton.tsx         # Sign out button
│   │   │   └── AuthProvider.tsx         # Better Auth state provider
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardContent.tsx
│   │   │   ├── users/
│   │   │   │   ├── UsersPageContent.tsx
│   │   │   │   ├── UserCard.tsx
│   │   │   │   ├── CreateUserForm.tsx
│   │   │   │   └── EditUserForm.tsx
│   │   │   ├── groups/
│   │   │   │   ├── GroupsPageContent.tsx
│   │   │   │   ├── GroupCard.tsx
│   │   │   │   ├── CreateGroupForm.tsx
│   │   │   │   └── EditGroupForm.tsx
│   │   │   ├── trips/
│   │   │   │   └── (trip management)
│   │   │   ├── rewards/
│   │   │   │   ├── RewardsPageContent.tsx
│   │   │   │   ├── RewardCard.tsx
│   │   │   │   └── RewardForm.tsx
│   │   │   ├── challenges/
│   │   │   │   ├── ChallengesPageContent.tsx
│   │   │   │   ├── ChallengeCard.tsx
│   │   │   │   ├── ChallengeForm.tsx
│   │   │   │   ├── ChallengeSubmissions.tsx
│   │   │   │   ├── VotingCard.tsx
│   │   │   │   └── JudgingPage.tsx
│   │   │   ├── coins/
│   │   │   │   ├── CoinsOverviewPage.tsx
│   │   │   │   └── CoinOperationForm.tsx
│   │   │   ├── schedules/
│   │   │   │   └── SchedulesPage.tsx
│   │   │   ├── notifications/
│   │   │   │   ├── NotificationsPage.tsx
│   │   │   │   └── CreateNotificationForm.tsx
│   │   │   └── activity/
│   │   │       ├── ActivityPage.tsx
│   │   │       └── ActivityForm.tsx
│   │   └── shared/
│   │       ├── FileUpload.tsx           # SeaweedFS/tusd upload
│   │       └── ImagePreview.tsx
│   ├── hooks/
│   │   ├── useAdminList.ts              # Generic list hook
│   │   ├── useTripContext.ts            # Trip selection hook
│   │   ├── useFileUpload.ts             # File upload hook (tusd)
│   │   └── useActiveTripId.ts           # LocalStorage trip ID
│   ├── lib/
│   │   ├── env.ts                       # Environment variables
│   │   └── fileValidation.ts            # File upload validation
│   ├── layouts/
│   │   ├── Layout.astro                 # Base layout (Tamagui)
│   │   └── AdminLayout.astro            # Admin shell
│   ├── pages/                           # Astro pages (routes)
│   │   ├── index.astro                  # Dashboard
│   │   ├── login.astro                  # Login page
│   │   ├── users/
│   │   │   ├── index.astro
│   │   │   └── new.astro
│   │   ├── users/[userId]/
│   │   │   └── edit.astro
│   │   ├── groups/
│   │   │   ├── index.astro
│   │   │   └── new.astro
│   │   ├── groups/[groupId]/
│   │   │   └── edit.astro
│   │   ├── trips/
│   │   │   └── index.astro
│   │   ├── rewards/
│   │   │   ├── index.astro
│   │   │   └── new.astro
│   │   ├── rewards/[rewardId]/
│   │   │   └── edit.astro
│   │   ├── challenges/
│   │   │   ├── index.astro
│   │   │   ├── new.astro
│   │   │   └── [id].astro
│   │   ├── challenges/[id]/
│   │   │   ├── submissions.astro
│   │   │   ├── voting.astro
│   │   │   └── judging.astro
│   │   ├── challenges/edit/
│   │   │   └── [id].astro
│   │   ├── coins/
│   │   │   ├── index.astro
│   │   │   └── operation.astro
│   │   ├── schedules/
│   │   │   └── index.astro
│   │   ├── notifications/
│   │   │   ├── index.astro
│   │   │   └── new.astro
│   │   └── activity/
│   │       ├── index.astro
│   │       ├── new.astro
│   │       └── edit/
│   │           └── [activityId].astro
│   ├── styles/
│   │   └── tamagui.css                  # Tamagui required CSS
│   └── middleware.ts                    # Better Auth middleware
├── tamagui.config.ts                    # Web-specific Tamagui config
└── package.json                         # Already updated
```

### Page-by-Page Checklist

| Priority | Page | Component Files | Complexity | Dependencies |
|----------|------|-----------------|------------|--------------|
| **P0 - Foundation** | | | | |
| | Login | `login.astro`, `LoginForm.tsx` | Low | Better Auth client |
| | Layout | `Layout.astro`, `AdminLayout.astro` | Low | Tamagui provider |
| | Middleware | `middleware.ts` | Low | Better Auth session |
| | Providers | `GraphQLProvider.tsx`, `GlobalProviders.tsx` | Medium | urql setup |
| | Header | `Header.tsx` | Low | TripSelector |
| | MobileNav | `MobileNav.tsx` | Low | Navigation items |
| **P1 - Core CRUD** | | | | |
| | Dashboard | `index.astro`, `DashboardContent.tsx` | Low | Stats queries |
| | Users List | `users/index.astro`, `UsersPageContent.tsx` | Medium | useAdminList hook |
| | Create User | `users/new.astro`, `CreateUserForm.tsx` | Low | useCreateUserMutation |
| | Edit User | `users/[userId]/edit.astro`, `EditUserForm.tsx` | Medium | Prefetch query |
| | Groups List | `groups/index.astro`, `GroupsPageContent.tsx` | Medium | List + members |
| | Create Group | `groups/new.astro`, `CreateGroupForm.tsx` | Medium | Trip selection |
| | Edit Group | `groups/[groupId]/edit.astro`, `EditGroupForm.tsx` | High | Member management |
| **P2 - Features** | | | | |
| | Rewards | `rewards/*`, `RewardsPageContent.tsx` | Medium | CRUD + image upload |
| | Challenges | `challenges/*`, `ChallengesPageContent.tsx` | High | Complex forms |
| | Challenge Details | `challenges/[id].astro` | Medium | View mode |
| | Submissions | `challenges/[id]/submissions.astro` | Medium | List + approve |
| | Voting | `challenges/[id]/voting.astro` | Medium | Staff voting UI |
| | Judging | `challenges/[id]/judging.astro` | High | Judging form |
| **P3 - Operations** | | | | |
| | Coins | `coins/*`, `CoinsOverviewPage.tsx` | Medium | Transaction list |
| | Coin Operations | `coins/operation.astro` | Medium | Add/remove coins |
| | Schedules | `schedules/*`, `SchedulesPage.tsx` | High | Calendar/timeline |
| | Notifications | `notifications/*` | Medium | Push notification UI |
| | Activity | `activity/*`, `ActivityPage.tsx` | High | Activity feed CRUD |
| **P4 - Shared** | | | | |
| | File Upload | `useFileUpload.ts`, `FileUpload.tsx` | High | SeaweedFS + tusd |
| | Trip Context | `useTripContext.ts`, `TripSelector.tsx` | Medium | Multi-tenant |

### Pre-Implementation Checklist

Before starting migration:

- [ ] **GraphQL Schema**: Verify all admin queries/mutations exist in schema
- [ ] **Generate Hooks**: Run `bun run --filter=@mirai-app/frameworks sync:schema`
- [ ] **Better Auth**: Confirm `/api/auth/*` endpoints are working
- [ ] **Environment**: Update `apps/web/src/lib/env.ts` with new endpoints:
  ```typescript
  export const env = {
    apiUrl: import.meta.env.PUBLIC_API_URL,
    graphqlUrl: import.meta.env.PUBLIC_GRAPHQL_URL,
    graphqlWsUrl: import.meta.env.PUBLIC_GRAPHQL_WS_URL,
  };
  ```
- [ ] **Dependencies**: Install required packages:
  ```bash
  cd apps/web
  bun add @urql/exchange-auth @urql/exchange-subscription graphql-ws
  ```

### Migration Order

1. **P0 - Foundation**: Login, layout, middleware, providers (1-2 days)
2. **P1 - Core CRUD**: Users, Groups - validate patterns (2-3 days)
3. **P4 - Shared**: File upload (critical dependency) (1 day)
4. **P2 - Features**: Rewards, Challenges with images (3-4 days)
5. **P3 - Operations**: Coins, Schedules, Notifications, Activity (3-4 days)

**Total Estimate**: 10-14 days for complete migration

---

## Dependencies Summary

### New Dependencies to Install

```bash
# GraphQL/urql
cd apps/web
bun add @urql/exchange-auth @urql/exchange-subscription graphql-ws

# Icons (if not already in @mirai-app/ui)
bun add @tamagui/lucide-icons
```

### Environment Variables

Update `apps/web/.env`:

```env
# API Endpoints
PUBLIC_API_URL=http://localhost:3000
PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
PUBLIC_GRAPHQL_WS_URL=ws://localhost:3000/graphql

# Better Auth (handled by server)
# No client-side auth env needed - uses cookies
```

---

## Testing Strategy

1. **Unit Tests**: Each component with mocked urql hooks
2. **Integration Tests**: Full page flows with test GraphQL server
3. **E2E Tests**: Critical paths (login → dashboard → CRUD operations)

### Test File Structure

```
src/components/admin/users/__tests__/
├── UsersPageContent.test.tsx
├── CreateUserForm.test.tsx
└── EditUserForm.test.tsx
```

---

## Appendix: GraphQL Operations Reference

The following operations should be available after running `sync:schema`:

### User Operations
- `useGetAllUsersQuery` - List users with pagination
- `useGetUserQuery` - Get single user
- `useCreateUserMutation` - Create new user
- `useUpdateUserMutation` - Update user
- `useDeleteUserMutation` - Delete user

### Group Operations
- `useGetAllGroupsQuery` - List groups for trip
- `useGetGroupQuery` - Get group with members
- `useCreateGroupMutation` - Create group
- `useUpdateGroupMutation` - Update group
- `useDeleteGroupMutation` - Delete group

### Trip Operations
- `useGetMyTripsQuery` - List admin's trips
- `useGetTripQuery` - Get trip details

### Reward Operations
- `useGetAllRewardsQuery` - List rewards
- `useCreateRewardMutation` - Create reward (with image)
- `useUpdateRewardMutation` - Update reward

### Challenge Operations
- `useGetAllChallengesQuery` - List challenges
- `useGetChallengeQuery` - Get challenge details
- `useCreateChallengeMutation` - Create challenge
- `useUpdateChallengeMutation` - Update challenge
- `useGetChallengeSubmissionsQuery` - List submissions
- `useApproveSubmissionMutation` - Approve submission
- `useGetStaffVotingQuery` - Get voting status
- `useCastVoteMutation` - Cast staff vote

### Coin Operations
- `useGetCoinBalanceQuery` - Get user/group coins
- `useAddCoinsMutation` - Add coins
- `useRemoveCoinsMutation` - Remove coins
- `useGetCoinTransactionsQuery` - List transactions

### Notification Operations
- `useGetAllNotificationsQuery` - List notifications
- `useCreateNotificationMutation` - Send notification
- `useNotificationReceivedSubscription` - Real-time notifications

### Storage Operations
- `useCreateUploadUrlMutation` - Get tusd upload URL
- `useCreateDownloadUrlQuery` - Get file download URL

---

**Design Version**: 1.0.0  
**Next Step**: Create implementation tasks using `/sdd:add-task`
