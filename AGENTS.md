# MIRAI Monorepo - Agent Guide

> **AI Assistant Context:** Base instruction layer for the MIRAI/PJApp monorepo. Files concatenate from root downward, with later files overriding earlier ones.

## Project Overview

MIRAI (PJApp) is a TypeScript monorepo for an event management platform:

- **Frontend**: Expo React Native (iOS/Android)
- **Backend**: Fastify + tRPC server with WebSocket support
- **Database**: PostgreSQL via Prisma ORM + Supabase
- **Tooling**: Turborepo + Bun workspaces

## Monorepo Structure

```
MIRAI/
├── apps/
│   ├── native/              # Expo React Native app (iOS/Android)
│   ├── backend-server/      # Fastify + tRPC API server
│   ├── notification-sender/ # Notification service worker
│   └── seed/                # Database seeding CLI
├── packages/
│   ├── auth/                # Authentication utilities
│   ├── db/                  # Prisma schema and client
│   ├── shared/              # Shared utilities, design tokens
│   ├── supabase/            # Supabase client configuration
│   └── trpc/                # tRPC routers and utilities
├── docs/                    # Detailed documentation (see below)
├── turbo.json               # Turborepo configuration
├── package.json             # Bun workspaces configuration
└── AGENTS.md                # This file (base instructions)
```

## Build System

### Turborepo Pipeline

| Command | Description |
|---------|-------------|
| `turbo run build` | Build all apps and packages |
| `turbo run dev` | Start development mode for all apps |
| `turbo run lint` | Run ESLint across all packages |
| `turbo run typecheck` | Type-check all packages |
| `turbo run test` | Run test suites |
| `turbo run clean` | Clean build artifacts |

**Pipeline order:** `build` → `typecheck` → `test` → `deploy`

### Bun Workspaces

- **Workspace protocol**: Use `workspace:*` for internal dependencies
- **Lockfile**: `bun.lock` tracks all dependencies
- **Install**: `bun install` at root installs all workspace dependencies

### Standard Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Start development server |
| `build` | Production build |
| `lint` | Code quality checks |
| `typecheck` | TypeScript validation |
| `test` | Run tests |
| `clean` | Remove build artifacts |

## Development Environment

### Prerequisites

- Bun 1.3.6+ (package manager)
- Node.js 20+ (for tooling)
- Docker (optional, for local PostgreSQL)

### Quick Start

```bash
# Install dependencies
bun install

# Start all apps in dev mode
turbo run dev

# Or start specific apps
turbo run dev --filter=@mirai-app/backend-server
turbo run dev --filter=@mirai-app/native
```

### Environment Variables

Copy `.env.example` files in `environment/` folder and fill in values:

```bash
cp environment/.env.dev.example environment/.env.dev
```

## Package Dependency Graph

```
auth ──────┐
           ├──→ trpc ────→ backend-server, notification-sender
db ────────┤      └──→ native (via client)
           │
supabase ──┤      └──→ native (via client)
           │
shared ────┘
```

## How AGENTS.md Works

This project follows OpenAI's layered AGENTS.md discovery pattern:

1. **Discovery order**: Root AGENTS.md → apps/packages → nested directories
2. **Merge order**: Files concatenate from root down, separated by blank lines
3. **Override mechanism**: Files closer to your working directory override earlier guidance
4. **Override files**: `AGENTS.override.md` provides temporary team-specific rules

### Example Layering

```
Root AGENTS.md                    # Base monorepo conventions
├── apps/native/AGENTS.md         # Native app rules
│   └── screens/AGENTS.override.md # Temporary overrides
├── packages/db/AGENTS.md         # Database rules
└── ...
```

### Override Files

Create `AGENTS.override.md` in your working directory for temporary rules. Remove when done.

**Important**: Keep all AGENTS.md files concise. Combined total must stay under 32 KiB.

## Instruction Size Guidelines

