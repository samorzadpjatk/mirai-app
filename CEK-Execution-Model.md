# SDD × TDD × DDD × SADD × Kaizen: Execution Model

> A unified workflow model aligned with Context Engineering Kit (CEK) concepts.
> This document maps abstract methodologies to concrete CEK commands and skill executions.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           THE FIVE PILLARS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   SDD     →  Structure the work (what to build, why, acceptance criteria)    │
│   TDD     →  Verify behavior (tests first, watch fail, minimal pass)       │
│   DDD     →  Organize code (Clean Architecture, domain purity)              │
│   SADD    →  Execute efficiently (subagents + judges, parallel/sequential)    │
│   Kaizen  →  Improve continuously (small steps, error-proof, YAGNI)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Structure (SDD)

**Goal:** Transform user intent into a refined, implementable specification.

### Commands

| Step | Command                   | Skill          | Purpose                                        |
| ---- | ------------------------- | -------------- | ---------------------------------------------- |
| 1.1  | `/add-task <description>` | `sdd:add-task` | Capture raw intent → draft task file           |
| 1.2  | `/plan <task-file>`       | `sdd:plan`     | Refine draft → specification with architecture |

### Execution Flow

```
User Input
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│ /add-task "Add JWT authentication with refresh tokens"         │
│                                                                 │
│ Output: .specs/tasks/draft/add-jwt-auth.feature.md              │
│                                                                 │
│ ---                                                             │
│ title: Add JWT authentication with refresh tokens               │
│                                                                 │
│ ## Initial User Prompt                                          │
│ Add JWT authentication with refresh tokens                      │
│                                                                 │
│ ## Description                                                  │
│ // Will be filled in future stages by business analyst          │
│ ---                                                             │
└────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│ /plan .specs/tasks/draft/add-jwt-auth.feature.md                │
│                                                                 │
│ Phase 2a: Research (sdd:researcher / sonnet)                    │
│   → Output: .claude/skills/jwt-auth/SKILL.md                    │
│                                                                 │
│ Phase 2b: Codebase Analysis (sdd:code-explorer / sonnet)      │
│   → Output: .specs/analysis/analysis-add-jwt-auth.md            │
│                                                                 │
│ Phase 2c: Business Analysis (sdd:business-analyst / opus)       │
│   → Updates: Description + Acceptance Criteria                  │
│                                                                 │
│ Phase 3: Architecture Synthesis (sdd:software-architect / opus)│
│   → Updates: Architecture Overview (DDD Clean Architecture)     │
│                                                                 │
│ Phase 4: Decomposition (sdd:tech-lead / opus)                   │
│   → Updates: Implementation Steps                               │
│                                                                 │
│ Phase 5: Parallelize (sdd:team-lead / opus)                     │
│   → Updates: Execution order with dependencies                  │
│                                                                 │
│ Phase 6: Verifications (sdd:qa-engineer / opus)                │
│   → Updates: Judge rubrics per step                           │
│                                                                 │
│ Final: Move to .specs/tasks/todo/add-jwt-auth.feature.md      │
└────────────────────────────────────────────────────────────────┘
```

### Quality Gates (Phase 1)

Every phase includes **LLM-as-Judge** validation:

```
Phase 2a → Judge 2a (sdd:researcher / sonnet) > 3.5/5.0
Phase 2b → Judge 2b (sdd:code-explorer / sonnet) > 3.5/5.0
Phase 2c → Judge 2c (sdd:business-analyst / opus) > 3.5/5.0
Phase 3  → Judge 3  (sdd:software-architect / opus) > 3.5/5.0
Phase 4  → Judge 4  (sdd:tech-lead / opus) > 3.5/5.0
Phase 5  → Judge 5  (sdd:team-lead / opus) > 3.5/5.0
Phase 6  → Judge 6  (sdd:qa-engineer / opus) > 3.5/5.0
```

**Retry Logic:** If judge score < threshold, re-launch phase with feedback (max 3 iterations).

---

## Phase 2: Execute (TDD + SADD + Kaizen)

**Goal:** Implement specification with test-first discipline, subagent efficiency, and continuous improvement.

### Commands

