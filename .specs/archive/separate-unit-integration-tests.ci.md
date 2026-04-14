---
title: Separate execution of unit tests from integration tests
---

## Architecture Overview

### Solution Strategy

The solution uses **Bun's test name filtering** with `[UNIT]` and `[INTEGRATION]` tags in test describe blocks to categorize tests without renaming or moving files. This approach was selected because:

1. **Task Constraint Compliance**: The task explicitly excludes renaming or moving existing test files
2. **Minimal Disruption**: Only requires adding tags to existing describe blocks (87 files)
3. **Gradual Adoption**: Can be applied package by package
4. **Tooling Native**: Uses Bun's built-in `-t` flag for filtering by test name

**Filtering Pattern:**

```bash
bun test -t '\[UNIT\]'      # Run only unit tests
bun test -t '\[INTEGRATION\]' # Run only integration tests
```

### Key Decisions

| Decision                       | Choice                                                       | Rationale                                                                              |
| ------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Test categorization method** | Tag-based (`[UNIT]`/`[INTEGRATION]` in describe blocks)      | Minimal file changes, works with existing structure, meets task constraints            |
| **Package-level scripts**      | Bun filtering with `-t` flag                                 | Each package knows its test structure best; 100% unit packages can run all tests       |
| **Root-level orchestration**   | Turbo with separate `test:unit` and `test:integration` tasks | Parallelization, caching, consistent monorepo patterns                                 |
| **CI pipeline strategy**       | Sequential jobs: `test-unit` → `test-integration`            | Fail-fast approach; don't waste time on slow integration tests if fast unit tests fail |
| **Backward compatibility**     | Preserve `bun test` to run all tests                         | Existing workflows remain intact; new commands are additive                            |
| **Native app handling**        | Keep separate from Bun separation                            | Native uses Jest (different runner); out of scope for this task                        |

### Expected Changes

#### Configuration Files (3 files)

- `/package.json` - Add `test:unit`, `test:integration`, update `test:ci`
- `/turbo.json` - Add task definitions for `test:unit` and `test:integration`
- `.github/workflows/ci.yml` - Split test job into sequential stages

#### Package-Level Scripts (12 files)

Update `package.json` scripts in:

- **100% Unit packages** (add `test:unit`): `packages/domain`, `packages/use-cases`, `packages/auth`, `packages/shared`, `apps/backend-server`, `apps/notification-sender`, `apps/seed`
- **Mixed packages** (add both): `packages/adapters`, `packages/trpc`, `apps/web`
- **100% Integration packages** (add `test:integration`): `packages/db` (replaces `test:db`), `packages/supabase`

#### Test Files (87 Bun test files)

- ~50 files: Add `[UNIT]` tag to describe blocks
- ~24 files: Add `[INTEGRATION]` tag to describe blocks
- ~13 files: Review and categorize based on test content

#### Documentation (2 files)

- `AGENTS.md` - Add test execution section
- `README.md` - Update testing documentation

### Trade-offs Considered

#### File Naming vs Tag-Based

- **File naming** (`*.unit.test.ts`) was rejected due to requiring 109 file renames, breaking git history, and violating task constraints
- **Tag-based** was selected for minimal disruption and gradual adoption

#### Sequential vs Parallel CI

- **Parallel** would reduce wall time but increase complexity and resource usage
- **Sequential** provides fail-fast behavior and simpler setup; parallel can be added later as optimization

#### Coverage Reporting

- **Separate coverage** (unit vs integration) would provide better insight but adds complexity
- **Unified coverage** was selected to maintain existing thresholds and simplify CI

---

## Initial User Prompt

Seperate execution of unit test form integration tests in the monorepo

## Description

The current monorepo runs all tests together in a single command, which creates slow feedback cycles and inefficient CI resource usage. When developers only need to verify logic changes, they must still wait for integration tests that require external services (databases, APIs). This disrupts development flow and wastes CI time.

This task implements separate execution paths for unit tests (fast, isolated) and integration tests (slower, external-dependent). Developers will be able to run `bun test:unit` for quick logic validation and `bun test:integration` when testing external interactions. The CI pipeline will leverage this separation with a fail-fast approach: unit tests run first, and only if they pass will integration tests execute.