To stay within OpenAI's default 32 KiB combined instruction limit:

| File Type | Target Size |
|-----------|-------------|
| Root AGENTS.md | 5-8 KiB |
| Per-app/package AGENTS.md | 2-4 KiB |
| AGENTS.override.md | < 1 KiB (temporary only) |

**Tips for keeping files small:**
- Focus on high-level guidance and conventions
- Put detailed technical content in `docs/` folder
- Use relative links from AGENTS.md to docs/
- Be concise - AGENTS.md should be scannable in 2-3 minutes

## App & Package AGENTS.md Files

- [apps/native/AGENTS.md](./apps/native/AGENTS.md) - Expo React Native app
- [apps/backend-server/AGENTS.md](./apps/backend-server/AGENTS.md) - Fastify + tRPC server
- [apps/notification-sender/AGENTS.md](./apps/notification-sender/AGENTS.md) - Notification service
- [apps/seed/AGENTS.md](./apps/seed/AGENTS.md) - Database seeding CLI
- [packages/auth/AGENTS.md](./packages/auth/AGENTS.md) - Authentication utilities
- [packages/db/AGENTS.md](./packages/db/AGENTS.md) - Prisma database client
- [packages/shared/AGENTS.md](./packages/shared/AGENTS.md) - Shared utilities
- [packages/supabase/AGENTS.md](./packages/supabase/AGENTS.md) - Supabase client
- [packages/trpc/AGENTS.md](./packages/trpc/AGENTS.md) - tRPC routers

## Documentation Structure

Detailed documentation lives in `docs/` folder:

| Path | Contents |
|------|----------|
| [docs/architecture/](./docs/architecture/) | Monorepo, Turborepo, Bun workspace docs |
| [docs/development/](./docs/development/) | Setup guides, environment, scripts |
| [docs/apps/](./docs/apps/) | Per-app detailed documentation |
| [docs/packages/](./docs/packages/) | Per-package detailed documentation |
| [docs/conventions/](./docs/conventions/) | Coding standards and best practices |

## AI-Driven Change Workflow (E2E)

This project uses a **hybrid approach** combining OpenSpec (change management) with CEK (Context Engineering Kit).

### Workflow Overview

```
Discovery (OpenSpec) → Specification (OpenSpec) → Planning (CEK SDD) → 
Implementation (CEK SDD) → Verification (Both) → Reflection & Docs (CEK) → Archive (OpenSpec)
```

#### Plugin Installation Best Practice

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

**Why**: Each plugin loads specific agents and commands. Install only what you need to keep context clean.

---

### Phase 1: Discovery - `/opsx:explore`

**Purpose**: Unstructured thinking and investigation
**When to use**: Unclear requirements, exploring solutions, investigating problems

```
/opsx:explore "Add real-time event notifications"
```

**What happens**:
- Free-form exploration of the problem space
- Codebase investigation
- Architecture visualization
- No code written, no artifacts created yet

**Guardrails**:
- **NEVER implement during exploration** - this is thinking time only
- Ask clarifying questions before proceeding
- Visualize with ASCII diagrams when helpful
- Surface risks and unknowns early

**Exit criteria**: Clear understanding of what to build and why

---

### Phase 2: Specification - `/opsx:propose` or `/opsx:ff-change`

**Purpose**: Create structured change artifacts
**When to use**: Requirements are clear, ready to formalize the change

**Option A - Full proposal** (for complex changes):
```
/opsx:propose "add-realtime-notifications"
```
Creates: proposal.md → specs/ → design.md → tasks.md

**Option B - Fast-forward** (for straightforward changes):
```
/opsx:ff-change "add-realtime-notifications"
```
Creates all artifacts in one step

**Guardrails**:
- **ALWAYS read dependency artifacts** before creating new ones
- **NEVER skip artifacts** in the schema sequence
- Each artifact builds on previous (proposal → specs → design → tasks)
- **DO NOT copy context/rules blocks** into artifacts (they guide you, not content)

