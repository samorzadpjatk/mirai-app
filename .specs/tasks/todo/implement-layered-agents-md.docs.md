---
title: Implement layered AGENTS.md structure
depends_on:
  - .specs/plans/layered-agents-md.design.md
  - .claude/skills/layered-agents-md/SKILL.md
research:
  scratchpad: .specs/scratchpad/research-a7f3c9d2.md
  resources: 5
  researcher: sdd:researcher
---

## Initial User Prompt

Split AGENTS.md and nest it in folders according to OpenAI Codex guidelines: https://developers.openai.com/codex/guides/agents-md#layer-project-instructions

## Description

Split the existing 611-line AGENTS.md file into a hierarchical, layered structure following OpenAI Codex discovery rules. The new structure will mirror the Clean Architecture layers, creating per-package AGENTS.md files with specialized guidance while transforming the root AGENTS.md into a navigation-focused landing page.

### Goals (Priority Order)

1. **Size management:** Keep each file under 200 lines (<8 KiB) and combined stack under 32 KiB
2. **Monorepo specialization:** Provide tailored guidance per package based on Clean Architecture
3. **Reduce duplication:** Reference CLAUDE.md instead of copying encyclopedic content

### Architecture

Codex discovers files by walking from root to current directory, concatenating guidance where files closer to the working directory override earlier guidance.

**Target structure:**

```
AGENTS.md                          # Root: Quick start + navigation (~200 lines)
packages/
  domain/AGENTS.md                 # Domain purity rules
  use-cases/AGENTS.md              # Effect orchestration patterns
  adapters/AGENTS.md               # DI + controller patterns
  frameworks/AGENTS.md             # Layer composition + DI wiring
apps/
  backend-server/AGENTS.md         # tRPC routes + auth flow
  native/AGENTS.md                 # Mobile patterns + Jest testing
  notification-sender/AGENTS.md    # Background job patterns
  web/AGENTS.md                    # Frontend patterns
```

### Migration Approach

1. **Phase 1 - Audit:** Map content from current AGENTS.md to destination files
2. **Phase 2 - Create:** Draft all per-package AGENTS.md files in parallel
3. **Phase 3 - Replace:** Backup and replace root AGENTS.md
4. **Phase 4 - Validate:** Verify file sizes and Codex discovery from each directory
5. **Phase 5 - Cleanup:** Archive backup after verification period

## Acceptance Criteria

### File Structure

**AC-001:** Given the repository root, when Codex discovers instructions, then it loads root AGENTS.md containing quick start checklist, layer decision tree, and navigation links to all package-specific files.

**AC-002:** Given the `packages/domain/` directory, when Codex discovers instructions, then it loads domain-specific AGENTS.md containing: entity creation template, branded ID pattern, purity rules, domain testing patterns, and common mistakes section.

**AC-003:** Given the `packages/use-cases/` directory, when Codex discovers instructions, then it loads use-case-specific AGENTS.md containing: Effect.gen patterns, Context.Tag DI, use case template, port definitions, and test templates with Layer.provide.

**AC-004:** Given the `packages/adapters/` directory, when Codex discovers instructions, then it loads adapter-specific AGENTS.md containing: awilix-modular DI patterns, controller auth helpers, Effect.tryPromise for gateways, and BasePrismaRepository rules.

**AC-005:** Given the `packages/frameworks/` directory, when Codex discovers instructions, then it loads framework-specific AGENTS.md containing: Layer composition patterns, awilix-modular module structure, and scope strategy table.

**AC-006:** Given the `apps/backend-server/` directory, when Codex discovers instructions, then it loads backend-server-specific AGENTS.md containing: tRPC router patterns, controller resolution, and auth flow examples.

**AC-007:** Given the `apps/native/` directory, when Codex discovers instructions, then it loads native-specific AGENTS.md containing: mobile development patterns, Jest testing setup, and navigation patterns.

**AC-008:** Given the `apps/notification-sender/` directory, when Codex discovers instructions, then it loads notification-sender-specific AGENTS.md containing: background job patterns and Effect scheduling guidance.

**AC-009:** Given the `apps/web/` directory, when Codex discovers instructions, then it loads web-specific AGENTS.md containing: frontend component patterns and API client usage.

### Content Quality

**AC-010:** Given any AGENTS.md file, when reviewing its content, then it ends with a "Deep Reference" section linking to the relevant CLAUDE.md section(s).

**AC-011:** Given any package directory, when measuring the combined size of all discovered AGENTS.md files from root to that directory, then the total is under 32 KiB.

**AC-012:** Given the migration is complete, when verifying against the original AGENTS.md content mapping, then 100% of essential guidance is preserved (no loss of critical patterns, templates, or rules).

## Scope

### In-Scope

- ✅ Creating 9 new AGENTS.md files per design specification
- ✅ Rewriting root AGENTS.md as navigation landing page
- ✅ Extracting and distributing content to appropriate package files
- ✅ Adding CLAUDE.md cross-references to every file
- ✅ Validating file size compliance (each <200 lines, combined <32 KiB)
- ✅ Testing Codex discovery from all package directories
- ✅ Creating backup of original AGENTS.md

### Out-of-Scope

- ❌ Modifying CLAUDE.md content
- ❌ Changing any source code in packages/
- ❌ Updating docs/ folder content
- ❌ Creating the seed/ package AGENTS.md (inherits root, no override needed)
- ❌ Deleting backup file (cleanup deferred to future task)

## Architecture Overview

### Solution Strategy

Transform the 611-line monolithic AGENTS.md into a **hierarchical, discovery-aware structure** following OpenAI Codex's concatenation rules. Codex walks from root to current directory, loading and concatenating AGENTS.md files where later files override earlier guidance.

**Core Approach:**

1. **Root becomes navigation hub** (~200 lines) - Quick start, layer decision tree, universal rules, navigation links
2. **Per-package files provide specialized guidance** (~60-140 lines each) - Context-specific patterns and checklists
3. **CLAUDE.md remains encyclopedic reference** - AGENTS.md files cross-reference to relevant sections
4. **Size-first enforcement** - Each file <200 lines, combined stack <32 KiB per directory

**Migration Pattern:** 5-phase approach (Audit → Create → Replace → Validate → Cleanup)

### Key Decisions

| Decision                          | Choice                                                                        | Rationale                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **1. Discovery-Driven Hierarchy** | Mirror Clean Architecture layers (Domain → Use Cases → Adapters → Frameworks) | Codex concatenation aligns with dependency direction; 4 packages + 4 apps (seed/ inherits root) |
| **2. Size Budget**                | Hard limit 200 lines/file, <32 KiB combined                                   | Codex default context limit is 32 KiB; current 20 KiB root risks truncation                     |
| **3. CLAUDE.md Reference Model**  | Every file ends with "Deep Reference" section                                 | Eliminates ~40% duplication; AGENTS.md = practical, CLAUDE.md = encyclopedic                    |
| **4. Content Distribution**       | Map sections to packages by layer responsibility                              | Domain purity → domain/, DI patterns → adapters/, etc.                                          |
| **5. Root Navigation Hub**        | Root contains only universal guidance + per-package links                     | Reduces cognitive load by ~70%; agents see only relevant patterns                               |
| **6. Backup Strategy**            | Single `AGENTS.md.backup` (not dated)                                         | Immediate rollback available; cleanup deferred                                                  |