The implementation will use file naming conventions to categorize tests (`*.unit.test.ts` for unit tests, `*.integration.test.ts` for integration tests), add dedicated npm scripts, update CI workflows, and provide clear documentation for developers.

**Scope**:

- **Included**:
  - Test categorization via naming conventions
  - Separate npm scripts (`test:unit`, `test:integration`)
  - CI pipeline stage separation
  - Documentation updates
  - Backward compatibility (existing `bun test` continues to work)

- **Excluded**:
  - Renaming or moving existing test files
  - Changes to test framework or assertions
  - Test content modifications
  - Parallel execution optimizations
  - Smart test selection based on file changes

**User Scenarios**:

1. **Primary Flow**: Developer makes domain layer change → runs `bun test:unit` → gets feedback in seconds → confident in change quality
2. **Alternative Flow**: Developer pushes code → CI runs unit tests (fast) → if pass, runs integration tests → build succeeds
3. **Error Handling**: If unit tests fail in CI, integration tests are skipped immediately (fail fast), clear logs indicate which stage failed

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[UNIT-1]**: Unit tests can be run separately
  - Given: The monorepo has tests following naming conventions
  - When: Developer runs `bun test:unit`
  - Then: Only unit tests execute (files matching unit test pattern, integration tests are excluded)

- [ ] **[INT-1]**: Integration tests can be run separately
  - Given: The monorepo has tests following naming conventions
  - When: Developer runs `bun test:integration`
  - Then: Only integration tests execute (unit tests are excluded)

- [ ] **[COMPAT-1]**: Backward compatibility maintained
  - Given: The current test setup works today
  - When: Developer runs `bun test`
  - Then: All tests execute as before (no regression in behavior)

- [ ] **[CI-1]**: CI pipeline optimized with separation
  - Given: A pull request is opened
  - When: CI executes
  - Then: Unit tests run in a dedicated stage that completes before integration test stage begins

- [ ] **[DOC-1]**: Documentation clearly explains test execution
  - Given: A new developer joins the project
  - When: Reading the testing documentation
  - Then: They find clear instructions for running unit tests, integration tests, and the full suite

### Non-Functional Requirements

- [ ] **[PERF-1]**: Unit test execution completes significantly faster than full suite
- [ ] **[MAINT-1]**: Test categorization is intuitive and easy to follow for developers
- [ ] **[COMPAT-2]**: Changes don't break existing developer workflows

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] Test commands work correctly in local development
- [ ] CI pipeline stages execute correctly
- [ ] Documentation is updated and reviewed
- [ ] At least one other developer has verified the commands work as expected

---

## Implementation Process

### Phase 1: Setup (Foundation)

**Goal:** Establish root-level configuration infrastructure

**Phase Dependencies:** None

**Parallelization Strategy:** Steps 1.1 and 1.2 can run in parallel (different files). Step 1.3 depends on 1.2 for task names.

| Step | Goal                         | Output                             | Success Criteria                                                           | Subtasks                                                                                                                                              | Agent  | Dependencies | Parallel with |
| ---- | ---------------------------- | ---------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ | ------------- |
| 1.1  | Add root-level test scripts  | Updated `/package.json`            | `test:unit` and `test:integration` scripts exist and run without error     | • Add `test:unit` script using turbo<br>• Add `test:integration` script using turbo<br>• Update `test:ci` to use new structure                        | sonnet | None         | 1.2           |
| 1.2  | Configure Turbo tasks        | Updated `/turbo.json`              | Turbo tasks `test:unit` and `test:integration` defined with proper caching | • Add `test:unit` task with dependencies<br>• Add `test:integration` task with dependencies<br>• Configure task pipeline order                        | sonnet | None         | 1.1           |
| 1.3  | Set up CI workflow structure | Updated `.github/workflows/ci.yml` | CI has separate jobs for unit and integration tests                        | • Split existing test job into `test-unit` and `test-integration`<br>• Add job dependency (integration waits for unit)<br>• Ensure fail-fast behavior | sonnet | 1.2          | None          |

**Step 1.1 Verification:**

- **Level:** Single Judge
- **Threshold:** 4.0/5.0
- **Method:** LLM-as-Judge
- **Rubric:**
  - Syntax Correctness (0.30): JSON is valid, no syntax errors
  - Script Accuracy (0.30): Scripts correctly invoke turbo with proper flags
  - Integration (0.20): Scripts work with existing package.json structure
  - Backward Compatibility (0.20): `bun test` continues to work as before