**Exit criteria**: All `applyRequires` artifacts complete (typically proposal, specs, design, tasks)

---

### Phase 3: Planning - `/sdd:plan-task`

**Purpose**: Refine task specification with multi-agent analysis
**When to use**: Complex implementation tasks from OpenSpec tasks.md

```
# Extract task from openspec/changes/<name>/tasks.md
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
- **CLEAR context** - run `/clear` after plan before implement
- **NEVER skip judges** without explicit `--skip-judges` flag

**Exit criteria**: Task in `todo/` with refined spec and rubrics

---

### Phase 4: Implementation - `/sdd:implement-task`

**Purpose**: Execute implementation with automated verification
**When to use**: After planning phase completes

```
/sdd:implement-task .specs/tasks/todo/<task-file>.md
```

**What happens**:
- Task moves `todo/` → `in-progress/` → `done/`
- Sequential/parallel step execution with dependencies
- **Judge verification** per step (4.0 standard, 4.5 critical threshold)
- Auto-retry loop (max 3 iterations)
- Panel of LLMs for high-stakes artifacts
- Final DoD verification

**Guardrails**:
- **STANDARD**: 4.0/5.0 threshold (4.5 for critical: security/auth/data)
- **Max iterations**: Default 3
- **MANDATORY**: You are ORCHESTRATOR ONLY - dispatch sub-agents, never implement
- **MANDATORY**: Never read implementation files - let judges verify
- **MANDATORY**: Clear context between phases (`/clear`)
- Use `--continue` to resume, `--refine` after edits

**Exit criteria**: Task in `done/`, all DoD items verified

---

### Phase 4.5: Test-Driven Development (TDD) - `/tdd:write-tests`

**Purpose**: Ensure comprehensive test coverage using TDD methodology
**When to use**: After implementation or when adding tests to existing code

**TDD Red-Green-Refactor Cycle**:
1. **RED** - Write a failing test first
2. **GREEN** - Write minimal code to pass the test
3. **REFACTOR** - Clean up while keeping tests green

**Commands**:
```
# Write tests for uncommitted changes (including untracked files)
/tdd:write-tests

# Or if everything is committed, covers latest commit
/tdd:write-tests

# Fix failing tests after business logic changes
/tdd:fix-tests
```

**Integration with SDD Implementation**:
When using `/sdd:implement-task`, TDD is automatically applied:
- Each implementation step includes test-first development
- Tests are written before production code
- Judge verification includes test quality checks

**TDD Anti-Patterns to Avoid**:
- ❌ Testing mock behavior instead of real code
- ❌ Adding test-only methods to production classes
- ❌ Mocking without understanding dependencies
- ❌ Writing tests after implementation without seeing them fail first

**Guardrails**:
- **ALWAYS** write test before implementation for new features
- **MUST** watch test fail before implementing (proves it tests the right thing)
- **NEVER** keep code written before tests (delete and start fresh)
- **Verify** test passes for expected reason, not by mistake

**Exit criteria**: All new code covered by tests that failed first, then passed

---

### Phase 5: Verification - Both Frameworks

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

**Spec alignment check** (OpenSpec):
```
/opsx:verify "add-realtime-notifications"
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

### Phase 6: Reflection & Documentation - `/reflexion:reflect` + `/docs:update-docs`

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

### Phase 7: Archive - `/opsx:archive`

**Purpose**: Complete change lifecycle, sync specs to main
**When to use**: Implementation verified and complete

```
/opsx:archive "add-realtime-notifications"
```

**What happens**:
- Syncs delta specs to main specs (`openspec/specs/<capability>/`)
- Moves change to archive with date prefix
- Preserves full change history

**Guardrails**:
- **Check task completion** before archive (warns on incomplete tasks)
- **Verify artifact completion** (warns on incomplete artifacts)
- **Sync specs**: Recommend syncing delta specs to main specs
- **Confirm**: Always prompt before archiving if warnings exist

