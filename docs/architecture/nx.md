# Nx Configuration

## Overview

Nx orchestrates tasks across the monorepo, handling caching, parallelization, task dependencies, and affected project detection. Projects are discovered automatically from Bun workspace configuration (`package.json` workspaces field) — no `project.json` files needed.

## Configuration File

The main configuration is in `nx.json`:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "plugins": [
    "@nx/expo",
    {
      "plugin": "@nx/js/typescript",
      "options": {
        "typecheck": { "targetName": "typecheck" },
        "build": {
          "targetName": "build",
          "configName": "tsconfig.build.json",
          "buildDepsName": "build-deps",
          "watchDepsName": "watch-deps"
        }
      }
    },
    {
      "plugin": "@nx/eslint/plugin",
      "options": { "targetName": "lint" }
    },
    {
      "plugin": "@nx/vitest",
      "options": {
        "targetName": "test",
        "ciTargetName": "test:ci",
        "configName": "vitest.config.ts"
      }
    },
    {
      "plugin": "@nx/jest",
      "options": {
        "targetName": "test",
        "ciTargetName": "test:ci"
      }
    },
    {
      "plugin": "@nx-tools/nx-container",
      "options": { "targetName": "container" }
    },
    {
      "plugin": "@berenddeboer/nx-knip",
      "options": { "targetName": "knip" }
    }
  ],
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build", "db:generate"],
      "outputs": ["{projectRoot}/dist/**", "{projectRoot}/.astro/**"],
      "cache": true
    },
    "container": {
      "dependsOn": ["build"],
      "cache": true
    },
    "dev": {
      "dependsOn": ["db:generate"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^lint"],
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/coverage/**"],
      "cache": true
    },
    "knip": {
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": ["{workspaceRoot}/package.json", "{workspaceRoot}/nx.json"],
    "production": [
      "default",
      "!{projectRoot}/**/*.test.ts",
      "!{projectRoot}/**/*.test.tsx",
      "!{projectRoot}/**/__tests__/**",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/**/*.spec.tsx"
    ]
  }
}
```

## Plugins

Nx uses plugins to infer targets from project configuration automatically. No manual target definition in `project.json` is needed because this is a package-based Nx monorepo.

### `@nx/js` — TypeScript Project References

Inferred targets:
- `typecheck` — runs `tsc --noEmit` using `tsconfig.json`
- `build` — runs TypeScript compilation using `tsconfig.build.json`
- `build-deps` / `watch-deps` — handles project reference builds

### `@nx/eslint` — Lint Inference

Inferred target:
- `lint` — runs ESLint across the project based on `.eslintrc` / `eslint.config` presence

### `@nx/vitest` — Vitest Test Inference

Inferred targets:
- `test` — runs `vitest run`
- `test:ci` — runs vitest in CI mode

Active in packages that contain a `vitest.config.ts` file.

### `@nx/jest` — Jest Test Inference

Inferred targets:
- `test` — runs `jest`
- `test:ci` — runs jest in CI mode

Active in packages that contain a Jest configuration (such as `@mirai-app/native`).

### `@nx-tools/nx-container` — Docker Container Builds

Inferred target:
- `container` — builds a Docker image for the project

Used by:
- `apps/backend-server`
- `apps/notification-sender`
- `packages/db`

CI builds run with:
```bash
nx run-many -t container --configuration=ci
```

### `@berenddeboer/nx-knip` — Unused Dependency Detection

Inferred target:
- `knip` — runs `knip` to detect unused dependencies, exports, and files

## Target Defaults

Target defaults define how tasks behave across all projects. Key settings:

| Target | Depends On | Outputs | Cached |
|--------|-----------|---------|--------|
| `build` | `^build`, `db:generate` | `dist/**`, `.astro/**` | Yes |
| `container` | `build` | — | Yes |
| `dev` | `db:generate` | — | No |
| `lint` | `^lint` | — | Yes |
| `typecheck` | `^typecheck` | — | Yes |
| `test` | `^build` | `coverage/**` | Yes |
| `knip` | — | — | Yes |

The `^` prefix means "all upstream dependencies must complete this target first."

## Named Inputs

`namedInputs` control what files count as task inputs for cache hashing:

- **`default`**: All files in the project root plus shared globals
- **`sharedGlobals`**: Root `package.json` and `nx.json` — changes here affect all projects
- **`production`**: All files except test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`, `__tests__/**`)

This means changing a test file does not invalidate a build cache. Only production code changes do.

## Project Graph

Nx builds the project graph automatically by reading Bun workspace links. When `package.json` contains:

```json
{
  "dependencies": {
    "@mirai-app/db": "workspace:*"
  }
}
```

Nx creates a dependency edge from that project to `@mirai-app/db`. The graph is recomputed automatically when workspace links change.

Visualize the graph:
```bash
nx graph
```

### Dependency Graph

```
packages/common
     |
     ▼
packages/auth ──┐
                ├──→ packages/orpc
packages/db ────┤      |
                |      ├──→ apps/native (client)
packages/supabase─┘      |
                         ├──→ apps/backend-server
                         └──→ apps/notification-sender
```

## Pipeline Execution Order

### Build Pipeline

```
1. Build packages/common
2. Build packages/auth, packages/db, packages/supabase (parallel)
3. Build packages/orpc
4. Build apps/* (parallel)
```

### Dev Pipeline

```bash
# Start all dev servers
nx run-many -t dev

# Start specific app
nx run @mirai-app/backend-server:dev
```

## Caching Strategy

### Local Caching Only

Nx Cloud is explicitly disabled (`nxCloudAccessToken` is empty). All caching is local, stored in `.nx/cache`.

### What Gets Cached

- Build outputs (`dist/`, `.astro/`)
- Test coverage reports (`coverage/`)
- Lint and typecheck results
- Container build layers
- Knip analysis results

### What Doesn't Get Cached

- Dev servers (`dev` task has `cache: false`)

### Cache Invalidation

Cache is invalidated when:
- Source files in `namedInputs` change
- Upstream dependency outputs change
- Root configuration (`nx.json`, `package.json`) changes

Clear the cache:
```bash
rm -rf .nx/cache
```

## CI Pipeline

### Pull Requests

Run tasks only on affected projects:
```bash
nx affected -t build --base=main
nx affected -t test --base=main
nx affected -t lint --base=main
nx affected -t typecheck --base=main
```

### Main Branch

Run tasks across all projects:
```bash
nx run-many -t build
nx run-many -t test
nx run-many -t lint
nx run-many -t typecheck
```

### Docker Builds

```bash
nx run-many -t container --configuration=ci
```

## Common Commands

| Command | Description |
|---------|-------------|
| `nx run-many -t build` | Build all packages and apps |
| `nx run @mirai-app/native:build` | Build only the native app and its dependencies |
| `nx run-many -t dev` | Start all dev servers |
| `nx run-many -t lint` | Lint all packages |
| `nx run-many -t typecheck` | Type-check all packages |
| `nx run-many -t test` | Run all tests |
| `nx run-many -t clean` | Clean all build artifacts |
| `nx affected -t build --base=main` | Build only projects changed since `main` |
| `nx graph` | Open the project dependency graph |
| `nx show project @mirai-app/backend-server` | Show project configuration |

## Best Practices

1. **Use `nx affected` in CI**: Saves time by skipping unchanged projects
2. **Don't cache `dev`**: Dev servers should always restart fresh
3. **Define outputs**: Always specify what to cache for build tasks
4. **Respect dependencies**: Use `^task` to ensure upstream work completes first
5. **Keep `nx.json` minimal**: Let plugins infer targets from project configuration

## Troubleshooting

### Cache Issues

```bash
# Clear all caches
nx run-many -t clean
rm -rf .nx/cache

# Run without cache
nx run-many -t build --skip-nx-cache
```

### Task Hangs

If `nx run-many -t dev` hangs:
```bash
# Run without Nx daemon
NX_DAEMON=false nx run-many -t dev
```

### Project Not Found

If Nx can't find a project:
```bash
# Verify project is in a Bun workspace
nx show projects

# Check workspace is listed in root package.json
# Verify package name matches the import
```

## Further Reading

- [Nx Documentation](https://nx.dev)
- [Monorepo Architecture](./monorepo.md)
- [Bun Workspaces](./bun-workspaces.md)
