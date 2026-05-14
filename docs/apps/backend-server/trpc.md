# oRPC Integration

## Overview

The backend server integrates oRPC with Fastify for type-safe APIs.

## Setup

### Fastify Plugin

```typescript
// src/trpc.ts
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from '@mirai-app/orpc';
import { createContext } from './context';

export default async function (fastify: FastifyInstance) {
  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });
}
```

### Context Creation

```typescript
// src/context.ts
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { createDb } from '@mirai-app/db';

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  // Get user from auth header
  const user = await getUserFromHeader(req);
  const db = createDb(process.env.DATABASE_URL!);

  return {
    req,
    res,
    db,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

## Router Integration

### Using Package Routers

```typescript
// src/trpc.ts
import { appRouter } from '@mirai-app/orpc';

// The appRouter is already defined in packages/trpc
// No need to redefine here
```

### Extending Routers

If needed, you can extend the base router:

```typescript
// src/trpc.ts
import { router as baseRouter } from '@mirai-app/orpc';
import { serverRouter } from './routers/server';

const appRouter = baseRouter.merge('server', serverRouter);
```

## WebSocket with oRPC

### Setup

```typescript
// src/websocket.ts
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from '@mirai-app/orpc';

const wss = new WebSocketServer({ port: 3001 });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});
```

### Subscriptions

```typescript
// In packages/trpc router
onEvent: publicProcedure
  .subscription(async function* () {
    while (true) {
      yield await getNextEvent();
    }
  }),
```

## Error Handling

### Global Error Handler

```typescript
// src/trpc.ts
const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        timestamp: new Date().toISOString(),
      }
    };
  },
  onError: ({ error, path }) => {
    console.error(`Error in ${path}:`, error);
  }
});
```

## Middleware

### Auth Middleware

```typescript
// Applied in packages/trpc
export const protectedProcedure = publicProcedure
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: { ...ctx, user: ctx.user }
    });
  });
```

## Request Flow

```
Client Request
     │
     ▼
Fastify Server
     │
     ▼
TRPC Adapter
     │
     ▼
Procedure Handler
     │
     ▼
Drizzle/Database
```

## Testing oRPC

### Integration Test

```typescript
import { test, expect } from 'vitest';
import { appRouter } from '@mirai-app/orpc';
import { createContext } from './test-context';

const caller = appRouter.createCaller(await createContext());

test('create user', async () => {
  const user = await caller.user.create({
    email: 'test@example.com',
    name: 'Test User'
  });
  
  expect(user.email).toBe('test@example.com');
});
```

## Best Practices

1. **Keep routers in packages/trpc** - Share between client and server
2. **Use context for dependencies** - Drizzle client, auth, etc.
3. **Return early on errors** - Don't process invalid requests
4. **Log errors** - But don't leak details to client

## Further Reading

- [oRPC Fastify Adapter](https://trpc.io/docs/server/adapters/fastify)
- [oRPC WebSocket](https://trpc.io/docs/subscriptions)