**Step 1.2 Verification:**

- **Level:** Panel (2 judges)
- **Threshold:** 4.0/5.0
- **Method:** LLM-as-Judge with consensus
- **Rubric:**
  - JSON Validity (0.25): turbo.json is valid JSON with correct schema
  - Task Definition (0.30): Both `test:unit` and `test:integration` tasks properly defined
  - Dependency Chain (0.25): Task dependencies correctly configured for execution order
  - Caching Config (0.20): Cache inputs/outputs properly specified for both tasks

**Step 1.3 Verification:**

- **Level:** Panel (2 judges)
- **Threshold:** 4.0/5.0
- **Method:** LLM-as-Judge with consensus
- **Rubric:**
  - YAML Validity (0.25): Workflow file is valid GitHub Actions YAML
  - Job Separation (0.25): Two distinct jobs (`test-unit`, `test-integration`) defined
  - Dependencies (0.25): Integration job correctly depends on unit job completion
  - Fail-Fast (0.25): Proper fail-fast configuration ensuring quick failure on unit test errors

**Phase 1 Verification Summary:**

| Step | Level  | Judges | Threshold | Focus Area          |
| ---- | ------ | ------ | --------- | ------------------- |
| 1.1  | Single | 1      | 4.0/5.0   | Root scripts        |
| 1.2  | Panel  | 2      | 4.0/5.0   | Turbo configuration |
| 1.3  | Panel  | 2      | 4.0/5.0   | CI workflow         |

**Phase 1 Blockers & Risks:**

- **Risk:** Turbo version compatibility issues
  - _Mitigation:_ Verify turbo.json schema matches installed version
- **Risk:** CI job dependencies syntax errors
  - _Mitigation:_ Test workflow YAML syntax with `gh workflow validate`

---

### Phase 2: Foundational (Package Scripts)

**Goal:** Configure each package with appropriate test filtering scripts

**Phase Dependencies:** Phase 1 complete (root scripts must exist)

**Parallelization Strategy:** All 12 packages across all 3 steps can run in parallel. Each package modifies its own package.json independently.

| Step | Goal                                             | Output                                                                                                     | Success Criteria                                                                 | Subtasks                                                                                                                                                                 | Agent  | Dependencies | Parallel with          |
| ---- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------ | ---------------------- |
| 2.1  | Configure 100% unit packages (7 packages)        | Updated `package.json` files in domain, use-cases, auth, shared, backend-server, notification-sender, seed | Each package has `test:unit` script that runs all tests (100% unit)              | • Add `"test:unit": "bun test"` to each package<br>• Verify no integration tests exist in these packages<br>• Document in scratchpad                                     | haiku  | Phase 1      | 2.2, 2.3, all packages |
| 2.2  | Configure mixed packages (3 packages)            | Updated `package.json` files in adapters, trpc, apps/web                                                   | Each package has both `test:unit` and `test:integration` scripts using `-t` flag | • Add `"test:unit": "bun test -t '\\[UNIT\\]'"`<br>• Add `"test:integration": "bun test -t '\\[INTEGRATION\\]'"`<br>• Verify bun filtering works in each package context | sonnet | Phase 1      | 2.1, 2.3, all packages |
| 2.3  | Configure 100% integration packages (2 packages) | Updated `package.json` files in db, supabase                                                               | Each package has `test:integration` script (replaces `test:db` if exists)        | • Replace `test:db` with `test:integration` in db package<br>• Add `test:integration` to supabase<br>• Update any references to old script name                          | haiku  | Phase 1      | 2.1, 2.2, all packages |

**Step 2.1 Verification:**

- **Level:** Single Judge (batched for all 7 packages)
- **Threshold:** 4.0/5.0
- **Method:** LLM-as-Judge
- **Rubric:**
  - Package Coverage (0.25): All 7 packages have test:unit script added
  - Script Correctness (0.25): Scripts properly delegate to `bun test`
  - 100% Unit Assumption (0.25): Verification that these packages have no integration tests
  - Consistency (0.25): All package scripts follow same pattern

**Step 2.2 Verification:**

