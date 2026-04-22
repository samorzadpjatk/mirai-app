# @mirai-app/backend-server - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

> **Backend-Specific Overrides**:
> - Uses Fastify 5.6.2 instead of Express
> - WebSocket support via @fastify/websocket
> - tRPC integration for type-safe APIs

## Purpose

Fastify HTTP server providing the REST and tRPC API for the MIRAI platform. Handles authentication, data persistence, and WebSocket connections for real-time features.

## Tech Stack

- **Framework**: Fastify 5.6.2
- **API**: tRPC 11.8.1
- **WebSocket**: @fastify/websocket
- **CORS**: @fastify/cors
- **Testing**: Vitest

## Key Files

```
apps/backend-server/
├── src/
│   ├── index.ts          # Server entry point
│   ├── server.ts         # Fastify server setup
│   ├── routes/           # HTTP routes
│   ├── trpc/             # tRPC router setup
│   └── websocket/        # WebSocket handlers
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
| `/trpc/*` | tRPC procedures |
| `/ws` | WebSocket endpoint |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `HOST` | Server host | 0.0.0.0 |
| `DATABASE_URL` | PostgreSQL URL | - |
| `SUPABASE_URL` | Supabase URL | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | - |

## Dependencies

### Internal

- `@mirai-app/trpc` - tRPC router

### External

- `fastify` - Web framework
- `@fastify/cors` - CORS handling
- `@fastify/websocket` - WebSocket support
- `@trpc/server` - tRPC server
- `ws` - WebSocket library

## Overrides to Root Conventions

1. **Uses Fastify** instead of typical Node.js frameworks
2. **WebSocket support** for real-time features
3. **Hot reload** via `bun --watch`
4. **Vitest** for testing instead of Jest

## Links

- [Setup guide](../../docs/apps/backend-server/setup.md)
- [tRPC Integration](../../docs/apps/backend-server/trpc.md)
- [API Structure](../../docs/apps/backend-server/api-structure.md)
- [Root AGENTS.md](../../AGENTS.md)