**Exit criteria**: Change archived, specs synced, knowledge preserved

---

### Quick Reference: When to Use Which Framework

| Scenario | Recommended Command | Why |
|----------|---------------------|-----|
| **Exploring ideas** | `/opsx:explore "idea"` | Unstructured thinking |
| **Complex feature** | `/opsx:propose` → `/sdd:plan-task` → `/sdd:implement-task` | Full spec + rigorous implementation |
| **Quick bug fix** | `/sadd:do-and-judge "Fix validation"` | Fast with quality gates |
| **Refactor across packages** | `/sadd:do-in-parallel --files "pkg1,pkg2,pkg3" "task"` | Parallel execution |
| **Production hotfix** | `/sadd:do-and-judge` + `/review-local-changes --min-impact critical` | Fast + critical review |
| **Root cause analysis** | `/kaizen:why "Database timeout"` | Systematic investigation |
| **Pre-commit check** | `/review-local-changes` | Multi-agent review |
| **Write tests** | `/tdd:write-tests` | TDD enforcement for changes |
| **Fix tests** | `/tdd:fix-tests` | After business logic changes |
| **Reflect & learn** | `/reflexion:reflect` + `/reflexion:memorize` | Capture insights to AGENTS.md |
| **Update docs** | `/docs:update-docs` | Sync docs with implementation |
| **Update API docs** | `/docs:update-docs api` | Endpoint documentation |
| **Update module docs** | `/docs:update-docs src/<module>/` | Module README and JSDoc |

---

### File Structure Created

```
.specs/                          # CEK task management
├── tasks/
│   ├── draft/                   # New tasks awaiting planning
│   ├── todo/                    # Planned tasks ready to implement
│   ├── in-progress/            # Currently being worked on
│   └── done/                   # Completed tasks
├── analysis/                   # Codebase impact analysis
└── scratchpad/                 # Agent working notes (gitignored)

.claude/skills/                # CEK reusable skills
└── <skill-name>/
    └── SKILL.md

openspec/                      # OpenSpec change management
├── changes/
│   ├── <change-name>/
│   │   ├── .openspec.yaml
│   │   ├── proposal.md
│   │   ├── specs/<capability>/
│   │   │   └── spec.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── archive/
│       └── YYYY-MM-DD-<change-name>/
└── specs/                     # Main specs (synced from changes)
    └── <capability>/
        └── spec.md
```

---

### Workflow Guardrails (CRITICAL)

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

### Best Practices & Patterns

#### Task Sizing Guide

Match the command to task complexity for optimal results:

| Task Size | Command | When to Use | Examples |
|-----------|---------|-------------|----------|
| **Small** | `/sadd:do-and-judge` | Single focused task, clear scope | Bug fixes, simple refactors, config updates |
| **Medium** | `/sadd:do-in-steps` | Sequential dependent tasks | Feature with 3-5 steps, API integration |
| **Large** | `/sdd:plan-task` → `/sdd:implement-task` | Complex multi-phase work | New subsystem, architecture changes, cross-package features |

**Why this matters**: Using the right command prevents both under-engineering (small tasks forced through heavy planning) and over-engineering (complex tasks without proper analysis).

---

#### Human + Agent Collaboration Pattern

The intended collaboration loop:

1. **Human provides** - Intent, context, constraints, and high-level decisions
2. **Agent drafts** - Converts intent into behavior-first requirements and scenarios
3. **Human reviews** - Validates direction, catches misunderstandings early
4. **Agent implements** - Following specs with judge-verified quality
5. **Human validates** - Final verification before commit

**Key insight**: Agents excel at converting human intent into structured artifacts. Humans excel at direction and validation. Don't skip the human checkpoints on critical work.

---

#### Progressive Rigor for Specifications