- **Level:** Panel (2 judges)
- **Threshold:** 4.5/5.0
- **Method:** LLM-as-Judge with consensus
- **Rubric:**
  - Script Presence (0.25): Both `test:unit` and `test:integration` scripts exist in each package
  - Filter Syntax (0.30): Bun `-t` flag syntax correct with proper escaping for `[UNIT]` and `[INTEGRATION]`
  - Cross-Platform (0.20): Escaping works correctly on both Unix and Windows
  - Integration (0.25): Scripts integrate with existing package.json without conflicts

**Step 2.3 Verification:**

- **Level:** Single Judge
- **Threshold:** 4.0/5.0
- **Method:** LLM-as-Judge
- **Rubric:**
  - Script Replacement (0.30): `test:db` correctly replaced with `test:integration`
  - Script Addition (0.30): `test:integration` added to supabase package
  - Reference Updates (0.20): All references to old script names updated
  - Backward Compatibility (0.20): No breaking changes to existing workflows

**Phase 2 Verification Summary:**

| Step | Level  | Judges | Threshold | Focus Area                      |
| ---- | ------ | ------ | --------- | ------------------------------- |
| 2.1  | Single | 1      | 4.0/5.0   | 100% unit packages (7 packages) |
| 2.2  | Panel  | 2      | 4.5/5.0   | Mixed packages (3 packages)     |
| 2.3  | Single | 1      | 4.0/5.0   | 100% integration (2 packages)   |

**Parallel Package Distribution:**

- Step 2.1: 7 parallel tasks (domain, use-cases, auth, shared, backend-server, notification-sender, seed)
- Step 2.2: 3 parallel tasks (adapters, trpc, apps/web)
- Step 2.3: 2 parallel tasks (db, supabase)

**Phase 2 Blockers & Risks:**

- **Risk:** Bun test filtering (`-t` flag) behavior varies across packages
  - _Mitigation:_ Test each package after script addition with a sample test
- **Risk:** Windows/Unix escaping differences for `-t` regex patterns
  - _Mitigation:_ Use single quotes and escaped brackets consistently
- **Risk:** Some packages may need environment variables for integration tests
  - _Mitigation:_ Review existing test setup and preserve env var configuration

---

### Phase 3: User Stories (Test Categorization)

**Goal:** Add `[UNIT]` and `[INTEGRATION]` tags to all 87 Bun test files

**Phase Dependencies:** Phase 2 complete (package scripts must be ready to verify)

**Parallelization Strategy:** All test files can be processed in parallel. Group by package for logical organization and conflict avoidance. Use haiku for clear categorizations, sonnet for mixed/review tasks.

| Step | Goal                                | Output                                     | Success Criteria                                                     | Subtasks                                                                                                                                                                           | Agent  | Dependencies | Parallel with               |
| ---- | ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ | --------------------------- |
| 3.1  | Categorize clear unit tests         | ~30 test files tagged with `[UNIT]`        | All domain entities, value objects, pure functions have `[UNIT]` tag | • Identify files in domain/, use-cases/ packages<br>• Update describe blocks: `describe("[UNIT] User entity")`<br>• Run `bun test:unit` to verify filtering works                  | haiku  | Phase 2      | 3.2, 3.3, 3.4, all packages |
| 3.2  | Categorize clear integration tests  | ~15 test files tagged with `[INTEGRATION]` | All database-related, API-dependent tests have `[INTEGRATION]` tag   | • Identify files in db/, supabase/ packages<br>• Update describe blocks: `describe("[INTEGRATION] Database connection")`<br>• Run `bun test:integration` to verify filtering works | haiku  | Phase 2      | 3.1, 3.3, 3.4, all packages |
| 3.3  | Categorize mixed package tests      | ~24 test files tagged appropriately        | adapters/, trpc/, apps/web/ tests properly categorized               | • Review each file in mixed packages<br>• Apply `[UNIT]` or `[INTEGRATION]` based on test content<br>• Verify both filters work in each package                                    | sonnet | Phase 2      | 3.1, 3.2, 3.4, all packages |
| 3.4  | Review and categorize unclear tests | ~13 test files reviewed and tagged         | All remaining uncategorized tests are properly tagged                | • Review remaining files individually<br>• Make categorization decisions<br>• Document any edge cases in scratchpad                                                                | sonnet | Phase 2      | 3.1, 3.2, 3.3, per file     |

