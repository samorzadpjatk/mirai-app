# @mirai-app/backend-server - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

> **Backend-Specific Overrides**:
> - Uses Hono 4.x instead of Fastify
> - WebSocket support via Bun-native adapter
> - oRPC integration for type-safe APIs

## Purpose

Hono HTTP server providing the REST and oRPC API for the MIRAI platform. Handles authentication, data persistence, and WebSocket connections for real-time features.

## Tech Stack

- **Framework**: Hono 4.12.18
- **API**: oRPC 1.14.2
- **WebSocket**: Bun native WebSocket via `@orpc/server/bun-ws`
- **CORS**: `hono/cors` (built-in)
- **Testing**: Vitest

## Development Commands

```bash
# Start dev server with hot reload
bun run dev

# Start production server
bun run start

# Code quality
bun run lint
bun run typecheck
bun run check      # lint + typecheck

# Testing
bun run test
bun run test:watch
bun run test:ui
```

## Startup Behavior

On startup, the server automatically:
1. Runs pending Drizzle database migrations (idempotent)
2. Starts the HTTP/WebSocket server

This replaces the previously separate `db-migrations` Docker service. Migration SQL files are bundled into the Docker image at `/drizzle` (configurable via `MIGRATIONS_FOLDER` env var).

## Server Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `/api/trpc/*` | oRPC procedures (HTTP + WebSocket) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TRPC_SERVER_PORT` | Server port | - |
| `TRPC_SERVER_HOST` | Server host | - |
| `DATABASE_URL` | PostgreSQL URL | - |
| `SUPABASE_URL` | Supabase URL | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | - |
| `MIGRATIONS_FOLDER` | Path to Drizzle migration SQL files | `/drizzle` |

## Dependencies

### Internal

- `@mirai-app/orpc` - oRPC router
- `@mirai-app/db` - Drizzle client, schema, and `runMigrations`

### External

- `hono` - Web framework
- `@orpc/server` - oRPC server
- `@orpc/server/fetch` - oRPC fetch handler
- `@orpc/server/bun-ws` - Bun WebSocket oRPC handler

## Server-Specific Quality Rules

### Structured Logging

- **Rule**: Replace `console.*` with structured logging.

### WebSocket Testing Gap

- **Warning**: WebSocket connection init, auth handshake, and reconnection logic have minimal automated test coverage.
- **Action**: Add integration tests for the full WebSocket lifecycle.

See [Testing Conventions](./../../docs/conventions/testing.md) for testing standards.

### Testing Hard Rules

- **Never mock Drizzle ORM**. Use PGLite for real database integration tests. Mocked ORM has no real transaction semantics, foreign key validation, or rollback behavior.
- **Never mock oRPC client or TanStack React Query**. Use MSW to intercept real HTTP requests. Mocked API tests verify the mock, not the code.
- **Exception**: `__mocks__/` for native modules that cannot be tested with real implementations.

### Side Effects at Module Level

- **Avoid**: Setting up global handlers or singletons at module import time.
- **Status**: ✅ Fixed. `rateLimitStore` moved to factory inside `createServer()`.
- **Rule**: Explicit initialization via `createServer()` or `main()` functions only.

## Overrides to Root Conventions

1. **Uses Hono** instead of Fastify or Express
2. **Bun-native WebSocket** for real-time features
3. **Hot reload** via `bun --watch`
4. **Vitest** for testing instead of Jest

## Links

- [Setup guide](../../docs/apps/backend-server/setup.md)
- [oRPC Integration](../../docs/apps/backend-server/orpc.md)
- [API Structure](../../docs/apps/backend-server/api-structure.md)
- [Root AGENTS.md](../../AGENTS.md)
