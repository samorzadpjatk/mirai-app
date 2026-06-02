---

title: Migrate from Turborepo to NX for monorepo task orchestration
---

## Initial User Prompt

Migrate from Turborepo to NX for monorepo task orchestration

## Description

This task migrates the MIRAI monorepo's task orchestration from Turborepo to NX. The monorepo previously used Bun workspaces + Turborepo 2.8.12 for package management and task running. The migration replaces Turborepo with NX 22.7.2 while preserving all existing functionality (build, test, lint, typecheck, db:generate) and gaining additional capabilities like precise affected detection, better caching granularity, and a richer plugin ecosystem.

The migration follows a phased approach: Phase 1-2 initialize NX alongside Turborepo without disruption, Phase 3 performs the cutover by switching root scripts and removing Turborepo dependencies, and Phase 4 adds optional NX-specific enhancements (plugins, module boundary rules, named inputs, Nx Cloud, generators).

Key deliverables include: (1) `nx.json` configuration auto-generated from `turbo.json`, (2) root `package.json` scripts updated to use `nx` commands, (3) Turborepo dependencies removed (`turbo` package and `turbo.json` deleted), (4) all tasks verified to work identically under NX, and (5) documentation updated to reflect NX usage.

**Scope**:
- **Included**: NX initialization, root script migration, Turborepo removal, task verification, documentation updates, optional NX enhancements
- **Excluded**: Bun workspaces removal, package structure changes, CI/CD pipeline provider changes, Expo/Metro configuration changes

**User Scenarios**:
1. **Primary Flow**: Developer runs `bun run build` or `bun run test` from root — NX executes tasks across all projects in correct dependency order, with caching
2. **Alternative Flow**: Developer runs `nx affected:build --base=main` to build only changed projects and their dependents — faster than building everything
3. **Error Handling**: Task failures provide clear error messages with NX's structured output, and `nx graph` helps diagnose dependency issues

## Architecture Overview

### Solution Strategy

This implementation uses a **phased migration strategy** to minimize risk and ensure zero downtime:

| Phase | Description | Risk Level |
|-------|-------------|------------|
| Phase 1-2 | NX initialized alongside Turborepo | Low — both tools coexist |
| Phase 3 | Cutover — switch scripts, remove Turborepo | Low — already validated |
| Phase 4 | NX-specific enhancements (optional) | Low — additive only |

### Key Architectural Decisions

1. **NX alongside Turborepo first**: Running both tools in parallel during Phase 1-2 validates that NX produces identical results before removing Turborepo.

2. **Preserve Bun workspaces**: NX works with Bun workspaces natively (NX 20.4+ has text-based `bun.lock` support). No package manager change needed.

3. **Script-level compatibility**: Root scripts change from `turbo run` to `nx run-many -t`, but individual package `package.json` scripts remain unchanged. NX reads existing scripts.

4. **Cache strategy**: NX local cache replaces Turborepo cache. `nx run-many` produces identical cache hits for all tasks.

5. **No Expo/Metro changes**: The migration is purely at the monorepo orchestration layer. Expo and Metro bundler configuration is untouched.