### Trade-offs

**Gained:**

- ✅ Contextual relevance - Agents see layer-specific guidance only
- ✅ Size compliance - All stacks <32 KiB with headroom
- ✅ Maintainability - Layer-specific changes isolated
- ✅ No duplication - CLAUDE.md remains single source of truth

**Sacrificed:**

- ⚠️ Single-file discoverability - Must use cross-references (mitigated by navigation table)
- ⚠️ Link stability - 106 files reference AGENTS.md sections (mitigated by link audit)
- ⚠️ Maintenance surface - 9 files vs 1 (mitigated by small, focused files)

**Risk Level:** MEDIUM → LOW (with mitigation)

### Expected Changes

**Files to Create (9 new AGENTS.md files):**

| #   | File Path                            | Purpose                     | Est. Lines |
| --- | ------------------------------------ | --------------------------- | ---------- |
| 1   | `packages/domain/AGENTS.md`          | Domain purity + entities    | ~120       |
| 2   | `packages/use-cases/AGENTS.md`       | Effect orchestration        | ~130       |
| 3   | `packages/adapters/AGENTS.md`        | DI + controller patterns    | ~140       |
| 4   | `packages/frameworks/AGENTS.md`      | Layer composition           | ~100       |
| 5   | `apps/backend-server/AGENTS.md`      | tRPC + auth flow            | ~80        |
| 6   | `apps/native/AGENTS.md`              | Mobile + Jest patterns      | ~80        |
| 7   | `apps/notification-sender/AGENTS.md` | Background jobs             | ~60        |
| 8   | `apps/web/AGENTS.md`                 | Frontend patterns           | ~80        |
| 9   | `apps/seed/AGENTS.md`                | **No file** - inherits root | N/A        |

**Files to Modify:**

- `AGENTS.md` - Major rewrite: 611 lines → ~200 lines (navigation hub)

**Files to Archive:**

- `AGENTS.md.backup` - Original 611-line version preserved

**Files Requiring Link Updates:**

- `.specs/templates/di-migration-guide.md` (line 636)
- `.specs/templates/di-quick-start.md` (line 281)
- `TESTING.md` (line 4)

**References:**

- Skill: `.claude/skills/layered-agents-md/SKILL.md`
- Analysis: `.specs/analysis/analysis-implement-layered-agents-md.md`
- Design: `.specs/plans/layered-agents-md.design.md`
- Architecture Scratchpad: `.specs/scratchpad/architecture-e61c5f14142e.md`

## User Scenarios

### Scenario 1: New AI Agent Onboarding

**Given** a new AI agent starts working on a feature in `packages/domain/`
**When** the agent opens the directory
**Then** Codex discovers root AGENTS.md (navigation) and domain/AGENTS.md (specialized guidance)
**And** the agent sees domain purity rules, entity templates, and branded ID patterns immediately relevant to their work.

### Scenario 2: Backend Developer Working on tRPC Router

**Given** a developer is implementing a new tRPC endpoint in `apps/backend-server/`
**When** the agent opens the directory
**Then** Codex discovers root AGENTS.md and backend-server/AGENTS.md
**And** the agent sees controller resolution patterns, auth flow examples, and router templates specific to backend work.

### Scenario 3: Cross-Package Feature Development

**Given** a developer needs to create a feature spanning Domain → Use Case → Adapter
**When** the agent moves between `packages/domain/`, `packages/use-cases/`, `packages/adapters/`
**Then** Codex discovers the appropriate specialized AGENTS.md at each location
**And** the agent receives layer-specific guidance (entity patterns, Effect orchestration, DI wiring) for each phase.

### Scenario 4: Documentation Reference

**Given** an agent needs deep details about Effect patterns
**When** the agent reads any AGENTS.md file
**Then** the file ends with a "Deep Reference" section
**And** the agent can navigate to CLAUDE.md §X.X for comprehensive patterns and advanced variations.

## Definition of Done

- [ ] All 9 AGENTS.md files created per design specification
- [ ] Root AGENTS.md contains: quick start (5 bullets), layer decision tree (ASCII), navigation section, 3 universal rules, condensed skill reference
- [ ] Each per-package AGENTS.md contains specialized checklists and templates for its layer
- [ ] Every file ends with "Deep Reference" section linking to CLAUDE.md
- [ ] Size validation passed: each file <200 lines, combined stack from any directory <32 KiB
- [ ] Content verification passed: all essential guidance from original AGENTS.md preserved
- [ ] Original AGENTS.md backed up as AGENTS.md.backup
- [ ] Codex discovery tested from each package directory (verified concatenation order)
- [ ] No duplicate or overlapping content between files
- [ ] All cross-references use correct CLAUDE.md section numbers

---

## Implementation Process

### Phase 1: Audit (15 minutes)

#### Step 1.1: Content Audit and Mapping

| Attribute            | Value                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| **Agent**            | sonnet                                                                      |
| **Goal**             | Map every section of current AGENTS.md to destination file with line ranges |
| **Estimated Effort** | 15 minutes                                                                  |
| **Output**           | Content mapping table (section → destination → line ranges)                 |
| **Success Criteria** | 100% of AGENTS.md sections mapped; duplicates with CLAUDE.md identified     |
| **Parallel with:**   | Step 1.2 (Link Audit) runs in parallel                                      |
| **Blockers:**        | None                                                                        |

**Subtasks:**

1. [ ] 1.1.1 Read and catalog all AGENTS.md sections with line numbers (611 lines)
2. [ ] 1.1.2 Identify sections duplicated in CLAUDE.md (~40% overlap estimated)
3. [ ] 1.1.3 Create detailed mapping table (section → destination file)
4. [ ] 1.1.4 Calculate size budget for each destination file (<200 lines each)
5. [ ] 1.1.5 Identify CLAUDE.md cross-reference points for each file

**Blockers:** None

**Risks:**

- **R1 (HIGH):** Essential guidance lost during split → Mitigated by thorough cataloging
- **R4 (MEDIUM):** Cross-references broken → Mitigated by section verification

**Verification:**

| Attribute     | Value                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| **Level**     | HIGH                                                                                                    |
| **Method**    | Panel (2 judges)                                                                                        |
| **Threshold** | 4.5/5.0                                                                                                 |
| **Rationale** | Content mapping is foundation for all creation steps. Incorrect mapping causes systematic content loss. |

**Rubric:**

| Criterion               | Weight | Target                            |
| ----------------------- | ------ | --------------------------------- |
| Completeness            | 30%    | 100% of 611 lines mapped          |
| Destination Accuracy    | 25%    | Zero section misplacements        |
| CLAUDE.md Overlap ID    | 20%    | >35% duplicate content found      |
| Size Budget Calculation | 15%    | All budgets sum correctly         |
| Cross-Reference Points  | 10%    | All 9 destination files have refs |

**Blockers:** None

---

