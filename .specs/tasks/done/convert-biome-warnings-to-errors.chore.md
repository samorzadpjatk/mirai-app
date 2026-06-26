---
title: Convert Biome lint warnings to errors one type at a time
created: 2026-06-04
phase: done
---

## Initial User Prompt

Make an analysis and plan of making current lint warning errors one type at the time - search the web and official docs on best practices

## Description

Systematically convert all Biome lint warnings across the MIRAI monorepo to errors, one rule type at a time. Follow the "one rule at a time" principle to keep PRs focused and reviewable.

## Current State

- **Linter**: Biome 2.5.1 (was 1.9.4). Config auto-migrated with `bunx biome migrate --write` because the existing `biome.json` used deprecated/removed keys (`recommended`, `overrides[].include`, `noConsoleLog`, `useShorthandArrayType`).
- **Lint targets**: Every package uses `biome check .`
- **Diagnostics after migration** (2026-06-24, before any auto-fix):
  - **Errors**: 200 total
    - `assist/source/organizeImports`: 189 errors (legacy config `organizeImports.enabled: true` was migrated to the new `assist` action and now enforces sorting)
    - `lint/suspicious/noUnknownAtRules`: 6 errors (new recommended-preset rule after migration)
    - `lint/a11y/noSvgWithoutTitle`: 1 error (new recommended-preset rule after migration)
  - **Warnings**: 249 total across the following rules
    - `lint/style/noNegationElse`: 40
    - `lint/style/noNonNullAssertion`: 22
    - `lint/suspicious/noArrayIndexKey`: 8
    - `lint/complexity/noForEach`: 8
    - `lint/suspicious/noExplicitAny`: 9
    - `lint/correctness/noUnusedVariables`: 8
    - `lint/suspicious/noConsole`: 8
    - `lint/correctness/useExhaustiveDependencies`: 9
    - `lint/suspicious/useBiomeIgnoreFolder`: 10
    - `lint/suspicious/noPrototypeBuiltins`: 2
    - `lint/style/useNodejsImportProtocol`: 1
    - `lint/complexity/useDateNow`: 3
    - `lint/complexity/noStaticOnlyClass`: 1
  - **Infos**: 5
    - `lint/complexity/noUselessUndefinedInitialization`: 1
    - `lint/correctness/useParseIntRadix`: 4
- **Config file**: `biome.json`
- **Total warnings to eliminate**: 249 across ~13 rules (down from the original 204 because Biome 2.5.1 recommended preset differs from 1.9.4 and test files are ignored)

## Warning Inventory (after migration)

| Rule | Category | Current Count | Notes | Effort |
|------|----------|---------------|-------|--------|
| `noNegationElse` | style | 40 | New count after 2.5.1 migration | 🟢 Easy |
| `noNonNullAssertion` | style | 22 | Was 38 before migration/ignored tests | 🟡 Medium |
| `useExhaustiveDependencies` | correctness | 9 | Mostly `apps/native` hooks | 🟡 Medium |
| `noArrayIndexKey` | suspicious | 8 | React key fixes | 🟢 Easy |
| `noForEach` | complexity | 8 | Convert to `for...of` | 🟢 Easy |
| `noConsole` | suspicious | 8 | Replaces legacy `noConsoleLog`; semantics changed with `allow: ["log"]` | 🟢 Easy |
| `noUnusedVariables` | correctness | 8 | Was assumed zero; clean up unused identifiers | 🟢 Easy |
| `noExplicitAny` | suspicious | 9 | Far fewer than originally (136) because test files are ignored and the 2.5.1 rule is more focused | 🟢 Easy |
| `useBiomeIgnoreFolder` | suspicious | 10 | New recommended-preset rule; likely `node_modules` ignore comments | 🟢 Easy |
| `noPrototypeBuiltins` | suspicious | 2 | New recommended-preset rule | 🟢 Easy |
| `useNodejsImportProtocol` | style | 1 | Was assumed zero | 🟢 Easy |
| `useDateNow` | complexity | 3 | New recommended-preset rule | 🟢 Easy |
| `noStaticOnlyClass` | complexity | 1 | Single class in `packages/orpc` | 🟢 Easy |

## Execution Plan

> **Prerequisite**: `biome.json` has already been migrated to Biome 2.5.1 schema.

### Phase -1: Unblock `bun run lint`
**Goal**: Eliminate the 200 non-warning errors so the repo passes `biome check .` before we start flipping rules.
- Run `bunx biome check . --write` to auto-fix `assist/source/organizeImports` and any safe lint fixes.
- Manually fix remaining `noUnknownAtRules` and `noSvgWithoutTitle` errors (or suppress with `// biome-ignore` if accepted).
- Verify: `bun run lint` exits 0 with only warnings remaining.

