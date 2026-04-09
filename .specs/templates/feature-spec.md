---
title: Feature Specification Template
type: feature
---

## Initial User Prompt

[Original user request that triggered this specification]

## Description

### Why This Feature is Needed

[Explain the problem, motivation, and value proposition]

### What This Feature Accomplishes

[Clear description of the solution and expected outcomes]

### Scope Boundaries

**IN Scope:**

- [List specific items that will be implemented]

**OUT of Scope:**

- [List items explicitly not included to prevent scope creep]

## Acceptance Criteria

### Functional Criteria

- [ ] [Criterion 1 - what the feature must do]
- [ ] [Criterion 2 - expected behavior]
- [ ] [Criterion 3 - edge cases to handle]

### Non-Functional Criteria

- [ ] [Performance, security, or other quality requirements]

## Architecture Overview

### Current State

[Description of current architecture relevant to this change]

### Target State

[Description of the desired architecture after implementation]

### Migration Strategy

[If applicable, how to migrate from current to target state]

### Key Architectural Decisions

| Decision     | Choice   | Rationale |
| ------------ | -------- | --------- |
| [Decision 1] | [Choice] | [Why]     |
| [Decision 2] | [Choice] | [Why]     |

### Expected Changes

**Files to Create:**

- [List new files to be created]

**Files to Modify:**

- [List existing files to be modified]

**Files to Delete:**

- [List files to be removed]

## Implementation Process

### Overview

[High-level approach to implementation]

### Step 1: [Step Name]

**Agent:** [haiku/sonnet/opus]
**Execution:** [Sequential/Parallel]
**Dependencies:** [Any prerequisite steps]

**Description:**

[What this step accomplishes]

**Expected Output:**

```
[File structure or expected changes]
```

**DDD Alignment:**

[How this aligns with Clean Architecture if applicable]

**TDD Cycle for This Step:**

- **Red:** [What test to write first]
- **Green:** [Minimal implementation to pass]
- **Refactor:** [Improvements after passing]

**Success Criteria:**

- [ ] [Checklist item 1]
- [ ] [Checklist item 2]
- [ ] [Checklist item 3]

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | [Low/Med/High] | [Low/Med/High] | [How to address] |
| [Risk 2] | [Low/Med/High] | [Low/Med/High] | [How to address] |

#### Verification

**Level:** [Single Judge / Panel of 2 Judges]
**Threshold:** [4.0/5.0 or 4.5/5.0]

| Criterion     | Weight | Description   |
| ------------- | ------ | ------------- |
| [Criterion 1] | 0.XX   | [Description] |
| [Criterion 2] | 0.XX   | [Description] |

### [Additional Steps...]

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Tests written and passing (80%+ coverage for new code)
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] No regression in existing functionality

### References

- [Link to related specs, ADRs, or external resources]

### Notes for Implementers

1. [Important note 1]
2. [Important note 2]
