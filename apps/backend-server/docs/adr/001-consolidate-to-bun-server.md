# ADR 001: Consolidate to Single Bun Server Implementation

## Status

**Accepted** — 2026-04-15

## Context

The backend-server package had multiple server implementations:

1. **Bun Server** (`bun-server.ts`) — Native Bun WebSocket server (738 lines)
2. **Hono Server** (`hono-server.ts`) — Node.js HTTP server via @hono/node-server (441 lines)
3. **Legacy tRPC Server** (`server.ts`) — Deprecated, only threw errors (27 lines)
4. **Legacy Config** (`config.ts`) — Deprecated mapping to Hono config (23 lines)

This created:

- **Code duplication**: Error handlers, middleware, and health check endpoints duplicated
- **Cognitive overhead**: Developers had to understand multiple server patterns
- **Maintenance burden**: Changes required updates in multiple places
- **Confusion**: Multiple entry points (`index.ts`, `index-hono.ts`) and exports

## Decision

Consolidate to a **single Bun server implementation** (`bun-server.ts`) and remove all alternatives.

### Rationale

1. **Production Reality**: Only Bun server was used in production
2. **WebSocket Support**: Bun provides native WebSocket support needed for GraphQL subscriptions
3. **Performance**: Bun outperforms Node.js for this use case
4. **Simplification**: Single code path reduces bugs and maintenance

### Changes

| Action  | File                                            | Lines Removed                       |
| ------- | ----------------------------------------------- | ----------------------------------- |
| Delete  | `server.ts`                                     | 27                                  |
| Delete  | `config.ts`                                     | 23                                  |
| Delete  | `hono-server.ts`                                | 441                                 |
| Rename  | `index-hono.ts` → `server-bootstrap.ts`         | —                                   |
| Rename  | `hono-server.test.ts` → `server-config.test.ts` | —                                   |
| Extract | Shared `error-handler.ts`                       | — (30 lines deduplicated)           |
| Update  | `effect-server.ts`                              | Remove HonoServer references        |
| Update  | `index.ts`                                      | Remove createHonoServerLayer export |
| Update  | `package.json`                                  | Update scripts and description      |

**Total Waste Removed: ~1,229 lines**

## Consequences

### Positive

- **Reduced complexity**: Single server implementation to understand
- **Less code**: ~1,200 fewer lines to maintain
- **Clear entry point**: `server-bootstrap.ts` is the single source of truth
- **Better testing**: No need to test multiple server implementations
- **Faster builds**: Less code to compile

### Negative

- **Loss of Node.js compatibility**: Bun is now required (already the case)
- **Migration work**: Tests and imports needed updating (completed)

## Alternatives Considered

1. **Keep Hono server as fallback**: Rejected — adds complexity without benefit
2. **Extract shared base class**: Rejected — over-engineering for current needs
3. **Keep deprecated files**: Rejected — creates permanent technical debt

## References

- Kaizen Muda Analysis: `/kaizen:analyze "Waste on apps/backend-server"`
- Related PR: Waste removal initiative
