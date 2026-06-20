---
title: Remove type safety and CI/CD tricks from codebase
---

## Initial User Prompt

investigate the type safety and correctness of the source code in the monorepo; I want to get rid of tricks for passing CI/CD in the codebase

## Description

The codebase has accumulated widespread type safety bypasses and CI/CD configuration tricks that undermine the TypeScript type system and reduce developer confidence. These shortcuts—including `as any` casts, `@ts-expect-error` comments, linter suppression directives, relaxed compiler settings, and test flags that allow empty suites—hide real errors, make refactoring unsafe, and render CI checks meaningless.

This task systematically removes these bypasses across the entire monorepo. We will eliminate all `as any` usages (28), `@ts-expect-error` comments (3), `eslint-disable` directives (5), `biome-ignore` comments (1), and `--passWithNoTests` flags (4) by fixing the underlying issues or adding proper tests. We will enable strict compiler settings (`noUnusedLocals`, `noUnusedParameters`) and remove `skipLibCheck: true` (5 instances) so the type checker validates all code. We will also fix empty catch blocks (2) and significantly reduce non-null assertions (`!`, 200+), type casts (`as`, 300+), and `any` type annotations (91) by replacing them with proper types, null checks, or `unknown`.

The goal is a codebase where the type system and CI pipeline can be trusted: every type error is caught at compile time, every test suite has real tests, and every lint warning is addressed rather than suppressed.

**Scope**:
- Included: All type safety bypasses listed above across apps/ and packages/
- Excluded: Business logic changes, new features, enabling `strict: true`, performance optimization

**User Scenarios**:
1. **Primary Flow**: Developer refactors bypasses category by category, enables stricter settings, and verifies CI passes legitimately
2. **Alternative Flow**: Some bypasses require dependency updates; these are documented and handled separately
3. **Error Handling**: If removing a bypass introduces a compile error, fix the root cause rather than re-suppress

## Architecture Overview

> **Synthesized from:**
> - Research Skill: `.claude/skills/remove-type-safety-tricks/SKILL.md`
> - Codebase Analysis: `.specs/analysis/analysis-remove-type-safety-tricks.md`
> - Scratchpad: `.specs/scratchpad/architecture-synthesis-remove-type-safety-tricks.md`

### Solution Strategy

This refactor follows a **5-phase phased approach** over ~3-4 weeks, prioritizing CI/CD hardening first, then production code safety, then test cleanup. The strategy avoids a "big bang" enablement of `strict: true` (explicitly out of scope) and instead tackles specific bypass categories incrementally.

**Phase 1: CI/CD & Config Hardening (Week 1)**
Remove configuration-level bypasses that hide missing coverage and dead code:
- Remove `--passWithNoTests` from all `package.json` test scripts and add minimum smoke tests
- Fix 5 `eslint-disable` directives in vitest configs by moving shared config to a proper workspace package
- Fix 1 `biome-ignore` in seed types by relocating to a `.d.ts` types directory
- Enable `noUnusedLocals` and `noUnusedParameters` in `apps/seed/tsconfig.json` and `packages/common/tsconfig.json`, cleaning up dead code and prefixing intentional unused params with `_`

**Phase 2: Production Empty Catch Blocks (Week 1-2)**
Eliminate silent failures in production code (16 files in `apps/native/src/components/`, `hooks/`, `app/`):
- Replace `.catch(() => {})` / `.catch(() => undefined)` with minimal logging
- Native app: Use Sentry (`Sentry.captureException`) or `console.warn` (dev-only)
- Backend: Use Pino logger with structured logging

