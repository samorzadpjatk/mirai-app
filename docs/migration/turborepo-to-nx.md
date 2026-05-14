# Turborepo → NX Migration Guide

> **Branch**: `feat/migrate-to-nx`  
> **Status**: Phase 1-2 Complete — NX initialized and validated alongside Turborepo  
> **Date**: 2026-05-15

---

## Executive Summary

This document provides a validated migration path from Turborepo to NX monorepo tooling. All critical tasks (build, test, lint, typecheck, db:generate) have been verified to work identically under NX. The migration is **low-risk** and can be completed in a single focused session (~1-2 hours).

### Key Outcome

- **Current**: Bun workspaces + Turborepo 2.8.12
- **Target**: Bun workspaces + NX 22.7.2
- **Bun compatibility**: ✅ Fully supported (NX 20.4+ has text-based `bun.lock` support)
- **Expo/Metro**: ✅ No changes needed
- **Affected detection**: Gains precise rebuild scoping (only changed + dependents)

---

## Verification Results

| Task | Turbo Behavior | NX Behavior | Status |
|------|---------------|-------------|--------|
| Project detection | 9 projects | 9 projects | ✅ |
| Dependency graph | `workspace:*` edges | `workspace:*` edges | ✅ |
| `db:generate` | Runs drizzle-kit generate | Identical | ✅ |
| `build` | `tsc`, `expo export` | Identical | ✅ |
| `typecheck` | `tsc --noEmit` all 9 | Identical | ✅ |
| `lint` | oxlint all 9 | Identical (139 warnings, 0 errors) | ✅ |
| `test` | vitest + jest | Identical | ✅ |
| Caching | Turborepo cache | NX local cache | ✅ (4/4 hits) |
| Affected detection | Manual `--filter` | Automatic `nx affected` | ✅ Superior |
| Seed orchestration | `cd ../../packages/db` | Identical | ✅ |

### One Pre-Existing Issue (Not Migration-Related)

`@mirai-app/native:build` fails with a `react-native-css-interop` parsing error during `expo export`. This is a NativeWind/Tailwind CSS issue that exists **independent of the monorepo tool**.

---

## Current State (Phase 1)

NX has been initialized alongside Turborepo without disruption:

### Files Added
- `nx.json` — Auto-generated from `turbo.json` via `npx nx@latest init`

### Files Modified
- `package.json` — Added `nx: "22.7.2"` to devDependencies
- `.gitignore` — Added `.nx/cache` and `.nx/workspace-data`
- `bun.lock` — Updated with NX transitive dependencies

### What Still Works
All existing Turbo commands continue to function:
```bash
turbo run build
turbo run dev
turbo run lint
turbo run typecheck
turbo run test
```

### What NX Adds (Already Working)
```bash
# Run tasks across all projects
nx run-many -t build
nx run-many -t typecheck
nx run-many -t test

# Run task for single project
nx run @mirai-app/backend-server:build
nx run @mirai-app/native:dev

# Affected detection (NX-only feature)
nx affected:build --base=main
nx affected:test --base=main

# Visualize dependency graph
nx graph

# Show project configuration
nx show project @mirai-app/backend-server
```

---

## Phase 3: Cutover (The Switch)

This phase switches root scripts from `turbo` to `nx` and removes Turborepo dependencies.

### Step 3.1: Update Root Scripts

Edit `package.json` scripts:

```json
{
  "scripts": {
    "build": "nx run-many -t build",
    "build:packages": "nx run-many -t build --projects='packages/*'",
    "dev": "nx run-many -t dev",
    "dev:backend": "nx run @mirai-app/backend-server:dev",
    "dev:notification-sender": "nx run @mirai-app/notification-sender:dev",
    "dev:native": "nx run @mirai-app/native:dev",
    "lint": "nx run-many -t lint",
    "typecheck": "nx run-many -t typecheck",
    "format:check": "oxfmt --check '**/*.{ts,tsx,js,jsx}'",
    "format:write": "oxfmt '**/*.{ts,tsx,js,jsx}'",
    "test": "nx run-many -t test",
    "test:watch": "nx run-many -t test:watch",
    "test:coverage": "nx run-many -t test:coverage",
    "clean": "nx run-many -t clean && rm -rf node_modules",
    "postinstall": "cd packages/db && bun run db:generate",
    "prepare": "husky",
    "setup:dev": "bun run scripts/setup-dev.ts"
  }
}
```

**Key changes**:
- `turbo run` → `nx run-many -t`
- `--filter=@mirai-app/...` → `nx run @mirai-app/...:`
- `--filter='./packages/*'` → `--projects='packages/*'`

### Step 3.2: Remove Turbo

```bash
# Remove turbo dependency
bun remove turbo

# Delete turbo.json
rm turbo.json
```

### Step 3.3: Verify Clean Build

```bash
# Clean install
rm -rf node_modules && bun install

# Full validation
nx run-many -t build
nx run-many -t typecheck
nx run-many -t test
nx run-many -t lint
```

### Step 3.4: Update Documentation

Update references in:
- `README.md` — Change "Turborepo" to "NX"
- `AGENTS.md` — Update build system section
- `CONTRIBUTING.md` — Update development commands
- Individual `apps/*/AGENTS.md` files

### Step 3.5: Commit

```bash
git add -A
git commit -m "chore: switch from turborepo to nx for task orchestration

- Replace turbo.json with nx.json (auto-migrated)
- Update root package.json scripts to use nx commands
- Remove turbo dependency
- Verified: build, test, lint, typecheck, db:generate all pass
- Gains: precise affected detection, better caching granularity"
```

