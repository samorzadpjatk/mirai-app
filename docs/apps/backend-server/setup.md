# Backend Server Setup

## Overview

This guide covers setting up the Hono + oRPC backend server.

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
TRPC_SERVER_PORT=2022
TRPC_SERVER_HOST=0.0.0.0
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
├── server.ts          # Hono + oRPC server
├── config.ts          # Server configuration
└── __tests__/         # Tests
```

## Adding a Route

### HTTP Route

HTTP routes are defined directly on the Hono app in `src/server.ts`:

```typescript
// src/server.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.text("OK"));
```

### oRPC Procedure

oRPC procedures are added to routers in the `@mirai-app/orpc` package:

```typescript
// Add to packages/orpc/src/api/routers/my-router.ts
import { os } from "@orpc/server";

export const myRouter = os.route({
  hello: os.handler(() => "Hello World"),
});
```

Then add to the root router in `packages/orpc/src/api/root.ts`.

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
app.use("*", async (c, next) => {
  console.log(`→ ${c.req.method} ${c.req.url}`);
  await next();
});
```

## Environment Variables

The server uses these environment variables (from `src/config.ts`):

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 2022) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ALLOWED_ORIGINS` | No | CORS origins (dev only)

## Deployment

### Docker

```dockerfile
FROM oven/bun:1.3.13

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
TRPC_SERVER_PORT=2022
TRPC_SERVER_HOST=0.0.0.0
DATABASE_URL=postgresql://...
```

## Further Reading

- [Hono Documentation](https://hono.dev/)
- [oRPC Documentation](https://orpc.unnoq.com/)
- [oRPC Server](https://orpc.unnoq.com/docs/server)