| Step | Command                     | Skill                         | Purpose                               |
| ---- | --------------------------- | ----------------------------- | ------------------------------------- |
| 2.1  | `/implement <task-file>`    | `sdd:implement`               | Execute planned steps with TDD + SADD |
| 2.2  | (internal) TDD cycle        | `tdd:test-driven-development` | Red-Green-Refactor per subtask        |
| 2.3  | (internal) Judge validation | `sadd:do-and-judge`           | Quality gates after each step         |

### Execution Flow

```
.specs/tasks/todo/add-jwt-auth.feature.md
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│ /implement add-jwt-auth.feature.md                              │
│                                                                 │
│ Configuration:                                                  │
│   • Standard threshold: 4.0/5.0                                 │
│   • Critical threshold: 4.5/5.0                                 │
│   • Max iterations: 3                                           │
│                                                                 │
│ MOVE: todo/ → in-progress/                                      │
└────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│ FOR EACH STEP (respecting parallelization):                     │
│                                                                 │
│ Step N: [Title]                                                 │
│ ├─ Read from task file: Expected Output, Success Criteria       │
│ ├─ Read from task file: #### Verification (judge config)          │
│ │                                                               │
│ │ ┌─────────────────────────────────────────────────────────┐  │
│ │ │           TDD RED-GREEN-REFACTOR CYCLE                  │  │
│ │ │                                                           │  │
│ │ │ RED:    sdd:developer writes test first                   │  │
│ │ │         → Watch it FAIL (not error, actual failure)       │  │
│ │ │         → Confirm failure reason is expected                │  │
│ │ │                                                           │  │
│ │ │ GREEN:  sdd:developer writes MINIMAL code to pass         │  │
│ │ │         → No premature features (YAGNI / Kaizen)            │  │
│ │ │         → Verify test passes                                │  │
│ │ │                                                           │  │
│ │ │ REFACTOR: sdd:developer cleans up                         │  │
│ │ │         → Remove duplication                              │  │
│ │ │         → Better names                                    │  │
│ │ │         → Extract helpers                                 │  │
│ │ │         → Keep tests green                                │  │
│ │ └─────────────────────────────────────────────────────────┘  │
│ │                                                               │
│ ├─ sdd:developer reports: files created, tests results          │
│ │                                                               │
│ ├─ LAUNCH JUDGE(S) per #### Verification:                         │
│ │   • NONE → Skip verification (simple ops like mkdir)          │
│ │   • Single → 1 judge (standard component, > 4.0)                │
│ │   • Panel of 2 → 2 judges (critical component, > 4.5)         │
│ │   • Per-Item → 1 judge per item (batch operations)            │
│ │                                                               │
│ ├─ Judge reports: scores per criterion, overall, PASS/FAIL        │
│ │                                                               │
│ ├─ FAIL? → Fix & Re-verify (max 3 iterations)                   │
│ │   • Dispatch sdd:developer with judge feedback                 │
│ │   • Re-run TDD cycle for fixes                                │
│ │   • Re-launch judge                                           │
│ │   • Iterate until PASS or max iterations                      │
│ │                                                               │
│ └─ PASS? → Mark [DONE] in task file → Next step                 │
│                                                                 │
│ Final: DoD Verification                                         │
│   → Verify all Definition of Done items                         │
│   → Fix any failures                                            │
│   → All PASS? → MOVE: in-progress/ → done/                    │
└────────────────────────────────────────────────────────────────┘
```

### Quality Gates (Phase 2)

```
Standard Component:
  → Single judge (sdd:developer)
  → Threshold: 4.0/5.0
  → Iterations: max 3

Critical Component:
  → Panel of 2 judges (sdd:developer × 2)
  → Threshold: 4.5/5.0
  → Median voting
  → Iterations: max 3

Per-Item (batch):
  → 1 judge per item
  → All items must pass
  → Iterations: max 3 per item
```

---

## DDD: Clean Architecture Mapping

Architecture synthesized in Phase 1 guides implementation structure in Phase 2.

