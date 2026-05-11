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

## Key Files

```
apps/backend-server/
├── src/
│   ├── index.ts          # Server entry point
│   ├── server.ts         # Hono server setup
│   ├── ws-adapter.ts     # oRPC WebSocket adapter wrapper
│   ├── config.ts         # Server configuration
│   └── routes/           # HTTP routes
├── package.json
└── AGENTS.md             # This file
```

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

## Dependencies

### Internal

- `@mirai-app/orpc` - oRPC router

### External

- `hono` - Web framework
- `@orpc/server` - oRPC server
- `@orpc/server/fetch` - oRPC fetch handler
- `@orpc/server/bun-ws` - Bun WebSocket oRPC handler

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
