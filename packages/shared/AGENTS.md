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