**Step 3.1 Verification:**

- **Level:** Per-Item (spot-check 20% sample)
- **Threshold:** Pass/Fail per item
- **Method:** Automated + Sample LLM verification
- **Rubric:**
  - Tag Format (0.30): `[UNIT]` tag present at start of describe block text
  - Top-Level Only (0.30): Only top-level describe blocks tagged (not nested)
  - Categorization (0.25): All files are indeed unit tests (pure logic, no external deps)
  - Completeness (0.25): All expected files in scope are tagged

**Step 3.2 Verification:**

- **Level:** Per-Item (spot-check 20% sample)
- **Threshold:** Pass/Fail per item
- **Method:** Automated + Sample LLM verification
- **Rubric:**
  - Tag Format (0.30): `[INTEGRATION]` tag present at start of describe block text
  - Top-Level Only (0.30): Only top-level describe blocks tagged (not nested)
  - Categorization (0.25): All files are indeed integration tests (external deps present)
  - Completeness (0.25): All expected files in scope are tagged

**Step 3.3 Verification:**

- **Level:** Single Judge
- **Threshold:** 4.0/5.0
- **Method:** LLM-as-Judge
- **Rubric:**
  - Categorization Accuracy (0.35): Each test correctly identified as unit vs integration
  - Mixed Handling (0.25): Files with both types properly handled (tagged or split)
  - External Dep Detection (0.20): Tests with database/API calls correctly flagged as integration
  - Pure Logic Detection (0.20): Tests with pure functions correctly flagged as unit

**Step 3.4 Verification:**

- **Level:** Panel (2 judges)
- **Threshold:** 4.5/5.0
- **Method:** LLM-as-Judge with consensus
- **Rubric:**
  - Categorization Accuracy (0.35): Complex cases correctly categorized
  - Edge Case Documentation (0.25): All edge cases and decisions documented in scratchpad
  - Split Recommendations (0.20): Cases requiring test file splits properly identified
  - Consistency (0.20): Decisions follow consistent logic with clear rationale

**Phase 3 Verification Summary:**

| Step | Level    | Judges | Threshold | Focus Area                             |
| ---- | -------- | ------ | --------- | -------------------------------------- |
| 3.1  | Per-Item | N/A    | Pass/Fail | ~30 clear unit test files              |
| 3.2  | Per-Item | N/A    | Pass/Fail | ~15 clear integration test files       |
| 3.3  | Single   | 1      | 4.0/5.0   | ~24 mixed package test files           |
| 3.4  | Panel    | 2      | 4.5/5.0   | ~13 unclear test files (complex cases) |

**Parallel File Distribution by Package:**

- Step 3.1 (UNIT): domain (~10 files), use-cases (~15 files), auth (~5 files), shared (~8 files), backend-server (~6 files) - all in parallel
- Step 3.2 (INTEGRATION): db (~10 files), supabase (~5 files) - in parallel
- Step 3.3 (MIXED): adapters (~12 files), trpc (~8 files), apps/web (~8 files) - all in parallel
- Step 3.4 (REVIEW): ~13 unclear files - each can be done in parallel

**Phase 3 Blockers & Risks:**

- **Risk:** ~13 files have unclear categorization (may mix unit/integration logic)
  - _Mitigation:_ Review each file individually; split into separate describe blocks if needed
- **Risk:** Nested describe blocks may complicate filtering
  - _Mitigation:_ Tag only top-level describe blocks; bun -t matches any describe text
- **Risk:** Some tests may have external dependencies not immediately obvious
  - _Mitigation:_ Run tests with `--dry-run` or check imports for external services
- **Risk:** Missing test files in initial count
  - _Mitigation:_ Generate final list with `find . -name "*.test.ts" -type f | wc -l` before starting

---

### Phase 4: Polish

**Goal:** Documentation, verification, and final validation

**Phase Dependencies:** Phase 3 complete (all tests categorized)

**Parallelization Strategy:** Steps 4.1 and 4.2 can run in parallel (different files). Step 4.3 must wait for all previous work to complete.