#### Step 1.2: Link Audit

| Attribute            | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Agent**            | haiku                                                        |
| **Goal**             | Identify all repository files referencing AGENTS.md sections |
| **Estimated Effort** | 5 minutes (parallel with 1.1)                                |
| **Output**           | List of files requiring link updates post-migration          |
| **Success Criteria** | All AGENTS.md references cataloged in .specs/ and TESTING.md |
| **Parallel with:**   | Step 1.1 (Content Audit)                                     |
| **Blockers:**        | None                                                         |

**Subtasks:**

1. [ ] 1.2.1 Run grep to find all AGENTS.md references in repo
2. [ ] 1.2.2 Catalog references in .specs/templates/di-migration-guide.md (line 636)
3. [ ] 1.2.3 Catalog references in .specs/templates/di-quick-start.md (line 281)
4. [ ] 1.2.4 Catalog references in TESTING.md (line 4)

**Blockers:** None

**Risks:**

- **R8 (LOW):** Link updates missed → Files noted; updates out-of-scope for this task

**Verification:**

| Attribute     | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| **Level**     | MEDIUM                                                                              |
| **Method**    | Single judge                                                                        |
| **Threshold** | 4.0/5.0                                                                             |
| **Rationale** | Link audit is supporting evidence, not blocking. Catalog provides future reference. |

**Rubric:**

| Criterion          | Weight | Target                        |
| ------------------ | ------ | ----------------------------- |
| Reference Coverage | 40%    | Complete repo scan performed  |
| Catalog Accuracy   | 35%    | >80% of references documented |
| Risk Assessment    | 25%    | Breaking changes flagged      |

---

### Phase 2: Create Structure (45 minutes)

#### Step 2.1: Draft Root AGENTS.md

| Attribute            | Value                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Agent**            | opus                                                                                                                    |
| **Goal**             | Create navigation-focused root file (~200 lines)                                                                        |
| **Estimated Effort** | 30 minutes                                                                                                              |
| **Output**           | Root AGENTS.md with quick start, layer tree, navigation                                                                 |
| **Success Criteria** | <200 lines; contains quick start (5 bullets), layer decision tree, navigation links, 3 universal rules, skill reference |
| **Parallel with:**   | Steps 2.2-2.9 (leads coordination of per-package file creation)                                                         |
| **Blockers:**        | Step 1.1 (content mapping)                                                                                              |

**Subtasks:**

1. [ ] 2.1.1 Create header: "AGENTS.md — Quick Reference"
2. [ ] 2.1.2 Add quick start checklist (5 bullets: read conventions, check work, verify spec, baseline green, TDD first)
3. [ ] 2.1.3 Add layer decision tree ASCII diagram
4. [ ] 2.1.4 Add condensed per-pillar summaries (SDD, TDD, SADD, Kaizen → 3 bullets each)
5. [ ] 2.1.5 Create navigation section with per-package links table
6. [ ] 2.1.6 Add 3 universal rules (TDD first, Effect-based, branded IDs)
7. [ ] 2.1.7 Add condensed skill reference table (8 skills)
8. [ ] 2.1.8 Add Deep Reference footer linking to CLAUDE.md
9. [ ] 2.1.9 Verify line count <200; byte count <8 KiB

**Risks:**

- **R2 (HIGH):** File size exceeds 200 lines → Strict budget: 200 lines max

**Verification:**

| Attribute     | Value                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **Level**     | HIGH                                                                                                |
| **Method**    | Panel (3 judges)                                                                                    |
| **Threshold** | 4.5/5.0                                                                                             |
| **Rationale** | Root AGENTS.md sets style standard and navigation for all package files. Inconsistencies propagate. |

**Rubric:**

| Criterion               | Weight | Target                  |
| ----------------------- | ------ | ----------------------- |
| Size Compliance         | 25%    | <200 lines, <8 KiB      |
| Quick Start Quality     | 20%    | 5 actionable bullets    |
| Layer Decision Tree     | 20%    | Clear ASCII diagram     |
| Navigation Completeness | 20%    | All 9 packages linked   |
| Deep Reference          | 15%    | CLAUDE.md links present |

---

#### Step 2.2: Draft packages/domain/AGENTS.md (Parallel)

| Attribute            | Value                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| **Agent**            | sonnet                                                                           |
| **Goal**             | Domain-specific guidance (~120 lines)                                            |
| **Estimated Effort** | 30 minutes                                                                       |
| **Output**           | packages/domain/AGENTS.md                                                        |
| **Success Criteria** | Contains: purity checklist, entity template, branded ID pattern, common mistakes |
| **Parallel with:**   | Steps 2.1, 2.3-2.9 (all per-package files parallel)                              |
| **Blockers:**        | Step 1.1 (content mapping)                                                       |

**Subtasks:**

1. [ ] 2.2.1 Create header: "Domain Layer — Quick Reference"
2. [ ] 2.2.2 Add domain purity checklist (5 bullets)
3. [ ] 2.2.3 Add `Effect<T,E,never>` pattern explanation
4. [ ] 2.2.4 Add entity creation template (MyEntity example)
5. [ ] 2.2.5 Add branded ID factory pattern (UserId example)
6. [ ] 2.2.6 Add common mistakes section (4 bullets)
7. [ ] 2.2.7 Add Deep Reference section (CLAUDE.md §10.5.1)
8. [ ] 2.2.8 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| **Level**       | MEDIUM                                                         |
| **Method**      | Single judge                                                   |
| **Threshold**   | 4.0/5.0                                                        |
| **Key Content** | purity checklist, entity template, branded ID, common mistakes |

**Rubric:**

| Criterion         | Weight | Target                                 |
| ----------------- | ------ | -------------------------------------- |
| Header Clarity    | 15%    | Clear "Domain Layer — Quick Reference" |
| Required Content  | 35%    | All mapped content sections present    |
| Templates Correct | 25%    | Code patterns follow original          |
| Size Compliance   | 15%    | <200 lines (target: ~120)              |
| Deep Reference    | 10%    | CLAUDE.md §10.5.1 link                 |

---

#### Step 2.3: Draft packages/use-cases/AGENTS.md (Parallel)

| Attribute            | Value                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Agent**            | sonnet                                                                              |
| **Goal**             | Use case layer guidance (~130 lines)                                                |
| **Estimated Effort** | 30 minutes                                                                          |
| **Output**           | packages/use-cases/AGENTS.md                                                        |
| **Success Criteria** | Contains: Effect.gen patterns, use case template, test templates with Layer.provide |
| **Parallel with:**   | Steps 2.1, 2.2, 2.4-2.9 (all per-package files parallel)                            |
| **Blockers:**        | Step 1.1 (content mapping)                                                          |

**Subtasks:**