### Layer Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLEAN ARCHITECTURE LAYERS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Domain Layer (Innermost - Pure Business Logic)              ││
│  │  ─────────────────────────────────────────────────          ││
│  │  Entities: User, Token, RefreshToken                         ││
│  │  Value Objects: JWTClaims, TokenExpiry                       ││
│  │  Domain Services: TokenGenerator (interface)                 ││
│  │                                                               ││
│  │  Rules:                                                       ││
│  │  • No framework dependencies                                  ││
│  │  • No I/O operations                                          ││
│  │  • Pure functions and logic                                     ││
│  │  • Types prevent invalid states (Poka-Yoke)                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Use Case Layer (Application Business Rules)                 ││
│  │  ─────────────────────────────────────────────────          ││
│  │  Interactors: AuthenticateUser, RefreshToken, LogoutUser       ││
│  │  Ports: UserRepository (interface), TokenRepository          ││
│  │  DTOs: AuthRequest, AuthResponse, TokenPair                   ││
│  │                                                               ││
│  │  Rules:                                                       ││
│  │  • Orchestrates domain entities                               ││
│  │  • Defines interfaces for external concerns                   ││
│  │  • No knowledge of UI, DB, or frameworks                      ││
│  │  • Business logic only, no infrastructure details             ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Interface Adapters (Convert Data for External Agents)       ││
│  │  ─────────────────────────────────────────────────          ││
│  │  Controllers: AuthController, TokenController                ││
│  │  Presenters: AuthResponsePresenter, ErrorPresenter           ││
│  │  Gateways: DatabaseUserRepository, RedisTokenRepository      ││
│  │  Mappers: UserMapper, TokenMapper                              ││
│  │                                                               ││
│  │  Rules:                                                       ││
│  │  • Converts use case output to UI format                      │
│  │  • Implements repository interfaces from use case layer         ││
│  │  • Handles external API calls                                  ││
│  │  • No domain logic, only adaptation                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Frameworks & Drivers (Outermost - Details)                 ││
│  │  ─────────────────────────────────────────────────          ││
  │  │  Web: Hono routes                                              ││
│  │  UI: React components, API clients                             ││
│  │  External: JWT library, bcrypt, Redis client                   ││
│  │  Database: PostgreSQL, MongoDB adapters                      ││
│  │                                                               ││
│  │  Rules:                                                       ││
│  │  • Framework-specific code                                     ││
│  │  • Can be swapped without affecting inner layers               ││
│  │  • Depends on inner layers (dependency rule)                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  DEPENDENCY RULE:                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Frameworks │───▶│  Interface  │───▶│   Use Case  │───▶ ...  │
│  │  & Drivers  │    │  Adapters   │    │   Layer     │          │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│      (outer)            (middle)           (inner)                │
│                                                                   │
│  Inner layers define interfaces. Outer layers implement them.     │
│  Dependencies point INWARD only.                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Steps Aligned with DDD

```markdown
## Implementation Process

### Step 1: Domain Entities [CRITICAL]

**Expected Output:**

- `src/domain/entities/User.ts`
- `src/domain/entities/Token.ts`
- `src/domain/value-objects/JWTClaims.ts`
- `src/domain/value-objects/TokenExpiry.ts`

**DDD Alignment:** Pure domain logic, no framework dependencies.

**TDD Cycle:**

1. Test: User.create() validates email format → FAIL
2. Implement: User entity with validation → PASS
3. Refactor: Extract Email value object

**Success Criteria:**

- [ ] Entities have no external dependencies
- [ ] Invalid states are unrepresentable (types enforce constraints)
- [ ] All domain logic tested in isolation

#### Verification

**Level:** Panel of 2 Judges  
**Threshold:** 4.5/5.0  
**Rubric:**
| Criterion | Weight | Description |
|-----------|--------|-------------|
| Domain Purity | 0.30 | No framework imports in domain layer |
| Type Safety | 0.25 | Invalid states prevented at compile time |
| Test Coverage | 0.25 | All domain logic paths tested |
| Design Quality | 0.20 | Follows DDD patterns (entities, value objects) |

---

### Step 2: Use Cases (Interactors) [CRITICAL]

**Expected Output:**

- `src/use-cases/AuthenticateUser.ts`
- `src/use-cases/RefreshToken.ts`
- `src/use-cases/ports/UserRepository.ts` (interface)
- `src/use-cases/ports/TokenRepository.ts` (interface)

**DDD Alignment:** Application business rules, orchestrate domain entities.

**TDD Cycle:**

1. Test: AuthenticateUser executes with valid credentials → FAIL
2. Implement: Interactor with repository interfaces → PASS
3. Refactor: Extract common auth logic

**Success Criteria:**

- [ ] Use cases have no knowledge of frameworks
- [ ] Dependencies are interfaces (ports), not implementations
- [ ] All use case scenarios tested

#### Verification

**Level:** Panel of 2 Judges  
**Threshold:** 4.5/5.0

---

### Step 3: Interface Adapters

**Expected Output:**

- `src/adapters/controllers/AuthController.ts`
- `src/adapters/gateways/DatabaseUserRepository.ts`
- `src/adapters/gateways/RedisTokenRepository.ts`
- `src/adapters/presenters/AuthResponsePresenter.ts`

**DDD Alignment:** Implement repository interfaces, convert data for frameworks.

**TDD Cycle:**

1. Test: DatabaseUserRepository.findByEmail returns User → FAIL
2. Implement: Repository with actual DB queries → PASS
3. Refactor: Extract query builders

#### Verification

**Level:** Single Judge  
**Threshold:** 4.0/5.0

---

### Step 4: Framework Integration

**Expected Output:**

- `src/frameworks/express/routes/auth.ts`
- `src/frameworks/middleware/jwtAuth.ts`
- `src/frameworks/config/jwt.ts`

**DDD Alignment:** Framework-specific code, depends on inner layers.

**TDD Cycle:**

1. Test: POST /auth/login returns token on valid credentials → FAIL
2. Implement: Express route wiring → PASS
3. Refactor: Extract route handlers

#### Verification

**Level:** Single Judge  
**Threshold:** 4.0/5.0
```

