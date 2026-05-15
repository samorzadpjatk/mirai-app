# API Structure

## Overview

This document describes how the backend API is organized.

## API Architecture

```
Client (Native/Web)
     │
     ▼
Hono Server (Bun.serve)
     ├── /health         # Health check
     ├── /api/trpc/*     # oRPC procedures (HTTP + WebSocket)
     └── /ws             # WebSocket
```

## oRPC Router Structure

```
appRouter (packages/orpc/src/api)
├── user
│   ├── list        # GET /trpc/user.list
│   ├── getById     # GET /trpc/user.getById
│   ├── create      # POST /trpc/user.create
│   └── update      # POST /trpc/user.update
├── event
│   ├── list        # GET /trpc/event.list
│   ├── getById     # GET /trpc/event.getById
│   └── create      # POST /trpc/event.create
└── ...
```

## HTTP Methods

| Procedure Type | HTTP Method | URL Pattern |
|----------------|-------------|-------------|
| Query | GET | `/api/trpc/[router].[procedure]` |
| Mutation | POST | `/api/trpc/[router].[procedure]` |
| Subscription | WS | `/api/trpc/[router].[procedure]` |

## Request Format

### Query

```http
GET /api/trpc/user.list?batch=1&input={}
```

### Mutation

```http
POST /api/trpc/user.create
Content-Type: application/json

{
  "0": {
    "json": {
      "email": "user@example.com",
      "name": "John"
    }
  }
}
```

### Response Format

```json
{
  "0": {
    "result": {
      "data": {
        "json": { "id": "123", "email": "user@example.com" }
      }
    }
  }
}
```

## Adding New Endpoints

### 1. Create Router

```typescript
// packages/orpc/src/api/routers/my-resource.ts
import { os } from "@orpc/server";
import { z } from "zod";

export const myResource = os
  .route({
    list: os.handler(async ({ context }) => {
      return context.db.query.myResources.findMany();
    }),
    create: os
      .input(z.object({ name: z.string() }))
      .handler(async ({ input, context }) => {
        const [created] = await context.db.insert(myResources).values(input).returning();
        return created;
      }),
  });
```

### 2. Add to Root Router

```typescript
// packages/orpc/src/api/root.ts
import { myResource } from './routers/my-resource';

export const appRouter = os.contract({
  myResource,
  user: userRouter,
  event: eventRouter,
});
```

### 3. Client Access

```typescript
import { orpc } from '@mirai-app/orpc/client';

// Available immediately
const { data } = orpc.myResource.list.useQuery();
```

## Batch Requests

```typescript
// Multiple procedures in one HTTP request
const [users, events] = await Promise.all([
  orpc.user.list.query(),
  orpc.event.list.query(),
]);
```

## Error Responses

```json
{
  "0": {
    "error": {
      "json": {
        "message": "User not found",
        "code": -32004,
        "data": {
          "code": "NOT_FOUND",
          "httpStatus": 404
        }
      }
    }
  }
}
```

## API Versioning

### URL-Based Versioning

```typescript
// In packages/orpc/src/api/root.ts
const v1Router = os.contract({ user: userRouter });
const v2Router = os.contract({ user: userV2Router });

export const appRouter = os.contract({
  v1: v1Router,
  v2: v2Router,
});
```

Access: `/api/trpc/v1.user.list`, `/api/trpc/v2.user.list`

## Rate Limiting

### Implementation (in `src/server.ts`)

Rate limiting and security headers are built into the Hono middleware stack:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// Rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

app.use("*", async (c, next) => {
  const ip = getClientIp(c);
  const { allowed, retryAfter } = checkRateLimit(ip, path);
  if (!allowed) {
    c.header("Retry-After", String(retryAfter));
    return c.text("Too Many Requests", 429);
  }
  await next();
});
```

## CORS Configuration

CORS is configured using Hono's built-in `cors` middleware:

```typescript
app.use("*", cors({
  origin: (origin) => {
    if (!origin || allowedOrigins.includes(origin)) return origin;
    return null;
  },
  credentials: true,
}));
```

## Monitoring

### Health Check

The health endpoint is defined directly on the Hono app:

```typescript
app.get("/health", (c) => c.text("OK"));
```

### WebSocket Support

WebSocket connections use Bun's native WebSocket with `@orpc/server/bun-ws`:

```typescript
import { RPCHandler as BunWsRPCHandler } from "@orpc/server/bun-ws";

// Handled outside Hono via Bun.serve upgrade
bunServer = Bun.serve({
  port,
  fetch(req, server) {
    if (url.pathname.startsWith(prefix) && server.upgrade(req)) return;
    return app.fetch(req);
  },
  websocket: {
    async message(ws, message) {
      await wsRpcHandler.message(ws, message, { context });
    },
  },
});
```

## Further Reading

- [oRPC HTTP Specification](https://orpc.unnoq.com/docs/http)
- [Hono Documentation](https://hono.dev/)
