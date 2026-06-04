# AI-Driven Change Workflow (E2E)

This project uses CEK SDD (Structured Development and Deployment).

## Workflow Overview

```
Brainstorm (CEK SDD) → Add Task (CEK SDD) → Planning (CEK SDD) →
Implementation with TDD (CEK SDD) → Verification (CEK SDD) → Reflection & Docs (CEK SDD) → Archive (manual)
```

**TDD Integration**: Implementation always follows test-first methodology: write failing tests (RED), implement to pass (GREEN), then refactor.

### Plugin Installation Best Practice

**Install only plugins you need for the task:**

```bash
# For feature work:
/plugin install sdd@NeoLabHQ/context-engineering-kit
/plugin install review@NeoLabHQ/context-engineering-kit

# For git operations:
/plugin install git@NeoLabHQ/context-engineering-kit

# For DDD/architecture work:
/plugin install ddd@NeoLabHQ/context-engineering-kit
```

**Why**: Each plugin loads specific agents and commands. Install only what you need.

---

## Phase 1: Brainstorm - `/sdd:brainstorm`

**Purpose**: Unstructured thinking and investigation
**When to use**: Unclear requirements, exploring solutions, investigating problems

```
/sdd:brainstorm "Add real-time event notifications"
```

**What happens**:
- Free-form exploration of the problem space
- Codebase investigation
- Architecture visualization
- No code or artifacts created

**Guardrails**:
- **NEVER implement during exploration** - this is thinking time only
- Ask clarifying questions before proceeding
- Visualize with ASCII diagrams when helpful
- Surface risks and unknowns early

**Exit criteria**: Clear understanding of what to build and why

---

## Phase 2: Add Task - `/sdd:add-task`

**Purpose**: Create draft task from user intent
**When to use**: Requirements are clear, ready to formalize the change

```
/sdd:add-task "Implement real-time event notifications"
```
Creates: `.specs/tasks/draft/<task-name>.<type>.md`

**Guardrails**:
- **ALWAYS read dependency artifacts** before creating new ones
- **NEVER skip artifacts** in the schema sequence
- Each artifact builds on the previous (proposal → specs → design → tasks)
- **DO NOT copy context/rules blocks** into artifacts (they guide you, not content)

**Exit criteria**: All `applyRequires` artifacts complete (typically proposal, specs, design, tasks)

---

## Phase 3: Planning - `/sdd:plan-task`

**Purpose**: Refine task specification with multi-agent analysis
**When to use**: Complex implementation tasks from CEK SDD task files

```
# Extract task from .specs/tasks/draft/ or .specs/tasks/todo/
/sdd:add-task "Implement WebSocket event broadcaster"
/sdd:plan-task .specs/tasks/draft/<task-file>.md
```

**What happens**:
- 6-phase parallel analysis (research, codebase analysis, business analysis)
- Architecture synthesis
- Task decomposition with implementation steps
- Parallelization optimization
- LLM-as-Judge quality gates at every phase
- Moves task from `draft/` to `todo/`

**Guardrails**:
- **Target quality**: Default 3.5/5.0 (use 4.5 for critical tasks)
- **Max iterations**: Default 3 (use `unlimited` for critical tasks)
- **Human checkpoints**: Use `--human-in-the-loop` for high-stakes phases
- **CLEAR context** - run `/clear` after planning, before implementation
- **NEVER skip judges** without explicit `--skip-judges` flag

**Exit criteria**: Task in `todo/` with refined spec and rubrics

---

## Phase 4: Implementation with TDD - `/sdd:implement-task` / `/tdd:test-driven-development`

**Purpose**: Execute implementation using test-driven development
**When to use**: After planning completes, or for direct TDD without formal planning

**All implementation uses TDD by default.** The methodology is inherited regardless of which command you use.

**For planned tasks** (inherited from SDD planning - TDD automatic):
```
/sdd:implement-task .specs/tasks/todo/<task-file>.md
```
→ TDD cycle is **built-in** - each step starts with test-first development

