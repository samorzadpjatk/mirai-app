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

## Code Quality Standards

### File Size Limits

- **Rule**: Router/service files >1000 lines violate SRP and are hard to review/test safely.
- **Action**: Split into `*Queries.ts`, `*Mutations.ts`, `*Enrichment.ts` files.
- **Completed splits**: `activityFeed.ts` → `activityFeed/`, `group.ts` → `group/`, `location.ts` → `location/`, `challengeSubmission.ts` → `challengeSubmission/`, `reward.ts` → `reward/`.

### Module-Level Side Effects

- **Anti-pattern**: Import-time side effects make testing and deterministic initialization impossible.
- **Rule**: Move setup into explicit `init()` functions called from app entry points.
- **Status**: ✅ Fixed. All module-level side effects refactored into `init*()` functions:
  - `apps/native/src/app/_layout.tsx` — notification handlers initialized explicitly
  - `apps/native/src/services/background/backgroundLocationTask.ts` — accepts dependencies via parameter injection
  - `packages/orpc/src/api/orpc.ts` — telemetry moved to explicit initialization

### Console Logging as Error Handling

- **Rule**: `console.error` / `console.warn` / `console.log` in production code is not error handling. Use structured logging (Pino backend, Sentry native).
- **Status**: ✅ Complete. All production `console.*` calls eliminated. Backend uses Pino logger from `@mirai-app/orpc`. Native uses Sentry for runtime error reporting.

### No `&&` in JSX Outside `<Text>` (React Native)

- **Rule**: Always use `!!value && <Component />` or `value ? <Component /> : null` when conditionally rendering inside `<View>` or at the root JSX level. The `&&` operator leaks empty strings (`""`) and `0`, which crash React Native with "Text strings must be rendered within a <Text> component".
- **Safe patterns**:
  - `{!!value && <Component />}` — explicit boolean conversion
  - `{value ? <Component /> : null}` — ternary with null fallback
  - `{value && "text"}` — inside `<Text>` only, empty string is a valid text child
  - `style={[styles.base, isActive && styles.active]}` — style arrays are safe
- **Status**: ✅ Enforced. All risky patterns audited and fixed in `apps/native/src/`.

### "Half-Effect" Trap

- **Warning**: Partial FP library adoption creates the highest-cost state.
- **Rule**: If adopting an FP library (e.g., neverthrow for typed errors), commit fully to a bounded context. Never sprinkle it into imperative code.
- **Verdict for this codebase**: Effect is a **net-negative refactor** — by both architectural redundancy **and** total lines of code. Analysis of 164 async functions shows Effect would add ~5,400–7,400 lines (~4–5% increase), not reduce them. The existing architecture (oRPC + React Query + Drizzle) already solves what Effect offers.

## Mechanical Refactoring Verification

When agents split files or move code (e.g., router → directory module):

**Critical**: Verify regexes, string literals, and escape sequences character-by-character after the move.

**Example bug caught**: During `storage.ts` → `storage/` split, the regex `/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]+$/` lost the `/` character in the character class, becoming `/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/`. This broke nested directory edge cases in storage tests.

**Checklist after any file split**:
- [ ] Compare all regexes between original and new files (use `diff` or manual check)
- [ ] Run the specific test file for the moved module
- [ ] Look for `no-useless-escape` lint errors that might indicate character class corruption

## Parallel Execution Pattern for Mass Refactoring

For splitting many routers (or similar mass file operations):

1. **Group by complexity**: ~4 simple routers per wave, ~3 complex routers per wave
2. **Execute in parallel**: Launch one agent per router using `run_in_background=true`
3. **Gate with typecheck**: Run `tsc --noEmit` after each wave before starting the next
4. **Final verification**: Run full test suite (`bun run test`) after all waves complete

## Anti-Patterns and Pitfalls

| Pitfall | Why It Happens | Prevention |
|---------|---------------|------------|
| Using `bun test` on vitest projects | Bun's native runner looks like it should work | Always check `package.json` scripts; use `bun run test` |
| Regex corruption during file moves | Agents copy-paste code; escape sequences can be mangled | Verify regexes with `git diff` or manual comparison |
| False test failure panic | Seeing many failures after refactoring triggers alarm | Run the correct test runner before diagnosing |
| Import path depth errors | Moving files one level deeper changes relative paths | Systematic mapping: `../../X` → `../../../X` for each level |

## Related Documentation

- [AI-Driven Change Workflow](../workflows/ai-change-workflow.md) - Complete workflow phases
- [TDD Best Practices](tdd.md) - Test-driven development guidelines
- [Documentation Best Practices](documentation.md) - Documentation patterns
- [AGENTS.md Template](../templates/AGENTS.md.template) - Template for new AGENTS.md files
