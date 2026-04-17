# Analysis: Implement Layered AGENTS.md Structure

**Task:** Split AGENTS.md into hierarchical structure per OpenAI Codex guidelines
**Generated:** 2026-04-14
**Analysis ID:** 281bc200c8550595

---

## Executive Summary

This analysis identifies all files affected by splitting the 611-line AGENTS.md into a layered structure following OpenAI Codex discovery rules. The monorepo has 4 packages and 5 apps, requiring 9 new AGENTS.md files plus modifications to the root AGENTS.md.

---

## Current State Analysis

### Root AGENTS.md Structure (611 lines)

| Section                  | Lines   | Content Type         | Destination                    |
| ------------------------ | ------- | -------------------- | ------------------------------ |
| Header + Quick Start     | 1-28    | Navigation/Checklist | Root (keep)                    |
| Test Output Config       | 19-27   | Config               | Root (keep)                    |
| Layer Decision Tree      | 31-56   | Diagram              | Root (keep)                    |
| SDD Section              | 62-79   | Pillar guidance      | Root (condense)                |
| TDD Section              | 82-111  | Testing rules        | Root + use-cases               |
| DDD Section              | 115-163 | Domain rules         | packages/domain                |
| SADD Section             | 167-207 | Subagent patterns    | Root (condense)                |
| Kaizen Section           | 210-225 | Improvement          | Root (condense)                |
| DI Patterns (awilix)     | 228-286 | Framework DI         | packages/adapters + frameworks |
| End-to-End Feature Flow  | 291-298 | Workflow             | Root (condense)                |
| Auth in Controllers      | 302-325 | Controller pattern   | packages/adapters              |
| Use Case Templates       | 331-438 | Templates            | packages/use-cases             |
| Adapter Repository Rules | 443-450 | Gateway rules        | packages/adapters              |
| Test Execution           | 454-478 | Commands             | Root (keep)                    |
| Troubleshooting          | 482-499 | Debug guide          | Root (condense)                |
| Common Patterns (3x)     | 503-592 | Reusable patterns    | Split by layer                 |
| Skill Reference          | 595-606 | Index                | Root (keep)                    |
| Footer                   | 610-611 | Meta                 | Root (keep)                    |

### CLAUDE.md Overlap Analysis (2194 lines)

| CLAUDE.md Section     | AGENTS.md Overlap             | Strategy                                            |
| --------------------- | ----------------------------- | --------------------------------------------------- |
| §2 Clean Architecture | Layer decision tree           | Deduplicate - keep diagram in AGENTS.md root only   |
| §4 TDD Conventions    | Testing rules                 | Reference from AGENTS.md, keep details in CLAUDE.md |
| §5.1 Domain Layer     | DDD section, entity template  | Move domain-specific to packages/domain             |
| §5.3 Use Cases Layer  | Use case templates            | Move to packages/use-cases                          |
| §5.3 Adapters Layer   | DI patterns, gateway patterns | Move to packages/adapters                           |
| §5.4 Frameworks Layer | Module structure              | Move to packages/frameworks                         |
| §10 Effect Patterns   | Comprehensive guide           | Keep encyclopedic content in CLAUDE.md only         |

---

## Affected Files Inventory

### Files to Create (9 new AGENTS.md files)

| #   | File Path                            | Source Lines                                          | Est. Size  | Purpose                              |
| --- | ------------------------------------ | ----------------------------------------------------- | ---------- | ------------------------------------ |
| 1   | `packages/domain/AGENTS.md`          | AGENTS.md 117-123, 277-331, 505-543, 125-156, 158-163 | ~120 lines | Domain purity, entities, branded IDs |
| 2   | `packages/use-cases/AGENTS.md`       | AGENTS.md 191-199, 331-366, 369-411, 495-506          | ~130 lines | Effect orchestration, ports, tests   |
| 3   | `packages/adapters/AGENTS.md`        | AGENTS.md 228-286, 246-258, 302-325, 443-450          | ~140 lines | DI, controllers, gateways            |
| 4   | `packages/frameworks/AGENTS.md`      | AGENTS.md 260-276, 279-286                            | ~100 lines | Layer composition, scopes            |
| 5   | `apps/backend-server/AGENTS.md`      | New content                                           | ~80 lines  | tRPC, auth flow specifics            |
| 6   | `apps/native/AGENTS.md`              | New content                                           | ~80 lines  | Mobile patterns, Jest                |
| 7   | `apps/notification-sender/AGENTS.md` | New content                                           | ~60 lines  | Background jobs                      |
| 8   | `apps/web/AGENTS.md`                 | New content                                           | ~80 lines  | Frontend patterns                    |
| 9   | `apps/seed/AGENTS.md`                | Not needed                                            | N/A        | Inherits root (no override)          |