Not every change needs full specification. Use the lightest level that still makes the change verifiable:

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

#### Delta Specs: Brownfield-First Thinking

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

#### The Virtuous Cycle

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

#### Test-Driven Development (TDD) Best Practices

**The Iron Law of TDD**:
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

**The Red-Green-Refactor Cycle**:

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│   RED   │────▶│  GREEN  │────▶│ REFACTOR│
│Write    │     │Minimal  │     │Clean up │
│failing  │     │code to  │     │while    │
│test     │     │pass     │     │green    │
└─────────┘     └─────────┘     └────┬────┘
     │                               │
     │                               │
     └───────────────────────────────┘
                (repeat)
```

**Why Order Matters**:

1. **Write test first** - Forces you to think about what you're testing before implementation
2. **Watch it fail** - Proves the test actually tests something (catches wrong assertions)
3. **Minimal code to pass** - Prevents over-engineering
4. **Refactor safely** - Tests prove behavior preserved

**TDD Anti-Patterns**:

| Anti-Pattern | The Problem | The Fix |
|--------------|-------------|---------|
| **Testing mocks** | Verifying mock was called, not that code works | Test real behavior, minimize mocks |
| **Test-only methods** | Production code polluted with methods only tests use | Move cleanup to test utilities |
| **Mock without understanding** | Mock breaks test logic by removing side effects | Understand dependencies before mocking |
| **Tests after code** | Tests passing immediately proves nothing | Delete code, start over with test first |
| **Keep "reference" code** | Adapting existing code while writing tests | Delete it. Start fresh from tests. |

**When to Use TDD**:

**Always**:
- New features
- Bug fixes (write test reproducing bug first)
- Refactoring (ensure tests exist before changing code)
- Behavior changes

**Integration with SDD**:
When using `/sdd:implement-task`, TDD is automatically applied:
- Each step includes test-first development
- Tests written before production code
- Judge verification includes test quality checks

**Anti-Patterns to Avoid**:
- ❌ "Too simple to test" - Simple code breaks. Test takes 30 seconds.
- ❌ "I'll test after" - Tests passing immediately prove nothing.
- ❌ "Deleting X hours is wasteful" - Sunk cost. Keep unverified code = technical debt.
- ❌ "TDD is dogmatic" - TDD IS pragmatic: finds bugs before commit.

**TDD Checklist** (Before marking complete):
- [ ] Every function has a test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass
- [ ] All tests pass, output pristine
- [ ] Edge cases covered

Can't check all boxes? **You skipped TDD. Start over.**

---

#### Documentation & Reflection Best Practices

**When to Update**:
- New features, API changes, refactoring, bug fixes revealing gaps

**Priority** (highest first):
1. **Onboarding blockers** - Setup, quick start
2. **API documentation** - Endpoints, auth (`/docs:update-docs api`)
3. **Module READMEs** - Purpose, navigation (`/docs:update-docs src/<module>/`)
4. **Troubleshooting** - Common errors
5. **Architecture decisions** - Why, not what
6. **JSDoc** - Complex logic with examples

**Signs docs need updating**:
- "How do I...?" questions in issues
- Setup instructions don't work
- API doesn't match docs
- No docs for new features

**Reflection**:
```
# After major features
/reflexion:reflect
/reflexion:memorize "Pattern: Use Redis pub/sub for real-time events"
```

**Memorize**: New patterns, gotchas, better approaches, tooling quirks

**Complete Workflow**:
```
# 1. Implement
claude "add user preferences"
# 2. Reflect
/reflexion:reflect
# 3. Test
/tdd:write-tests
# 4. Review
/review-local-changes
# 5. Document
/docs:update-docs
# 6. Memorize
/reflexion:memorize "Validate preferences against schema before saving"
# 7. Commit
/git:commit
```

---

#### Using AGENTS.md Effectively

**At start of session**:
```
Read AGENTS.md and follow its guidelines
```

**After major feature**:
```
# Reflect on implementation lessons
/reflect

