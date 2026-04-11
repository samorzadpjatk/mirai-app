# Rename `@mirai-app/graphql-types` to `@mirai-app/graphql-client`

## Overview

This plan details the migration of the package name from `@mirai-app/graphql-types` to `@mirai-app/graphql-client` to better reflect its purpose as a client-side GraphQL SDK (not just types).

**Impact:** 149 references across 105 unique files  
**Risk Level:** Low (mechanical refactoring, no functional changes)  
**Estimated Time:** 30-45 minutes

---

## Current State Analysis

### Files Requiring Updates

| Category              | Count | Files                                                        |
| --------------------- | ----- | ------------------------------------------------------------ |
| Package manifests     | 5     | `packages/graphql-types/package.json`, `apps/*/package.json` |
| Source code (imports) | 90+   | Components, hooks, screens across web/native apps            |
| Documentation         | 10+   | `.specs/`, `docs/`, README files                             |
| Lockfile              | 1     | `bun.lock` (auto-regenerated)                                |

### Package Structure

```
packages/
├── graphql-types/          ← RENAME TO: graphql-client/
│   ├── src/
│   │   ├── index.ts
│   │   ├── generated/
│   │   └── graphql/
│   ├── package.json        ← UPDATE: name field
│   ├── README.md           ← UPDATE: references
│   └── codegen.ts
```

---

## Step-by-Step Implementation

### Phase 1: Package Directory Rename (5 min)

```bash
# Rename the directory
cd packages
mv graphql-types graphql-client

# Update package.json name field
sed -i '' 's/"@mirai-app\/graphql-types"/"@mirai-app\/graphql-client"/g' graphql-client/package.json
```

**Files to verify:**

- [ ] `packages/graphql-client/package.json` - name field
- [ ] `packages/graphql-client/README.md` - update references

### Phase 2: Update Consumer Package Dependencies (5 min)

Update `package.json` files in consuming apps:

| File                                    | Line to Change                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web/package.json`                 | `"@mirai-app/graphql-types": "workspace:*"` → `"@mirai-app/graphql-client": "workspace:*"` |
| `apps/native/package.json`              | `"@mirai-app/graphql-types": "workspace:*"` → `"@mirai-app/graphql-client": "workspace:*"` |
| `apps/seed/package.json`                | `"@mirai-app/graphql-types": "workspace:*"` → `"@mirai-app/graphql-client": "workspace:*"` |
| `apps/notification-sender/package.json` | `"@mirai-app/graphql-types": "workspace:*"` → `"@mirai-app/graphql-client": "workspace:*"` |

### Phase 3: Update Import Statements (15 min)

Replace all import statements across source files:

```typescript
// BEFORE
import { Something } from "@mirai-app/graphql-types";
import { SomethingElse } from "@mirai-app/graphql-types/urql";
import { Another } from "@mirai-app/graphql-types/sdk";

// AFTER
import { Something } from "@mirai-app/graphql-client";
import { SomethingElse } from "@mirai-app/graphql-client/urql";
import { Another } from "@mirai-app/graphql-client/sdk";
```

**Bulk replace command (use with caution):**

```bash
# Update regular imports
find apps packages -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  -exec sed -i '' 's/@mirai-app\/graphql-types/@mirai-app\/graphql-client/g' {} \;
```

**Affected directories (by count):**

- [ ] `apps/web/src/` - 45 files
- [ ] `apps/native/src/` - 50 files
- [ ] `apps/seed/src/` - 2 files
- [ ] `apps/notification-sender/src/` - 1 file

### Phase 4: Update Documentation (10 min)

Update documentation files to reference the new package name:

| File                                                 | Purpose               |
| ---------------------------------------------------- | --------------------- |
| `packages/graphql-client/README.md`                  | Package documentation |
| `docs/TRPC_TO_GRAPHQL_MIGRATION.md`                  | Migration guide       |
| `apps/web/src/docs/graphql-usage.md`                 | Usage documentation   |
| `.claude/skills/graphql-subscriptions-urql/SKILL.md` | Claude skill          |
| `.specs/plans/*.md`                                  | Architecture specs    |
| `.specs/tasks/done/*.md`                             | Completed tasks       |
| `.specs/tasks/in-progress/*.md`                      | Active tasks          |

### Phase 5: Regenerate Lockfile (2 min)

```bash
# Remove lockfile and reinstall
rm bun.lock
bun install
```

This will automatically update all workspace references.

### Phase 6: Verification (5 min)

```bash
# 1. Verify no old references remain
grep -r "@mirai-app/graphql-types" . --include="*.json" --include="*.ts" --include="*.tsx" --include="*.md" 2>/dev/null | grep -v ".git/" | grep -v "node_modules/" | grep -v "dist/"
# Should return empty

# 2. Type check all packages
bun run typecheck

# 3. Build the renamed package
cd packages/graphql-client && bun run build

# 4. Verify workspace dependencies
bun install --dry-run 2>&1 | grep -i "graphql-client"
```

---

## Rollback Plan

If issues are discovered:

```bash
# Revert directory name
cd packages
mv graphql-client graphql-types

# Restore from git
git checkout packages/graphql-types/
git checkout apps/*/package.json

# Regenerate lockfile
rm bun.lock && bun install
```

---

## Post-Migration Checklist

- [ ] All imports updated (zero references to old name)
- [ ] All package.json dependencies updated
- [ ] `bun.lock` regenerated successfully
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] `bun run build` passes for the renamed package
- [ ] No runtime errors in dev mode
- [ ] Documentation updated

---

## Success Criteria

1. ✅ Package directory renamed to `packages/graphql-client/`
2. ✅ Package name in `package.json` updated to `@mirai-app/graphql-client`
3. ✅ All workspace consumers updated
4. ✅ All import statements use new package name
5. ✅ All documentation references updated
6. ✅ CI/CD pipeline passes
7. ✅ No functional changes (pure refactoring)

---

## Alternative: Gradual Migration

If immediate full migration is too risky, consider:

### Option A: Package Alias (Temporary)

Add alias to root `package.json`:

```json
{
  "workspaces": ["packages/*", "apps/*"],
  "dependencies": {
    "@mirai-app/graphql-types": "workspace:./packages/graphql-client"
  }
}
```

This allows both names to work during transition.

### Option B: Deprecation Notice

1. Keep old package as thin re-export wrapper
2. Add deprecation JSDoc to all exports
3. Migrate consumers over time
4. Remove old package after all consumers migrated

---

## Implementation Command Summary

```bash
# 1. Rename directory
cd packages && mv graphql-types graphql-client

# 2. Update package name in package.json
sed -i '' 's/"name": "@mirai-app\/graphql-types"/"name": "@mirai-app\/graphql-client"/' graphql-client/package.json

# 3. Update README in package
sed -i '' 's/graphql-types/graphql-client/g' graphql-client/README.md

# 4. Update all consuming package.json files
for file in ../apps/*/package.json; do
  sed -i '' 's/@mirai-app\/graphql-types/@mirai-app\/graphql-client/g' "$file"
done

# 5. Update all source imports
find ../apps -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" \
  -exec sed -i '' 's/@mirai-app\/graphql-types/@mirai-app\/graphql-client/g' {} \;

# 6. Regenerate lockfile
cd .. && rm bun.lock && bun install

# 7. Verify
grep -r "@mirai-app/graphql-types" . --include="*.json" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".git/" | grep -v "node_modules/" | grep -v "dist/" | grep -v "bun.lock"
```

---

**Created:** 2026-04-11  
**Author:** OpenCode  
**Reviewers:** Pending