### Files to Modify (1 file)

| #   | File Path   | Change Type   | Description                                          |
| --- | ----------- | ------------- | ---------------------------------------------------- |
| 1   | `AGENTS.md` | Major rewrite | Reduce from 611 to ~200 lines; become navigation hub |

### Files to Archive (1 file - backup)

| #   | File Path          | Action | Description                        |
| --- | ------------------ | ------ | ---------------------------------- |
| 1   | `AGENTS.md.backup` | Create | Backup original before replacement |

### Files Referencing AGENTS.md (106 occurrences)

These files contain references to `AGENTS.md` and may need link updates:

**Critical References (may need updates):**

- `.specs/templates/di-migration-guide.md` - Line 636: `[AGENTS.md](../../AGENTS.md)`
- `.specs/templates/di-quick-start.md` - Line 281: `[AGENTS.md](../../AGENTS.md)`
- `TESTING.md` - Line 4: Aligns with AGENTS.md v1.0.3
- `.specs/analysis/KAIZEN-CYCLES-COMPLETE.md` - Pattern documentation references

**Spec References (likely need navigation updates):**

- Multiple `.specs/plans/` files reference AGENTS.md for conventions
- `.specs/archive/` historical references (keep as-is)

**Git References (no action needed):**

- `.git/logs/` commit history references

---

## Integration Points & Risks

### Risk Assessment: MEDIUM

**Primary Risks:**

1. **Broken Links**: Spec files link to specific AGENTS.md sections that will move
2. **Agent Confusion**: Sudden structure change may confuse agents mid-task
3. **Content Loss**: 611 lines → ~200 lines risks losing practical guidance

**Mitigation Strategies:**

1. Create comprehensive cross-reference table for link updates
2. Update skill references to point to new locations
3. Keep all practical checklists (no encyclopedic content in root)
4. Add redirect section in root AGENTS.md for first 2 weeks

### Key Integration Points

1. **Skill Command Integration**
   - SDD skills reference AGENTS.md for layer decision tree
   - TDD skills reference testing templates
   - Must update skill documentation to point to new per-package locations

2. **Template File Integration**
   - `.specs/templates/di-migration-guide.md` links to AGENTS.md DI section
   - After split, this link should point to `packages/adapters/AGENTS.md`

3. **CLAUDE.md Cross-Reference Integrity**
   - Every per-package AGENTS.md must end with: `For comprehensive patterns, see CLAUDE.md §X.X`
   - CLAUDE.md section references must remain valid

---

## Directory Structure

```
AGENTS.md                          # MODIFIED: Navigation hub (~200 lines)
AGENTS.md.backup                   # CREATED: Archive of original
packages/
  adapters/AGENTS.md               # CREATED: DI + controller patterns (~140 lines)
  domain/AGENTS.md                 # CREATED: Domain purity + entities (~120 lines)
  frameworks/AGENTS.md             # CREATED: Layer composition (~100 lines)
  use-cases/AGENTS.md              # CREATED: Effect orchestration (~130 lines)
  graphql-client/                  # NO CHANGE: No AGENTS.md (inherits root)
  shared/                          # NO CHANGE: No AGENTS.md (inherits root)
apps/
  backend-server/AGENTS.md         # CREATED: tRPC + auth (~80 lines)
  native/AGENTS.md                 # CREATED: Mobile + Jest (~80 lines)
  notification-sender/AGENTS.md    # CREATED: Background jobs (~60 lines)
  web/AGENTS.md                    # CREATED: Frontend patterns (~80 lines)
  seed/                            # NO CHANGE: Inherits root guidance
```