**For direct TDD** (standalone, no planning phase):
```
/tdd:test-driven-development "Implement user authentication"
```
→ Same TDD cycle applied directly

### TDD Inheritance Model

```
Planning (SDD)
      │
      │ (tasks inherit TDD)
      ▼
Implementation ───┬─── /sdd:implement-task
                  │      (TDD automatic)
                  │
                  └─── /tdd:test-driven-development
                         (TDD explicit)
```

**Both paths result in identical test-first development:**

### TDD-First Implementation Cycle

Every implementation step follows **RED → GREEN → REFACTOR**:

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│   RED   │────▶│  GREEN  │────▶│ REFACTOR│
│Write    │     │Minimal  │     │Clean up │
│failing  │     │code to  │     │while    │
│test     │     │pass     │     │green    │
└─────────┘     └─────────┘     └────┬────┘
     │                               │
     └───────────────────────────────┘
                (repeat)
```

**Step-by-step**:
1. **RED** - Write a failing test that defines expected behavior
2. **GREEN** - Write minimal code to make the test pass
3. **REFACTOR** - Clean up code while keeping all tests green
4. Repeat for each requirement

### What Happens (TDD is Inherited)

When using `/sdd:implement-task`:
- Task moves `todo/` → `in-progress/` → `done/`
- **TDD is automatically applied to every step** - no opt-out
- Each implementation step inherits the **RED → GREEN → REFACTOR** cycle:
  1. **RED**: Write test first, watch it fail
  2. **GREEN**: Minimal code to pass
  3. **REFACTOR**: Clean up while green
- **Judge verification** per step includes test quality validation (4.0 standard, 4.5 critical threshold)
- Auto-retry loop (max 3 iterations)
- Panel of LLMs for high-stakes artifacts
- Final DoD verification

When using `/tdd:test-driven-development` directly:
- Same **RED → GREEN → REFACTOR** cycle
- No planning phase required
- Same guardrails and exit criteria apply

### Guardrails

**TDD Enforcement**:
- **MANDATORY**: No production code without a failing test first
- **MANDATORY**: Watch each test fail before implementing
- **MANDATORY**: Delete any code written before tests - start fresh
- **MANDATORY**: Verify test passes for the right reason, not by accident

**Quality Gates**:
- **STANDARD**: 4.0/5.0 threshold (4.5 for critical: security/auth/data)
- **Max iterations**: Default 3
- **MANDATORY**: You are ORCHESTRATOR ONLY - dispatch sub-agents, never implement
- **MANDATORY**: Never read implementation files - let judges verify
- **MANDATORY**: Clear context between phases (`/clear`)
- Use `--continue` to resume, `--refine` after edits

### TDD Anti-Patterns to Avoid

| Anti-Pattern | The Problem | The Fix |
|--------------|-------------|---------|
| **Testing mocks** | Verifying mock was called, not that code works | Test real behavior, minimize mocks |
| **Test-only methods** | Production code polluted with methods only tests use | Move cleanup to test utilities |
| **Mock without understanding** | Mock breaks test logic by removing side effects | Understand dependencies before mocking |
| **Tests after code** | Tests passing immediately proves nothing | Delete code, start over with test first |
| **Keep "reference" code** | Adapting existing code while writing tests | Delete it. Start fresh from tests. |

**Other Anti-Patterns**:
- ❌ "Too simple to test" - Simple code breaks. Tests take 30 seconds.
- ❌ "I'll test after" - Tests passing immediately prove nothing.
- ❌ "Deleting X hours is wasteful" - Sunk cost. Unverified code = technical debt.
- ❌ "TDD is dogmatic" - TDD IS pragmatic: finds bugs before commit.

### When to Use Standalone TDD Commands

**Use `/tdd:test-driven-development`** when:
- You want to skip formal planning and implement directly
- The scope is clear and doesn't require multi-agent analysis
- Quick prototyping or spikes
- The task is straightforward and well-understood

**Use `/sdd:implement-task`** (TDD inherited) when:
- You've completed the planning phase (`/sdd:plan-task`)
- The task requires rigorous multi-step implementation
- You want full judge verification and quality gates
- Working on complex, multi-file changes

**Both enforce TDD** - the only difference is whether planning happened first.

```
With Planning (SDD):        Without Planning (Direct):
/sdd:plan-task              /tdd:test-driven-development
      │                            │
      ▼                            ▼