**Phase 3: ORPC Router Type Safety (Week 2-3)**
Replace `any` in production API routers with proper Drizzle types (6 files in `packages/orpc/src/api/routers/`):
- Extract a shared typed helper for Drizzle query builder callbacks into `packages/orpc/src/api/routers/utils/drizzle-types.ts`
- Apply to `group/mutations.ts` (30+ instances), `trip/queries.ts` (15+), `reward/mutations.ts` (12+), `challengeSubmission/mutations.ts` (7+), `challengeVote/mutations.ts` (7+), `challenge/utils.ts` (4 `as any`)
- Fix `packages/common/src/groups/transforms.ts` (3 `any` instances) using generic constraints

**Phase 4: Test File Cleanup (Week 3)**
Remove `as any`, `!`, and empty catches from tests (12 files with `as any`, 5 files with `!`, 12 MSW test files with `.catch(() => {})`):
- Use typed mock factories from `packages/common/src/test-utils/mock-factories.ts`
- Use `jest.MockedFunction<>` for mock types
- Use `expect(x).toBeDefined()` before `expect(x!.y).toBe(...)`
- Define proper `MapUser` / `Coordinate` types for map store tests

**Phase 5: `skipLibCheck` Removal (Week 4)**
Remove `skipLibCheck: true` from 4 tsconfig files:
- Files: `apps/seed/tsconfig.json`, `apps/native/tsconfig.json`, `packages/orpc/tsconfig.test-check.json`, `packages/common/tsconfig.json`
- **Risk:** `apps/native/tsconfig.json` may need to keep due to React Native ecosystem type issues — evaluate after removal
- Resolution hierarchy: Upgrade dependency → patch upstream → local `.d.ts` shim (last resort)

### Key Architectural Decisions

1. **Phased Enablement, Not Big Bang:** Do NOT enable `strict: true`. Instead, enable specific strict flags (`noUnusedLocals`, `noUnusedParameters`) and remove bypasses incrementally to prevent overwhelming the team with thousands of errors at once.

2. **Extract Drizzle Query Builder Types:** The ORPC routers share a common pattern of untyped Drizzle callbacks. Extracting a shared typed helper in `packages/orpc/` provides a reusable pattern and prevents regression.

3. **Unified Error Handling Strategy:** Empty catch blocks must follow project logging conventions:
   - Native app: Sentry for production errors, `console.warn` only in development
   - Backend: Pino logger with structured logging
   - Tests: Explicit suppression only when testing error paths; otherwise use `.rejects`

4. **Test Fixture Type Safety:** Test files are not exempt. Use typed builder patterns in `packages/common/src/test-utils/mock-factories.ts` to ensure mock data is fully typed, eliminating the need for `as any` in tests.

5. **`@ts-expect-error` Policy:** The 3 `@ts-expect-error` instances in `packages/orpc/src/api/routers/__tests__/storage.pglite.test.ts` are **legitimate** (testing validation error paths). Keep them but add explicit comments linking to the test purpose. All other `@ts-expect-error` / `@ts-ignore` must be removed.

### Expected Changes

**Files to Modify (by category):**

| Category | Count | Key Files | Order |
|----------|-------|-----------|-------|
| `--passWithNoTests` | 3 scripts | `package.json`, `packages/db/package.json`, `apps/native/package.json` | Phase 1 |
| `eslint-disable` | 5 | 5 `vitest.config.ts` files | Phase 1 |
| `biome-ignore` | 1 | `apps/seed/src/types/bun-types.d.ts` | Phase 1 |
| `noUnusedLocals/Parameters` | 2 tsconfigs | `apps/seed/tsconfig.json`, `packages/common/tsconfig.json` | Phase 1 |
| Empty catch (production) | 16 files | `apps/native/src/components/**/*.tsx`, `apps/native/src/hooks/**/*.ts`, `apps/native/src/app/**/*.tsx` | Phase 2 |
| `any` in ORPC routers | 6 files | `packages/orpc/src/api/routers/{group,trip,reward,chSubmission,chVote,challenge}/` | Phase 3 |
| `as any` in tests | 12 files | Various `**/__tests__/**/*.test.ts` | Phase 4 |
| `!` in tests | 5 files | `apps/native/src/hooks/__tests__/**/*.test.ts` | Phase 4 |
| Empty catch (tests) | 12 files | `apps/native/src/hooks/__tests__/admin/*.test.ts` | Phase 4 |
| `skipLibCheck` | 4 tsconfigs | `apps/seed/tsconfig.json`, `apps/native/tsconfig.json`, `packages/orpc/tsconfig.test-check.json`, `packages/common/tsconfig.json` | Phase 5 |
| `shared/src/groups/transforms.ts` | 1 | `packages/common/src/groups/transforms.ts` | Phase 3 |
| `shared/test-utils/mock-factories.ts` | 1 | `packages/common/src/test-utils/mock-factories.ts` | Phase 4 |

