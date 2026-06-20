---
title: Convert Biome lint warnings to errors one type at a time
created: 2026-06-04
phase: planned
---

## Initial User Prompt

Make an analysis and plan of making current lint warning errors one type at the time - search the web and official docs on best practices

## Description

Systematically convert all 204 Biome lint warnings across the MIRAI monorepo to errors, one rule type at a time. Follow the "one rule at a time" principle to keep PRs focused and reviewable. Start with zero-violation rules for immediate wins, then tackle easy auto-fixable rules, medium-complexity rules, and finally the hard rules (noExplicitAny with 136 violations).

## Current State

- **Linter**: Biome 1.9.4 (not ESLint) via `nx run-many -t lint`
- **Config**: Single root `biome.json` — no package-level overrides
- **Total warnings**: 204 across 5 packages
- **Rules at `warn`**: 23 rules total
- **Zero-violation rules**: 16 (can flip immediately)
- **Rules with violations**: 7 (need code fixes)

## Warning Inventory

| Rule | Category | Count | Packages | Effort |
|------|----------|-------|----------|--------|
| `noExplicitAny` | suspicious | 136 | orpc (120+), shared (15), native (1) | 🔴 Hard |
| `noNonNullAssertion` | style | 38 | orpc (14), native (8), seed (8), shared (3), db (2) | 🟡 Medium |
| `useExhaustiveDependencies` | correctness | 10 | native (10) | 🟡 Medium |
| `noForEach` | complexity | 10 | orpc (5), shared (4), native (1) | 🟢 Easy |
| `noArrayIndexKey` | suspicious | 5 | native (5) | 🟢 Easy |
| `noEmptyBlockStatements` | suspicious | 4 | db (2), seed (2) | 🟢 Easy |
| `noStaticOnlyClass` | complexity | 1 | orpc (1) | 🟢 Easy |

## Execution Plan

### Phase 0: Immediate Wins (Zero Violations)
**Goal**: Flip 16 rules to `error` with zero code changes.
**Rules**: `noUselessTernary`, `noUnusedVariables`, `noUnusedImports`, `noUnusedPrivateClassMembers`, `useSemanticElements`, `noImplicitBoolean`, `noNegationElse`, `useCollapsedElseIf`, `useForOf`, `useShorthandArrayType`, `useNodejsImportProtocol`, `noConsoleLog`, `noDoubleEquals`, `noExtraNonNullAssertion`, `noGlobalIsNan`, `noRedundantUseStrict`
**Files**: `biome.json` only
**Verification**: `bun run lint` passes immediately
**PR**: #1

### Phase 1: Easy Fixes (Auto-fixable or Simple)

#### Step 1: `noStaticOnlyClass` (1 violation)
- File: `packages/orpc/src/services/NotificationService.ts`
- Action: Convert static class to module-level functions
- Verification: `bun run lint` passes
- PR: #2

#### Step 2: `noEmptyBlockStatements` (4 violations)
- Files: `packages/db/src/migrate.ts`, `packages/db/src/seed.ts`, `apps/seed/src/rewards.ts`, `apps/seed/src/config/env.ts`
- Action: Remove empty blocks or add `// biome-ignore` with justification
- Verification: `bun run lint` passes
- PR: #2 (combined with Step 1)

#### Step 3: `noArrayIndexKey` (5 violations)
- Files: `apps/native/src/trips/info.tsx`, `AdminRewardsModal.tsx`, `ChallengeCard.tsx`, etc.
- Action: Use stable data IDs instead of array index as React key
- Verification: `bun run lint` + manual check of React rendering
- PR: #3

#### Step 4: `noForEach` (10 violations)
- Files: `packages/common/src/notifications/deliveryUtils.ts`, `packages/orpc/src/utils/notificationTemplates.ts`, `apps/native/src/map/index.tsx`
- Action: Convert `forEach` to `for...of` (many auto-fixable)
- Command: `bunx biome check . --write --max-diagnostics=1000`
- Verification: `bun run lint` + tests
- PR: #3 (combined with Step 3)