1. [ ] 2.3.1 Create header: "Use Case Layer — Quick Reference"
2. [ ] 2.3.2 Add `Effect.gen + yield*` pattern explanation
3. [ ] 2.3.3 Add Context.Tag DI pattern
4. [ ] 2.3.4 Add use case template (DoSomethingUseCase)
5. [ ] 2.3.5 Add port definition pattern (MyEntityRepository)
6. [ ] 2.3.6 Add test template with Layer.provide
7. [ ] 2.3.7 Add test template with container
8. [ ] 2.3.8 Add Deep Reference section (CLAUDE.md §10.4, §10.5.2)
9. [ ] 2.3.9 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| **Level**       | MEDIUM                                                     |
| **Method**      | Single judge                                               |
| **Threshold**   | 4.0/5.0                                                    |
| **Key Content** | Effect.gen patterns, use case template, Layer.provide test |

**Rubric:**

| Criterion         | Weight | Target                                   |
| ----------------- | ------ | ---------------------------------------- |
| Header Clarity    | 15%    | Clear "Use Case Layer — Quick Reference" |
| Required Content  | 35%    | All mapped content sections present      |
| Templates Correct | 25%    | Effect patterns follow original          |
| Size Compliance   | 15%    | <200 lines (target: ~130)                |
| Deep Reference    | 10%    | CLAUDE.md §10.4, §10.5.2 links           |

---

#### Step 2.4: Draft packages/adapters/AGENTS.md (Parallel)

| Attribute            | Value                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| **Agent**            | sonnet                                                                                            |
| **Goal**             | Adapter layer guidance (~140 lines)                                                               |
| **Estimated Effort** | 30 minutes                                                                                        |
| **Output**           | packages/adapters/AGENTS.md                                                                       |
| **Success Criteria** | Contains: awilix-modular patterns, controller auth, Effect.tryPromise, BasePrismaRepository rules |
| **Parallel with:**   | Steps 2.1, 2.2-2.3, 2.5-2.9 (all per-package files parallel)                                      |
| **Blockers:**        | Step 1.1 (content mapping)                                                                        |

**Subtasks:**

1. [ ] 2.4.1 Create header: "Adapter Layer — Quick Reference"
2. [ ] 2.4.2 Add awilix-modular DI patterns overview
3. [ ] 2.4.3 Add container resolution in routers pattern
4. [ ] 2.4.4 Add `Effect.tryPromise` for gateways pattern
5. [ ] 2.4.5 Add controller auth patterns (requireAuth, requireAdmin)
6. [ ] 2.4.6 Add BasePrismaRepository rules (allowed/not allowed)
7. [ ] 2.4.7 Add module structure pattern example
8. [ ] 2.4.8 Add scope strategy table
9. [ ] 2.4.9 Add Deep Reference section (CLAUDE.md §10.5.3)
10. [ ] 2.4.10 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| **Level**       | MEDIUM                                                                      |
| **Method**      | Single judge                                                                |
| **Threshold**   | 4.0/5.0                                                                     |
| **Key Content** | awilix-modular DI, controller auth, Effect.tryPromise, BasePrismaRepository |

**Rubric:**

| Criterion         | Weight | Target                                  |
| ----------------- | ------ | --------------------------------------- |
| Header Clarity    | 15%    | Clear "Adapter Layer — Quick Reference" |
| Required Content  | 35%    | All mapped content sections present     |
| Templates Correct | 25%    | DI patterns follow original             |
| Size Compliance   | 15%    | <200 lines (target: ~140)               |
| Deep Reference    | 10%    | CLAUDE.md §10.5.3 link                  |

---

#### Step 2.5: Draft packages/frameworks/AGENTS.md (Parallel)

| Attribute            | Value                                                               |
| -------------------- | ------------------------------------------------------------------- |
| **Agent**            | sonnet                                                              |
| **Goal**             | Framework layer guidance (~100 lines)                               |
| **Estimated Effort** | 20 minutes                                                          |
| **Output**           | packages/frameworks/AGENTS.md                                       |
| **Success Criteria** | Contains: Layer composition, awilix-modular modules, scope strategy |
| **Parallel with:**   | Steps 2.1, 2.2-2.4, 2.6-2.9 (all per-package files parallel)        |
| **Blockers:**        | Step 1.1 (content mapping)                                          |

**Subtasks:**

1. [ ] 2.5.1 Create header: "Framework Layer — Quick Reference"
2. [ ] 2.5.2 Add Layer composition patterns (Effect)
3. [ ] 2.5.3 Add awilix-modular module structure pattern
4. [ ] 2.5.4 Add scope strategy table (SINGLETON, SCOPED, TRANSIENT)
5. [ ] 2.5.5 Add DI wiring examples
6. [ ] 2.5.6 Add Deep Reference section (CLAUDE.md §10.4)
7. [ ] 2.5.7 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                                     |
| --------------- | --------------------------------------------------------- |
| **Level**       | MEDIUM                                                    |
| **Method**      | Single judge                                              |
| **Threshold**   | 4.0/5.0                                                   |
| **Key Content** | Layer composition, awilix-modular modules, scope strategy |

**Rubric:**

| Criterion        | Weight | Target                                    |
| ---------------- | ------ | ----------------------------------------- |
| Header Clarity   | 15%    | Clear "Framework Layer — Quick Reference" |
| Required Content | 35%    | All mapped content sections present       |
| Patterns Correct | 25%    | Layer composition patterns accurate       |
| Size Compliance  | 15%    | <200 lines (target: ~100)                 |
| Deep Reference   | 10%    | CLAUDE.md §10.4 link                      |

---

#### Step 2.6: Draft apps/backend-server/AGENTS.md (Parallel)

| Attribute            | Value                                                            |
| -------------------- | ---------------------------------------------------------------- |
| **Agent**            | haiku                                                            |
| **Goal**             | Backend server guidance (~80 lines)                              |
| **Estimated Effort** | 20 minutes                                                       |
| **Output**           | apps/backend-server/AGENTS.md                                    |
| **Success Criteria** | Contains: tRPC router patterns, controller resolution, auth flow |
| **Parallel with:**   | Steps 2.1, 2.2-2.5, 2.7-2.9 (all per-package files parallel)     |
| **Blockers:**        | Step 1.1 (content mapping)                                       |

**Subtasks:**

1. [ ] 2.6.1 Create header: "Backend Server — Quick Reference"
2. [ ] 2.6.2 Add tRPC router patterns overview
3. [ ] 2.6.3 Add controller resolution pattern in routers
4. [ ] 2.6.4 Add auth flow examples (requireAuth usage)
5. [ ] 2.6.5 Add router template example
6. [ ] 2.6.6 Add Deep Reference section (link to adapters/AGENTS.md)
7. [ ] 2.6.7 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                                  |
| --------------- | ------------------------------------------------------ |
| **Level**       | MEDIUM                                                 |
| **Method**      | Single judge                                           |
| **Threshold**   | 4.0/5.0                                                |
| **Key Content** | tRPC router patterns, controller resolution, auth flow |

**Rubric:**

| Criterion        | Weight | Target                                   |
| ---------------- | ------ | ---------------------------------------- |
| Header Clarity   | 15%    | Clear "Backend Server — Quick Reference" |
| Required Content | 35%    | All mapped content sections present      |
| Patterns Correct | 25%    | Router patterns follow original          |
| Size Compliance  | 15%    | <200 lines (target: ~80)                 |
| Deep Reference   | 10%    | Link to adapters/AGENTS.md               |