### Migration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Before: Turborepo + Bun Workspaces             │
│  turbo run build → reads turbo.json → executes tasks        │
│  turbo run test → reads turbo.json → executes tasks         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Phase 1-2: NX initialized
┌─────────────────────────────────────────────────────────────┐
│              Both: Turborepo + NX coexist                   │
│  turbo run build  ✓                                         │
│  nx run-many -t build  ✓                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Phase 3: Cutover
┌─────────────────────────────────────────────────────────────┐
│              After: NX + Bun Workspaces                       │
│  nx run-many -t build → reads nx.json + package.json         │
│  nx run-many -t test → reads nx.json + package.json          │
│  nx affected:build → only changed + dependents               │
└─────────────────────────────────────────────────────────────┘
```

### NX Configuration

**nx.json** (auto-generated from `turbo.json` via `npx nx@latest init`):
- Project graph inferred from `package.json` `workspaces` and `workspace:*` dependencies
- Target defaults for common tasks (build, test, lint, typecheck)
- Local cache configuration in `.nx/cache`

### Expected File Changes

**Create (1 file)**:
| File | Purpose |
|------|---------|
| `nx.json` | NX workspace configuration (auto-generated from `turbo.json`) |

**Modify (3 files)**:
| File | Changes |
|------|---------|
| `package.json` (root) | Add `nx` to devDependencies, update scripts from `turbo run` to `nx run-many -t` |
| `.gitignore` | Add `.nx/cache` and `.nx/workspace-data` |
| `bun.lock` | Updated with NX transitive dependencies |

**Delete (2 files)**:
| File | Reason |
|------|--------|
| `turbo.json` | Replaced by `nx.json` |
| `turbo` dependency | Removed from root `package.json` devDependencies |

**Update Documentation (4+ files)**:
| File | Changes |
|------|---------|
| `README.md` | Change "Turborepo" references to "NX" |
| `AGENTS.md` | Update build system section |
| `CONTRIBUTING.md` | Update development commands |
| `apps/*/AGENTS.md` | Update per-app documentation |

---

## Acceptance Criteria

### Functional Requirements

- [x] **NX Configuration Created**: `nx.json` exists with proper project graph and target defaults
  - Given: `nx.json` is auto-generated from `turbo.json` via `npx nx@latest init`
  - When: Developer runs `nx run-many -t build` from root
  - Then: NX executes build for all 9 projects in correct dependency order

- [x] **Root Scripts Migrated**: Root `package.json` scripts use `nx` instead of `turbo`
  - Given: Root `package.json` has scripts updated
  - When: Developer runs `bun run build` or `bun run test` from root
  - Then: NX commands execute (`nx run-many -t build`, `nx run-many -t test`)

- [x] **Turborepo Dependencies Removed**: `turbo` package is removed and `turbo.json` is deleted
  - Given: `turbo.json` does not exist and `turbo` is not in `package.json` devDependencies
  - When: Developer runs `bun install` from root
  - Then: No Turborepo packages are installed

- [x] **Build Task Verification**: `nx run-many -t build` produces identical results to previous `turbo run build`
  - Given: All 9 projects have build scripts configured
  - When: Developer runs `nx run-many -t build`
  - Then: All builds succeed with no errors

- [x] **Test Task Verification**: `nx run-many -t test` produces identical results to previous `turbo run test`
  - Given: All projects have test scripts configured
  - When: Developer runs `nx run-many -t test`
  - Then: All tests pass with identical results

- [x] **Lint Task Verification**: `nx run-many -t lint` produces identical results to previous `turbo run lint`
  - Given: All projects have lint scripts configured
  - When: Developer runs `nx run-many -t lint`
  - Then: All linting passes with identical results (0 errors, warnings only)

- [x] **Typecheck Task Verification**: `nx run-many -t typecheck` produces identical results to previous `turbo run typecheck`
  - Given: All projects have typecheck scripts configured
  - When: Developer runs `nx run-many -t typecheck`
  - Then: All type checking passes with no errors

- [x] **Database Generation Task Verification**: `nx run-many -t db:generate` works correctly
  - Given: `packages/db` has `db:generate` script configured
  - When: Developer runs `nx run-many -t db:generate` or `cd packages/db && bun run db:generate`
  - Then: Drizzle migrations are generated successfully

- [x] **Cache Verification**: NX cache produces hits for repeated task executions
  - Given: Tasks have been run once and cached
  - When: Developer runs the same task again without code changes
  - Then: NX reports cache hits and task completes faster

- [x] **Affected Detection**: `nx affected` detects changed projects and their dependents
  - Given: Code changes exist in some projects
  - When: Developer runs `nx affected:build --base=main`
  - Then: Only changed projects and their dependents are built

- [x] **Documentation Updated**: All documentation references updated from Turborepo to NX
  - Given: README.md, AGENTS.md, CONTRIBUTING.md, and per-app AGENTS.md files are updated
  - When: Developer reads documentation
  - Then: All references correctly describe NX usage

### Non-Functional Requirements

- [x] **Performance**: Task execution times under NX are comparable to or faster than Turborepo
- [x] **Reliability**: All tasks produce deterministic results (same code produces same results)
- [x] **Developer Experience**: Root commands (`bun run build`, `bun run test`, etc.) work identically
- [x] **Rollback Safety**: Migration can be rolled back by re-installing `turbo` and restoring `turbo.json`

### Definition of Done

- [x] All acceptance criteria pass
- [x] All 9 projects build, test, lint, and typecheck successfully under NX
- [x] `turbo.json` deleted and `turbo` dependency removed
- [x] Documentation updated with NX references
- [x] NX cache verified with cache hits
- [x] Code reviewed and approved

---

## Implementation Process

### Phase 1: Foundation (NX Initialization Alongside Turborepo)

#### Step 1.1: Initialize NX
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 - Foundation)

**Success Criteria**:
- `nx.json` is generated from `turbo.json` via `npx nx@latest init`
- `package.json` has `nx` added to devDependencies
- `.gitignore` updated with `.nx/cache` and `.nx/workspace-data`
- All existing `turbo run` commands continue to work

**Subtasks**:
1. Run `npx nx@latest init` to auto-generate `nx.json` from `turbo.json`
2. Add `nx` to root `package.json` devDependencies
3. Update `.gitignore` with NX cache directories
4. Verify `turbo run build` still works
5. Verify `nx run-many -t build` works identically

**Blockers**: None

**Risks**:
- Risk: `npx nx@latest init` may fail with Bun workspaces
  - Mitigation: Ensure Bun 1.3.6+ is installed; NX 20.4+ supports `bun.lock`

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (40%): `nx.json` properly generated with project graph and target defaults
  2. **Integration** (30%): Both `turbo run` and `nx run-many` work identically
  3. **Completeness** (20%): `nx` in devDependencies, `.gitignore` updated
  4. **Quality** (10%): Clean configuration, no conflicts

---

#### Step 1.2: Validate NX Alongside Turborepo
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 2 - Depends on 1.1)

**Success Criteria**:
- All critical tasks (build, test, lint, typecheck, db:generate) produce identical results under both tools
- Project graph shows all 9 projects with correct dependencies
- Cache hits verified for repeated executions

**Subtasks**:
1. Run `nx run-many -t build` and compare with `turbo run build`
2. Run `nx run-many -t test` and compare with `turbo run test`
3. Run `nx run-many -t lint` and compare with `turbo run lint`
4. Run `nx run-many -t typecheck` and compare with `turbo run typecheck`
5. Run `nx run-many -t db:generate` and verify
6. Run `nx graph` to verify project graph

**Blockers**:
- Step 1.1 complete

**Risks**:
- Risk: NX project graph may miss some workspace dependencies
  - Mitigation: Verify `nx show projects` lists all 9 projects

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All 5 tasks produce identical results under both tools
  2. **Testing** (25%): Cache hits verified, no failures
  3. **Integration** (25%): Project graph shows all 9 projects with correct edges
  4. **Completeness** (20%): All subtasks completed

---

### Phase 2: Cutover (Switch from Turborepo to NX)

#### Step 2.1: Update Root Scripts
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 - Depends on 1.2)

**Success Criteria**:
- Root `package.json` scripts use `nx` commands instead of `turbo`
- All script names preserved (build, dev, lint, typecheck, test, etc.)
- Key changes:
  - `turbo run build` → `nx run-many -t build`
  - `turbo run test` → `nx run-many -t test`
  - `--filter=@mirai-app/...` → `nx run @mirai-app/...:`
  - `--filter='./packages/*'` → `--projects='packages/*'`

**Subtasks**:
1. Update `build` script to `nx run-many -t build`
2. Update `build:packages` script to `nx run-many -t build --projects='packages/*'`
3. Update `dev` script to `nx run-many -t dev`
4. Update `dev:backend` script to `nx run @mirai-app/backend-server:dev`
5. Update `dev:notification-sender` script to `nx run @mirai-app/notification-sender:dev`
6. Update `dev:native` script to `nx run @mirai-app/native:dev`
7. Update `lint` script to `nx run-many -t lint`
8. Update `typecheck` script to `nx run-many -t typecheck`
9. Update `test` script to `nx run-many -t test`
10. Update `test:watch` script to `nx run-many -t test:watch`
11. Update `test:coverage` script to `nx run-many -t test:coverage`
12. Update `clean` script to `nx run-many -t clean && rm -rf node_modules`
13. Preserve `postinstall`, `prepare`, `setup:dev`, `format:check`, `format:write` scripts

**Blockers**:
- Step 1.2 complete

**Risks**:
- Risk: Script syntax differences between `turbo` and `nx` may cause errors
  - Mitigation: Test each script after updating

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (40%): All scripts use correct `nx` syntax
  2. **Completeness** (30%): All scripts updated, no `turbo` references remain
  3. **Integration** (20%): All scripts execute successfully
  4. **Quality** (10%): Clean formatting, no syntax errors

---

#### Step 2.2: Remove Turborepo
**Estimate**: Tiny (5-15 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 4 - Depends on 2.1)

**Success Criteria**:
- `turbo` package removed from devDependencies
- `turbo.json` deleted
- `bun.lock` updated without Turborepo dependencies
- No Turborepo references remain in root `package.json`

**Subtasks**:
1. Run `bun remove turbo` to remove Turborepo dependency
2. Run `rm turbo.json` to delete Turborepo configuration
3. Run `bun install` to update lockfile
4. Verify no `turbo` references in root `package.json`

**Blockers**:
- Step 2.1 complete

**Risks**:
- Risk: Some package may have `turbo` as a transitive dependency
  - Mitigation: Check with `bun pm ls turbo` after removal

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (40%): `turbo` removed, `turbo.json` deleted
  2. **Completeness** (30%): `bun.lock` updated, no references remain
  3. **Quality** (30%): No broken dependencies

---

#### Step 2.3: Verify Clean Build
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 5 - Depends on 2.2)

**Success Criteria**:
- Clean install (`rm -rf node_modules && bun install`) works
- Full validation passes: build, typecheck, test, lint all succeed
- No Turborepo artifacts remain

**Subtasks**:
1. Run `rm -rf node_modules && bun install`
2. Run `nx run-many -t build` and verify all pass
3. Run `nx run-many -t typecheck` and verify all pass
4. Run `nx run-many -t test` and verify all pass
5. Run `nx run-many -t lint` and verify all pass
6. Run `nx run-many -t db:generate` and verify

**Blockers**:
- Step 2.2 complete

**Risks**:
- Risk: Clean install may reveal missing dependencies
  - Mitigation: Verify all 9 projects are listed in `nx show projects`

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All 5 validation commands pass
  2. **Testing** (25%): Clean install produces working environment
  3. **Completeness** (25%): All subtasks completed
  4. **Integration** (20%): No Turborepo artifacts remain

---

### Phase 3: Documentation Update

#### Step 3.1: Update Documentation
**Estimate**: Small (15-30 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 6 - Depends on 2.3)

**Success Criteria**:
- `README.md` references changed from "Turborepo" to "NX"
- `AGENTS.md` build system section updated
- `CONTRIBUTING.md` development commands updated
- Individual `apps/*/AGENTS.md` files updated

**Subtasks**:
1. Update `README.md` — change "Turborepo" to "NX", update command examples
2. Update `AGENTS.md` — update build system table, pipeline commands
3. Update `CONTRIBUTING.md` — update development commands
4. Update `apps/native/AGENTS.md` — update build/test commands
5. Update `apps/backend-server/AGENTS.md` — update build/test commands
6. Update `apps/notification-sender/AGENTS.md` — update build/test commands
7. Update `apps/seed/AGENTS.md` — update build/test commands
8. Update any other docs referencing Turborepo

**Blockers**:
- Step 2.3 complete

**Risks**:
- Risk: Some documentation may be missed
  - Mitigation: Search for "turbo" and "turborepo" across all markdown files

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Completeness** (40%): All documentation files updated
  2. **Quality** (35%): References are accurate and consistent
  3. **Correctness** (25%): No "turbo" or "turborepo" references remain

---

#### Step 3.2: Commit Changes
**Estimate**: Tiny (5-15 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 7 - Depends on 3.1)

**Success Criteria**:
- All changes committed with descriptive message
- Commit includes: nx.json, updated package.json, deleted turbo.json, documentation updates

**Subtasks**:
1. Stage all changes with `git add -A`
2. Commit with message describing the migration

**Blockers**:
- Step 3.1 complete

**Risks**: None

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Correctness** (50%): All relevant files included in commit
  2. **Quality** (50%): Commit message is descriptive

---

### Phase 4: NX-Specific Enhancements (Optional)

#### Step 4.1: Install @nx/expo Plugin
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 8 - Optional)

**Success Criteria**:
- `@nx/expo` plugin installed as devDependency
- Better Expo-specific task detection and Metro bundler integration

**Subtasks**:
1. Run `bun add -d @nx/expo`
2. Verify plugin configuration in `nx.json`
3. Test Expo-specific tasks work

**Blockers**:
- Step 3.2 complete

**Risks**:
- Risk: Plugin may conflict with existing Expo configuration
  - Mitigation: Test thoroughly after installation

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (40%): Plugin installed and configured correctly
  2. **Integration** (40%): Expo tasks work correctly
  3. **Quality** (20%): No conflicts with existing setup

---

#### Step 4.2: Configure Module Boundary Rules
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 8 - Optional)

**Success Criteria**:
- Module boundary rules configured in `nx.json`
- Tags applied to projects (e.g., `type:app`, `type:package`)
- Architectural rules enforced via ESLint

**Subtasks**:
1. Add `pluginsConfig` with `@nx/eslint-plugin` module boundary rules to `nx.json`
2. Add `nx.tags` to each project's `package.json`
3. Run `nx run-many -t lint` to verify rules work

**Blockers**:
- Step 3.2 complete

**Risks**:
- Risk: Rules may be too strict and block legitimate dependencies
  - Mitigation: Start with permissive rules, tighten gradually

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (40%): Rules configured correctly in `nx.json`
  2. **Integration** (30%): Tags applied to all projects
  3. **Quality** (30%): ESLint passes with rules enabled

---

#### Step 4.3: Set Up Named Inputs for Fine-Grained Caching
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 8 - Optional)

**Success Criteria**:
- Named inputs configured in `nx.json`
- Build caches invalidated only by production code changes
- Test caches include test files + production dependencies

**Subtasks**:
1. Add `namedInputs` section to `nx.json` (default, sharedGlobals, production)
2. Configure `targetDefaults` for `build` and `test` inputs
3. Verify cache behavior: changing test file doesn't invalidate build cache

**Blockers**:
- Step 3.2 complete

**Risks**:
- Risk: Incorrect input configuration may cause stale caches
  - Mitigation: Test cache invalidation after configuration changes

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (40%): Named inputs configured correctly
  2. **Integration** (30%): Cache behavior verified
  3. **Quality** (30%): No stale cache issues

---

#### Step 4.4: Evaluate Nx Cloud for CI
**Estimate**: Tiny (5-15 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 8 - Optional)

**Success Criteria**:
- Nx Cloud evaluated for remote caching
- Decision documented on whether to connect

**Subtasks**:
1. Evaluate Nx Cloud benefits for CI distributed caching
2. Document decision in team notes
3. Optionally run `npx nx connect-to-nx-cloud` if approved

**Blockers**:
- Step 3.2 complete

**Risks**:
- Risk: Nx Cloud may require additional permissions/setup
  - Mitigation: Evaluate first, connect only if approved

**Verification**:
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubrics**:
  1. **Completeness** (50%): Evaluation documented
  2. **Quality** (50%): Decision is clear and justified

---

#### Step 4.5: Add Generators for New Packages
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 8 - Optional)

**Success Criteria**:
- Generators available for creating new packages/apps
- Consistent structure enforced across new packages

**Subtasks**:
1. Install `@nx/js` plugin if needed
2. Test generator: `nx g @nx/js:lib packages/new-feature --unitTestRunner=vitest`
3. Test generator: `nx g @nx/js:app apps/new-service --bundler=bun`
4. Document generator usage in team wiki

**Blockers**:
- Step 3.2 complete

**Risks**:
- Risk: Generators may not match project conventions
  - Mitigation: Customize generator templates as needed

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (40%): Generators work correctly
  2. **Integration** (30%): Generated packages match project conventions
  3. **Quality** (30%): Documentation is clear

---

#### Step 4.6: Install @nx/vitest Plugin
**Estimate**: Small (15-30 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 8 - Optional)

**Success Criteria**:
- `@nx/vitest` plugin installed
- Vitest configuration can be inferred from `package.json` scripts
- Optional: remove `vitest.config.ts` files from packages if desired

**Subtasks**:
1. Run `bun add -d @nx/vitest`
2. Verify plugin configuration in `nx.json`
3. Test that `nx run-many -t test` still works
4. Optionally remove `vitest.config.ts` files if inference works

**Blockers**:
- Step 3.2 complete

**Risks**:
- Risk: Removing `vitest.config.ts` files may break custom configurations
  - Mitigation: Keep config files initially, remove only after thorough testing

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (40%): Plugin installed and configured correctly
  2. **Integration** (30%): Tests work with inferred configuration
  3. **Quality** (30%): No regression in test behavior

---

## Verification Summary

| Step | Description | Level | Threshold | Judge Count | Primary Rubrics |
|------|-------------|-------|-----------|-------------|-----------------|
| 1.1 | Initialize NX | Medium | 4.0/5.0 | 1 | Correctness, Integration |
| 1.2 | Validate NX Alongside Turborepo | High | 4.0/5.0 | 2 | Correctness, Testing, Integration |
| 2.1 | Update Root Scripts | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| 2.2 | Remove Turborepo | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 2.3 | Verify Clean Build | High | 4.0/5.0 | 2 | Correctness, Testing, Integration |
| 3.1 | Update Documentation | Low | 3.5/5.0 | 1 | Completeness, Quality |
| 3.2 | Commit Changes | Low | 3.5/5.0 | 1 | Correctness, Quality |
| 4.1 | Install @nx/expo Plugin | Medium | 4.0/5.0 | 1 | Correctness, Integration |
| 4.2 | Module Boundary Rules | Medium | 4.0/5.0 | 1 | Correctness, Integration |
| 4.3 | Named Inputs for Caching | Medium | 4.0/5.0 | 1 | Correctness, Integration |
| 4.4 | Evaluate Nx Cloud | Low | 3.5/5.0 | 1 | Completeness, Quality |
| 4.5 | Generators for New Packages | Medium | 4.0/5.0 | 1 | Correctness, Integration |
| 4.6 | Install @nx/vitest Plugin | Medium | 4.0/5.0 | 1 | Correctness, Integration |

**Legend**:
- **Level**: None / Low / Medium / High / Panel
- **Threshold**: Minimum score required (out of 5.0)
- **Judge Count**: Number of independent judges for verification
- **Rubrics**: Evaluation categories — Correctness, Completeness, Quality, Testing, Integration

---

## Sub-Agent Execution Directive

### Agent Type Assignments

| Step | Agent Type | Rationale |
|------|------------|-----------|
| 1.1, 1.2, 2.1, 2.3, 4.1, 4.2, 4.3, 4.5, 4.6 | **sonnet** | Medium complexity, requires reasoning, configuration logic |
| 2.2, 3.1, 3.2, 4.4 | **haiku** | Simple configuration, low complexity, documentation, evaluation |

### Parallel Execution Waves

**Wave 1**: Step 1.1 (Foundation)  
**Wave 2**: Step 1.2 (Depends on 1.1)  
**Wave 3**: Step 2.1 (Depends on 1.2)  
**Wave 4**: Step 2.2 (Depends on 2.1)  
**Wave 5**: Step 2.3 (Depends on 2.2)  
**Wave 6**: Step 3.1 (Depends on 2.3)  
**Wave 7**: Step 3.2 (Depends on 3.1)  
**Wave 8**: Steps 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 (ALL parallel after 3.2 — optional enhancements)

### Execution Rules

1. **Pre-execution Check**: Verify all "Parallel with" steps from previous waves are complete
2. **Dependency Gate**: Never start a step until ALL its blockers are satisfied
3. **Wave Synchronization**: Wait for entire wave to complete before starting dependent waves
4. **Quality Gate**: Each step must pass success criteria before marking complete
5. **Agent Selection**: Use assigned agent type — no substitutions without approval
6. **Phase 4 Optional**: Steps 4.1-4.6 are optional enhancements and can be skipped if not needed

### Critical Path

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2
```

