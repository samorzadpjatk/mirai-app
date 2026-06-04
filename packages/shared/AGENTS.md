# @mirai-app/shared - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Shared utilities and design tokens used across all apps and packages in the MIRAI monorepo. Contains common helper functions, constants, and design system tokens.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./index.ts` | Shared utilities |
| `test-utils` | `./src/test-utils/index.ts` | Test helpers, factories, builders |
| `challenges` | `./src/challenges/index.ts` | Challenge query builders, validators |
| `groups` | `./src/groups/index.ts` | Group flattening, filters, permissions |
| `trips` | `./src/trips/index.ts` | Trip filters, leaderboard, query builders |
| `users` | `./src/users/index.ts` | User pagination, ban utils, validation |
| `coins` | `./src/coins/index.ts` | Coin builders, mappers, statistics |
| `feed` | `./src/feed/index.ts` | Activity feed filters and reactions |
| `notifications` | `./src/notifications/index.ts` | Notification delivery utilities |
| `rewards` | `./src/rewards/index.ts` | Reward progress calculation |
| `storage` | `./src/storage/index.ts` | Storage utilities |
| `stores` | `./src/stores/index.ts` | Zustand stores |
| `utils` | `./src/utils/index.ts` | General utilities |

See `index.ts` for all available exports.

## Tech Stack

- **State Management**: Jotai, Zustand
- **Integrations**: Jotai-Tanstack-Query
- **TypeScript**: Peer dependency

## Development Commands

```bash
# TypeScript check
bun run typecheck

# Lint
bun run lint

# Testing
bun run test
bun run test:coverage
bun run test:watch
```

## Dependencies

### External

- `jotai` - Atomic state management
- `jotai-tanstack-query` - Jotai integration with React Query
- `jotai-zustand` - Jotai integration with Zustand
- `zustand` - State management

### Peer Dependencies

- `typescript` ^5
- `react` ^19.0.0
- `@tanstack/react-query` ^5.0.0

## Code Quality Rules

### Pure Function Extraction

- **Pattern**: Domain logic from **any monorepo package or app** gets extracted into this package as pure functions with real-data tests.
- **Scope**: NOT limited to native hooks. Extract from `apps/native` hooks, `packages/orpc` routers, and any package with duplicated logic.
- **Directories**: `challenges/`, `coins/`, `feed/`, `groups/`, `notifications/`, `rewards/`, `storage/`, `trips/`, `users/`, `utils/` — each contains focused utilities with real-data test coverage.
- **Examples** (see `docs/conventions/testing.md` for full list):
  - `challenges/queryBuilders.ts` — `buildChallengeQueryInput`, `getNextChallengePageParam`
  - `feed/reactions.ts` — `toggleHeartSummary`, `emptyReactionSummary`
  - `trips/leaderboard.ts` — `calculateLeaderboardInfo`, `findUserGroup`
  - `users/banUtils.ts` — `parseBanStatus`, `isUserBanned`
- **Deduplication rule**: Before extracting, `grep` for similar logic across `apps/` and `packages/`. If the same transformation exists in 2+ places, extract once to `packages/shared` and import everywhere.
- **Coverage Target**: 100% real-data coverage for all pure functions. No mocks needed — pass real objects and assert on outputs.

See [Testing Conventions](./../../docs/conventions/testing.md) for full testing standards.

## Links

- [Utilities documentation](../../docs/packages/shared/utilities.md)
- [Root AGENTS.md](../../AGENTS.md)
