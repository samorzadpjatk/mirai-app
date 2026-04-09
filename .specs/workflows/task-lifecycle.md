# Task Lifecycle

## State Machine

```
                    ┌──────────────────┐
                    │   TRANSITION     │
     ┌──────────────│   VALIDATION     │
     │              └────────┬─────────┘
     │                       │
     ▼                       ▼
┌──────────┐  refine   ┌──────────┐  start   ┌─────────────┐  complete  ┌──────────┐
│          │──────────>│          │─────────>│             │───────────>│          │
│  DRAFT   │           │   TODO   │          │ IN-PROGRESS │            │   DONE   │
│          │<──────────│          │<─────────│             │<───────────│          │
└──────────┘  abandon  └──────────┘  block   └─────────────┘  reopen    └──────────┘
     │                                                       │
     └───────────────────────────────────────────────────────┘
                    (revert to earlier state)
```

## State Descriptions

### DRAFT State

**Purpose:** Idea capture and early exploration

**Entry Criteria:**

- Task file created in `.specs/tasks/draft/`
- Basic description exists

**Exit Criteria (to TODO):**

- [ ] Description is complete
- [ ] Acceptance criteria defined (Given-When-Then)
- [ ] Architecture overview included (if structural)
- [ ] Implementation steps outlined

**Exit Criteria (to Archive):**

- Task abandoned or superseded

### TODO State

**Purpose:** Ready queue for implementation

**Entry Criteria:**

- All DRAFT exit criteria met
- Moved to `.specs/tasks/todo/`

**Exit Criteria (to IN-PROGRESS):**

- [ ] Developer assigned
- [ ] Dependencies resolved
- [ ] Started work

**Exit Criteria (to DRAFT):**

- Blocked or needs more refinement

### IN-PROGRESS State

**Purpose:** Active development

**Entry Criteria:**

- Work actively being done
- Moved to `.specs/tasks/in-progress/`

**Exit Criteria (to DONE):**

- [ ] All acceptance criteria met
- [ ] Tests written and passing (80%+ coverage)
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No regressions

**Exit Criteria (to TODO):**

- Blocked and cannot proceed
- Abandoned mid-implementation

### DONE State

**Purpose:** Completed work archive

**Entry Criteria:**

- All acceptance criteria verified
- Moved to `.specs/tasks/done/`

**Exit Criteria:**

- None (archive after 90 days)

## State Transition Rules

### Forward Transitions

1. **DRAFT → TODO**
   - Requires: Specification complete
   - Action: `mv .specs/tasks/draft/X .specs/tasks/todo/`

2. **TODO → IN-PROGRESS**
   - Requires: Work started
   - Action: `mv .specs/tasks/todo/X .specs/tasks/in-progress/`

3. **IN-PROGRESS → DONE**
   - Requires: All criteria met, verified
   - Action: `mv .specs/tasks/in-progress/X .specs/tasks/done/`

### Backward Transitions

1. **TODO → DRAFT**
   - Reason: Needs more refinement
   - Action: `mv .specs/tasks/todo/X .specs/tasks/draft/`

2. **IN-PROGRESS → TODO**
   - Reason: Blocked, abandoned, or needs restart
   - Action: `mv .specs/tasks/in-progress/X .specs/tasks/todo/`

3. **DONE → IN-PROGRESS**
   - Reason: Bug found, needs additional work
   - Action: `mv .specs/tasks/done/X .specs/tasks/in-progress/`
   - Note: Update task with regression details

## Quality Gates

### TODO → IN-PROGRESS Gate

Before starting implementation:

- [ ] All dependencies resolved?
- [ ] Specification is clear and complete?
- [ ] Architecture decisions documented?
- [ ] Test approach defined?

### IN-PROGRESS → DONE Gate

Before marking complete:

- [ ] All acceptance criteria verified?
- [ ] Code coverage meets threshold (80%+)?
- [ ] dependency-cruiser passes?
- [ ] Manual testing complete?
- [ ] Documentation updated?

## Retention Policy

| State       | Retention Period | Action After Period          |
| ----------- | ---------------- | ---------------------------- |
| DRAFT       | 30 days          | Archive if stale             |
| TODO        | No limit         | Keep until done              |
| IN-PROGRESS | 14 days          | Review if stale              |
| DONE        | 90 days          | Archive to `.specs/archive/` |

## Automation Opportunities

Potential future automations:

- Auto-archive DRAFT tasks after 30 days
- Notify on IN-PROGRESS tasks older than 14 days
- Generate summary reports of DONE tasks weekly
