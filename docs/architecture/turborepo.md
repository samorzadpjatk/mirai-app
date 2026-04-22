# Turborepo Configuration

## Overview

Turborepo orchestrates tasks across the monorepo, handling caching, parallelization, and task dependencies.

## Configuration File

The main configuration is in `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".astro/**"]
    },
    "clean": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "format:check": {
      "outputs": []
    },
    "format:write": {
      "outputs": []
    }
  }
}
```

## Task Definitions

### `build`

- **dependsOn**: `^build` - Must build all upstream dependencies first
- **outputs**: `dist/**`, `.astro/**` - Artifacts to cache

### `dev`

- **cache**: `false` - Never cache dev servers
- **persistent**: `true` - Keeps running until stopped

### `lint`, `typecheck`

- **dependsOn**: `^lint`, `^typecheck` - Run after dependencies pass
- **outputs**: `[]` - No artifacts to cache

### `test`

- **outputs**: `coverage/**` - Cache coverage reports

### `clean`

- **outputs**: `[]` - No caching

## Dependency Graph

```
packages/shared
     │
     ▼
packages/auth ──┐
                ├──→ packages/trpc
packages/db ────┤      │
                │      ├──→ apps/native (client)
packages/supabase─┘      │
                         ├──→ apps/backend-server
                         └──→ apps/notification-sender
```

## Pipeline Execution Order

### Build Pipeline

```
1. Build packages/shared
2. Build packages/auth, packages/db, packages/supabase (parallel)
3. Build packages/trpc
4. Build apps/* (parallel)
```

### Dev Pipeline

```bash
# Start all dev servers
turbo run dev

# Start specific app
turbo run dev --filter=@mirai-app/backend-server
```

## Caching Strategy

### What Gets Cached

- Build outputs (`dist/`, `.astro/`)
- Test coverage reports (`coverage/`)

### What Doesn't Get Cached

- Dev servers (`dev` task)
- Lint results (fast to re-run)

### Cache Invalidation

Cache is invalidated when:
- Source files change
- Dependencies change
- Configuration changes

## Common Commands

| Command | Description |
|---------|-------------|
| `turbo run build` | Build all packages and apps |
| `turbo run build --filter=@mirai-app/native` | Build only native app and its dependencies |
| `turbo run dev` | Start all dev servers |
| `turbo run lint` | Lint all packages |
| `turbo run typecheck` | Type-check all packages |
| `turbo run test` | Run all tests |
| `turbo run clean` | Clean all build artifacts |

## Best Practices

1. **Use `--filter`**: Limit scope to save time
2. **Don't cache `dev`**: Dev servers should always restart fresh
3. **Define outputs**: Always specify what to cache for build tasks
4. **Respect dependencies**: Use `^task` to ensure upstream work completes first

## Troubleshooting

### Cache Issues

```bash
# Clear all caches
turbo run clean
rm -rf .turbo

# Run without cache
turbo run build --force
```

### Task Hangs

If `turbo run dev` hangs:
```bash
# Run without daemon
turbo run dev --no-daemon
```