### Phase 2: Medium Complexity

#### Step 5: `useExhaustiveDependencies` (10 violations)
- Package: `apps/native` only
- Files: `vote/[id].tsx`, `map/index.tsx`, `profile/edit.tsx`, `trips/info.tsx`, `JudgementContent.tsx`, `CardStack.tsx`, `ProfileHeader.tsx`, `challenges/[id].tsx`, `PhotoCaptureModal.tsx`, `UserAvatar.tsx`
- Action: Add missing dependencies to `useEffect`/`useCallback` hooks, or suppress with `// biome-ignore` if intentional
- **Warning**: This prevents React bugs. Highest-value rule.
- Verification: `bun run lint` + native tests + manual QA
- PR: #4

### Phase 3: Large Cleanup

#### Step 6: `noNonNullAssertion` (38 violations)
- Packages: orpc (14), native (8), seed (8), shared (3), db (2)
- Action: Replace `!` with proper null checks or type guards
- Strategy: Tackle one package per sub-step
- Verification: `bun run lint` + tests for each package
- PR: #5 (shared + db), #6 (native + seed), #7 (orpc)

### Phase 4: The Big One

#### Step 7: `noExplicitAny` (136 violations)
- Packages: orpc (120+), shared (15), native (1)
- Action: Replace `any` with `unknown`, specific types, or proper generics
- Strategy:
  1. `packages/common` (15 violations) — foundational, affects all packages
  2. `apps/native` (1 violation) — quick win
  3. `packages/orpc` (120+ violations) — split into 3 PRs
- Use `// biome-ignore` with TODO for genuinely dynamic data (API responses)
- Verification: `bun run lint` + `bun run typecheck` + all tests
- PR: #8 (shared + native), #9 (orpc part 1), #10 (orpc part 2), #11 (orpc part 3)

## Per-Package Impact

| Package | Current | After |
|---------|---------|-------|
| `packages/orpc` | 143 | 0 |
| `apps/native` | 30 | 0 |
| `packages/common` | 19 | 0 |
| `apps/seed` | 9 | 0 |
| `packages/db` | 3 | 0 |
| **Total** | **204** | **0** |

## Workflow for Each Rule

1. **Change rule** to `"error"` in `biome.json`
2. **Auto-fix** where possible: `bunx biome check . --write --max-diagnostics=1000`
3. **Manual fix** remaining violations
4. **Verify** with `bun run lint`
5. **Verify** with `bun run test` for affected packages
6. **Verify** with `bun run typecheck` for affected packages
7. **Commit** as a single rule-focused PR

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `noExplicitAny` in orpc is massive (120+) | Split into 3 PRs; use `// biome-ignore` with TODOs for edge cases |
| `useExhaustiveDependencies` might introduce runtime bugs | Test each changed hook manually; add `// biome-ignore` if intentional |
| `noNonNullAssertion` in React components might change UX | Add runtime type guards rather than just `?.` chains |
| Large PRs disrupt team | Keep PRs ≤20 files; merge quickly; communicate in advance |

## Priority Recommendation

If you want maximum impact with minimum effort:
1. **Phase 0** (immediate) — 16 rules, 0 code changes
2. **`useExhaustiveDependencies`** (Phase 2) — 10 violations, highest bug-prevention value
3. **`noArrayIndexKey` + `noForEach`** (Phase 1) — 15 violations, easy React fixes
4. **`noEmptyBlockStatements` + `noStaticOnlyClass`** (Phase 1) — 5 violations, trivial
5. **`noNonNullAssertion`** (Phase 3) — 38 violations
6. **`noExplicitAny`** (Phase 4) — 136 violations, save for last

## Next Action

Ready to execute Phase 0 immediately (flipping 16 zero-violation rules to `error` in `biome.json`).

---

## Status Log

- **2026-06-04**: Task created and planned. 204 warnings identified across 7 rules.