| Step | Goal                              | Output              | Success Criteria                                       | Subtasks                                                                                                                                                                                          | Agent  | Dependencies | Parallel with |
| ---- | --------------------------------- | ------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ | ------------- |
| 4.1  | Update AGENTS.md testing section  | Updated `AGENTS.md` | Section exists explaining test execution patterns      | • Add "Test Execution" section<br>• Document `bun test:unit` usage<br>• Document `bun test:integration` usage<br>• Explain backward compatibility                                                 | sonnet | Phase 3      | 4.2           |
| 4.2  | Update README.md documentation    | Updated `README.md` | General developer documentation includes test commands | • Update testing section<br>• Add quick reference for common commands<br>• Link to AGENTS.md for details                                                                                          | sonnet | Phase 3      | 4.1           |
| 4.3  | Final verification and validation | Verification report | All commands work as expected                          | • Run full test suite: `bun test`<br>• Run unit tests only: `bun test:unit`<br>• Run integration tests only: `bun test:integration`<br>• Verify CI workflow syntax<br>• Document any issues found | opus   | 4.1, 4.2     | None          |

**Step 4.1 Verification:**

- **Level:** None (Human Review)
- **Threshold:** N/A
- **Method:** Documentation review by team
- **Rationale:** Documentation changes are best verified by human review for clarity and accuracy. No LLM-as-Judge required.

**Step 4.2 Verification:**

- **Level:** None (Human Review)
- **Threshold:** N/A
- **Method:** Documentation review by team
- **Rationale:** Documentation changes are best verified by human review for clarity and accuracy. No LLM-as-Judge required.

**Step 4.3 Verification:**

- **Level:** Panel (2 judges) + Automated Checks
- **Threshold:** 4.5/5.0
- **Method:** LLM-as-Judge with consensus + Automated execution verification
- **Rubric:**
  - Command Execution (0.25): `bun test`, `bun test:unit`, `bun test:integration` all execute without errors
  - Filtering Correctness (0.25): Unit command runs only unit tests, integration runs only integration tests
  - Backward Compatibility (0.20): `bun test` continues to run all tests as before
  - CI Validation (0.15): CI workflow YAML is valid and jobs execute in correct order
  - Documentation Accuracy (0.15): All documented commands match actual implementation

**Phase 4 Verification Summary:**

| Step | Level        | Judges | Threshold | Focus Area              |
| ---- | ------------ | ------ | --------- | ----------------------- |
| 4.1  | None         | 0      | N/A       | AGENTS.md documentation |
| 4.2  | None         | 0      | N/A       | README.md documentation |
| 4.3  | Panel + Auto | 2      | 4.5/5.0   | Final verification gate |

**Phase 4 Blockers & Risks:**

- **Risk:** Documentation may not stay in sync with implementation
  - _Mitigation:_ Update docs immediately, include command examples that can be copy-pasted
- **Risk:** Final verification may reveal edge cases missed during categorization
  - _Mitigation:_ Build in buffer time for fixing any discovered issues

---

## Complete Verification Summary

### All Phases Verification Table

| Phase | Step | Description                   | Level      | Judges | Threshold | Method                      | Gate Type  |
| ----- | ---- | ----------------------------- | ---------- | ------ | --------- | --------------------------- | ---------- |
| 1     | 1.1  | Root package.json scripts     | Single     | 1      | 4.0/5.0   | LLM-as-Judge                | Phase Gate |
| 1     | 1.2  | Turbo tasks configuration     | Panel      | 2      | 4.0/5.0   | LLM-as-Judge with consensus | Phase Gate |
| 1     | 1.3  | CI workflow structure         | Panel      | 2      | 4.0/5.0   | LLM-as-Judge with consensus | Phase Gate |
| 2     | 2.1  | 100% unit packages (7)        | Single     | 1      | 4.0/5.0   | LLM-as-Judge                | Phase Gate |
| 2     | 2.2  | Mixed packages (3)            | Panel      | 2      | 4.5/5.0   | LLM-as-Judge with consensus | Phase Gate |
| 2     | 2.3  | 100% integration packages (2) | Single     | 1      | 4.0/5.0   | LLM-as-Judge                | Phase Gate |
| 3     | 3.1  | Clear unit tests (~30 files)  | Per-Item   | N/A    | Pass/Fail | Automated + Sample          | Inline     |
| 3     | 3.2  | Clear integration tests (~15) | Per-Item   | N/A    | Pass/Fail | Automated + Sample          | Inline     |
| 3     | 3.3  | Mixed package tests (~24)     | Single     | 1      | 4.0/5.0   | LLM-as-Judge                | Inline     |
| 3     | 3.4  | Unclear tests (~13 files)     | Panel      | 2      | 4.5/5.0   | LLM-as-Judge with consensus | Inline     |
| 4     | 4.1  | AGENTS.md documentation       | None       | 0      | N/A       | Human Review                | None       |
| 4     | 4.2  | README.md documentation       | None       | 0      | N/A       | Human Review                | None       |
| 4     | 4.3  | Final verification            | Panel+Auto | 2      | 4.5/5.0   | LLM-as-Judge + Execution    | Final Gate |