**New Files to Create:**
1. `packages/orpc/src/api/routers/utils/drizzle-types.ts` — Shared typed helpers for Drizzle query builder callbacks
2. `packages/common/src/test-utils/typed-builders.ts` — Typed test fixture builders (optional, if mock-factories refactor is insufficient)

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| React Native `skipLibCheck` removal breaks build | Evaluate carefully; may need to keep with documented justification |
| Drizzle type changes break runtime queries | Add integration tests for each refactored router before changing types |
| Empty catch logging adds noise | Use appropriate log levels (warn for user-facing, debug for internal) |
| Test `as any` removal requires large fixture changes | Start with `packages/common/src/test-utils/mock-factories.ts` to propagate fixes |
| `--passWithNoTests` removal causes CI failure | Add 1 smoke test per affected package before removing flag |

## Implementation Process

> **Decomposed by:** sdd:tech-lead  
> **Scratchpad:** `.specs/scratchpad/decomposition-remove-type-safety-tricks.md`

### Overview

The refactor is decomposed into **4 macro-phases** with **12 ordered implementation steps**. Steps are organized by dependency: Setup steps harden CI/CD first, Foundational steps fix production code safety, User Stories steps clean up test files, and Polish steps remove final configuration bypasses.

**Critical path:** Step 1 → Step 3 → Step 6 → Step 7 → Step 10 → Step 11 → Step 12  
**Estimated duration:** ~3-4 weeks  
**Team size:** 1-2 developers

---

### Phase 1: Setup (CI/CD & Config Hardening)

#### Step 1: Remove `--passWithNoTests` and Add Smoke Tests
- **Goal:** Eliminate CI bypass that hides empty test suites
- **Output:** All test scripts fail legitimately when no tests exist; every affected package has ≥1 real test
- **Success Criteria:**
  - `grep -r "passWithNoTests" package.json packages/*/package.json apps/*/package.json` returns 0 results
  - `nx run-many -t test` passes without `--passWithNoTests`
- **Subtasks:**
  1. Audit all `package.json` files for `--passWithNoTests` (root, `packages/db`, `apps/native`)
  2. Write 1 smoke test per affected package (minimum: imports core module without error)
  3. Remove flag from scripts
  4. Verify CI passes
- **Blockers:** None
- **Risks:**
  - **High:** Some packages may have zero tests and no test infrastructure → Mitigation: Create minimal `__tests__/smoke.test.ts` that imports the package's entry point
  - **Medium:** Native app uses Jest, others use Vitest → Mitigation: Write package-specific smoke tests matching existing test framework

#### Step 2: Fix `eslint-disable` and `biome-ignore` Directives
- **Goal:** Remove linter suppression in config and type files
- **Output:** Zero `eslint-disable` in source/config files; `biome-ignore` relocated or removed
- **Success Criteria:**
  - `grep -r "eslint-disable" apps/ packages/` returns 0 results (except legitimate config files)
  - `grep -r "biome-ignore" apps/ packages/` returns 0 results
