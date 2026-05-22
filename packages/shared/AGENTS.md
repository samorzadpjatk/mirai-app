# @mirai-app/shared - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Shared utilities and design tokens used across all apps and packages in the MIRAI monorepo. Contains common helper functions, constants, and design system tokens.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./index.ts` | Shared utilities |
| `design-tokens` | `./src/design-tokens/index.ts` | Design system tokens |
| `design-tokens/*` | `./src/design-tokens/*.ts` | Individual token files |

## Tech Stack

- **State Management**: Jotai, Zustand
- **Integrations**: Jotai-Tanstack-Query
- **TypeScript**: Peer dependency

## Key Files

```
packages/shared/
├── src/
│   ├── design-tokens/
│   │   ├── index.ts      # All tokens export
│   │   ├── colors.ts     # Color tokens
│   │   ├── spacing.ts    # Spacing tokens
│   │   └── typography.ts # Typography tokens
│   └── utils/
│       └── ...           # Utility functions
├── index.ts              # Main exports
└── AGENTS.md             # This file
```

## Development Commands

```bash
# TypeScript check
bun run typecheck

# Lint
bun run lint
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
- **Scope**: NOT limited to native hooks. Extract from:
  - `apps/native` hooks with mocked React Query tests
  - `packages/orpc` routers with inline data transformations
  - Any package where the same calculation appears in multiple places
- **Directories**: `feed/`, `trips/`, `challenges/`, `groups/` — each contains focused utilities with 100% real-data test coverage.
- **Examples**:
  - `feed/reactions.ts` — `toggleHeartSummary`, `emptyReactionSummary` (6 tests)
  - `feed/filters.ts` — `filterActivities` (7 tests)
  - `trips/flattenTrips.ts` — `flattenTrips` (6 tests)
  - `trips/leaderboard.ts` — `calculateLeaderboardInfo`, `findUserGroup` (10 tests)
  - `challenges/challengeMappers.ts` — `mapChallengeToListItem`, `countCompletedChallenges` (12 tests)
  - `groups/flattenGroups.ts` — `flattenGroups` (3 tests)
  - `groups/filters.ts` — `filterGroupsBySearch` (5 tests)
- **Deduplication rule**: Before extracting new functions, `grep` for similar logic across `apps/` and `packages/`. If the same transformation exists in 2+ places, extract once to `packages/shared` and import everywhere.
- **Rule**: When moving code from other packages to here, use type assertions (`as Type[]`) if types don't align exactly. Test import paths in `__tests__/` subdirectories must use `../module` not `./module` (Vite resolution rule).

### Store Tests

- **Rating**: `authStore.test.ts` is 4/5 — solid state transition coverage (initialize, sign-in, sign-out, refresh, auth state changes).
- **Rating**: `judgementStore.test.ts` is 1/5 — trivial state mutation tests. Confirms Zustand setters work, not domain logic.
- **Rule**: Remove runtime TypeScript interface tests (e.g., `expect(user.role).toBe(role)` after assignment). The TypeScript compiler already verifies this.

## Usage in Apps

```typescript
// Use design tokens
import { colors, spacing } from '@mirai-app/shared/design-tokens';

// Use utilities
import { formatDate } from '@mirai-app/shared';

// Use state management utilities
import { atomWithQuery } from '@mirai-app/shared';
```

## Links

- [Utilities documentation](../../docs/packages/shared/utilities.md)
- [Root AGENTS.md](../../AGENTS.md)
