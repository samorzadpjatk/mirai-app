# API Structure

## Overview

This document describes how the backend API is organized.

## API Architecture

```
Client (Native/Web)
     │
     ▼
Fastify Server
     ├── /health         # Health check
     ├── /trpc/*         # oRPC procedures
     └── /ws             # WebSocket
```

## oRPC Router Structure

```
appRouter (packages/trpc)
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
| Query | GET | `/trpc/[router].[procedure]` |
| Mutation | POST | `/trpc/[router].[procedure]` |
| Subscription | WS | `/trpc/[router].[procedure]` |

## Request Format

### Query

```http
GET /trpc/user.list?batch=1&input={}
```

### Mutation

```http
POST /trpc/user.create
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
// packages/trpc/src/routers/my-resource.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const myResourceRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.myResources.findMany();
  }),

  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [created] = await ctx.db.insert(myResources).values(input).returning();
      return created;
    }),
});
```

### 2. Add to Root Router

```typescript
// packages/trpc/src/routers/index.ts
import { myResourceRouter } from './my-resource';

export const appRouter = router({
  user: userRouter,
  event: eventRouter,
  myResource: myResourceRouter, // Add here
});
```

### 3. Client Access

```typescript
import { trpc } from '@mirai-app/orpc/client';

// Available immediately
const { data } = trpc.myResource.list.useQuery();
```

## Batch Requests

```typescript
// Multiple procedures in one HTTP request
const [users, events] = await Promise.all([
  trpc.user.list.query(),
  trpc.event.list.query(),
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
// In packages/trpc
const v1Router = router({ user: userRouter });
const v2Router = router({ user: userV2Router });

export const appRouter = router({
  v1: v1Router,
  v2: v2Router,
});
```

Access: `/trpc/v1.user.list`, `/trpc/v2.user.list`

## Rate Limiting

### Implementation

```typescript
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});
```

## CORS Configuration

```typescript
import cors from '@fastify/cors';

await fastify.register(cors, {
  origin: ['https://mirai.app', 'http://localhost:19006'],
  credentials: true,
});
```

## Monitoring

### Health Check

```typescript
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});
```

### Metrics

```typescript
fastify.get('/metrics', async () => {
  return {
    requests: requestCount,
    errors: errorCount,
    latency: averageLatency,
  };
});
```

## Further Reading

- [oRPC HTTP Specification](https://trpc.io/docs/http-rpc-spec)
- [Fastify Routing](https://fastify.dev/docs/latest/Reference/Routes/)