- **Subtasks:**
  1. Identify 5 `eslint-disable @nx/enforce-module-boundaries` in vitest configs
  2. Extract shared vitest config to `packages/common/vitest.config.base.ts` or adjust `nx.json` boundaries
  3. Move `apps/seed/src/types/bun-types.d.ts` to proper `.d.ts` directory (biome ignores `.d.ts` by default)
  4. Run `nx run-many -t lint` to verify zero suppressions
- **Blockers:** None (can parallelize with Step 1)
- **Risks:**
  - **Medium:** Nx module boundary rules may be legitimately violated → Mitigation: Document any boundary changes in `nx.json` with justification

#### Step 3: Enable `noUnusedLocals` and `noUnusedParameters`
- **Goal:** Catch dead code and unused parameters at compile time
- **Output:** `apps/seed` and `packages/common` tsconfigs have strict flags enabled; all unused code cleaned
- **Success Criteria:**
  - `tsc --noEmit` passes for `apps/seed` and `packages/common`
  - Zero `_`-unprefixed unused parameters in those packages
- **Subtasks:**
  1. Enable `noUnusedLocals: true` in `apps/seed/tsconfig.json` and `packages/common/tsconfig.json`
  2. Enable `noUnusedParameters: true` in same files
  3. Remove dead code (unused imports, variables)
  4. Prefix intentional unused params with `_`
  5. Verify `tsc --noEmit` passes
- **Blockers:** Steps 1-2 (to avoid CI noise from unrelated failures)
- **Risks:**
  - **Low:** Large number of unused imports may exist → Mitigation: Use `tsc` error list as a checklist; fix incrementally

---

### Phase 2: Foundational (Production Code Safety)

#### Step 4: Fix Empty Catch Blocks in Production Code
- **Goal:** Eliminate silent failures in native app and backend
- **Output:** All 16 production files have proper error handling (logging or re-throw)
- **Success Criteria:**
  - `grep -r "\.catch(() => {})" apps/native/src/components/ apps/native/src/hooks/ apps/native/src/app/` returns 0 results
  - `grep -r "\.catch(() => undefined)"` in same dirs returns 0 results
  - Sentry/Pino logging added per project conventions
- **Subtasks:**
  1. Audit 16 files in `apps/native/src/components/`, `hooks/`, `app/`
  2. Replace empty catches with `Sentry.captureException(error)` (native) or Pino logger (backend)
  3. Use `console.warn` only in development builds
  4. Verify no runtime regressions via manual smoke test
- **Blockers:** Step 3 (to avoid tsconfig noise)
- **Risks:**
  - **High:** Adding logging may expose noisy errors previously hidden → Mitigation: Use `warn` level for user-facing, `debug` for internal; review Sentry dashboard after deploy
  - **Medium:** Some catches may be intentionally suppressing expected errors → Mitigation: Add code comments explaining why suppression is safe, or use typed error filtering

#### Step 5: Create Drizzle Typed Helper
- **Goal:** Provide reusable typed pattern for Drizzle query builder callbacks
- **Output:** New file `packages/orpc/src/api/routers/utils/drizzle-types.ts` with typed helpers
- **Success Criteria:**
  - File exports at least one reusable type/helper for Drizzle callback patterns
  - Used by at least 1 ORPC router file
  - `tsc --noEmit` passes for `packages/orpc`
- **Subtasks:**
  1. Analyze callback patterns in `group/mutations.ts`, `trip/queries.ts`, `reward/mutations.ts`
  2. Design generic helper using `PgTableWithColumns` and Drizzle operators
  3. Write unit tests for helper types (compile-time verification)
  4. Document usage pattern in file header
- **Blockers:** None (can parallelize with Step 4)
- **Risks:**
  - **Medium:** Drizzle's type system is complex; helper may not cover all patterns → Mitigation: Start with 3 most common patterns; extend as needed in Step 6