---

#### Step 2.7: Draft apps/native/AGENTS.md (Parallel)

| Attribute            | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Agent**            | haiku                                                        |
| **Goal**             | Native app guidance (~80 lines)                              |
| **Estimated Effort** | 20 minutes                                                   |
| **Output**           | apps/native/AGENTS.md                                        |
| **Success Criteria** | Contains: mobile patterns, Jest testing, navigation patterns |
| **Parallel with:**   | Steps 2.1, 2.2-2.6, 2.8-2.9 (all per-package files parallel) |
| **Blockers:**        | Step 1.1 (content mapping)                                   |

**Subtasks:**

1. [ ] 2.7.1 Create header: "Native App — Quick Reference"
2. [ ] 2.7.2 Add mobile development patterns overview
3. [ ] 2.7.3 Add Jest testing setup guidance
4. [ ] 2.7.4 Add navigation patterns for mobile
5. [ ] 2.7.5 Add platform-specific considerations (iOS/Android)
6. [ ] 2.7.6 Add Deep Reference section
7. [ ] 2.7.7 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                     |
| --------------- | ----------------------------------------- |
| **Level**       | MEDIUM                                    |
| **Method**      | Single judge                              |
| **Threshold**   | 4.0/5.0                                   |
| **Key Content** | mobile patterns, Jest testing, navigation |

**Rubric:**

| Criterion        | Weight | Target                               |
| ---------------- | ------ | ------------------------------------ |
| Header Clarity   | 15%    | Clear "Native App — Quick Reference" |
| Required Content | 35%    | All mapped content sections present  |
| Patterns Correct | 25%    | Mobile patterns accurate             |
| Size Compliance  | 15%    | <200 lines (target: ~80)             |
| Deep Reference   | 10%    | CLAUDE.md or related links           |

---

#### Step 2.8: Draft apps/notification-sender/AGENTS.md (Parallel)

| Attribute            | Value                                                    |
| -------------------- | -------------------------------------------------------- |
| **Agent**            | haiku                                                    |
| **Goal**             | Background job guidance (~60 lines)                      |
| **Estimated Effort** | 15 minutes                                               |
| **Output**           | apps/notification-sender/AGENTS.md                       |
| **Success Criteria** | Contains: background job patterns, Effect scheduling     |
| **Parallel with:**   | Steps 2.1, 2.2-2.7, 2.9 (all per-package files parallel) |
| **Blockers:**        | Step 1.1 (content mapping)                               |

**Subtasks:**

1. [ ] 2.8.1 Create header: "Notification Sender — Quick Reference"
2. [ ] 2.8.2 Add background job patterns overview
3. [ ] 2.8.3 Add Effect scheduling guidance
4. [ ] 2.8.4 Add job template example
5. [ ] 2.8.5 Add Deep Reference section
6. [ ] 2.8.6 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                      |
| --------------- | ------------------------------------------ |
| **Level**       | MEDIUM                                     |
| **Method**      | Single judge                               |
| **Threshold**   | 4.0/5.0                                    |
| **Key Content** | background job patterns, Effect scheduling |

**Rubric:**

| Criterion        | Weight | Target                                        |
| ---------------- | ------ | --------------------------------------------- |
| Header Clarity   | 15%    | Clear "Notification Sender — Quick Reference" |
| Required Content | 35%    | All mapped content sections present           |
| Patterns Correct | 25%    | Job patterns accurate                         |
| Size Compliance  | 15%    | <200 lines (target: ~60)                      |
| Deep Reference   | 10%    | CLAUDE.md links                               |

---

#### Step 2.9: Draft apps/web/AGENTS.md (Parallel)

| Attribute            | Value                                                   |
| -------------------- | ------------------------------------------------------- |
| **Agent**            | haiku                                                   |
| **Goal**             | Web frontend guidance (~80 lines)                       |
| **Estimated Effort** | 20 minutes                                              |
| **Output**           | apps/web/AGENTS.md                                      |
| **Success Criteria** | Contains: frontend component patterns, API client usage |
| **Parallel with:**   | Steps 2.1, 2.2-2.8 (all per-package files parallel)     |
| **Blockers:**        | Step 1.1 (content mapping)                              |

**Subtasks:**

1. [ ] 2.9.1 Create header: "Web Frontend — Quick Reference"
2. [ ] 2.9.2 Add frontend component patterns
3. [ ] 2.9.3 Add API client usage examples
4. [ ] 2.9.4 Add state management guidance
5. [ ] 2.9.5 Add Deep Reference section
6. [ ] 2.9.6 Verify line count <200

**Blockers:** Step 1.1

**Risks:** R2

**Verification:**

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Level**       | MEDIUM                                        |
| **Method**      | Single judge                                  |
| **Threshold**   | 4.0/5.0                                       |
| **Key Content** | frontend component patterns, API client usage |

**Rubric:**

| Criterion        | Weight | Target                                 |
| ---------------- | ------ | -------------------------------------- |
| Header Clarity   | 15%    | Clear "Web Frontend — Quick Reference" |
| Required Content | 35%    | All mapped content sections present    |
| Patterns Correct | 25%    | Frontend patterns accurate             |
| Size Compliance  | 15%    | <200 lines (target: ~80)               |
| Deep Reference   | 10%    | CLAUDE.md links                        |

---

### Phase 3: Replace Root (5 minutes)

#### Step 3.1: Backup and Replace Root AGENTS.md

| Attribute            | Value                                                                |
| -------------------- | -------------------------------------------------------------------- |
| **Agent**            | haiku                                                                |
| **Goal**             | Safely replace root AGENTS.md with navigation-focused version        |
| **Estimated Effort** | 5 minutes                                                            |
| **Output**           | New root AGENTS.md in place; backup created                          |
| **Success Criteria** | Original backed up as AGENTS.md.backup; new file loads without error |
| **Parallel with:**   | NONE (sequential gate)                                               |
| **Blockers:**        | Steps 2.1-2.9 (all draft files must be complete)                     |

**Subtasks:**

1. [ ] 3.1.1 Verify no uncommitted changes in AGENTS.md
2. [ ] 3.1.2 Create backup: `cp AGENTS.md AGENTS.md.backup`
3. [ ] 3.1.3 Move drafted root AGENTS.md in place
4. [ ] 3.1.4 Verify new file renders correctly (markdown syntax)

**Blockers:** Steps 2.1-2.9 (all draft files complete)

**Risks:**

- **R6 (MEDIUM):** Rollback needed but backup missing → Git-tracked backup ensures recovery

**Verification:**

| Attribute     | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| **Level**     | HIGH                                                                               |
| **Method**    | Panel (2 judges)                                                                   |
| **Threshold** | 4.5/5.0                                                                            |
| **Rationale** | Irreversible file replacement. Must verify backup integrity and correct placement. |

**Rubric:**

| Criterion           | Weight | Target                              |
| ------------------- | ------ | ----------------------------------- |
| Backup Integrity    | 35%    | Original file fully preserved       |
| Replacement Correct | 35%    | New file correctly placed and valid |
| Uncommitted Check   | 15%    | No uncommitted changes verified     |
| Render Test         | 15%    | Markdown renders without error      |