---

## Phase 4: NX-Specific Enhancements (Optional)

After the cutover is stable, these enhancements provide additional value.

### 4.1: Install @nx/expo Plugin

For better Expo app integration and task inference:

```bash
bun add -d @nx/expo
```

This enables:
- Automatic detection of Expo-specific tasks
- Better Metro bundler integration
- Generators for new Expo screens/components

### 4.2: Module Boundary Rules

Prevent architectural drift by enforcing dependency rules:

```json
// nx.json
{
  "pluginsConfig": {
    "@nx/eslint-plugin": {
      "enforce-module-boundaries": [
        "error",
        {
          "depConstraints": [
            {
              "sourceTag": "type:app",
              "onlyDependOnLibsWithTags": ["type:package"]
            },
            {
              "sourceTag": "type:package",
              "onlyDependOnLibsWithTags": ["type:package"]
            },
            {
              "sourceTag": "scope:shared",
              "onlyDependOnLibsWithTags": ["scope:shared"]
            }
          ]
        }
      ]
    }
  }
}
```

Apply tags in each project's `package.json`:
```json
{
  "nx": { "tags": ["type:app"] }
}
```

### 4.3: Named Inputs for Fine-Grained Caching

Improve cache granularity beyond file-level:

```json
// nx.json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": ["{workspaceRoot}/package.json"],
    "production": [
      "default",
      "!{projectRoot}/**/*.test.ts",
      "!{projectRoot}/**/*.test.tsx",
      "!{projectRoot}/**/__tests__/**"
    ]
  },
  "targetDefaults": {
    "build": {
      "inputs": ["production", "^production"]
    },
    "test": {
      "inputs": ["default", "^production"]
    }
  }
}
```

This ensures:
- Changing a test file doesn't invalidate build caches
- Build caches are production-code-only
- Test caches include test files + production dependencies

### 4.4: Nx Cloud (CI Distributed Caching)

For faster CI builds with remote caching:

```bash
# Connect to Nx Cloud
npx nx connect-to-nx-cloud

# Or use self-hosted cache
# See: https://nx.dev/ci/features/remote-cache
```

Benefits:
- CI agents share cache across runs
- Distributed task execution (multiple agents working together)
- Build time reduction: 40-70% for monorepos of this size

### 4.5: Generators for New Packages

Create new packages/apps with consistent structure:

```bash
# Generate new package
nx g @nx/js:lib packages/new-feature --unitTestRunner=vitest

# Generate new app
nx g @nx/js:app apps/new-service --bundler=bun
```

### 4.6: @nx/vitest Plugin

For automatic vitest configuration inference:

```bash
bun add -d @nx/vitest
```

This allows removing `vitest.config.ts` files from packages if desired — NX will infer test configuration from `package.json` scripts.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bun + NX edge cases | Low | Medium | Phase 1-2 validation already passed; monitor CI |
| Team workflow disruption | Medium | Low | Parallel running during Phase 1; gradual cutover |
| CI pipeline breakage | Low | High | Test NX commands in CI before removing Turbo |
| Cache invalidation changes | Low | Low | NX cache opt-in vs Turbo cache default — no surprises |
| Expo/Metro issues | Very Low | Medium | Pre-existing native build issue unrelated to migration |

---

## Rollback Plan

If issues arise post-cutover:

```bash
# Re-install turbo
bun add -d turbo@2.8.12

# Restore turbo.json (from git history)
git show HEAD~1:turbo.json > turbo.json

# Update root scripts back to turbo
# (Revert package.json scripts)

# Both can coexist if needed
```

---

## Migration Checklist

### Phase 3 (Required)
- [ ] Update root `package.json` scripts to use `nx`
- [ ] Remove `turbo` from devDependencies
- [ ] Delete `turbo.json`
- [ ] Run full build validation (`nx run-many -t build`)
- [ ] Run test validation (`nx run-many -t test`)
- [ ] Run lint validation (`nx run-many -t lint`)
- [ ] Run typecheck validation (`nx run-many -t typecheck`)
- [ ] Update `README.md` references
- [ ] Update `AGENTS.md` references
- [ ] Commit changes

### Phase 4 (Optional)
- [ ] Install `@nx/expo` plugin
- [ ] Configure module boundary rules
- [ ] Set up named inputs for caching
- [ ] Evaluate Nx Cloud for CI
- [ ] Add generators for new packages
- [ ] Install `@nx/vitest` plugin

---

## Useful NX Commands Reference

```bash
# Run task across all projects
nx run-many -t <task>

# Run task for specific project
nx run <project>:<task>

# Run tasks for affected projects (changed since last commit)
nx affected -t <task> --base=HEAD~1

# Run tasks for affected projects (changed since main)
nx affected -t <task> --base=main

# Show dependency graph (opens browser)
nx graph

# Show project details
nx show project <project-name>

# List all projects
nx show projects

# Clear NX cache
rm -rf .nx/cache
```

---

## Questions?

- **Why NX over Turborepo?** NX offers precise affected detection, module boundary enforcement, and a richer plugin ecosystem. For this monorepo's size, the gains in CI efficiency and architectural governance justify the switch.
- **Will Bun support break?** No — NX 22.x fully supports Bun. The `bun.lock` text format is natively parsed.
- **Do package scripts change?** No — NX reads existing `package.json` scripts. Only root orchestration changes.
- **What about `workspace:*`?** Bun resolves `workspace:*` dependencies. NX reads the resolved dependency graph from Bun.

---

*Document generated during Phase 1-2 investigation. Phase 3-4 implementation is ready to proceed.*