/sdd:implement-task         Same TDD cycle
(TDD automatic)             (TDD explicit)
```

### Exit Criteria

- [ ] Task in `done/`
- [ ] All DoD items verified
- [ ] Every function has a test
- [ ] **Watched each test fail before implementing**
- [ ] Wrote minimal code to pass
- [ ] All tests pass, output pristine
- [ ] Edge cases covered

Can't check all boxes? **TDD was skipped. Start over.**

---

## Phase 5: Verification - Both Frameworks

**Pre-commit review** (CEK):
```
/review-local-changes --min-impact high
```

Multi-agent review covering:
- Bug Hunter (memory leaks, race conditions, logic errors)
- Security Auditor (auth bypasses, secrets, vulnerabilities)
- Test Coverage Reviewer (test quality, edge cases)
- Code Quality Reviewer (maintainability, patterns)
- Contracts Reviewer (API changes, type safety)
- Historical Context Reviewer (consistency with existing code)

**Spec alignment check** (CEK SDD):
```
/sdd:judge
```

Verifies:
- Completeness (all tasks and requirements covered)
- Correctness (implementation matches spec intent)
- Coherence (follows design decisions, pattern consistency)

**Guardrails**:
- **Quality Gate**: FAIL if any critical or high issues exist
- **Min impact**: Default `high` (use `critical` for production hotfixes)
- **Iterate on failures**: Fix issues before proceeding
- **Never skip**: Even "simple" changes get reviewed

**Exit criteria**: No critical/high issues, all specs aligned

---

## Phase 6: Reflection & Documentation - `/reflexion:reflect` + `/docs:update-docs`

**Purpose**: Reflect on implementation and update documentation
**When to use**: After implementation and verification, before archiving

**Reflection**:
```
# Reflect on implementation lessons
/reflexion:reflect

# Memorize key insights to AGENTS.md
/reflexion:memorize "Key insight from this change"
```

**Documentation Update**:
```
# Update all project documentation
/docs:update-docs