---

### Phase 4: Validation (20 minutes)

#### Step 4.1: Size Validation

| Attribute            | Value                                                                              |
| -------------------- | ---------------------------------------------------------------------------------- |
| **Agent**            | haiku                                                                              |
| **Goal**             | Verify all files meet size constraints (<200 lines, <8 KiB each; combined <32 KiB) |
| **Estimated Effort** | 10 minutes                                                                         |
| **Output**           | Size validation report                                                             |
| **Success Criteria** | Each file <200 lines; combined stack from any directory <32 KiB                    |
| **Parallel with:**   | Steps 4.2, 4.3, 4.4 (all validations parallel)                                     |
| **Blockers:**        | Step 3.1 (backup/replace complete)                                                 |

**Subtasks:**

1. [ ] 4.1.1 Measure each file line count (9 files + root)
2. [ ] 4.1.2 Measure each file byte count
3. [ ] 4.1.3 Calculate combined stack: root + packages/domain/
4. [ ] 4.1.4 Calculate combined stack: root + packages/use-cases/
5. [ ] 4.1.5 Calculate combined stack: root + packages/adapters/
6. [ ] 4.1.6 Calculate combined stack: root + packages/frameworks/
7. [ ] 4.1.7 Calculate combined stack: root + apps/backend-server/
8. [ ] 4.1.8 Calculate combined stack: root + apps/native/
9. [ ] 4.1.9 Calculate combined stack: root + apps/notification-sender/
10. [ ] 4.1.10 Calculate combined stack: root + apps/web/
11. [ ] 4.1.11 Verify all combined stacks <32 KiB
12. [ ] 4.1.12 Document size validation results

**Blockers:** Step 3.1

**Risks:**

- **R2 (HIGH):** Individual file exceeds 200 lines
- **R3 (HIGH):** Combined stack exceeds 32 KiB

**Verification:**

| Attribute     | Value                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| **Level**     | HIGH                                                                              |
| **Method**    | Panel (2 judges)                                                                  |
| **Threshold** | 4.5/5.0                                                                           |
| **Rationale** | Size validation is a hard gate. Undetected violations break Codex context limits. |

**Rubric:**

| Criterion          | Weight | Target                         |
| ------------------ | ------ | ------------------------------ |
| Individual Files   | 25%    | Each file <200 lines, <8 KiB   |
| Combined Stacks    | 40%    | All 9 combined stacks <32 KiB  |
| Measurement Method | 20%    | Accurate wc -l and du -h usage |
| Documentation      | 15%    | Results clearly documented     |

**Blockers:** Step 3.1

---

#### Step 4.2: Codex Discovery Testing

| Attribute            | Value                                                            |
| -------------------- | ---------------------------------------------------------------- |
| **Agent**            | haiku                                                            |
| **Goal**             | Verify Codex loads correct file stack from each directory        |
| **Estimated Effort** | 10 minutes                                                       |
| **Output**           | Discovery testing report                                         |
| **Success Criteria** | Codex discovers root + per-package AGENTS.md from each directory |
| **Parallel with:**   | Steps 4.1, 4.3, 4.4 (all validations parallel)                   |
| **Blockers:**        | Step 3.1 (backup/replace complete)                               |

**Subtasks:**

1. [ ] 4.2.1 Test discovery from repository root (should load root only)
2. [ ] 4.2.2 Test discovery from packages/domain/ (root + domain)
3. [ ] 4.2.3 Test discovery from packages/use-cases/ (root + use-cases)
4. [ ] 4.2.4 Test discovery from packages/adapters/ (root + adapters)
5. [ ] 4.2.5 Test discovery from packages/frameworks/ (root + frameworks)
6. [ ] 4.2.6 Test discovery from apps/backend-server/ (root + backend-server)
7. [ ] 4.2.7 Test discovery from apps/native/ (root + native)
8. [ ] 4.2.8 Test discovery from apps/notification-sender/ (root + notification-sender)
9. [ ] 4.2.9 Test discovery from apps/web/ (root + web)
10. [ ] 4.2.10 Document discovery results

**Blockers:** Step 3.1

**Risks:**

- **R5 (MEDIUM):** Discovery fails from subdirectory → Requires file location fix

**Verification:**

| Attribute     | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| **Level**     | HIGH                                                                                 |
| **Method**    | Panel (2 judges)                                                                     |
| **Threshold** | 4.5/5.0                                                                              |
| **Rationale** | Discovery testing validates the core hypothesis of this task (hierarchical loading). |

**Rubric:**

| Criterion           | Weight | Target                                |
| ------------------- | ------ | ------------------------------------- |
| Test Coverage       | 30%    | All 9 directories tested              |
| Method Correctness  | 30%    | Codex discovery simulation accurate   |
| Concatenation Order | 25%    | Verified root → package loading order |
| Results Documented  | 15%    | Clear pass/fail per directory         |

---

#### Step 4.3: Content Verification

| Attribute            | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Agent**            | opus                                                         |
| **Goal**             | Verify no essential guidance was lost during migration       |
| **Estimated Effort** | 15 minutes                                                   |
| **Output**           | Content verification report                                  |
| **Success Criteria** | 100% of essential guidance from original AGENTS.md preserved |
| **Parallel with:**   | Steps 4.1, 4.2, 4.4 (all validations parallel)               |
| **Blockers:**        | Step 3.1 (backup/replace complete)                           |

**Subtasks:**

1. [ ] 4.3.1 Compare original AGENTS.md.backup against new file set
2. [ ] 4.3.2 Verify entity template completeness (lines 125-156)
3. [ ] 4.3.3 Verify use case template completeness (lines 331-366)
4. [ ] 4.3.4 Verify branded ID pattern completeness (lines 505-543)
5. [ ] 4.3.5 Verify DI patterns completeness (lines 228-286)
6. [ ] 4.3.6 Verify controller auth patterns (lines 302-325)
7. [ ] 4.3.7 Verify layer decision tree preserved
8. [ ] 4.3.8 Document content verification results

**Blockers:** Step 3.1

**Risks:**

- **R1 (HIGH):** Essential guidance lost → Mitigated by systematic verification

**Verification:**

| Attribute     | Value                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Level**     | HIGH                                                                                           |
| **Method**    | Panel (3 judges)                                                                               |
| **Threshold** | 4.5/5.0                                                                                        |
| **Rationale** | Content verification protects against R1 (essential guidance loss). Judges rotate focus areas. |

**Rubric:**

| Criterion           | Weight | Target                  |
| ------------------- | ------ | ----------------------- |
| Entity Template     | 20%    | Lines 125-156 preserved |
| Use Case Template   | 20%    | Lines 331-366 preserved |
| Branded ID Pattern  | 20%    | Lines 505-543 preserved |
| DI Patterns         | 20%    | Lines 228-286 preserved |
| Layer Decision Tree | 20%    | ASCII tree preserved    |

---

#### Step 4.4: Cross-Reference Validation