---

## Kaizen: Continuous Improvement Principles

Applied throughout both phases via skill constraints and agent instructions.

### 1. Small Iterations (Kaizen)

```
BAD:  Implement entire auth system in one step
GOOD: Domain entities → Use cases → Adapters → Framework

Each step is:
- Complete and working
- Tested in isolation
- Committable independently
- Reviewable independently
```

### 2. Error-Proofing (Poka-Yoke)

```typescript
// Type system prevents invalid states
type ValidEmail = string & { readonly __brand: "ValidEmail" };
type Token = string & { readonly __brand: "JWTToken" };

// Validation at boundary
function validateEmail(email: string): ValidEmail {
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  return email as ValidEmail;
}

// Domain entities enforce invariants
class User {
  private constructor(
    private readonly id: string,
    private readonly email: ValidEmail,
    private readonly hashedPassword: string,
  ) {}

  static create(email: string, password: string): Result<User, Error> {
    // Must validate before creation
    const validEmail = validateEmail(email);
    if (password.length < 8) {
      return { ok: false, error: new Error("Password too short") };
    }
    // ...
  }
}
```

### 3. Standardized Work

```
Pattern for all use cases:
  src/use-cases/{UseCaseName}.ts
  src/use-cases/{UseCaseName}.test.ts
  src/use-cases/ports/{PortInterface}.ts

Pattern for all entities:
  src/domain/entities/{EntityName}.ts
  src/domain/entities/{EntityName}.test.ts
  src/domain/value-objects/{ValueObject}.ts

Error handling:
  Use Result<T, E> type throughout
  Never throw in domain layer
  Handle errors at boundaries
```

### 4. Just-In-Time (YAGNI)

```
Current requirement: "User can login with email/password"

BAD:
  - Implement OAuth, SAML, LDAP "for future"
  - Add role-based permissions "we might need"
  - Build audit logging framework "just in case"

GOOD:
  - Email/password auth only
  - Simple bcrypt hashing
  - JWT with standard claims

When requirement evolves: "Add refresh tokens"
THEN add RefreshToken entity and RefreshToken use case.
```

---

## SADD: Subagent Execution Patterns

### Sequential Execution

Use when tasks are tightly coupled or have dependencies.

```
Step 1: Create Domain Entities
    ↓ (depends on)
Step 2: Implement Use Cases
    ↓ (depends on)
Step 3: Create Adapters
    ↓ (depends on)
Step 4: Framework Integration
```

**Command Flow:**

```
/implement task.md
  → Sequential by default (respects step dependencies)
  → Each step launches sdd:developer fresh
  → Judge validates before proceeding
  → Next step only after PASS
```

### Parallel Execution

Use for independent tasks in same step.

