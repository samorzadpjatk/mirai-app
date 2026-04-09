# SDD Workflow: Specification-Driven Development

## Overview

This workflow defines the process for Specification-Driven Development (SDD) in the Mirai App monorepo. All features, refactors, and significant changes must follow this workflow.

## Task Lifecycle

```
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌─────────┐
│  DRAFT  │───>│  TODO   │───>│ IN-PROGRESS │───>│  DONE   │
└─────────┘    └─────────┘    └─────────────┘    └─────────┘
     │                              │                │
     │                              │                │
     └──────────────────────────────┴────────────────┘
                    (can revert)
```

### State Definitions

#### DRAFT

- **Location:** `.specs/tasks/draft/`
- **Purpose:** Initial idea capture, rough specifications
- **Quality:** Brainstorming level, not ready for implementation
- **Transitions:**
  - → TODO: After refinement with acceptance criteria and architecture overview
  - Archive if abandoned

#### TODO

- **Location:** `.specs/tasks/todo/`
- **Purpose:** Ready for implementation
- **Quality:** Complete specification with:
  - Clear description and scope
  - Acceptance criteria (Given-When-Then format)
  - Architecture overview (for structural changes)
  - Implementation steps defined
- **Transitions:**
  - → IN-PROGRESS: When work begins

#### IN-PROGRESS

- **Location:** `.specs/tasks/in-progress/`
- **Purpose:** Currently being implemented
- **Quality:** Under active development
- **Transitions:**
  - → DONE: When complete and verified
  - → TODO: If implementation blocked or abandoned

#### DONE

- **Location:** `.specs/tasks/done/`
- **Purpose:** Completed and verified work
- **Quality:**
  - All acceptance criteria met
  - Tests passing
  - Code reviewed
  - Documentation updated
- **Retention:** Keep for reference; archive quarterly

## Workflow Commands

### Creating a New Task

```bash
# Use the sdd:add-task skill
/sdd:add-task
```

This creates a new draft task in `.specs/tasks/draft/` with:

- Proper frontmatter
- Template sections
- Auto-generated filename

### Refining a Task

```bash
# Move from draft to todo when ready
mv .specs/tasks/draft/my-feature.feature.md .specs/tasks/todo/
```

### Starting Implementation

```bash
# Move to in-progress when beginning work
mv .specs/tasks/todo/my-feature.feature.md .specs/tasks/in-progress/
```

### Completing a Task

```bash
# Move to done when complete and verified
mv .specs/tasks/in-progress/my-feature.feature.md .specs/tasks/done/
```

## Task Quality Standards

### Required Sections

Every task in TODO or later must have:

1. **Title** (frontmatter)
2. **Description**
   - Why it's needed
   - What it accomplishes
   - Scope boundaries
3. **Acceptance Criteria**
   - Functional criteria (Given-When-Then)
   - Non-functional criteria (performance, etc.)
4. **Architecture Overview** (for structural changes)
   - Current state
   - Target state
   - Migration strategy
5. **Implementation Process**
   - Step-by-step breakdown
   - Agent assignments
   - Verification criteria
6. **Definition of Done**
   - Completion checklist

### Acceptance Criteria Format

Use Given-When-Then format for clarity:

```
Given [context]
When [action]
Then [expected result]
```

Example:

```
Given a user is on the login page
When they enter valid credentials
Then they are redirected to the dashboard
```

## Subagent Patterns

### Parallel Execution

For independent tasks that can be worked on simultaneously:

```
Step 1: Task A ──────────────────────>
Step 2: Task B ──────────────────────>  (parallel with A)
Step 3: Task C ──────────────────────>  (depends on A and B)
```

### Sequential Execution

For dependent tasks that must be completed in order:

```
Step 1: Domain Layer ──> Step 2: Use Cases ──> Step 3: Adapters
```

### Subagent Assignment Guide

| Agent  | Best For                                           |
| ------ | -------------------------------------------------- |
| haiku  | Documentation, templates, simple structure         |
| sonnet | Package scaffolds, tooling, established patterns   |
| opus   | Critical entity extraction, complex business logic |

## Verification Levels

### Single Judge (Standard)

- **Threshold:** 4.0/5.0
- **Use for:** Documentation, package structure, simple features
- **Process:** One judge evaluates against rubric

### Panel of 2 Judges (Critical)

- **Threshold:** 4.5/5.0
- **Use for:** Domain entity extraction, critical business logic
- **Process:** Two independent judges, both must pass

## File Naming Conventions

```
[short-descriptive-name].[type].md

Examples:
- add-user-authentication.feature.md
- fix-login-redirect.bug.md
- refactor-database-layer.feature.md
```

## Integration with CEK Five Pillars

### SDD (Specification-Driven Development)

- This workflow IS SDD
- All work flows through this process

### TDD (Test-Driven Development)

- Each implementation step includes TDD cycle
- Tests written before implementation

### DDD (Domain-Driven Design)

- Architecture section maps to Clean Architecture
- Task decomposition follows entity boundaries

### SADD (Subagent-Driven Development)

- Subagent patterns documented here
- Quality gates defined per task type

### Kaizen (Continuous Improvement)

- Completed tasks reviewed for learnings
- Templates updated based on experience

## Related Documents

- [CLAUDE.md](../../../CLAUDE.md) - CEK Five Pillars conventions
- [AGENTS.md](../../../AGENTS.md) - Agent instructions
- [TESTING.md](../../../TESTING.md) - TDD practices