| Attribute            | Value                                                         |
| -------------------- | ------------------------------------------------------------- |
| **Agent**            | opus                                                          |
| **Goal**             | Verify all CLAUDE.md cross-references are valid               |
| **Estimated Effort** | 10 minutes                                                    |
| **Output**           | Cross-reference validation report                             |
| **Success Criteria** | All CLAUDE.md section references exist; navigation links work |
| **Parallel with:**   | Steps 4.1, 4.2, 4.3 (all validations parallel)                |
| **Blockers:**        | Step 3.1 (backup/replace complete)                            |

**Subtasks:**

1. [ ] 4.4.1 Extract all CLAUDE.md section references from 10 files
2. [ ] 4.4.2 Verify each referenced section exists in CLAUDE.md
3. [ ] 4.4.3 Verify navigation links in root AGENTS.md are valid paths
4. [ ] 4.4.4 Document cross-reference validation

**Blockers:** Step 3.1

**Risks:**

- **R4 (MEDIUM):** Cross-references broken → Mitigated by section verification

**Verification:**

| Attribute     | Value                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| **Level**     | MEDIUM                                                                      |
| **Method**    | Single judge                                                                |
| **Threshold** | 4.0/5.0                                                                     |
| **Rationale** | Cross-references can be fixed post-creation without blocking the migration. |

**Rubric:**

| Criterion            | Weight | Target                           |
| -------------------- | ------ | -------------------------------- |
| Reference Extraction | 30%    | All refs extracted from 10 files |
| Section Existence    | 40%    | Each referenced section exists   |
| Navigation Links     | 20%    | Package links are valid paths    |
| Documentation        | 10%    | Results documented               |

---

### Phase 5: Cleanup (5 minutes)

#### Step 5.1: Archive Backup

| Attribute            | Value                                             |
| -------------------- | ------------------------------------------------- |
| **Agent**            | haiku                                             |
| **Goal**             | Archive backup file after successful validation   |
| **Estimated Effort** | 5 minutes                                         |
| **Output**           | AGENTS.md.backup moved to .specs/archive/         |
| **Success Criteria** | Backup preserved in archive; task marked complete |
| **Parallel with:**   | NONE (sequential - final step)                    |
| **Blockers:**        | Steps 4.1, 4.2, 4.3, 4.4 (all validations passed) |

**Subtasks:**

1. [ ] 5.1.1 Verify Phase 4 all validations passed
2. [ ] 5.1.2 Move AGENTS.md.backup to .specs/archive/
3. [ ] 5.1.3 Update task status to done

**Blockers:** Steps 4.1, 4.2, 4.3, 4.4 (all validations passed)

**Risks:** None (backup preserved in archive)

**Verification:**

| Attribute     | Value                                          |
| ------------- | ---------------------------------------------- |
| **Level**     | LOW                                            |
| **Method**    | Per-item check                                 |
| **Threshold** | Pass/Fail                                      |
| **Rationale** | Simple file move operation with binary checks. |

**Checklist:**

| Check              | Expected                   | Pass Criteria           |
| ------------------ | -------------------------- | ----------------------- |
| Backup file exists | `AGENTS.md.backup` in root | File exists before move |
| Destination exists | `.specs/archive/`          | Directory exists        |
| Move successful    | File in `.specs/archive/`  | File at destination     |
| Original removed   | No backup in root          | File not in root        |
| Task updated       | Status "done"              | Status field correct    |

---

## Implementation Summary

| Phase             | Steps  | Duration   | Parallelism         | Critical Path       |
| ----------------- | ------ | ---------- | ------------------- | ------------------- |
| Phase 1: Audit    | 2      | 15 min     | Sequential          | Yes (Step 1.1)      |
| Phase 2: Create   | 9      | 45 min     | 8 parallel + 1 lead | Yes (Step 2.1)      |
| Phase 3: Replace  | 1      | 5 min      | Sequential          | Yes (Step 3.1)      |
| Phase 4: Validate | 4      | 20 min     | Partial parallel    | Yes (Step 4.1, 4.2) |
| Phase 5: Cleanup  | 1      | 5 min      | Sequential          | No                  |
| **Total**         | **17** | **90 min** | **Mixed**           | **6 steps**         |

### Critical Path Steps

1. **Step 1.1:** Content audit and mapping (15 min) - BLOCKS ALL
2. **Step 2.1:** Draft root AGENTS.md (30 min) - BLOCKS Phase 3
3. **Step 2.2-2.9:** Draft per-package files (30 min parallel) - BLOCKS Phase 3
4. **Step 3.1:** Backup and replace root (5 min) - BLOCKS Phase 4
5. **Step 4.1:** Size validation (10 min) - BLOCKS Phase 5
6. **Step 4.2:** Codex discovery testing (10 min) - BLOCKS Phase 5

**Critical Path Duration:** 80 minutes

### Subtasks Summary

| Phase     | Subtasks |
| --------- | -------- |
| Phase 1   | 9        |
| Phase 2   | 67       |
| Phase 3   | 4        |
| Phase 4   | 34       |
| Phase 5   | 3        |
| **Total** | **117**  |

### Risks Summary

| Risk ID | Description                                   | Probability | Impact | Priority |
| ------- | --------------------------------------------- | ----------- | ------ | -------- |
| R1      | Essential guidance lost during split          | Medium      | High   | **HIGH** |
| R2      | File size exceeds 200 lines                   | Medium      | Medium | **HIGH** |
| R3      | Combined stack exceeds 32 KiB                 | Low         | High   | **HIGH** |
| R4      | Cross-references to CLAUDE.md broken          | Medium      | Medium | MEDIUM   |
| R5      | Codex discovery fails from subdirectory       | Low         | High   | MEDIUM   |
| R6      | Rollback needed but backup missing            | Low         | High   | MEDIUM   |
| R7      | Parallel subagents produce inconsistent style | Medium      | Low    | LOW      |
| R8      | Link updates in docs/ missed                  | Medium      | Low    | LOW      |

**High Priority Risks:** 3 (R1, R2, R3)

---

## Verification Summary

> **Full verification details:** See `.specs/scratchpad/verification-b4e28de877f7.md` for detailed rubrics, judge selection rationale, and execution notes.

### Verification Overview Table