# Memorize key insights to AGENTS.md
/memorize
```

**When to update AGENTS.md**:
- New patterns emerge that should be standardized
- Gotchas or pitfalls discovered
- Workflow improvements validated
- Tooling or environment changes

---

#### Fluid vs Rigid: When to Break the Rules

The workflow described is a guide, not a prison. Be fluid when:

✅ **OK to skip phases**:
- Emergency hotfixes: `/sadd:do-and-judge` directly
- Trivial changes: Skip formal proposal, use `/sdd:add-task` directly
- Well-understood problems: Skip exploration, go straight to specification

⚠️ **NOT OK to skip**:
- Judge verification on production code
- Spec alignment check before archive
- Context clearing between planning and implementation
- Final review before commit

**Guideline**: Skip documentation phases when speed matters. Never skip quality gates.

---

#### Combining Plugins for Maximum Quality

For the highest quality results, combine multiple CEK plugins:

```
# 1. Create task with DDD context
/sdd:add-task "Add OAuth2 authentication"

# 2. Plan following Clean Architecture principles (DDD plugin)
/sdd:plan-task

# 3. Implement following DDD and SOLID principles
/sdd:implement-task

# 4. Multi-agent review (review plugin)
/review-local-changes

# 5. Fix any issues found (sadd plugin)
/sadd:do-in-steps "Fix issues from review"

# 6. Reflect on implementation (reflexion plugin)
/reflexion:reflect

# 7. Update documentation (docs plugin)
/docs:update-docs

# 8. Memorize insights to AGENTS.md (reflexion plugin)
/reflexion:memorize "Key pattern learned from this implementation"

# 9. Create PR with proper formatting (git plugin)
/git:create-pr
```

**Benefit**: Each plugin brings specialized agents and quality gates. Combined, they provide comprehensive coverage across architecture, implementation, review, documentation, and delivery.

## AGENTS.md Template

Use this template when creating new AGENTS.md files:

```markdown
# @mirai-app/[name] - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md)

## Purpose

Brief description of what this package/app does.

## Tech Stack

- **Tool 1**: version/purpose
- **Tool 2**: version/purpose

## Key Files

```
packages/[name]/
├── src/
│   └── index.ts
├── package.json
└── AGENTS.md
```

## Development Commands

| Command | Purpose |
|---------|---------|
| `dev` | Start development |
| `build` | Production build |
| `test` | Run tests |

## Dependencies

### Internal

- `@mirai-app/[dep]` - Purpose

### External

- `library` - Purpose

## Links

- [Root AGENTS.md](../../AGENTS.md)
```

## Instruction Chain Verification

### Discovery Order

Files are discovered in this order (root → apps/packages → nested):

1. `/AGENTS.md` (6.4 KiB) - Base monorepo conventions
2. `/apps/[app]/AGENTS.md` (~2.5 KiB avg) - App-specific rules
3. `/packages/[package]/AGENTS.md` (~2.1 KiB avg) - Package-specific rules
4. `/*/AGENTS.override.md` (< 1 KiB) - Temporary overrides

### Current Size Summary

| Category | Files | Total Size |
|----------|-------|------------|
| Root | 1 | 6.4 KiB |
| Apps | 5 | ~11.5 KiB |
| Packages | 5 | ~10.8 KiB |
| **Combined** | **11** | **~28.7 KiB** |

**Status**: ✓ Under 32 KiB limit

### Verification

To verify concatenation works correctly:

```bash
# Test root + one app
cat AGENTS.md apps/native/AGENTS.md

# Test root + one package
cat AGENTS.md packages/trpc/AGENTS.md

# Test full chain (simulated)
cat AGENTS.md apps/*/AGENTS.md packages/*/AGENTS.md
```

## License

AGPL-3.0 - See [LICENSE](./LICENSE) for details.