#### Step 6: Fix `any` in ORPC Routers
- **Goal:** Replace all `any` in production API routers with proper Drizzle types
- **Output:** 6 router files use typed callbacks; `packages/common/src/groups/transforms.ts` uses generic constraints
- **Success Criteria:**
  - `grep -r "any" packages/orpc/src/api/routers/` returns ≤5 results (documented exceptions)
  - `grep -r "as any" packages/orpc/src/api/routers/` returns 0 results
  - All integration tests for affected routers pass
- **Subtasks:**
  1. Apply `drizzle-types.ts` helper to `group/mutations.ts` (30+ instances)
  2. Apply to `trip/queries.ts` (15+ instances)
  3. Apply to `reward/mutations.ts` (12+ instances)
  4. Apply to `challengeSubmission/mutations.ts` (7+ instances)
  5. Apply to `challengeVote/mutations.ts` (7+ instances)
  6. Fix `challenge/utils.ts` (4 `as any`)
  7. Fix `packages/common/src/groups/transforms.ts` (3 `any` with generic constraints)
  8. Add integration tests for each refactored router before changing types
- **Blockers:** Step 5 (typed helper must exist first)
- **Risks:**
  - **High:** Type changes may break runtime queries if Drizzle types don't match runtime schema → Mitigation: Add integration tests for each router BEFORE changing types; run `db:push` and test actual queries
  - **High:** `group/mutations.ts` has 30+ instances — largest file, highest risk → Mitigation: Split into sub-PRs per router; review carefully

---

### Phase 3: User Stories (Test File Cleanup)

#### Step 7: Fix `as any` in Test Files
- **Goal:** Remove all `as any` casts from tests (12 files)
- **Output:** Test files use typed mock factories or proper type narrowing
- **Success Criteria:**
  - `grep -r "as any" apps/native/src/**/__tests__/` returns 0 results
  - `grep -r "as any" packages/**/__tests__/` returns 0 results
  - All affected test suites pass
- **Subtasks:**
  1. Audit 12 test files with `as any`
  2. Refactor `packages/common/src/test-utils/mock-factories.ts` to provide fully typed builders
  3. Replace `as any` with typed mock factories or `jest.MockedFunction<>`
  4. Define proper `MapUser` / `Coordinate` types for map store tests
  5. Run affected test suites
- **Blockers:** Step 3 (tsconfig strictness must be in place)
- **Risks:**
  - **Medium:** Mock factories may need significant expansion → Mitigation: Create `typed-builders.ts` if mock-factories is insufficient
  - **Low:** Some `as any` may be testing invalid input paths → Mitigation: Use `unknown` with runtime validation for those cases

#### Step 8: Fix Non-Null Assertions (`!`) in Tests
- **Goal:** Remove `!` assertions from 5 test files
- **Output:** All `!` replaced with `expect(x).toBeDefined()` guards or optional chaining
- **Success Criteria:**
  - `grep -r "!\." apps/native/src/hooks/__tests__/` returns ≤2 results (documented exceptions)
  - All affected test suites pass
- **Subtasks:**
  1. Audit 5 files in `apps/native/src/hooks/__tests__/`
  2. Replace `x!.y` with `expect(x).toBeDefined()` + `x.y`
  3. Use optional chaining where appropriate
  4. Run test suites