**Critical Path Duration**: ~2.5 hours sequential  
**Wall Clock with Parallelization**: ~2.5 hours (minimal parallelization in required phases)  
**Phase 4 Optional**: Additional 1-2 hours if all enhancements implemented

### Synchronization Points

1. **Wave 1 → 2**: Wait for 1.1 completion
2. **Wave 2 → 3**: Wait for 1.2 completion
3. **Wave 3 → 4**: Wait for 2.1 completion
4. **Wave 4 → 5**: Wait for 2.2 completion
5. **Wave 5 → 6**: Wait for 2.3 completion
6. **Wave 6 → 7**: Wait for 3.1 completion
7. **Wave 7 → 8**: Wait for 3.2 completion (optional phase)

---

## Implementation Summary Table

| Phase | Step | Description | Agent | Estimate | Dependencies | Parallel With |
|-------|------|-------------|-------|----------|--------------|---------------|
| 1 | 1.1 | Initialize NX | sonnet | Small | None | None |
| 1 | 1.2 | Validate NX alongside Turborepo | sonnet | Small | 1.1 | None |
| 2 | 2.1 | Update Root Scripts | sonnet | Small | 1.2 | None |
| 2 | 2.2 | Remove Turborepo | haiku | Tiny | 2.1 | None |
| 2 | 2.3 | Verify Clean Build | sonnet | Small | 2.2 | None |
| 3 | 3.1 | Update Documentation | haiku | Small | 2.3 | None |
| 3 | 3.2 | Commit Changes | haiku | Tiny | 3.1 | None |
| 4 | 4.1 | Install @nx/expo Plugin | sonnet | Small | 3.2 | 4.2, 4.3, 4.4, 4.5, 4.6 |
| 4 | 4.2 | Module Boundary Rules | sonnet | Small | 3.2 | 4.1, 4.3, 4.4, 4.5, 4.6 |
| 4 | 4.3 | Named Inputs for Caching | sonnet | Small | 3.2 | 4.1, 4.2, 4.4, 4.5, 4.6 |
| 4 | 4.4 | Evaluate Nx Cloud | haiku | Tiny | 3.2 | 4.1, 4.2, 4.3, 4.5, 4.6 |
| 4 | 4.5 | Generators for New Packages | sonnet | Small | 3.2 | 4.1, 4.2, 4.3, 4.4, 4.6 |
| 4 | 4.6 | Install @nx/vitest Plugin | sonnet | Small | 3.2 | 4.1, 4.2, 4.3, 4.4, 4.5 |

