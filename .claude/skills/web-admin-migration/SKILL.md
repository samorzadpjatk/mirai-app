# Web Admin Migration: tRPC to GraphQL/urql + Better Auth + Tamagui

> Reusable patterns for migrating web admin apps from tRPC/tanstack-query to Effect/GraphQL/urql stack

## Overview

This skill provides migration patterns for reimplementing admin web apps using:
- **Effect DI**: Layer composition for dependency injection
- **Better Auth**: Email + OTP authentication
- **GraphQL/urql**: Type-safe data fetching with auto-generated hooks
- **Tamagui UI**: Cross-platform React component library
- **SeaweedFS + tusd**: Resumable file uploads

## Migration: tRPC to GraphQL/urql

### Query Migration Pattern

**Before (tRPC):**
```typescript
// Client setup
trpc.user.getAll.useQuery();
trpc.user.getById.useQuery({ id: userId });
```

**After (urql hooks):**
```typescript
import { useGetAllUsersQuery, useGetUserQuery } from "@mirai-app/frameworks/graphql/client";

// List query - GraphQL returns edges/node structure
const [{ data, fetching, error }] = useGetAllUsersQuery();
const users = data?.users?.edges?.map(e => e.node) ?? [];

// Single item query
const [{ data }] = useGetUserQuery({ variables: { id: userId } });
const user = data?.user;
```

### Mutation Migration Pattern

**Before (tRPC):**
```typescript
const mutation = useTRPCClient().user.create.useMutation();
await mutation.mutateAsync({ email, firstName, lastName });
```

**After (urql):**
```typescript
import { useCreateUserMutation } from "@mirai-app/frameworks/graphql/client";

const [result, createUser] = useCreateUserMutation();
const { error } = await createUser({ 
  input: { email, firstName, lastName } 
});
```

### Subscription Migration Pattern

**Real-time with urql:**
```typescript
import { useNotificationReceivedSubscription } from "@mirai-app/frameworks/graphql/client";

useNotificationReceivedSubscription({}, (prev, data) => {
  toast.success(data.notificationReceived.title);
  return prev;
});
```

### Generic List Hook Pattern

Create reusable hooks for admin list pages:

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

### urql Client Setup Pattern

```typescript
// src/components/providers/GraphQLProvider.tsx
"use client";

import { createClient, Provider } from "urql";
import { authExchange } from "@urql/exchange-auth";
import { cacheExchange } from "@urql/exchange-graphcache";
import { subscriptionExchange } from "@urql/exchange-subscription";
import { createClient as createWSClient } from "graphql-ws";
import { betterAuthStore } from "@mirai-app/frameworks/auth/store";

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

## Migration: Supabase Auth to Better Auth

### Middleware Pattern

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

const PUBLIC_ROUTES = new Set(["/login", "/api/auth/*"]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  if (pathname.startsWith("/api/auth")) {
    return next();
  }

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

### Email OTP Login Form Pattern

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
    
    const { error } = await betterAuthStore.getState().sendVerificationOtp(
      email, 
      "sign-in"
    );
    
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
    
    const { error } = await betterAuthStore.getState().verifyEmail({ 
      email, 
      otp 
    });
    
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

## Migration: Tailwind to Tamagui

### Component Mapping

| Tailwind Pattern | Tamagui Equivalent |
|-----------------|-------------------|
| `className="p-4"` | `padding="$4"` |
| `className="flex flex-col"` | `<YStack>` |
| `className="flex flex-row"` | `<XStack>` |
| `className="gap-4"` | `gap="$4"` |
| `className="bg-white"` | `backgroundColor="$background"` |
| `className="text-lg"` | `fontSize="$6"` |
| `className="font-bold"` | `fontWeight="bold"` |
| `className="rounded-lg"` | `borderRadius="$4"` |

### Layout Structure

```typescript
// Before (Tailwind)
<div className="flex flex-col min-h-screen bg-gray-50">
  <header className="bg-white shadow">...</header>
  <main className="flex-1 p-4">...</main>
</div>

// After (Tamagui)
<YStack flex={1} backgroundColor="$background">
  <Header />
  <ScrollView flex={1} padding="$4">
    {children}
  </ScrollView>
  <MobileNav />
</YStack>
```

### Form Pattern

```typescript
// src/components/CreateForm.tsx
"use client";

import { Button, Card, Input, Label, Spinner, Text, YStack } from "@mirai-app/ui";
import { useState } from "react";