```
Step 3: Create Adapters
  ├── Item 1: DatabaseUserRepository (sdd:developer)
  ├── Item 2: RedisTokenRepository (sdd:developer)
  ├── Item 3: AuthController (sdd:developer)
  └── Item 4: ErrorPresenter (sdd:developer)

All 4 launched in parallel
Each validated by separate judge
All must PASS before step complete
```

**Configuration in Task File:**

```markdown
### Step 3: Create Adapters

**Parallel Items:**

1. DatabaseUserRepository
2. RedisTokenRepository
3. AuthController
4. ErrorPresenter

#### Verification

**Level:** Per-Item Judges
```

### Human-in-the-Loop

Pause after specific steps for human review.

```bash
# Review after every step
/implement task.md --human-in-the-loop

# Review after specific steps only
/implement task.md --human-in-the-loop 2,4,6

# Higher quality with checkpoints
/implement task.md --target-quality 4.5 --human-in-the-loop 3,6
```

---

## Complete Execution Example

### Scenario: Add JWT Authentication

```bash
# ─────────────────────────────────────────────────────────────────
# PHASE 1: SPECIFICATION (SDD)
# ─────────────────────────────────────────────────────────────────

# 1.1 Create draft task
$ /add-task "Add JWT authentication with refresh tokens"
Created: .specs/tasks/draft/add-jwt-auth.feature.md

# 1.2 Refine to specification
$ /plan .specs/tasks/draft/add-jwt-auth.feature.md

[Phase 2a] Researching JWT best practices...
  → .claude/skills/jwt-auth/SKILL.md [Judge 2a: 4.2/5.0 PASS]

[Phase 2b] Analyzing codebase impact...
  → .specs/analysis/analysis-add-jwt-auth.md [Judge 2b: 4.1/5.0 PASS]

[Phase 2c] Defining acceptance criteria...
  [Judge 2c: 4.3/5.0 PASS]

[Phase 3] Synthesizing Clean Architecture...
  Architecture Overview:
  ├─ Domain: User, Token, JWTClaims entities
  ├─ Use Cases: AuthenticateUser, RefreshToken
  ├─ Ports: UserRepository, TokenRepository
  ├─ Adapters: AuthController, DB repositories
  └─ Framework: Express routes, JWT middleware
  [Judge 3: 4.0/5.0 PASS]

[Phase 4] Decomposing into steps...
  Step 1: Domain Entities [CRITICAL]
  Step 2: Use Cases [CRITICAL]
  Step 3: Interface Adapters
  Step 4: Framework Integration
  [Judge 4: 4.2/5.0 PASS]

[Phase 5] Parallelizing...
  Step 1: Sequential (foundation)
  Step 2: Sequential (depends on 1)
  Step 3: Parallel items (4 repositories/controllers)
  Step 4: Sequential (depends on 2,3)
  [Judge 5: 4.0/5.0 PASS]

[Phase 6] Defining verifications...
  Step 1: Panel of 2 judges, threshold 4.5
  Step 2: Panel of 2 judges, threshold 4.5
  Step 3: Per-item judges, threshold 4.0
  Step 4: Single judge, threshold 4.0
  [Judge 6: 4.1/5.0 PASS]

Moved: draft/ → todo/

# ─────────────────────────────────────────────────────────────────
# PHASE 2: IMPLEMENTATION (TDD + SADD + Kaizen)
# ─────────────────────────────────────────────────────────────────

$ /implement add-jwt-auth.feature.md

[Configuration]
  Task: .specs/tasks/in-progress/add-jwt-auth.feature.md
  Standard threshold: 4.0/5.0
  Critical threshold: 4.5/5.0
  Max iterations: 3

[Step 1] Domain Entities [CRITICAL]
  sdd:developer (Opus) executing TDD cycle...
    RED: Test User.create validates email → FAIL ✗
    GREEN: Implement User entity → PASS ✓
    RED: Test JWTClaims prevents invalid expiry → FAIL ✗
    GREEN: Implement JWTClaims value object → PASS ✓
    REFACTOR: Extract Email value object → PASS ✓

  Reporting: 4 files created, 12 tests passing

  Launching Panel of 2 Judges...
    Judge 1 (sdd:developer): 4.6/5.0
      - Domain Purity: 5.0/5.0 (no framework deps)
      - Type Safety: 4.5/5.0 (branded types used)
      - Test Coverage: 4.5/5.0 (edge cases covered)
      - Design Quality: 4.5/5.0 (good entity boundaries)

    Judge 2 (sdd:developer): 4.5/5.0
      - Domain Purity: 5.0/5.0
      - Type Safety: 4.0/5.0 (some any types)
      - Test Coverage: 4.5/5.0
      - Design Quality: 4.5/5.0

    Median: 4.5/5.0 ≥ 4.5 threshold → PASS ✓

  Status: [DONE]

[Step 2] Use Cases [CRITICAL]
  sdd:developer (Opus) executing TDD cycle...
    RED: Test AuthenticateUser with valid creds → FAIL ✗
    GREEN: Implement AuthenticateUser interactor → PASS ✓
    RED: Test repository port interfaces → FAIL ✗
    GREEN: Define UserRepository, TokenRepository ports → PASS ✓
    REFACTOR: Extract common auth utilities → PASS ✓

  Reporting: 5 files created, 15 tests passing

  Launching Panel of 2 Judges...
    Judge 1: 4.4/5.0
    Judge 2: 4.6/5.0
    Median: 4.5/5.0 ≥ 4.5 threshold → PASS ✓

  Status: [DONE]

[Step 3] Interface Adapters
  Launching 4 parallel sdd:developer agents...
    Item 1: DatabaseUserRepository → 4.1/5.0 PASS
    Item 2: RedisTokenRepository → 4.2/5.0 PASS
    Item 3: AuthController → 4.0/5.0 PASS
    Item 4: ErrorPresenter → 4.3/5.0 PASS

  All items passed threshold 4.0
  Status: [DONE]

[Step 4] Framework Integration
  sdd:developer (Opus) executing TDD cycle...
    RED: Test POST /auth/login endpoint → FAIL ✗
    GREEN: Implement Express routes → PASS ✓
    RED: Test JWT middleware protects routes → FAIL ✗
    GREEN: Implement auth middleware → PASS ✓
    REFACTOR: Extract route configuration → PASS ✓

  Reporting: 4 files created, 8 tests passing

  Launching Single Judge...
    Score: 4.2/5.0 ≥ 4.0 threshold → PASS ✓

  Status: [DONE]

[Final Verification] Definition of Done
  Verifying all DoD items...
    ✓ All acceptance criteria met (4/4)
    ✓ Unit tests passing (35/35)
    ✓ Integration tests passing (8/8)
    ✓ Code coverage >80% (85.3%)
    ✓ No ESLint errors (0 errors, 0 warnings)
    ✓ Clean Architecture boundaries respected

  All items PASS ✓

[Complete]
  Moved: in-progress/ → done/

  Summary:
  • 4 steps completed
  • 17 files created
  • 43 tests written (all passing)
  • 6 quality gates passed
  • 2 critical components verified by panel
  • 0 iterations required (first-pass quality)
```