---

## Size Validation Matrix

| Directory Stack     | Root AGENTS.md | Package AGENTS.md | Total Lines | Est. Size |
| ------------------- | -------------- | ----------------- | ----------- | --------- |
| packages/domain     | ~200 lines     | ~120 lines        | ~320 lines  | ~12 KiB   |
| packages/use-cases  | ~200 lines     | ~130 lines        | ~330 lines  | ~13 KiB   |
| packages/adapters   | ~200 lines     | ~140 lines        | ~340 lines  | ~13 KiB   |
| packages/frameworks | ~200 lines     | ~100 lines        | ~300 lines  | ~12 KiB   |
| apps/backend-server | ~200 lines     | ~80 lines         | ~280 lines  | ~11 KiB   |
| apps/native         | ~200 lines     | ~80 lines         | ~280 lines  | ~11 KiB   |
| apps/web            | ~200 lines     | ~80 lines         | ~280 lines  | ~11 KiB   |

**All stacks <32 KiB limit** ✅

---

## Content Extraction Map

### From AGENTS.md to packages/domain/AGENTS.md:

```
Lines 117-123: Domain purity rules
Lines 125-156: Entity template (MyEntity example)
Lines 277-331: Effect<T,E,never> pattern
Lines 505-543: Branded ID factory pattern
Lines 158-163: Common mistakes
```

### From AGENTS.md to packages/use-cases/AGENTS.md:

```
Lines 191-199: Effect.gen + yield* patterns
Lines 331-366: Use case template (DoSomething)
Lines 369-411: Test templates (Layer.provide)
Lines 495-506: Port definition pattern (from skill reference)
Lines 173-180: Quality gates table (SADD section)
```

### From AGENTS.md to packages/adapters/AGENTS.md:

```
Lines 228-286: awilix-modular patterns
Lines 246-258: Container resolution in routers
Lines 302-325: Controller auth patterns
Lines 443-450: Adapter repository rules
Lines 260-276: Module structure pattern
Lines 279-286: Scope strategy table
```

### From AGENTS.md to packages/frameworks/AGENTS.md:

```
Lines 260-276: Module structure pattern (awilix)
Lines 279-286: Scope strategy
Lines from CLAUDE.md §10.4: Layer composition patterns
```

### Root AGENTS.md Keeps:

```
Lines 1-28: Header + Quick start checklist
Lines 31-56: Layer decision tree
Lines 62-79: SDD summary (condensed)
Lines 82-111: TDD summary (condensed)
Lines 167-207: SADD summary (condensed)
Lines 210-225: Kaizen summary (condensed)
Lines 454-478: Test execution commands
Lines 482-499: Troubleshooting (condensed)
Lines 595-606: Skill reference (condensed)
Lines 610-611: Footer
```

---

## Rollback & Validation Plan

### Phase 1: Pre-implementation

- [ ] Create all 9 new files in draft
- [ ] Validate cross-references work
- [ ] Run link checker on spec files

### Phase 2: Implementation

- [ ] Backup: `git mv AGENTS.md AGENTS.md.backup`
- [ ] Create new root AGENTS.md
- [ ] Verify all new files exist

### Phase 3: Post-implementation

- [ ] Test agent discovery from each package directory
- [ ] Validate total stack size <32 KiB
- [ ] Update critical spec file links

### Rollback Command:

```bash
git mv AGENTS.md AGENTS.md.backup.$(date +%Y%m%d)
git mv AGENTS.md.backup AGENTS.md
```

---

## Conclusion

**Files Affected:** 11 total (9 create, 1 modify, 1 backup)
**Risk Level:** MEDIUM - Mitigatable with careful link updates
**Integration Points:** 3 primary (Skills, Templates, CLAUDE.md cross-refs)

The layered structure aligns with Clean Architecture and enables package-specific guidance while maintaining the <32 KiB Codex limit.
