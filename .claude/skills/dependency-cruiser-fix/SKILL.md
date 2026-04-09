# Skill: Fix Dependency-Cruiser Violations

> **How to resolve dependency-cruiser violations in monorepos after package consolidation**

---

## Quick Reference

### Common Violation Types

| Violation             | Cause                               | Solution                                                         |
| --------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| `not-to-unresolvable` | Import path doesn't resolve to disk | Fix package exports, install missing deps, or update import path |
| `no-orphans`          | Module not imported anywhere        | Remove dead code, add to exports, or add exclusion rule          |
| `no-circular`         | Circular dependency detected        | Refactor to break cycle, extract shared interface                |

### Useful Commands

```bash
# Run validation and see errors
bunx dependency-cruiser --validate .dependency-cruiser.mjs .

# Run with long output format
bunx dependency-cruiser --validate --output-type err-long .

# Generate dependency graph
bunx dependency-cruiser --output-type dot . | dot -T svg > deps.svg

# Check specific file
bunx dependency-cruiser --validate --output-type err-long packages/adapters/src/gateways/UserRepository.ts
```

---

## Fixing Unresolvable Imports

### Root Cause Analysis

Unresolvable imports typically occur when:

1. **Package exports not configured**: The package.json lacks proper `exports` field
2. **Workspace alias not set up**: Monorepo workspace packages aren't properly linked
3. **Build-time only modules**: Virtual modules (e.g., `astro:`) or path aliases (`~/*`)
4. **Missing dependencies**: Package not installed or incorrect version

### Solutions by Category

#### 1. Fix Package Exports

Check the exporting package's `package.json`:

```json
{
  "name": "@mirai-app/frameworks",
  "exports": {
    "./prisma": {
      "types": "./src/prisma/index.ts",
      "default": "./src/prisma/index.ts"
    },
    "./supabase": {
      "types": "./src/supabase/index.ts",
      "default": "./src/supabase/index.ts"
    }
  }
}
```

#### 2. Update Dependency-Cruiser Config

Add exclusions for known unresolvable patterns:

```javascript
// .dependency-cruiser.mjs
{
  name: "not-to-unresolvable",
  from: {
    pathNot: [
      "^apps/native/src",     // ~/* path aliases
      "^apps/web/src",        // @mirai-app/* imports
      "^apps/seed/src",       // Known workspace imports
    ],
  },
  to: {
    couldNotResolve: true,
    pathNot: [
      "^astro:",              // Astro virtual modules
      "^~",                   // Native app path alias
      "^@mirai-app/",         // Workspace packages
    ],
  },
}
```

#### 3. Fix Import Paths

Update imports to use correct paths:

```typescript
// ❌ Before (unresolvable)
import { prisma } from "@mirai-app/frameworks/prisma";

// ✅ After (fix by ensuring package exports)
// Or update to relative path if package not yet configured:
import { prisma } from "../../../packages/frameworks/src/prisma";
```

---

## Fixing Orphan Warnings

### Understanding Orphans

Orphan modules are files that aren't imported by any other module. They may be:

1. **Dead code**: No longer used, should be removed
2. **Entry points**: App entry files that shouldn't be imported
3. **Config files**: Build/runtime configuration
4. **Port/Interface files**: Repository ports or interfaces designed to be implemented
5. **Library models**: Type definitions for external libraries

### Solutions

#### Option 1: Remove Dead Code

```bash
# Delete unused files
rm packages/frameworks/src/prisma/lib/models/UnusedModel.ts
```

#### Option 2: Add to Exclusions

Update `.dependency-cruiser.mjs` to exclude legitimate orphans:

```javascript
{
  name: "no-orphans",
  from: {
    orphan: true,
    pathNot: [
      // Already excluded
      "\\.d\\.ts$",                          // Type declarations
      "^.*\\.config\\.(ts|js)$",             // Config files
      "__tests__",                           // Test directories
      "__mocks__",                           // Mock directories
      // Add new exclusions
      "packages/frameworks/src/prisma/lib/models/.*\\.ts$",  // Prisma models
      "apps/.*/(index|main)\\.(ts|tsx)$",     // Entry points
      "apps/.*/.*\\.config\\.(ts|js|cjs)$",  // App configs
      "happydom\\.ts$",                      // Test setup
    ],
  },
  to: {},
}
```

#### Option 3: Export from Package Index

If the orphan should be used but isn't exported:

```typescript
// packages/frameworks/src/index.ts
export * from "./prisma/lib/models";
```

---

## Monorepo-Specific Patterns

### Workspace Package Imports

```typescript
// Import from workspace packages
import { User } from "@mirai-app/domain";
import { CreateUserUseCase } from "@mirai-app/use-cases";
```

Ensure all workspace packages have proper `exports` in their `package.json`.

### Path Aliases

Native app uses `~/*` aliases. These need dependency-cruiser exclusions:

```javascript
// .dependency-cruiser.mjs
{
  name: "not-to-unresolvable",
  from: {
    pathNot: ["^apps/native/src"],
  },
  to: {
    couldNotResolve: true,
    pathNot: ["^~"],
  },
}
```

### Legacy Migration

During package consolidation from legacy names (`@mirai-app/*`) to new names (`@mirai-app/*`), temporary exclusions may be needed:

```javascript
// Allow legacy imports during migration
{
  from: {
    path: "^packages/frameworks/src",
  },
  to: {
    pathNot: "^@mirai-app/",
  },
}
```

---

## Best Practices

### 1. Fix Errors First, Warnings Second

```bash
# Focus on errors (unresolvable imports)
bunx dependency-cruiser --validate . 2>&1 | grep "error"

# Then address warnings (orphans)
bunx dependency-cruiser --validate . 2>&1 | grep "warn"
```

### 2. Verify After Each Fix

Run dependency-cruiser after each change to ensure the fix worked:

```bash
bunx dependency-cruiser --validate --output-type err-long . 2>&1 | head -20
```

### 3. Document Tech Debt

When adding exclusions for known issues, add comments:

```javascript
{
  name: "not-to-unresolvable",
  comment: "Allow path aliases in native app - tech debt: migrate to @mirai-app/",
  from: { pathNot: "^apps/native/src" },
  to: { pathNot: "^~" },
}
```

### 4. CI Integration

Always run dependency-cruiser in CI:

```yaml
# .github/workflows/ci.yml
- name: Validate Dependencies
  run: bunx dependency-cruiser --validate .dependency-cruiser.mjs .
```

---

## Resources

- **Dependency-Cruiser Docs**: https://github.com/sverweij/dependency-cruiser
- **Configuration Reference**: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- **Monorepo Patterns**: https://github.com/sverweij/dependency-cruiser/blob/main/doc/recipes.md#monorepos