---

## Command Reference

### SDD Commands

| Command                   | Arguments                                                                                   | When to Use                     |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| `/add-task <description>` | Description string                                                                          | Starting any new work           |
| `/plan <task-file>`       | `[--fast] [--one-shot] [--human-in-the-loop] [--target-quality X.X] [--max-iterations N]`   | Refining draft to specification |
| `/implement <task-file>`  | `[--continue] [--refine] [--human-in-the-loop] [--target-quality X.X] [--max-iterations N]` | Executing planned work          |

### Quality Thresholds

| Context                 | Default | Override Flag                                  |
| ----------------------- | ------- | ---------------------------------------------- |
| SDD /plan phases        | 3.5/5.0 | `--target-quality X.X`                         |
| SDD /implement standard | 4.0/5.0 | `--target-quality X.X`                         |
| SDD /implement critical | 4.5/5.0 | `--target-quality X.X,Y.Y` (standard,critical) |

### File Locations

```
.specs/
├── tasks/
│   ├── draft/              # Tasks created via /add-task
│   ├── todo/               # Tasks refined via /plan, ready to implement
│   ├── in-progress/        # Tasks currently being implemented
│   └── done/               # Completed tasks
├── analysis/               # Codebase impact analysis files
└── scratchpad/             # Agent working notes (gitignored)

.claude/
└── skills/                 # Reusable skill documents from research
    └── <skill-name>/
        └── SKILL.md
```

