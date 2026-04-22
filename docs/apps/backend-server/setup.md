# Backend Server Setup

## Overview

This guide covers setting up the Fastify + tRPC backend server.

## Prerequisites

- Bun 1.3.6+
- PostgreSQL database
- Supabase project (optional, for auth)

## Installation

### 1. Install Dependencies

```bash
cd apps/backend-server
bun install
```

### 2. Environment Configuration

Create environment file:

```bash
# From project root
cp environment/.env.dev.example environment/.env.dev
```

Required variables:
```bash
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Database Setup

Run migrations from seed app:

```bash
cd apps/seed
bun run db:migrate:dev
```

## Running the Server

### Development

```bash
bun run dev
```

Server starts at http://localhost:3000 with hot reload.

### Production

```bash
bun run build
bun run start
```

## Server Structure

```
src/
├── index.ts           # Entry point
├── server.ts          # Fastify instance
├── context.ts         # tRPC context
├── routers/           # tRPC routers
│   ├── index.ts       # Root router
│   └── ...
└── plugins/           # Fastify plugins
```

## Adding a Route

### HTTP Route

```typescript
// src/routes/health.ts
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });
}
```

Register in server:
```typescript
// src/server.ts
import healthRoute from './routes/health';

await fastify.register(healthRoute);
```

### tRPC Procedure

```typescript
// Add to packages/trpc/src/routers/my-router.ts
import { router, publicProcedure } from '../trpc';

export const myRouter = router({
  hello: publicProcedure.query(() => 'Hello World'),
});
```

## Testing

### Run Tests

```bash
bun run test
```

### Test Example

```typescript
// src/test/mytest.test.ts
import { test, expect } from 'vitest';

test('health check', async () => {
  const response = await fetch('http://localhost:3000/health');
  expect(response.status).toBe(200);
});
```

## Debugging

### VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "bun",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/apps/backend-server/src/index.ts"
    }
  ]
}
```

### Console Logging

```typescript
fastify.addHook('onRequest', async (request) => {
  console.log(`→ ${request.method} ${request.url}`);
});
```

## Performance Tuning

### Connection Pooling

```typescript
// Use pgBouncer in production
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Response Caching

```typescript
fastify.get('/api/data', {
  schema: {
    response: {
      200: {
        type: 'object',
      }
    }
  }
}, async (request, reply) => {
  reply.header('Cache-Control', 'public, max-age=60');
  return data;
});
```

## Deployment

### Docker

```dockerfile
FROM oven/bun:1.3.6

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
```

### Environment Variables

Ensure these are set in production:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
```

## Further Reading

- [Fastify Documentation](https://fastify.dev/)
- [tRPC Server](https://trpc.io/docs/server/introduction)