| Step | Phase    | Name                                     | Level  | Method    | Threshold |
| ---- | -------- | ---------------------------------------- | ------ | --------- | --------- |
| 1.1  | Audit    | Content Audit and Mapping                | HIGH   | Panel (2) | 4.5/5.0   |
| 1.2  | Audit    | Link Audit                               | MEDIUM | Single    | 4.0/5.0   |
| 2.1  | Create   | Draft Root AGENTS.md                     | HIGH   | Panel (3) | 4.5/5.0   |
| 2.2  | Create   | Draft packages/domain/AGENTS.md          | MEDIUM | Single    | 4.0/5.0   |
| 2.3  | Create   | Draft packages/use-cases/AGENTS.md       | MEDIUM | Single    | 4.0/5.0   |
| 2.4  | Create   | Draft packages/adapters/AGENTS.md        | MEDIUM | Single    | 4.0/5.0   |
| 2.5  | Create   | Draft packages/frameworks/AGENTS.md      | MEDIUM | Single    | 4.0/5.0   |
| 2.6  | Create   | Draft apps/backend-server/AGENTS.md      | MEDIUM | Single    | 4.0/5.0   |
| 2.7  | Create   | Draft apps/native/AGENTS.md              | MEDIUM | Single    | 4.0/5.0   |
| 2.8  | Create   | Draft apps/notification-sender/AGENTS.md | MEDIUM | Single    | 4.0/5.0   |
| 2.9  | Create   | Draft apps/web/AGENTS.md                 | MEDIUM | Single    | 4.0/5.0   |
| 3.1  | Replace  | Backup and Replace Root AGENTS.md        | HIGH   | Panel (2) | 4.5/5.0   |
| 4.1  | Validate | Size Validation                          | HIGH   | Panel (2) | 4.5/5.0   |
| 4.2  | Validate | Codex Discovery Testing                  | HIGH   | Panel (2) | 4.5/5.0   |
| 4.3  | Validate | Content Verification                     | HIGH   | Panel (3) | 4.5/5.0   |
| 4.4  | Validate | Cross-Reference Validation               | MEDIUM | Single    | 4.0/5.0   |
| 5.1  | Cleanup  | Archive Backup                           | LOW    | Per-Item  | Pass/Fail |

### Verification Breakdown

| Level Type             | Count  | Steps                                            |
| ---------------------- | ------ | ------------------------------------------------ |
| **Panel (2-3 judges)** | 6      | 1.1, 2.1, 3.1, 4.1, 4.2, 4.3                     |
| **Single Judge**       | 10     | 1.2, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 4.4 |
| **Per-Item Check**     | 1      | 5.1                                              |
| **Total Evaluations**  | **17** | —                                                |

### Judge Selection Rationale

**Panel Evaluation (HIGH):** Used when:

- Single point of failure — Errors would cascade downstream
- Content integrity risk — Risk of losing essential guidance
- Irreversible operations — File replacement cannot be easily undone
- Validation gates — Must be objectively correct to proceed

**Single Evaluation (MEDIUM):** Used when:

- Isolated scope — Errors contained to single package
- Follows template — Pattern established by root file
- Parallel execution — No dependencies between steps

**Per-Item Check (LOW):** Used for simple binary operations with clear pass/fail criteria.

---

## Definition of Done (Revised)

### File Structure (AC-001 to AC-009)

- [ ] **AC-001:** Root AGENTS.md exists with quick start + layer decision tree + navigation links
- [ ] **AC-002:** packages/domain/AGENTS.md exists with domain purity rules, entity template, branded IDs
- [ ] **AC-003:** packages/use-cases/AGENTS.md exists with Effect.gen patterns, use case template, test templates
- [ ] **AC-004:** packages/adapters/AGENTS.md exists with DI patterns, controller auth, BasePrismaRepository rules
- [ ] **AC-005:** packages/frameworks/AGENTS.md exists with Layer composition, awilix-modular modules
- [ ] **AC-006:** apps/backend-server/AGENTS.md exists with tRPC routers, controller resolution, auth flow
- [ ] **AC-007:** apps/native/AGENTS.md exists with mobile patterns, Jest testing, navigation
- [ ] **AC-008:** apps/notification-sender/AGENTS.md exists with background job patterns, Effect scheduling
- [ ] **AC-009:** apps/web/AGENTS.md exists with frontend patterns, API client usage

### Content Quality (AC-010 to AC-012)

- [ ] **AC-010:** Every file ends with Deep Reference section linking to CLAUDE.md
- [ ] **AC-011:** Combined stack <32 KiB from any directory (validated in Step 4.1)
- [ ] **AC-012:** 100% of essential guidance preserved (validated in Step 4.3)

### Implementation Verification

- [ ] Original AGENTS.md backed up as AGENTS.md.backup (Step 3.1)
- [ ] No duplicate content between files (Step 4.3)
- [ ] All cross-references use correct CLAUDE.md section numbers (Step 4.4)
- [ ] Codex discovery verified from all 9 directories (Step 4.2)
- [ ] All files <200 lines (Step 4.1)
- [ ] All files <8 KiB individually (Step 4.1)
- [ ] Backup archived to .specs/archive/ (Step 5.1)

---

## Sub-Agent Execution Directive

> **PARALLELIZATION PLAN:** See scratchpad `.specs/scratchpad/parallelize-4c0da7c5.md` for full execution flow diagram.

### Launch Sequence

Execute phases sequentially, launching sub-agents within each phase according to parallelization annotations:

```bash
# PHASE 1: Audit (15 min) - Launch 2 agents in parallel
sdd:launch-sub-agent step-1.1-content-audit sonnet
sdd:launch-sub-agent step-1.2-link-audit haiku

# Wait for Phase 1 completion, then:

# PHASE 2: Create Structure (30 min burst) - Launch 9 agents in parallel
sdd:launch-sub-agent step-2.1-root-agents-md opus
sdd:launch-sub-agent step-2.2-domain-agents-md sonnet
sdd:launch-sub-agent step-2.3-use-cases-agents-md sonnet
sdd:launch-sub-agent step-2.4-adapters-agents-md sonnet
sdd:launch-sub-agent step-2.5-frameworks-agents-md sonnet
sdd:launch-sub-agent step-2.6-backend-server-agents-md haiku
sdd:launch-sub-agent step-2.7-native-agents-md haiku
sdd:launch-sub-agent step-2.8-notification-sender-agents-md haiku
sdd:launch-sub-agent step-2.9-web-agents-md haiku

# Wait for all Phase 2 agents, then:

# PHASE 3: Replace Root (5 min) - Sequential gate
sdd:launch-sub-agent step-3.1-backup-replace haiku

# Wait for Phase 3, then:

# PHASE 4: Validation (15 min parallel) - Launch 4 agents in parallel
sdd:launch-sub-agent step-4.1-size-validation haiku
sdd:launch-sub-agent step-4.2-discovery-testing haiku
sdd:launch-sub-agent step-4.3-content-verification opus
sdd:launch-sub-agent step-4.4-cross-reference-validation opus

# Wait for all Phase 4 agents, then:

# PHASE 5: Cleanup (5 min) - Final sequential step
sdd:launch-sub-agent step-5.1-archive-backup haiku
```

### Quality Gates

1. **Gate 1 (post-Phase 1):** Content mapping approved → triggers Phase 2 burst
2. **Gate 2 (post-Phase 2):** All 9 AGENTS.md files complete → triggers Phase 3
3. **Gate 3 (post-Phase 3):** Backup/replace confirmed → triggers Phase 4 validations
4. **Gate 4 (post-Phase 4):** All 4 validations pass → triggers Phase 5 cleanup

### Agent Coordination Rules

- **Critical path agents (opus):** Steps 2.1, 4.3, 4.4 require thoroughness over speed
- **Parallel agents (sonnet/haiku):** Package-specific files can diverge; root file sets the standard
- **Safety checks:** Even parallel validation steps must all pass before cleanup
- **Risk mitigation:** R1 (content loss) covered by opus-level verification in 4.3
