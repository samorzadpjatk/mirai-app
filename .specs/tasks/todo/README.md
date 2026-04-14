# Task Conversion Summary

**Date:** 2026-04-14  
**Action:** Converted 3 actionable plans to implementation tasks

---

## Converted Tasks

### Task 1: Simplify Domain Entities

| Attribute       | Value                                                |
| --------------- | ---------------------------------------------------- |
| **File**        | `.specs/tasks/todo/simplify-domain-entities.task.md` |
| **Source Plan** | `.specs/plans/simplify-domain-entities.design.md`    |
| **Priority**    | High                                                 |
| **Status**      | Ready                                                |
| **Effort**      | 11-16 hours                                          |
| **Impact**      | 65% code reduction (~2,300 lines eliminated)         |

**Summary:**  
Extract shared infrastructure from 35 entity files, nest 7 child entities as interfaces, reduce to 21 aggregate roots. Creates validation framework, state machine factory, immutable helpers, and entity helpers.

**Key Deliverables:**

- `packages/domain/src/utils/entity-validation.ts`
- `packages/domain/src/utils/state-machine.ts`
- `packages/domain/src/utils/immutable.ts`
- `packages/domain/src/utils/entity-helpers.ts`
- 21 simplified aggregate root entities

---

### Task 2: Refactor Use Cases to Result<T,E>

| Attribute       | Value                                                    |
| --------------- | -------------------------------------------------------- |
| **File**        | `.specs/tasks/todo/refactor-use-cases-to-result.task.md` |
| **Source Plan** | `.specs/plans/use-case-result-refactor.design.md`        |
| **Priority**    | High                                                     |
| **Status**      | Ready                                                    |
| **Effort**      | 7-10 hours                                               |
| **Impact**      | Uniform error handling, ~370 type errors eliminated      |

**Summary:**  
Convert 13 throwing use cases to Result-based pattern. Update 7 controllers to use consistent `result.kind === "err"` pattern. Aligns all 88+ use cases to single error handling approach.

**Files to Modify:**

- 13 use cases in `packages/use-cases/src/interactors/`
- 7 controllers in `packages/adapters/src/controllers/`

**Key Deliverables:**

- All use cases return `Result<T, DomainError>`
- All controllers use uniform result checking
- Type consistency in adapters package

---

### Task 3: Fix Adapters Type Errors

| Attribute       | Value                                                |
| --------------- | ---------------------------------------------------- |
| **File**        | `.specs/tasks/todo/fix-adapters-type-errors.task.md` |
| **Source Plan** | `.specs/plans/adapters-type-errors.design.md`        |
| **Priority**    | Medium                                               |
| **Status**      | Ready                                                |
| **Effort**      | 7-11 hours                                           |
| **Impact**      | Zero TypeScript errors in adapters package           |

**Summary:**  
Fix remaining 63 TypeScript errors in adapters package (down from 338). Resolve module dependencies, error class modifiers, controller DTOs, mapper types, and repository types.

**Phases:**

1. Missing dependencies (~15 errors)
2. Error class modifiers (~5 errors)
3. Controller DTO alignment (~10 errors)
4. Mapper fixes (~20 errors)
5. Repository fixes (~13 errors)

**Key Deliverables:**

- `bunx tsc --noEmit` shows 0 errors in adapters package
- All imports resolve correctly
- All types aligned across layers

---

## Execution Order Recommendation

While tasks can run in parallel, this order minimizes rework:

```
1. simplify-domain-entities (foundational utilities)
   ↓
2. refactor-use-cases-to-result (aligns with domain patterns)
   ↓
3. fix-adapters-type-errors (benefits from aligned use cases)
```

**Alternative:** Run #2 and #3 in parallel since they're independent.

---

## Quick Start Commands

**Execute with SDD implement:**

```bash
/sdd:implement .specs/tasks/todo/simplify-domain-entities.task.md
/sdd:implement .specs/tasks/todo/refactor-use-cases-to-result.task.md
/sdd:implement .specs/tasks/todo/fix-adapters-type-errors.task.md
```

**Execute in parallel with SADD:**

```bash
/sadd:do-in-parallel \
  "simplify-domain-entities.task.md" \
  "refactor-use-cases-to-result.task.md"
```

---

## Total Impact Projection

| Metric               | Current   | After All Tasks |
| -------------------- | --------- | --------------- |
| Domain entity files  | 35        | 21 (-40%)       |
| Domain LOC           | ~3,500    | ~1,200 (-65%)   |
| Use case patterns    | 2 (mixed) | 1 (uniform)     |
| Adapters type errors | 63        | 0               |
| Throwing use cases   | 13        | 0               |
| **Total effort**     | -         | **25-37 hours** |

---

## Plan Updates

All 3 source plans have been marked as **"Converted to Task"** with links to their respective task files:

- ✅ `simplify-domain-entities.design.md`
- ✅ `use-case-result-refactor.design.md`
- ✅ `adapters-type-errors.design.md`

---

**Next Step:** Use `/sdd:implement` or `/sadd:do-in-parallel` to execute these tasks.
