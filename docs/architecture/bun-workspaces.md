# Bun Workspaces

## Overview

Bun workspaces enable code sharing across multiple packages and apps in the monorepo. Bun handles package management and workspace linking, while **Nx** orchestrates tasks (build, test, lint) with caching and parallelization. This document explains how Bun workspaces are configured and how to work with them.

## Configuration

Workspaces are defined in the root `package.json`:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

This tells Bun that any directory under `apps/` or `packages/` is a workspace.

## Workspace Protocol

### Adding Workspace Dependencies

Use `workspace:*` to reference local packages:

```json
{
  "dependencies": {
    "@mirai-app/orpc": "workspace:*",
    "@mirai-app/db": "workspace:*"
  }
}
```

### Installing Dependencies

```bash
# Install all dependencies across all workspaces
bun install

# Add dependency to root
bun add <package>

# Add dependency to specific workspace
bun add <package> --workspace=@mirai-app/native
```

## Package Naming Convention

All packages use the `@mirai-app/` scope:

- `@mirai-app/native` - Expo app
- `@mirai-app/backend-server` - API server
- `@mirai-app/orpc` - oRPC package
- `@mirai-app/db` - Database package
- etc.

## Dependency Management

### Lockfile

Bun uses `bun.lock` to lock dependency versions:

```bash
# Update lockfile after changing dependencies
bun install
```

### Hoisting

Common dependencies are hoisted to the root `node_modules`:

```
node_modules/
├── react/          # Hoisted (shared)
├── typescript/     # Hoisted (dev dependency)
└── packages/
    └── orpc/
        └── node_modules/
            └── @orpc/server/  # Package-specific
```

## Cross-Package Development

### Making Changes Across Packages

When you change a package, dependent packages need to be rebuilt:

```bash
# Change in packages/orpc
# Automatically rebuilds apps that depend on it
nx run-many -t build --projects='packages/orpc'
```

### Local Linking

Bun automatically links workspace packages:

```typescript
// In apps/native/some-file.ts
import { trpc } from '@mirai-app/orpc';
// Resolves to packages/orpc/src/index.ts
```

## Scripts in Workspaces

### Running Scripts

```bash
# Run script in all workspaces
nx run-many -t lint

# Run script in specific workspace
nx run @mirai-app/native:lint

# Run script from root
bun run --cwd apps/native lint
```

### Script Inheritance

Common scripts across workspaces:

```json
{
  "scripts": {
    "dev": "Start development server",
    "build": "Production build",
    "lint": "Run ESLint",
    "typecheck": "TypeScript check",
    "test": "Run tests",
    "clean": "Clean build artifacts"
  }
}
```

## Best Practices

1. **Use `workspace:*`**: Always use the workspace protocol for internal dependencies
2. **Keep versions in sync**: When publishing, keep workspace package versions aligned
3. **Avoid circular dependencies**: The dependency graph must be acyclic
4. **Update lockfile**: Run `bun install` after modifying any package.json

## Troubleshooting

### Module Not Found

If Bun can't find a workspace package:

```bash
# Reinstall dependencies
bun install

# Check workspace is listed in root package.json
# Verify package name matches import
```

### Hoisting Issues

If a package finds the wrong version:

```bash
# Clear node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules
bun install
```

## Further Reading

- [Bun Workspaces Documentation](https://bun.sh/docs/install/workspaces)
- [Monorepo Architecture](./monorepo.md)
- [Nx Configuration](./nx.md)