---

## Critical Path

The critical path (longest dependency chain) is:

```
1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2
```

**Critical Path Duration**: ~2.5 hours sequential  
**Wall Clock with Parallelization**: ~2.5 hours (minimal parallelization in required phases)  
**Phase 4 Optional**: Additional 1-2 hours if all enhancements implemented

### Parallel Wave Summary

| Wave | Steps | Can Parallelize | Duration |
|------|-------|-----------------|----------|
| 1 | 1.1 | No | 15-30 min |
| 2 | 1.2 | No | 15-30 min |
| 3 | 2.1 | No | 15-30 min |
| 4 | 2.2 | No | 5-15 min |
| 5 | 2.3 | No | 15-30 min |
| 6 | 3.1 | No | 15-30 min |
| 7 | 3.2 | No | 5-15 min |
| 8 | 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 | **Yes (6x)** | 15-30 min |

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Bun + NX edge cases | Low | Medium | Phase 1-2 validation already passed; monitor CI |
| Team workflow disruption | Medium | Low | Parallel running during Phase 1; gradual cutover |
| CI pipeline breakage | Low | High | Test NX commands in CI before removing Turbo |
| Cache invalidation changes | Low | Low | NX cache opt-in vs Turbo cache default — no surprises |
| Expo/Metro issues | Very Low | Medium | Pre-existing native build issue unrelated to migration |
| Plugin conflicts (Phase 4) | Low | Medium | Test plugins thoroughly before relying on them |
| Module boundary rules too strict | Low | Medium | Start with permissive rules, tighten gradually |

---

## Definition of Done Checklist

- [x] `nx.json` created and configured with project graph
- [x] Root `package.json` scripts updated to use `nx` commands
- [x] `turbo` dependency removed from root `package.json`
- [x] `turbo.json` deleted
- [x] `nx run-many -t build` passes for all 9 projects
- [x] `nx run-many -t test` passes for all 9 projects
- [x] `nx run-many -t lint` passes for all 9 projects
- [x] `nx run-many -t typecheck` passes for all 9 projects
- [x] `nx run-many -t db:generate` works correctly
- [x] NX cache produces hits for repeated executions
- [x] `nx affected` detection works correctly
- [x] README.md updated with NX references
- [x] AGENTS.md updated with NX references
- [x] CONTRIBUTING.md updated with NX references
- [x] Per-app AGENTS.md files updated with NX references
- [x] All changes committed
- [x] No "turbo" or "turborepo" references remain in codebase
- [x] Clean install (`rm -rf node_modules && bun install`) works
- [x] Full validation passes after clean install

(End of file)
