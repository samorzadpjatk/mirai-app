# Best Practices & Patterns

## Task Sizing Guide

Match the command to task complexity:

| Task Size | Command | When to Use | Examples |
|-----------|---------|-------------|----------|
| **Small** | `/sadd:do-and-judge` | Single focused task, clear scope | Bug fixes, simple refactors, config updates |
| **Medium** | `/sadd:do-in-steps` | Sequential dependent tasks | Feature with 3-5 steps, API integration |
| **Large** | `/sdd:plan-task` → `/sdd:implement-task` | Complex multi-phase work | New subsystem, architecture changes, cross-package features |

**Why this matters**: Using the right command prevents under-engineering (small tasks forced through heavy planning) and over-engineering (complex tasks without proper analysis).

---

## Human + Agent Collaboration Pattern

The collaboration loop:

1. **Human provides** - Intent, context, constraints, and high-level decisions
2. **Agent drafts** - Converts intent into behavior-first requirements and scenarios
3. **Human reviews** - Validates direction, catches misunderstandings early
4. **Agent implements** - Following specs with judge-verified quality
5. **Human validates** - Final verification before commit

**Key insight**: Agents excel at converting human intent into structured artifacts. Humans excel at direction and validation. Don't skip human checkpoints on critical work.

---

## Progressive Rigor for Specifications

Not every change needs full specification. Use the lightest level that makes the change verifiable:

**Lite Spec (default for most changes)**:
- Short behavior-first requirements
- Clear scope and non-goals
- A few concrete acceptance checks
- No detailed scenarios needed

**Full Spec (for higher risk)**:
- Cross-team or cross-repo changes
- API/contract changes, migrations, security/privacy concerns
- Changes where ambiguity causes expensive rework
- Complete Given/When/Then scenarios for all requirements

**Decision criteria**: If implementation can change without changing externally visible behavior, use Lite spec. If external contracts change, use Full spec.

---

## Delta Specs: Brownfield-First Thinking

This project uses **delta specs** for brownfield development - describing what's changing rather than restating the entire spec:

```markdown
## ADDED Requirements

### Requirement: New Feature
System MUST support X.

## MODIFIED Requirements

### Requirement: Existing Behavior
(Previously: old behavior)
System NOW behaves as Y.

## REMOVED Requirements

### Requirement: Deprecated Feature
(Removing due to Z reason)
```

**Benefits**:
- Clarity: Shows exactly what's changing
- Conflict avoidance: Multiple changes can touch same spec without conflict
- Review efficiency: Reviewers see the change, not unchanged context
- Brownfield fit: Makes modifications first-class

---

## The Virtuous Cycle

Specs and changes form a continuous improvement loop:

```
Specs describe current behavior
        │
        ▼
Changes propose modifications (as deltas)
        │
        ▼
Implementation makes changes real
        │
        ▼
Archive merges deltas into specs
        │
        ▼
Specs now describe new behavior
        │
        └─────► Next change builds on updated specs
```

**Why this matters**: Each completed change improves the documentation, making the next change easier to specify and implement.

---

## Related Documentation

- [AI-Driven Change Workflow](../workflows/ai-change-workflow.md) - Complete workflow phases
- [TDD Best Practices](tdd.md) - Test-driven development guidelines
- [Documentation Best Practices](documentation.md) - Documentation patterns
- [AGENTS.md Template](../templates/AGENTS.md.template) - Template for new AGENTS.md files