export function CreateForm() {
  const [name, setName] = useState("");
  const [result, createItem] = useCreateMutation();

  const handleSubmit = async () => {
    await createItem({ input: { name } });
  };

  if (result.fetching) {
    return <Spinner size="large" />;
  }

  return (
    <Card elevate padding="$4">
      <YStack gap="$3">
        <Text fontSize="$7" fontWeight="bold">Create Item</Text>
        
        <YStack>
          <Label>Name</Label>
          <Input value={name} onChangeText={setName} />
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

### Layout Pattern

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

## Migration: File Upload (SeaweedFS + tusd)

### Upload Hook Pattern

```typescript
// src/hooks/useFileUpload.ts
"use client";

import { useState, useCallback } from "react";
import { useCreateUploadUrlMutation } from "@mirai-app/frameworks/graphql/client";
import * as tus from "tus-js-client";

interface UseFileUploadOptions {
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess?: (fileId: string) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [upload, setUpload] = useState<tus.Upload | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, createUploadUrl] = useCreateUploadUrlMutation();

  const startUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Get upload URL from GraphQL
      const { data } = await createUploadUrl({
        input: { 
          filename: file.name,
          contentType: file.type,
          size: file.size,
        },
      });

      if (!data?.createUploadUrl?.url) {
        throw new Error("Failed to get upload URL");
      }

      const uploadUrl = data.createUploadUrl.url;
      const fileId = data.createUploadUrl.fileId;

      // Create tus upload
      const tusUpload = new tus.Upload(file, {
        endpoint: uploadUrl,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onError: (error) => {
          setIsUploading(false);
          options.onError?.(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal) * 100;
          setProgress(percentage);
          options.onProgress?.(bytesUploaded, bytesTotal);
        },
        onSuccess: () => {
          setIsUploading(false);
          options.onSuccess?.(fileId);
        },
      });

      setUpload(tusUpload);
      tusUpload.start();

      return { fileId, upload: tusUpload };
    } catch (error) {
      setIsUploading(false);
      options.onError?.(error as Error);
      throw error;
    }
  }, [createUploadUrl, options]);

  const abortUpload = useCallback(() => {
    upload?.abort();
    setIsUploading(false);
    setProgress(0);
  }, [upload]);

  return {
    startUpload,
    abortUpload,
    progress,
    isUploading,
    isLoading: result.fetching,
    error: result.error,
  };
}
```

### Upload Component Pattern

```typescript
// src/components/FileUpload.tsx
"use client";

import { Button, Progress, Text, XStack, YStack } from "@mirai-app/ui";
import { useFileUpload } from "../hooks/useFileUpload";

interface FileUploadProps {
  onUploadComplete: (fileId: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileUpload({ 
  onUploadComplete, 
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const { startUpload, abortUpload, progress, isUploading } = useFileUpload({
    onSuccess: onUploadComplete,
    onError: (error) => console.error("Upload failed:", error),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
      return;
    }

    await startUpload(file);
  };

  return (
    <YStack gap="$2">
      {!isUploading ? (
        <Button asChild theme="active">
          <label>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            Choose File
          </label>
        </Button>
      ) : (
        <XStack gap="$2" alignItems="center">
          <Progress value={progress} max={100} flex={1} />
          <Text>{Math.round(progress)}%</Text>
          <Button onPress={abortUpload} size="$2" theme="red">
            Cancel
          </Button>
        </XStack>
      )}
    </YStack>
  );
}
```

## Trip Context Pattern

For multi-tenant admin apps with trip/organization switching:

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

## Effect DI Patterns

### Layer Composition

```typescript
// From packages/frameworks/src/di
import { makeAppLayer } from "@mirai-app/frameworks/di";

const appLayer = makeAppLayer({ db, supabase });

const program = Effect.gen(function* () {
  const userRepo = yield* UserPortTag;
  return yield* userRepo.findById("123");
}).pipe(Effect.provide(appLayer));
```

### Test Layer Pattern

```typescript
// Testing with Effect
import { createTestLayer, runWithTestLayer } from "@mirai-app/frameworks/di";

const testLayer = createTestLayer();

const result = await runWithTestLayer(
  testLayer,
  Effect.gen(function* () {
    const repo = yield* UserPortTag;
    return yield* repo.findById("123");
  }),
);
```

## Pre-Implementation Checklist

Before migrating pages:

- [ ] **Generate GraphQL Hooks**: Run `bun run --filter=@mirai-app/frameworks sync:schema`
- [ ] **Verify Auth Endpoints**: Confirm `/api/auth/*` endpoints working
- [ ] **Update Environment**: Add `PUBLIC_GRAPHQL_URL` and `PUBLIC_GRAPHQL_WS_URL`
- [ ] **Install Dependencies**:
  ```bash
  cd apps/web
  bun add @urql/exchange-auth @urql/exchange-subscription graphql-ws
  bun add @tamagui/lucide-icons
  bun add tus-js-client
  ```

## Migration Order

1. **Foundation** (1-2 days): Login, layout, middleware, providers
2. **Core CRUD** (2-3 days): Users, Groups - validate patterns
3. **File Upload** (1 day): Critical dependency for Rewards, Challenges
4. **Features** (3-4 days): Rewards, Challenges with images
5. **Operations** (3-4 days): Coins, Schedules, Notifications, Activity

## Resources

- **Effect**: https://effect.website/docs/guides/context-management/layers
- **Better Auth Email OTP**: https://www.better-auth.com/docs/plugins/email-otp
- **urql**: https://formidable.com/open-source/urql/docs/
- **Tamagui**: https://tamagui.dev
- **tusd**: https://tus.io/
- **SeaweedFS**: https://seaweedfs.github.io/