---

## Anti-Patterns & Guardrails

### TDD Anti-Patterns (Prevented)

| Anti-Pattern                    | Prevention                                                      |
| ------------------------------- | --------------------------------------------------------------- |
| Testing mock behavior           | Skill mandates: "Test real component or unmock it"              |
| Test-only methods in production | Skill mandates: "Move to test utilities"                        |
| Mocking without understanding   | Skill mandates: "Understand dependencies first, mock minimally" |
| Incomplete mocks                | Skill mandates: "Mirror real API completely"                    |
| Tests as afterthought           | Skill mandates: "TDD - tests first"                             |

### Kaizen Red Flags

| Rationalization                | Reality                                            |
| ------------------------------ | -------------------------------------------------- |
| "I'll refactor later"          | Kaizen: Refactor NOW while context is fresh        |
| "We might need this"           | Kaizen: YAGNI - build only what's needed NOW       |
| "Too simple to test"           | Kaizen: Simple code breaks. Test takes 30 seconds. |
| "I'll manually test"           | TDD: Manual is ad-hoc. Automated is systematic.    |
| "Deleting X hours is wasteful" | TDD: Sunk cost fallacy. Unverified code is debt.   |

### DDD Violations

| Violation                        | Correct Approach                                |
| -------------------------------- | ----------------------------------------------- |
| Domain layer imports Express     | Domain must have ZERO framework dependencies    |
| Use case throws framework errors | Use Result<T,E> types, catch at boundaries      |
| Repository returns database rows | Repository returns domain entities              |
| Business logic in controllers    | Controllers only adapt, use cases contain logic |

---

## Summary: The Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UNIFIED EXECUTION MODEL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INTENT          SPECIFICATION         IMPLEMENTATION        COMPLETION     │
│      │                  │                    │                   │         │
│      ▼                  ▼                    ▼                   ▼         │
│  ┌─────────┐       ┌──────────┐       ┌───────────┐       ┌──────────┐    │
│  │ /add-   │       │ /plan    │       │ /implement│       │ DoD      │    │
│  │  task   │──────▶│          │──────▶│           │──────▶│  verify  │    │
│  └─────────┘       └──────────┘       └───────────┘       └──────────┘    │
│       │                 │                   │                   │         │
│       │                 │                   │                   │         │
│   SDD:draf          SDD:refine          TDD+SADD+Kaizen     SDD:done      │
│                      +DDD:arch                                                  │
│                                                                              │
│   SKILLS:           SKILLS:              SKILLS:                             │
│   • sdd:add-task    • sdd:plan          • sdd:implement                      │
│                     • sdd:researcher    • tdd:test-driven-dev                │
│                     • sdd:code-explorer • sadd:do-and-judge                  │
│                     • sdd:business      • sadd:subagent-driven              │
│                     • sdd:architect                                                │
│                     • sdd:tech-lead                                             │
│                     • sdd:team-lead                                             │
│                     • sdd:qa-engineer                                           │
│                                                                              │
│   QUALITY:          QUALITY:           QUALITY:          QUALITY:          │
│   • Draft created   • 6 phases ×         • Per-step        • DoD agent       │
│                     • judge (>3.5)       • judges          • validation       │
│                                          • (>4.0/4.5)      • (>threshold)       │
│                                                                              │
│   OUTPUT:           OUTPUT:            OUTPUT:           OUTPUT:            │
│   • .md in          • .md in todo/      • Code in src/     • .md in done/    │
│     draft/          • SKILL.md          • Tests passing    • Complete record │
│                     • Analysis.md       • All judges PASS                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Create task
/add-task "Implement feature X with Y requirements"

# 2. Plan with quality
/plan .specs/tasks/draft/feature-x.feature.md --target-quality 4.0

# 3. Implement with human checkpoints
/implement feature-x.feature.md --target-quality 4.0,4.5 --human-in-the-loop 2,4

# 4. Review completed work
cat .specs/tasks/done/feature-x.feature.md
```

---

_This model is designed for CEK (Context Engineering Kit) and assumes the following skills are installed:_

- `sdd:add-task`
- `sdd:plan`
- `sdd:implement`
- `tdd:test-driven-development`
- `kaizen:kaizen`
- `sadd:do-and-judge`
- `sadd:subagent-driven-development`