# Update specific area
/docs:update-docs api
/docs:update-docs src/auth/
/docs:update-docs readme
```

**What happens**:
- Analyzes implementation for lessons learned
- Updates AGENTS.md with new patterns and gotchas
- Scans changed files for documentation gaps
- Updates README, API docs, JSDoc, module docs
- Validates examples and links
- Removes stale documentation

**Guardrails**:
- **Always reflect** after major features or novel solutions
- **Document immediately** - don't let docs go stale
- **Prioritize**: Onboarding blockers > API docs > Module READMEs > JSDoc
- **Verify examples** - test code examples in documentation
- **Check links** - fix broken references

**Documentation Priority**:
1. **Onboarding blockers** - Setup instructions, quick start
2. **API documentation** - Endpoint references, authentication
3. **Module READMEs** - Navigation and purpose
4. **Troubleshooting** - Common errors and solutions
5. **Architecture decisions** - When they affect usage
6. **JSDoc comments** - Complex business logic

**Exit criteria**: Documentation reflects current state, AGENTS.md updated with learnings

---

## Phase 7: Archive - Manual

**Purpose**: Complete change lifecycle, preserve knowledge
**When to use**: Implementation verified and complete

**What happens**:
- Move completed task from `.specs/tasks/in-progress/` to `.specs/tasks/done/`
- Update capability specs in `.specs/specs/<capability>/` if needed
- Preserve full change history in `.specs/analysis/archive/`

**Guardrails**:
- **Check task completion** before archive (warns on incomplete items)
- **Verify all artifacts** are complete (tests, docs, reviews)
- **Confirm**: Always review before finalizing

**Exit criteria**: Task in `done/`, knowledge preserved, docs updated

---

## Quick Reference: When to Use Which Framework

| Scenario | Recommended Command | Why |
|----------|---------------------|-----|
| **Exploring ideas** | `/sdd:brainstorm "idea"` | Unstructured thinking |
| **Complex feature** | `/sdd:add-task` → `/sdd:plan-task` → `/sdd:implement-task` | Full spec + **inherited TDD** |
| **TDD implementation** | `/tdd:test-driven-development` | Direct TDD without planning |
| **Quick bug fix** | `/sadd:do-and-judge "Fix validation"` | Fast with quality gates |
| **Refactor across packages** | `/sadd:do-in-parallel --files "pkg1,pkg2,pkg3" "task"` | Parallel execution |
| **Production hotfix** | `/sadd:do-and-judge` + `/review-local-changes --min-impact critical` | Fast + critical review |
| **Root cause analysis** | `/kaizen:why "Database timeout"` | Systematic investigation |
| **Pre-commit check** | `/review-local-changes` | Multi-agent review |
| **Write tests** | `/tdd:write-tests` | TDD when not using SDD |
| **Fix tests** | `/tdd:fix-tests` | Update tests after logic changes |
| **Reflect & learn** | `/reflexion:reflect` + `/reflexion:memorize` | Capture insights to AGENTS.md |
| **Update docs** | `/docs:update-docs` | Sync docs with implementation |
| **Update API docs** | `/docs:update-docs api` | Endpoint documentation |
| **Update module docs** | `/docs:update-docs src/<module>/` | Module README and JSDoc |

---

## File Structure Created

```
.specs/                          # CEK task management
├── tasks/
│   ├── draft/                   # New tasks awaiting planning
│   ├── todo/                    # Planned tasks ready to implement
│   ├── in-progress/            # Currently being worked on
│   └── done/                   # Completed tasks
├── analysis/                   # Codebase impact analysis
└── scratchpad/                 # Agent working notes (gitignored)

.agents/skills/                # CEK reusable skills
└── <skill-name>/
    └── SKILL.md

.specs/                        # CEK SDD change management
├── tasks/
│   ├── draft/                 # New tasks awaiting planning
│   ├── todo/                  # Planned tasks ready to implement
│   ├── in-progress/          # Currently being worked on
│   └── done/                 # Completed tasks
├── analysis/                 # Codebase impact analysis
│   └── archive/             # Historical change records
└── specs/                    # Capability specs
    └── <capability>/
        └── spec.md
```

---

## Workflow Guardrails (CRITICAL)

**NEVER**:
- ❌ Skip judge verification to "save time"
- ❌ Implement during exploration phase
- ❌ Read implementation files yourself (let judges verify)
- ❌ Skip planning phase for complex tasks
- ❌ Proceed after max retries without user decision
- ❌ Archive changes with incomplete tasks/artifacts (unless explicitly confirmed)
- ❌ Write code as the orchestrator (dispatch sub-agents only)
- ❌ Copy `<context>` or `<rules>` blocks into artifact files

**ALWAYS**:
- ✅ Clear context between planning and implementation (`/clear`)
- ✅ Use `--human-in-the-loop` for critical/high-stakes changes
- ✅ Run `/review-local-changes` before committing
- ✅ Verify all Definition of Done items pass
- ✅ Sync specs to main specs on archive
- ✅ Read dependency artifacts before creating new ones
- ✅ Follow schema artifact sequence (don't skip or reorder)
- ✅ Use `sadd:do-in-parallel` for independent tasks across packages

**QUALITY THRESHOLDS**:
- Standard: 4.0/5.0 (default)
- Critical: 4.5/5.0 (auth, security, data integrity)
- Judge scores below threshold trigger automatic retry
- After 3 retries, escalate to user decision

---

## Related Documentation

- [Task Sizing Guide](../conventions/best-practices.md#task-sizing-guide)
- [TDD Best Practices](../conventions/tdd.md)
- [Documentation Best Practices](../conventions/documentation.md)
- [See all conventions](../conventions/)
