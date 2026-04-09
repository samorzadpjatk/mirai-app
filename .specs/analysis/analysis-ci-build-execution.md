# Codebase Impact Analysis: Enable CI Build and Test Execution

**Analysis Date:** 2026-04-09  
**Task:** Enable build and test execution after cyclic dependency fix  
**Analyst:** SDD Code Explorer Agent

---

## Executive Summary

The CI workflow is currently configured to run builds and tests, but the **cyclic dependency between `adapters` and `frameworks` packages prevents successful builds**. This analysis identifies the affected files, integration points, and required changes to enable CI builds.

### Cyclic Dependency Identified

```
adapters ──depends on──> frameworks
    ↑                      │
    └──────────────────────┘
    frameworks depends on adapters
```

**Evidence:**

- `packages/adapters/package.json` line 63: `"@mirai-app/frameworks": "workspace:*"`
- `packages/frameworks/package.json` line 77: `"@mirai-app/adapters": "workspace:*"`

---

## Affected Files

### Must Modify

| File                               | Purpose                 | Change Required                              |
| ---------------------------------- | ----------------------- | -------------------------------------------- |
| `packages/adapters/package.json`   | Adapter package deps    | Remove dependency on frameworks              |
| `packages/frameworks/package.json` | Frameworks package deps | Keep adapters dependency (correct direction) |
| `.github/workflows/ci.yml`         | CI workflow             | Add build step, verify execution order       |

### Verify/Update

| File                      | Purpose             | Check                      |
| ------------------------- | ------------------- | -------------------------- |
| `packages/*/package.json` | All package scripts | Ensure build scripts exist |
| Root `package.json`       | Workspace config    | Verify workspace patterns  |

---

## Package Structure

```
packages/
├── adapters/          → Should NOT depend on frameworks
├── frameworks/        → CAN depend on adapters (outermost layer)
├── domain/            → No dependencies (pure)
├── use-cases/        → Depends on domain only
├── shared/           → Shared utilities
└── test-utils/       → Test utilities
```

### Current Dependencies Analysis

| Package      | Currently Depends On          | Should Depend On              |
| ------------ | ----------------------------- | ----------------------------- |
| `domain`     | (none)                        | (none) ✓                      |
| `use-cases`  | domain                        | domain ✓                      |
| `adapters`   | domain, use-cases, frameworks | domain, use-cases             |
| `frameworks` | domain, use-cases, adapters   | domain, use-cases, adapters ✓ |

---

## Integration Points

### 1. Build Pipeline Integration

The CI workflow currently runs:

1. `bun install` - Install dependencies
2. `bun run lint` - ESLint checks
3. `bun run depcruise:check` - Dependency layer check
4. `bun run typecheck` - TypeScript type checking
5. `bun run test:unit` - Unit tests
6. `bun run test:integration` - Integration tests

**Missing:** Explicit `bun run build` step before tests.

### 2. Test Execution Order

Current CI job order:

```
build_test (lint, typecheck)
    ↓
test-unit
    ↓
test-integration
    ↓
test-native
```

**Issue:** No build step before test-unit. Tests may fail if imports reference unbuilt packages.

### 3. Package Build Scripts

All packages have build scripts:

- `bun run build` - Compiles TypeScript to dist/
- `bun run clean` - Removes dist/
- `bun run typecheck` - Type-only check

---

## Risk Assessment

### High Risk

1. **Cyclic Dependency Resolution Complexity**
   - Risk: Breaking changes in adapters that depend on frameworks
   - Impact: Code may break when dependency removed
   - Mitigation: Carefully audit all imports from frameworks in adapters

### Medium Risk

2. **Build Order Dependencies**
   - Risk: Packages may need specific build order
   - Impact: CI builds may fail intermittently
   - Mitigation: Use Bun workspace topological build

### Low Risk

3. **Test Dependencies**
   - Risk: Tests may have implicit build dependencies
   - Impact: Tests fail on fresh CI runs
   - Mitigation: Ensure build runs before tests

---

## Recommendations

### 1. Resolve Cyclic Dependency (CRITICAL)

**Option A: Remove frameworks dependency from adapters**

- Edit `packages/adapters/package.json`
- Remove `"@mirai-app/frameworks": "workspace:*"`
- Audit and refactor any code importing from frameworks

**Option B: Reorganize shared code**

- If adapters need utilities from frameworks, move to `shared` package
- Both can depend on `shared`

### 2. Add Build Step to CI (REQUIRED)

Add to `.github/workflows/ci.yml` before test jobs:

```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: oven-sh/setup-bun@v1
    - run: bun install
    - run: bun run build
```

Then make test jobs depend on build:

```yaml
test-unit:
  needs: build
  # ... rest of config
```

### 3. Verify Build in All Packages

Run locally to verify:

```bash
bun install
bun run build
bun run test:unit
bun run test:integration
```

---

## Expected Changes Summary

| Change                                  | Priority | Complexity | Estimated Time |
| --------------------------------------- | -------- | ---------- | -------------- |
| Remove adapters → frameworks dependency | P0       | Medium     | 2-4 hours      |
| Add build job to CI                     | P1       | Low        | 30 min         |
| Verify all builds pass                  | P1       | Low        | 30 min         |
| Update job dependencies                 | P2       | Low        | 15 min         |

---

## Scratchpad Reference

Working notes: `.specs/scratchpad/analysis-ci-[hex].md`

## Related Files

- Skill: `.claude/skills/ci-monorepo-builds/SKILL.md`
- Task: `.specs/tasks/draft/enable-build-test-execution.ci.md`