- **Blockers:** Step 7 (can parallelize if files don't overlap)
- **Risks:**
  - **Low:** Some assertions may be on values that are genuinely guaranteed → Mitigation: Add `toBeDefined()` guard; if test fails, investigate data setup

#### Step 9: Fix Empty Catch Blocks in Tests
- **Goal:** Remove `.catch(() => {})` from 12 MSW test files
- **Output:** All test catches use `expect(promise).rejects.toThrow()` or explicit error testing
- **Success Criteria:**
  - `grep -r "\.catch(() => {})" apps/native/src/hooks/__tests__/` returns 0 results
  - `grep -r "\.catch(() => undefined)"` in same dir returns 0 results
  - All MSW test suites pass
- **Subtasks:**
  1. Audit 12 MSW test files in `apps/native/src/hooks/__tests__/admin/`
  2. Replace empty catches with `expect(promise).rejects.toThrow()` where testing error paths
  3. Use explicit error assertions where needed
  4. Run MSW test suites
- **Blockers:** Step 7-8 (test infrastructure must be stable)
- **Risks:**
  - **Low:** Some catches suppress unhandled promise rejection warnings in test runner → Mitigation: Use `await expect(promise).rejects.toThrow()` pattern; Jest handles gracefully

---

### Phase 4: Polish (skipLibCheck & Final Verification)

#### Step 10: Remove `skipLibCheck: true`
- **Goal:** Enable full type checking of all dependencies
- **Output:** 4 tsconfig files no longer have `skipLibCheck: true`; all compile errors fixed
- **Success Criteria:**
  - `grep -r "skipLibCheck" apps/seed/tsconfig.json apps/native/tsconfig.json packages/orpc/tsconfig.test-check.json packages/common/tsconfig.json` returns 0 results
  - `tsc --noEmit` passes for all 4 packages
- **Subtasks:**
  1. Remove `skipLibCheck: true` from `apps/seed/tsconfig.json`
  2. Remove from `packages/orpc/tsconfig.test-check.json`
  3. Remove from `packages/common/tsconfig.json`
  4. Remove from `apps/native/tsconfig.json` (evaluate carefully; may need documented justification to keep)
  5. Fix any `.d.ts` errors using resolution hierarchy: upgrade → patch upstream → local shim
  6. Verify `tsc --noEmit` for each package
- **Blockers:** Steps 1-9 (all other type issues must be resolved first)
- **Risks:**
  - **High:** `apps/native/tsconfig.json` React Native ecosystem may have unfixable type issues → Mitigation: Evaluate after removal; if unfixable, document justification and keep with comment
  - **Medium:** Dependency type issues may require upstream patches → Mitigation: Use local `.d.ts` shims as last resort; document in `docs/technical-debt.md`

#### Step 11: Handle `@ts-expect-error` and `@ts-ignore`
- **Goal:** Remove or document all `@ts-expect-error` comments
- **Output:** 3 instances in `storage.pglite.test.ts` kept with explicit documentation; all others removed
- **Success Criteria:**
  - `grep -r "@ts-expect-error" apps/ packages/` returns 3 results (all in `storage.pglite.test.ts` with documentation)
  - `grep -r "@ts-ignore" apps/ packages/` returns 0 results
- **Subtasks:**
  1. Audit all `@ts-expect-error` and `@ts-ignore` instances
  2. Remove any non-legitimate instances (fix underlying type issue)
  3. For 3 legitimate test instances: add detailed comments explaining test purpose
  4. Verify no new type errors introduced
- **Blockers:** Step 10 (all other type issues resolved)
- **Risks:**
  - **Low:** Removing `@ts-expect-error` may reveal hidden type errors → Mitigation: Fix root cause; do not re-suppress

#### Step 12: Final Verification & Sign-Off
- **Goal:** Ensure all acceptance criteria and non-functional requirements pass
- **Output:** Verification report with all checks green
- **Success Criteria:**
  - All AC-1 through AC-12 pass
  - NFR-1 (zero compiler errors), NFR-2 (all tests pass), NFR-3 (no runtime regression) pass
  - `eslint` and `biome` pass with zero suppressions
- **Subtasks:**
  1. Run `nx run-many -t typecheck` — verify zero errors
  2. Run `nx run-many -t test` — verify all pass without `--passWithNoTests`
  3. Run `nx run-many -t lint` — verify zero suppressions
  4. Manual smoke test: native app dev build, backend dev server
  5. Generate verification report
  6. Code review and approval
- **Blockers:** Steps 1-11
- **Risks:**
  - **Medium:** Final verification may reveal inter-package type issues not caught per-package → Mitigation: Run `nx run-many -t typecheck` which checks all packages together

---

### Critical Path

```
Step 1 (Smoke Tests) → Step 3 (Strict TSConfig) → Step 6 (ORPC Types) → Step 7 (Test Cleanup) → Step 10 (skipLibCheck) → Step 11 (ts-expect-error) → Step 12 (Final Verification)
```

**Critical path duration:** ~3 weeks (sequential dependencies)  
**Parallelizable work:** Steps 4-5 can run in parallel with each other and after Step 3. Steps 8-9 can run in parallel with Step 7.

---

### High Priority Risks & Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| React Native `skipLibCheck` removal breaks build | High | High | Evaluate carefully; keep with documented justification if unfixable | Step 10 |
| Drizzle type changes break runtime queries | Medium | High | Add integration tests for each router BEFORE changing types | Step 6 |
| `--passWithNoTests` removal causes CI failure | Medium | Medium | Add 1 smoke test per affected package before removing flag | Step 1 |
| Empty catch logging adds noise/alerts | Medium | Medium | Use appropriate log levels; review Sentry after deploy | Step 4 |
| Test `as any` removal requires large fixture changes | Medium | Low | Start with `mock-factories.ts`; create `typed-builders.ts` if needed | Step 7 |
| `group/mutations.ts` (30+ any) is too large for single PR | High | Medium | Split into sub-PRs per router; merge incrementally | Step 6 |

---

### Implementation Summary Table

| Step | Phase | Goal | Output | Success Criteria | Blockers | Est. Duration |
|------|-------|------|--------|------------------|----------|---------------|
| 1 | Setup | Remove `--passWithNoTests` | All suites have real tests | `grep` returns 0; CI passes | None | 2 days |
| 2 | Setup | Fix linter suppressions | Zero `eslint-disable` / `biome-ignore` | `grep` returns 0 | None | 1 day |
| 3 | Setup | Enable strict TS flags | Dead code removed | `tsc --noEmit` passes | Steps 1-2 | 2 days |
| 4 | Foundational | Fix empty catches | All catches have handling | `grep` returns 0; smoke test passes | Step 3 | 3 days |
| 5 | Foundational | Create Drizzle helper | `drizzle-types.ts` exists | Helper used by ≥1 router | None | 2 days |
| 6 | Foundational | Fix `any` in routers | 6 files typed | `grep` returns 0; integration tests pass | Step 5 | 5 days |
| 7 | User Stories | Fix `as any` in tests | 12 files cleaned | `grep` returns 0; tests pass | Step 3 | 3 days |
| 8 | User Stories | Fix `!` in tests | 5 files cleaned | `grep` returns ≤2; tests pass | Step 7 | 1 day |
| 9 | User Stories | Fix empty catches in tests | 12 MSW files cleaned | `grep` returns 0; tests pass | Steps 7-8 | 2 days |
| 10 | Polish | Remove `skipLibCheck` | 4 tsconfigs cleaned | `grep` returns 0; `tsc` passes | Steps 1-9 | 3 days |
| 11 | Polish | Handle `@ts-expect-error` | All documented/removed | `grep` returns 3 (documented) | Step 10 | 1 day |
| 12 | Polish | Final verification | Verification report | All AC/NFR pass | Steps 1-11 | 1 day |

**Total estimated duration:** ~3-4 weeks

---

### Definition of Done (Implementation)

- [ ] All 12 implementation steps complete
- [ ] All acceptance criteria (AC-1 through AC-12) verified with `grep` commands
- [ ] All non-functional requirements (NFR-1 through NFR-3) verified
- [ ] `nx run-many -t typecheck` passes with zero errors
- [ ] `nx run-many -t test` passes without `--passWithNoTests`
- [ ] `nx run-many -t lint` passes with zero suppressions
- [ ] Manual smoke test: native app dev build starts without runtime errors
- [ ] Manual smoke test: backend dev server starts and handles requests
- [ ] Code reviewed and approved by 1+ team member
- [ ] Documentation updated: any kept `skipLibCheck` or `@ts-expect-error` has justification comment

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[AC-1]**: All `as any` usages removed
  - Given: Codebase contains 28 `as any` instances
  - When: Refactoring is complete
  - Then: `grep -r "as any" apps/ packages/` returns 0 results (with documented exceptions)

- [ ] **[AC-2]**: All `@ts-expect-error` comments removed
  - Given: Codebase contains 3 `@ts-expect-error` comments
  - When: Refactoring is complete
  - Then: `grep -r "@ts-expect-error" apps/ packages/` returns 0 results

- [ ] **[AC-3]**: All `eslint-disable` comments removed
  - Given: Codebase contains 5 `eslint-disable` comments
  - When: Refactoring is complete
  - Then: `grep -r "eslint-disable" apps/ packages/` returns 0 results (except config files)

- [ ] **[AC-4]**: All `biome-ignore` comments removed
  - Given: Codebase contains 1 `biome-ignore` comment
  - When: Refactoring is complete
  - Then: `grep -r "biome-ignore" apps/ packages/` returns 0 results

- [ ] **[AC-5]**: All `--passWithNoTests` flags removed
  - Given: 4 test scripts use `--passWithNoTests`
  - When: Refactoring is complete
  - Then: No test scripts use `--passWithNoTests` and all affected suites have ≥1 real test

- [ ] **[AC-6]**: All `skipLibCheck: true` settings removed
  - Given: 5 tsconfig files have `skipLibCheck: true`
  - When: Refactoring is complete
  - Then: No tsconfig has `skipLibCheck: true` and `tsc --noEmit` passes for all packages

- [ ] **[AC-7]**: `noUnusedLocals` enabled globally
  - Given: tsconfig files have `noUnusedLocals: false` or undefined
  - When: Refactoring is complete
  - Then: All tsconfig files have `noUnusedLocals: true` and `tsc` passes

- [ ] **[AC-8]**: `noUnusedParameters` enabled globally
  - Given: tsconfig files have `noUnusedParameters: false` or undefined
  - When: Refactoring is complete
  - Then: All tsconfig files have `noUnusedParameters: true` and `tsc` passes

- [ ] **[AC-9]**: Empty catch blocks fixed
  - Given: 2 empty catch blocks exist
  - When: Refactoring is complete
  - Then: All catch blocks have error handling (logging, re-throw, or typed handling)

- [ ] **[AC-10]**: Non-null assertions reduced by >90%
  - Given: 200+ `!` non-null assertions exist
  - When: Refactoring is complete
  - Then: Count is reduced by >90% with proper null checks or optional chaining

- [ ] **[AC-11]**: Type casts reduced by >90%
  - Given: 300+ `as` type casts exist
  - When: Refactoring is complete
  - Then: Count is reduced by >90% with proper type narrowing or runtime validation

- [ ] **[AC-12]**: `any` types eliminated
  - Given: 91 `any` type annotations exist
  - When: Refactoring is complete
  - Then: Count is 0 with specific types or `unknown` (documented exceptions allowed)

### Non-Functional Requirements

- [ ] **[NFR-1]**: Zero compiler errors
  - Given: All changes are applied
  - When: Running `tsc --noEmit` for each package
  - Then: Zero type errors across all packages

- [ ] **[NFR-2]**: All tests pass
  - Given: All changes are applied
  - When: Running test suites
  - Then: All tests pass without `--passWithNoTests`

- [ ] **[NFR-3]**: No runtime regression
  - Given: All changes are applied
  - When: Running the application
  - Then: No new runtime errors introduced

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] `tsc --noEmit` passes for all packages
- [ ] All test suites pass without bypass flags
- [ ] `eslint` and `biome` pass with zero suppressions
- [ ] Code reviewed and approved