### Verification by Criticality

| Criticality | Steps                   | Count | Total Judges | Notes                       |
| ----------- | ----------------------- | ----- | ------------ | --------------------------- |
| HIGH        | 1.2, 1.3, 2.2, 3.4, 4.3 | 5     | 10           | Panel review with consensus |
| MEDIUM      | 1.1, 2.1, 2.3, 3.3      | 4     | 4            | Single judge review         |
| LOW         | 3.1, 3.2                | 2     | N/A          | Per-item automated/sample   |
| NONE        | 4.1, 4.2                | 2     | 0            | Human documentation review  |

### Verification Rubric Summary

**Configuration Changes (Steps 1.x, 2.x):**

- Syntax/JSON Validity (0.25-0.30)
- Script/Task Correctness (0.25-0.30)
- Integration (0.20-0.25)
- Backward Compatibility (0.20)

**Test Categorization (Steps 3.x):**

- Categorization Accuracy (0.35-0.40)
- Tag Format (0.25-0.30)
- Top-Level Only (0.20-0.30)
- Edge Cases/Completeness (0.20-0.25)

**Final Verification (Step 4.3):**

- Command Execution (0.25)
- Filtering Correctness (0.25)
- Backward Compatibility (0.20)
- CI Validation (0.15)
- Documentation Accuracy (0.15)

### Verification Execution Notes

1. **Phase Gates:** Steps 1.1-1.3, 2.1-2.3 must pass verification before proceeding to next phase
2. **Inline Verification:** Steps 3.1-3.4 can be verified as they complete (non-blocking)
3. **Final Gate:** Step 4.3 is the critical final verification before task completion
4. **Retry Policy:** Single judge failures get 1 retry; Panel disagreements get max 3 debate rounds
5. **Scratchpad Reference:** Detailed verification planning in `.specs/scratchpad/separate-unit-integration-tests-verification.md`

---

## Implementation Summary

### Sequential vs Parallel Duration

| Phase                     | Steps        | Complexity | Est. Duration (Sequential) | Est. Duration (Parallel) | Key Deliverables                             |
| ------------------------- | ------------ | ---------- | -------------------------- | ------------------------ | -------------------------------------------- |
| **Phase 1: Setup**        | 3 steps      | Low        | 30 min                     | ~10 min                  | Root package.json, turbo.json, CI workflow   |
| **Phase 2: Foundational** | 3 steps      | Low-Medium | 1 hour                     | ~15 min                  | 12 package.json files with test scripts      |
| **Phase 3: User Stories** | 4 batches    | Medium     | 3-4 hours                  | ~30 min                  | 87 test files categorized                    |
| **Phase 4: Polish**       | 3 steps      | Low        | 30 min                     | ~10 min                  | Documentation updated, verification complete |
| **TOTAL**                 | **13 steps** |            | **5-6 hours**              | **~65 minutes**          | **104 files modified**                       |

### Parallelization Overview

**Maximum Parallelism:**

- Phase 1: 2 parallel tasks (1.1 || 1.2 → 1.3)
- Phase 2: 12 parallel tasks (all packages simultaneously)
- Phase 3: ~82 parallel tasks (all test files by package)
- Phase 4: 2 parallel tasks (4.1 || 4.2 → 4.3)

**Agent Distribution:**

- **opus** (1): Final verification (4.3)
- **sonnet** (13): Mixed packages, unclear tests, config, docs
- **haiku** (36): Clear unit/integration packages and tests

**Execution Flow:**