### Phase 0: Immediate Wins (Zero Violations)
**Goal**: Flip rules with zero remaining violations to `error` in `biome.json`.
**Candidates after auto-fix** (verify before flipping):
- `noUselessTernary`
- `noUnusedImports`
- `noUnusedPrivateClassMembers`
- `useSemanticElements`
- `noImplicitBoolean`
- `useCollapsedElseIf`
- `useForOf`
- `useConsistentArrayType`
- `noExtraNonNullAssertion`
- `noGlobalIsNan`
- `noRedundantUseStrict`
- `noDoubleEquals`
- `noEmptyBlockStatements`

**Verification**: `bun run lint` passes immediately.

### Phase 1: Easy Auto/Safe Fixes
Handle rules that are mechanical and low-risk:
1. `noStaticOnlyClass` (1)
2. `noEmptyBlockStatements` (if any remain)
3. `noArrayIndexKey` (8)
4. `noForEach` (8)
5. `noNegationElse` (40) — usually an `if/else` inversion safe fix
6. `useNodejsImportProtocol` (1)
7. `noPrototypeBuiltins` (2)
8. `useDateNow` (3)
9. `useBiomeIgnoreFolder` (10)

### Phase 2: Medium Complexity
1. `noUnusedVariables` (8)
2. `useExhaustiveDependencies` (9) — requires React hook dependency review
3. `noConsole` (8) — decide log policy; may need `// biome-ignore` for intentional logs

### Phase 3: Type-Safety Cleanup
1. `noNonNullAssertion` (22)
2. `noExplicitAny` (9)

## Workflow for Each Rule

1. **Change rule** to `"error"` in `biome.json`.
2. **Auto-fix** where possible: `bunx biome check . --write --max-diagnostics=1000`.
3. **Manually fix** remaining violations.
4. **Verify** with `bun run lint`.
5. **Verify** with `bun run typecheck` for affected packages.
6. **Verify** with `bun run test` for affected packages.
7. **Commit** as a single rule-focused PR.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `useExhaustiveDependencies` might change runtime behavior | Test each changed hook; add `// biome-ignore` if intentional |
| `noNonNullAssertion` refactors may introduce undefined behavior | Replace with runtime type guards or `?.` chains, not just cast changes |
| `noExplicitAny` replacements could break callers | Prefer `unknown` + narrow; add explicit generic parameters |
| Large auto-fix batches (organizeImports) obscure review | Land Phase -1 as its own PR before any rule changes |
| New recommended-preset rules not in original plan | Document in this spec; fix or explicitly disable if not desired |

## Priority Recommendation

1. **Phase -1** — unblock lint, land mechanical import/organization fixes.
2. **Phase 0** — flip rules with zero violations.
3. **Phase 1** — tackle easy rules that Biome can mostly auto-fix.
4. **Phase 2** — `useExhaustiveDependencies` and `noConsole` with manual review.
5. **Phase 3** — `noNonNullAssertion` and `noExplicitAny` last.

## Next Action

Run `bunx biome check . --write` to clear the 189 `organizeImports` errors, then fix the remaining 11 non-warning errors (`noUnknownAtRules`, `noSvgWithoutTitle`). After that, flip the verified zero-violation rules to `error` in Phase 0.

---

## Status Log

- **2026-06-04**: Task created and planned. Original estimate: 204 warnings across 7 rules.
- **2026-06-24**: Task moved to in-progress. Discovered Biome is now 2.5.1 and `biome.json` was invalid; migrated config.
- **2026-06-24**: Phase -1 complete. `bunx biome check . --write` and config adjustments (CSS unknown at-rules, HTML interpolation, iOS Pods/ email-template ignores) cleared all errors. Lint now passes with 79 warnings and 4 infos.
- **2026-06-24**: Phase 0 complete. 13 zero-violation rules flipped to `error` in `biome.json`; `bun run lint` still passes.
- **2026-06-24**: Phase 1 complete. Fixed `noForEach`, `noArrayIndexKey`, `noStaticOnlyClass`, `useDateNow`, `useNodejsImportProtocol`; flipped to `error`.
- **2026-06-24**: Phase 2 complete. Fixed `noConsole` (via overrides for intentional logger/seed console calls) and `noUnusedVariables`; flipped to `error`.
- **2026-06-24**: Phase 3 complete. Fixed `noNonNullAssertion`, `noExplicitAny`, and `useExhaustiveDependencies`; flipped to `error`.
- **2026-06-24**: Verification. `bun run lint` and `bun run typecheck` pass for all 9 projects. Targeted tests for `@mirai-app/common`, `@mirai-app/orpc`, `@mirai-app/db`, `@mirai-app/seed` pass: 62 files, 1155 tests.