```
Phase 1: [1.1 + 1.2] → [1.3]
    ↓
Phase 2: [2.1.1 + 2.1.2 + ... + 2.3.2] (all 12 packages parallel)
    ↓
Phase 3: [3.1 packages + 3.2 packages + 3.3 packages + 3.4 files] (all parallel)
    ↓
Phase 4: [4.1 + 4.2] → [4.3]
```

### Implementation Definition of Done

- [ ] **Configuration Complete:** Root-level scripts and Turbo tasks configured
- [ ] **Package Scripts Ready:** All 12 packages have appropriate test scripts
- [ ] **100% Categorized:** All 87 Bun test files tagged with `[UNIT]` or `[INTEGRATION]`
- [ ] **Commands Verified:**
  - [ ] `bun test` runs all tests (backward compatibility)
  - [ ] `bun test:unit` runs only unit tests
  - [ ] `bun test:integration` runs only integration tests
- [ ] **CI Pipeline Working:**
  - [ ] `test-unit` job executes and passes
  - [ ] `test-integration` job executes only after unit tests pass
  - [ ] Fail-fast behavior confirmed
- [ ] **Documentation Updated:**
  - [ ] AGENTS.md has test execution section
  - [ ] README.md has testing quick reference
- [ ] **Peer Verification:** At least one other developer has run the commands and confirmed they work

---

## Parallelization Reference Diagram

```
PHASE 1: SETUP (Foundation)
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐                                  │
│  │ 1.1 root │  │ 1.2 turbo│                                  │
│  │ package  │  │  config  │                                  │
│  │  sonnet  │  │  sonnet  │                                  │
│  └────┬─────┘  └────┬─────┘                                  │
│       └──────────────┘                                       │
│              │                                               │
│              ▼                                               │
│       ┌──────────┐                                           │
│       │ 1.3 CI   │                                           │
│       │ workflow │                                           │
│       │  sonnet  │                                           │
│       └──────────┘                                           │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 2: FOUNDATIONAL (12 packages in parallel)
┌─────────────────────────────────────────────────────────────┐
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │ 2.1 domain    │ │ 2.1 use-cases │ │ 2.1 auth      │    │
│  │ haiku         │ │ haiku         │ │ haiku         │    │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤    │
│  │ 2.1 shared    │ │ 2.1 back-srv  │ │ 2.1 note-send │    │
│  │ haiku         │ │ haiku         │ │ haiku         │    │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤    │
│  │ 2.1 seed      │ │ 2.2 adapters  │ │ 2.2 trpc      │    │
│  │ haiku         │ │ sonnet        │ │ sonnet        │    │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤    │
│  │ 2.2 apps/web  │ │ 2.3 db        │ │ 2.3 supabase  │    │
│  │ sonnet        │ │ haiku         │ │ haiku         │    │
│  └───────────────┘ └───────────────┘ └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 3: CATEGORIZATION (all packages/files in parallel)
┌─────────────────────────────────────────────────────────────┐
│  [3.1 UNIT]           [3.2 INTEGRATION]    [3.3 MIXED]     │
│  domain files ─┐      db files ─┐          adapters files │
│  use-cases ────┼┐     supabase ──┘          trpc files    │
│  auth ─────────┼┤                           apps/web files │
│  shared ───────┼┘                                          │
│  backend-srv ──┘      [3.4 UNCLEAR]                       │
│                       13 files (sonnet each)               │
│  All haiku per package or sonnet per file                   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
PHASE 4: POLISH (Documentation + Verification)
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ 4.1 AGENTS.md│  │ 4.2 README.md│                          │
│  │   sonnet     │  │   sonnet     │                          │
│  └──────┬───────┘  └──────┬───────┘                          │
│         └───────────────────┘                                │
│                    │                                         │
│                    ▼                                         │
│            ┌──────────────┐                                  │
│            │ 4.3 FINAL   │                                  │
│            │ VERIFICATION│                                  │
│            │   opus      │                                  │
│            └──────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

**Agent Legend:**

- `opus` = Critical verification, complex final checks
- `sonnet` = Moderate complexity, judgment required
- `haiku` = Simple, repetitive, pattern-based tasks

**Scratchpad Reference:** `.specs/scratchpad/separate-unit-integration-tests-parallelization.md`
