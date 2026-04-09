---
title: Align monorepo codebase with CEK Five Pillars (SDD, TDD, DDD, SADD, Kaizen)
---

## Initial User Prompt

I want to bring the codebase of the monorepo to the state, where it fully adheres to Five Pillars from CEK-Execution-Model.md

Right now, the codebase is messy and poor code quality

## Description

### Why This Transformation is Needed

The current monorepo suffers from:

- **Poor code quality**: Mixed concerns and inconsistent patterns make the codebase difficult to maintain
- **Scalability issues**: Current structure won't scale with team growth or feature expansion
- **Testing difficulties**: Architecture lacks clear boundaries, making testing complex and unreliable
- **Developer friction**: Inconsistent patterns slow down development and increase cognitive load
- **Technical debt accumulation**: Without structured workflows, debt compounds rapidly

### What "Five Pillars Compliance" Means

This transformation brings the entire monorepo into alignment with the CEK Execution Model:

1. **SDD (Specification-Driven Development)**: Structured task workflow with clear specifications, acceptance criteria, and architecture planning before implementation

2. **TDD (Test-Driven Development)**: Test-first development with Red-Green-Refactor cycles, minimum coverage thresholds, and comprehensive test suites

3. **DDD (Domain-Driven Design)**: Clean Architecture with clearly separated layers - Domain (pure business logic), Use Case (application rules), Interface Adapters (external integration), and Frameworks (technical details)

4. **SADD (Subagent-Driven Development)**: Efficient execution through subagent workflows with LLM-as-Judge quality gates for consistent, high-quality output

5. **Kaizen (Continuous Improvement)**: Incremental refactoring following YAGNI principles, small iterative improvements, and type-based error-proofing

### Scope Boundaries

**IN Scope:**

- All packages in `/packages/*` (auth, db, shared, supabase, test-utils, trpc)
- All apps in `/apps/*` (backend-server, native, notification-sender, seed, web)
- Task management structure in `.specs/`
- Testing infrastructure and patterns
- Documentation (CLAUDE.md, AGENTS.md)

**OUT of Scope:**

- External third-party services (Supabase, etc.) - integration only, not service changes
- Deployment and CI/CD infrastructure changes
- UI/UX design modifications
- Database schema migrations (unless required by architectural refactoring)

## Acceptance Criteria

### SDD Acceptance Criteria

- [ ] Task workflow structure exists at `.specs/tasks/` with subdirectories: `draft/`, `todo/`, `in-progress/`, `done/`
- [ ] All major features have specification documents following the template format
- [ ] Acceptance criteria use Given-When-Then format for clarity and testability
- [ ] Architecture Overview section exists for features requiring structural changes
- [ ] Definition of Done is explicitly defined for each task

### TDD Acceptance Criteria

- [ ] Test files are co-located with source files or in `__tests__/` directories
- [ ] Minimum coverage thresholds defined and enforced: 80% line coverage, 75% branch coverage, 80% function coverage
- [ ] Red-Green-Refactor pattern documented in CLAUDE.md with examples
- [ ] All new code has accompanying tests written BEFORE implementation
- [ ] Tests run successfully in CI for all packages and apps
- [ ] Mocking guidelines documented (mock.module() for Bun, **mocks**/ for Jest)

### DDD Acceptance Criteria

- [ ] Clean Architecture layers properly organized in each package/app:
  - **Domain Layer** (`src/domain/`): entities, value-objects, domain-services
    - Zero framework dependencies
    - No I/O operations
    - Pure business logic only
  - **Use Case Layer** (`src/use-cases/`): interactors, ports (interfaces), DTOs
    - Orchestrates domain entities
    - No knowledge of UI, DB, or frameworks
    - Defines repository interfaces
  - **Interface Adapters** (`src/adapters/`): controllers, gateways, presenters, mappers
    - Implements repository interfaces from use case layer
    - Converts use case output to UI/external format
    - No domain logic, only adaptation
  - **Frameworks & Drivers** (`src/frameworks/`): Express routes, React components, database adapters, external API clients
    - Framework-specific code only
    - Depends on inner layers following Dependency Rule

- [ ] Dependency Rule enforced: Dependencies point INWARD only (Frameworks → Adapters → Use Cases → Domain)
- [ ] Domain Purity verified: No framework imports, no I/O operations in domain layer
- [ ] Type-based error prevention using branded types and Result<T,E> patterns
- [ ] Each layer has documented responsibilities and examples

### SADD Acceptance Criteria

- [ ] Subagent workflows documented in CLAUDE.md
- [ ] Quality gates with LLM-as-Judge validation defined for:
  - Standard components: Single judge, threshold 4.0/5.0
  - Critical components: Panel of 2 judges, threshold 4.5/5.0
  - Batch operations: Per-item judges, all must pass
- [ ] Parallel execution patterns established for independent tasks
- [ ] Sequential execution patterns documented for dependent tasks
- [ ] Judge rubrics defined for common component types

### Kaizen Acceptance Criteria

- [ ] Continuous improvement process documented in CLAUDE.md
- [ ] YAGNI principles followed with documented anti-patterns:
  - "I'll refactor later" → Refactor NOW while context is fresh
  - "We might need this" → Build only what's needed NOW
  - "Too simple to test" → Simple code breaks, test takes 30 seconds
- [ ] Small, incremental refactoring approach documented
- [ ] Standardized work patterns defined for:
  - File naming conventions
  - Directory structures
  - Error handling (Result<T,E> throughout)
- [ ] Examples of Poka-Yoke (error-proofing) via type system

## Definition of Done

- [ ] All five pillars have measurable compliance criteria defined above
- [ ] Codebase organized according to Clean Architecture (all packages refactored to layered structure)
- [ ] All packages/apps follow consistent patterns (directory structure, naming, error handling)
- [ ] Documentation exists for workflows:
  - CLAUDE.md with CEK Five Pillars guidance
  - AGENTS.md with agent-focused instructions
  - Updated TESTING.md with TDD practices
- [ ] Test coverage meets thresholds across all packages (verified in CI)
- [ ] Judge validation integrated into development workflow (documented process)
- [ ] Reference implementations demonstrating each pillar:
  - One complete feature showing SDD → TDD → DDD → SADD → Kaizen flow
  - Examples of Clean Architecture layers in practice
  - Example of subagent-driven implementation with judge validation

## Architecture Overview

### Current State

The monorepo currently has a **mixed-concerns architecture** with business logic scattered across layers:

**Structure:**

- **5 Apps**: `backend-server`, `native`, `nextjs-web`, `storybook`, `web`
- **6 Packages**: `trpc`, `auth`, `db`, `supabase`, `shared`, `test-utils`

**Critical Issues:**

- **12K+ lines of business logic in tRPC routers** (`packages/trpc/src/api/routers/`)
- **No Clean Architecture separation**: Domain, application, and infrastructure concerns mixed together
- **Direct Prisma coupling**: Database access scattered throughout business logic
- **No repository pattern**: External dependencies directly imported in business logic
- **Framework leakage**: tRPC, React, and Prisma imports throughout packages

**Dependency Graph (Current):**

```
┌────────────────────────────────────────────────────────────────┐
│                    CURRENT (Mixed Concerns)                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐             │
│  │   auth   │◄────│   db     │     │ supabase │             │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘             │
│       │                │                │                    │
│       │         ┌──────▼──────┐         │                    │
│       │         │  test-utils │◄────────┘                    │
│       │         └─────────────┘                            │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐       │
│  │   trpc   │◄────│  shared  │     │ notification │       │
│  └────┬─────┘     └──────────┘     │   -sender    │       │
│       │                            └──────┬───────┘       │
│       │                                   │               │
│       ▼                                   ▼               │
│  ┌──────────┐                    ┌──────────────┐          │
│  │  native  │                    │  backend-server│          │
│  └──────────┘                    └──────────────┘          │
│                                                                │
│  LEGEND: ◄──── = depends on                                   │
└────────────────────────────────────────────────────────────────┘
```

**CEK Five Pillars Scorecard:**
| Pillar | Current | Target | Gap |
|--------|---------|--------|-----|
| SDD | 2/10 | 8/10 | -6 |
| TDD | 5/10 | 9/10 | -4 |
| DDD | 2/10 | 8/10 | -6 |
| SADD | 3/10 | 8/10 | -5 |
| Kaizen | 3/10 | 7/10 | -4 |

---

### Target State

**Clean Architecture with DDD Layers** - Dependencies point strictly inward:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TARGET (Clean Architecture)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Presentation Layer (Apps)                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │
│  │  │  native  │ │   web    │ │ backend  │ │  seed    │           │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │  │
│  └───────┼───────────┼───────────┼───────────┼──────────────────┘  │
│          │           │           │           │                       │
│          ▼           ▼           ▼           ▼                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              Interface Adapters (packages/adapters/)            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │  │
│  │  │ Controllers │ │  Gateways   │ │ Presenters  │               │  │
│  │  │  (tRPC)     │ │(Repository) │ │   (DTOs)    │               │  │
│  │  └──────┬──────┘ └──────┬──────┘ └─────────────┘               │  │
│  └─────────┼───────────────┼────────────────────────────────────┘  │
│            │               │                                         │
│            ▼               │ depends on                              │
│  ┌─────────────────────────▼─────────────────────────────────────┐  │
│  │              Application Layer (packages/use-cases/)          │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │  │
│  │  │ Interactors │ │   Ports     │ │     DTOs    │             │  │
│  │  │ (Use Cases) │ │(Interfaces) │ │             │             │  │
│  │  └──────┬──────┘ └──────┬──────┘ └─────────────┘             │  │
│  └─────────┼───────────────┼────────────────────────────────────┘  │
│            │               │                                         │
│            ▼               │ depends on                              │
│  ┌─────────────────────────▼─────────────────────────────────────┐  │
│  │                 Domain Layer (packages/domain/)                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │  │
│  │  │  Entities   │ │Value Objects│ │Domain Svcs  │             │  │
│  │  │   (Pure)    │ │   (Pure)    │ │   (Pure)    │             │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘             │  │
│  │                                                                 │  │
│  │  ZERO EXTERNAL DEPENDENCIES - Only pure TypeScript           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│            ▲                                                          │
│            │ implements                                                │
│  ┌─────────┴─────────────────────────────────────────────────────┐  │
│  │           Infrastructure (packages/frameworks/)                 │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │  │
│  │  │    tRPC     │ │   Prisma    │ │  Supabase   │             │  │
│  │  │   Config    │ │   Client    │ │   Client    │             │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  DEPENDENCY RULE: Frameworks → Adapters → Use Cases → Domain          │
│                    (Dependencies point INWARD only)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Package Dependencies (Target):**

```json
// packages/domain/package.json - ZERO dependencies
{ "name": "@mirai-app/domain", "dependencies": {} }

// packages/use-cases/package.json - Only domain
{ "name": "@mirai-app/use-cases", "dependencies": { "@mirai-app/domain": "workspace:*" } }

// packages/adapters/package.json - Domain + Use Cases
{ "name": "@mirai-app/adapters", "dependencies": {
  "@mirai-app/domain": "workspace:*",
  "@mirai-app/use-cases": "workspace:*"
} }

// packages/frameworks/package.json - All inner layers
{ "name": "@mirai-app/frameworks", "dependencies": {
  "@mirai-app/domain": "workspace:*",
  "@mirai-app/use-cases": "workspace:*",
  "@mirai-app/adapters": "workspace:*"
} }
```

---

### Migration Strategy

**Approach: Gradual Extraction (NOT Big-Bang)**

| Phase       | Timeline   | Focus                  | Risk Level |
| ----------- | ---------- | ---------------------- | ---------- |
| **Phase 1** | Weeks 1-2  | SDD/TDD Infrastructure | Low        |
| **Phase 2** | Weeks 3-8  | DDD Layer Extraction   | High       |
| **Phase 3** | Weeks 9-12 | SADD/Kaizen Process    | Medium     |

**Phase 1: Foundation (Low Risk)**

```
┌────────────────────────────────────────────────────────────────┐
│  Phase 1: SDD + TDD Infrastructure                             │
├────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Create Package Structure                                   │ │
│  │ ├─ packages/domain/ (empty scaffold)                       │ │
│  │ ├─ packages/use-cases/ (empty scaffold)                   │ │
│  │ ├─ packages/adapters/ (migrate trpc/ incrementally)        │ │
│  │ └─ packages/frameworks/ (config extraction)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Documentation                                              │ │
│  │ ├─ CLAUDE.md (CEK Five Pillars conventions)                │ │
│  │ ├─ AGENTS.md (Agent instructions)                          │ │
│  │ └─ TESTING.md (TDD workflow update)                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Tooling                                                    │ │
│  │ ├─ dependency-cruiser (layer enforcement)                │ │
│  │ ├─ turbo.json (DDD-aware pipeline)                        │ │
│  │ └─ CI coverage enforcement (80% threshold)                │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Phase 2: DDD Extraction (High Risk - Incremental)**

```
┌────────────────────────────────────────────────────────────────┐
│  Phase 2: Domain-Driven Design Layer Extraction                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Extraction Order (by entity complexity):                      │
│                                                                │
│  Step 1: User Entity                                           │
│  ├─ Create packages/domain/src/entities/User.ts               │
│  ├─ Create packages/use-cases/src/ports/UserRepository.ts     │
│  ├─ Create packages/adapters/src/gateways/PrismaUserRepository.ts│
│  ├─ Create packages/use-cases/src/interactors/CreateUser.ts   │
│  └─ Refactor packages/trpc/src/api/routers/user.ts (thin)     │
│                                                                │
│  Step 2: Challenge Entity                                      │
│  └─ [Repeat pattern for Challenge]                            │
│                                                                │
│  Step 3: Notification Entity                                   │
│  └─ [Repeat pattern for Notification]                         │
│                                                                │
│  Step N: Remaining Entities                                    │
│  └─ [Continue until all 12K lines extracted]                  │
│                                                                │
│  Parallelization Strategy:                                     │
│  - Independent entities can be extracted in parallel             │
│  - Dependent entities (User → Challenge) must be sequential    │
│  - Each entity: 1 subagent for domain + 1 for adapters         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Phase 3: SADD + Kaizen (Medium Risk)**

- Document subagent workflow patterns
- Implement judge quality gates
- Set up continuous improvement metrics
- Create refactoring playbooks

---

### Key Architectural Decisions

| Decision                   | Choice                                                         | Rationale                                                 |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| **Layer Boundaries**       | 4 layers (Domain → Use Cases → Adapters → Frameworks)          | Standard Clean Architecture, clear responsibilities       |
| **Dependency Direction**   | Strictly inward                                                | Domain has zero external dependencies, maximally testable |
| **Repository Pattern**     | Interface in Domain/Ports, Implementation in Adapters/Gateways | Dependency inversion, testability                         |
| **Error Handling**         | `Result<T,E>` type throughout                                  | Type-based error prevention (Poka-Yoke)                   |
| **DTO Strategy**           | Adapters handle all mapping                                    | Clean boundaries, no domain leakage                       |
| **Test Strategy**          | Domain: co-located pure tests, Adapters: integration tests     | Match test type to layer responsibility                   |
| **Migration Approach**     | Gradual extraction, one entity at a time                       | Risk mitigation, continuous delivery                      |
| **Dependency Enforcement** | dependency-cruiser + CI check                                  | Automated prevention of layer violations                  |

**Cross-Package Communication Patterns:**

```
┌────────────────────────────────────────────────────────────────┐
│  Communication Patterns by Layer                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Domain → Use Cases:                                           │
│  ├─ Entities (pure objects)                                   │
│  ├─ Domain Events (for loose coupling)                        │
│  └─ Repository Interfaces (ports)                             │
│                                                                │
│  Use Cases → Adapters:                                         │
│  ├─ DTOs (Input/Output)                                        │
│  ├─ Repository Interfaces (implemented by adapters)             │
│  └─ Use Case Interactors (orchestration)                      │
│                                                                │
│  Adapters → Frameworks:                                        │
│  ├─ Controller implementation (tRPC routers)                     │
│  ├─ Gateway implementation (Prisma repositories)              │
│  └─ Presenter implementation (response formatting)            │
│                                                                │
│  Apps → Packages:                                              │
│  ├─ Apps import only from adapters (routers)                   │
│  ├─ Apps import only from frameworks (config)                 │
│  └─ Apps NEVER import from domain/use-cases directly          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Expected Changes

**New Packages to Create (4):**

| Package                | Purpose                   | Files to Create                                                                                 |
| ---------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/domain/`     | Pure business logic       | `entities/*.ts`, `value-objects/*.ts`, `domain-services/*.ts`, `repositories/*.ts` (interfaces) |
| `packages/use-cases/`  | Application orchestration | `ports/*.ts`, `interactors/*.ts`, `dto/*.ts`                                                    |
| `packages/adapters/`   | External integration      | `controllers/*.ts`, `gateways/*.ts`, `presenters/*.ts`, `mappers/*.ts`                          |
| `packages/frameworks/` | Technical configuration   | `trpc/*.ts`, `prisma/*.ts`, `fastify/*.ts`                                                      |

**Existing Packages to Refactor (2):**

| Package          | Changes                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `packages/trpc/` | Move router business logic to `packages/adapters/src/controllers/`, keep only thin routing |
| `packages/auth/` | Extract domain logic to `packages/domain/`, keep only adapter implementations              |

**Configuration Changes:**

- `turbo.json` - Add DDD layer build pipeline (domain → use-cases → adapters → frameworks)
- Root `package.json` - Add workspace dependencies between new packages
- `bunfig.toml` - Ensure coverage thresholds enforced in CI
- Add `dependency-cruiser` config for layer dependency enforcement

**Documentation to Create:**

- `CLAUDE.md` (root) - CEK Five Pillars conventions, code style, testing rules
- `AGENTS.md` (root) - Agent-specific instructions for this codebase
- `packages/domain/README.md` - Domain layer guidelines
- `packages/use-cases/README.md` - Use case patterns
- `packages/adapters/README.md` - Adapter implementation guide

**Files to Delete/Move:**

- Business logic from `packages/trpc/src/api/routers/*.ts` (12K+ lines → move to domain/)
- Direct Prisma calls in routers (replace with repository injection)

---

---

## Implementation Process

### Overview

This section defines the concrete implementation steps for aligning the monorepo with CEK Five Pillars. The process follows a 3-phase gradual migration strategy to minimize risk while achieving full Clean Architecture compliance.

**Phase Sequence:**

1. **Phase 1: Foundation** - Set up SDD/TDD infrastructure (no business logic changes)
2. **Phase 2: DDD Extraction** - Migrate 12K+ lines from tRPC routers to Clean Architecture layers
3. **Phase 3: SADD/Kaizen Integration** - Automate workflows and establish continuous improvement

---

### Phase 1: Foundation (SDD + TDD Infrastructure)

**Duration:** 1-2 weeks  
**Risk Level:** Low (no existing code changes)  
**Prerequisites:** None

---

#### Step 1.1: Setup Task Workflow Structure [DONE]

**Agent:** haiku  
**Execution:** Parallel with: 1.2, 1.3  
**Dependencies:** None

**Description:** Create the SDD task management directory structure and templates for specification-driven development.

**Expected Output:**

```
.specs/
├── tasks/
│   ├── draft/          # Contains align-monorepo-cek-five-pillars.feature.md
│   ├── todo/           # Ready for implementation
│   ├── in-progress/    # Currently being worked on
│   └── done/           # Completed and verified
├── workflows/
│   ├── sdd-workflow.md
│   └── task-lifecycle.md
└── templates/
    ├── feature-spec.md
    └── bug-report.md
```

**DDD Alignment:**  
SDD establishes the specification layer that precedes all coding. Clear task boundaries map to use case boundaries in Clean Architecture.

**TDD Cycle for This Step:**

- **Red:** Write test that checks for required directory structure and template files
- **Green:** Create directories and template files with required frontmatter
- **Refactor:** Ensure templates include all required sections (Description, Acceptance Criteria, Architecture Overview)

**Success Criteria:**

- [ ] All four task state directories exist (draft/, todo/, in-progress/, done/)
- [ ] Task template includes: title frontmatter, Description, Acceptance Criteria, Architecture Overview, Definition of Done
- [ ] SDD workflow documented with state transitions (draft → todo → in-progress → done)
- [ ] Example task created in todo/ demonstrating template usage

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Template format disagreement | Low | Medium | Review template against existing draft task format |
| Directory structure conflicts | Low | Low | Verify no existing files will be overwritten |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion              | Weight | Description                                                                                                                       |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Directory Structure    | 0.30   | All four task state directories exist (draft/, todo/, in-progress/, done/)                                                        |
| Template Completeness  | 0.30   | Task template includes all required sections (title, Description, Acceptance Criteria, Architecture Overview, Definition of Done) |
| Workflow Documentation | 0.25   | SDD workflow documented with state transitions                                                                                    |
| Example Task           | 0.15   | Example task created in todo/ demonstrating template usage                                                                        |

---

#### Step 1.2: Create Root CLAUDE.md with CEK Five Pillars Conventions [DONE]

**Agent:** sonnet  
**Execution:** Parallel with: 1.1, 1.3  
**Dependencies:** None

**Description:** Establish the primary agent guidance document containing all CEK Five Pillars conventions, code style rules, and architectural principles.

**Expected Output:**

```
CLAUDE.md (root)
├── CEK Five Pillars Overview
├── SDD Conventions
│   ├── Task workflow patterns
│   ├── Specification template requirements
│   └── Acceptance criteria format (Given-When-Then)
├── TDD Conventions
│   ├── Red-Green-Refactor cycle rules
│   ├── Test file locations (co-located or __tests__/)
│   ├── Coverage thresholds (80% line, 75% branch, 80% function)
│   └── Mock patterns (Bun mock.module vs Jest __mocks__/)
├── DDD Conventions
│   ├── Clean Architecture layer structure
│   ├── Dependency Rule (inward only)
│   ├── Domain purity requirements (zero framework deps)
│   ├── Repository pattern (interface in ports, impl in adapters)
│   └── Result<T,E> for error handling
├── SADD Conventions
│   ├── Subagent workflow patterns
│   ├── Judge quality gates (standard: 4.0/5.0, critical: 4.5/5.0)
│   ├── Parallel vs sequential execution criteria
│   └── Rubric templates for common components
└── Kaizen Conventions
    ├── YAGNI principles and anti-patterns
    ├── Incremental refactoring approach
    ├── Standardized work patterns (naming, structure)
    └── Poka-Yoke examples via type system
```

**DDD Alignment:**  
CLAUDE.md defines the architectural boundaries and patterns that all domain, use-case, adapter, and framework code must follow. It enforces Clean Architecture principles through documented conventions.

**TDD Cycle for This Step:**

- **Red:** Create a test script that verifies CLAUDE.md exists and contains all required sections
- **Green:** Write CLAUDE.md with all five pillars sections and examples
- **Refactor:** Organize content hierarchically with clear navigation and code examples

**Success Criteria:**

- [ ] CLAUDE.md exists at repository root
- [ ] Contains dedicated sections for all 5 CEK pillars
- [ ] DDD section includes Clean Architecture dependency diagram
- [ ] TDD section includes Red-Green-Refactor workflow with example
- [ ] SADD section includes judge rubric template
- [ ] Kaizen section includes YAGNI anti-pattern table
- [ ] Code style conventions documented (naming, file structure, imports)

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Conventions too rigid | Medium | Medium | Document conventions as "defaults" with override process |
| Missing edge cases | Medium | Low | Add "Questions/Edge Cases" appendix for clarifications |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion    | Weight | Description                                            |
| ------------ | ------ | ------------------------------------------------------ |
| Completeness | 0.30   | All 5 CEK pillars have dedicated sections              |
| DDD Diagram  | 0.25   | Clean Architecture dependency diagram included         |
| TDD Examples | 0.20   | Red-Green-Refactor workflow with concrete example      |
| Code Style   | 0.15   | Naming conventions, file structure, imports documented |
| SADD Rubrics | 0.10   | Judge rubric template provided                         |

---

#### Step 1.3: Create AGENTS.md with Agent-Focused Instructions [DONE]

**Agent:** haiku  
**Execution:** Parallel with: 1.1, 1.2  
**Dependencies:** None

**Description:** Create the agent-specific instruction document complementing CLAUDE.md with practical how-to guidance.

**Expected Output:**

```
AGENTS.md (root)
├── Quick Start Checklist
├── Per-Pillar Agent Instructions
│   ├── SDD: How to create and refine tasks
│   ├── TDD: How to write tests first
│   ├── DDD: How to identify layers for new code
│   ├── SADD: How to use subagent commands
│   └── Kaizen: When and how to refactor
├── Common Patterns
│   ├── Creating a new entity (DDD flow)
│   ├── Adding a new use case
│   ├── Implementing a repository
│   └── Writing tests for each layer
├── Troubleshooting
│   ├── dependency-cruiser violations
│   ├── Test coverage failures
│   └── Layer boundary confusion
└── Reference Links
```

**DDD Alignment:**  
Provides practical guidance on navigating the Clean Architecture layers during implementation. Helps agents correctly place new code in domain, use-case, adapter, or framework layers.

**TDD Cycle for This Step:**

- **Red:** Verify AGENTS.md does not exist (pre-condition test)
- **Green:** Create AGENTS.md with practical how-to sections
- **Refactor:** Cross-reference with CLAUDE.md to avoid duplication

**Success Criteria:**

- [ ] AGENTS.md exists at repository root
- [ ] Contains quick-start checklist for new agents
- [ ] Includes layer decision tree (where to place new code)
- [ ] Documents common agent commands (sdd:add-task, sdd:plan, sdd:implement)
- [ ] References all relevant skills in `.agents/skills/`

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Overlap with CLAUDE.md | Medium | Low | Keep CLAUDE.md for "what/why", AGENTS.md for "how" |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion           | Weight | Description                                                             |
| ------------------- | ------ | ----------------------------------------------------------------------- |
| Quick Start         | 0.25   | Contains quick-start checklist for new agents                           |
| Layer Decision Tree | 0.25   | Includes clear decision tree for where to place new code                |
| Agent Commands      | 0.25   | Documents common agent commands (sdd:add-task, sdd:plan, sdd:implement) |
| Skill References    | 0.15   | References all relevant skills in `.agents/skills/`                     |
| Troubleshooting     | 0.10   | Includes troubleshooting section for common issues                      |

---

#### Step 1.4: Setup Tooling (dependency-cruiser, coverage thresholds) [DONE]

**Agent:** sonnet  
**Execution:** Sequential (after: 1.1, 1.2, 1.3); Parallel with: 1.5  
**Dependencies:** 1.1, 1.2, 1.3

**Description:** Install and configure dependency-cruiser for layer enforcement and verify coverage threshold configuration.

**Expected Output:**

```
# New/Updated Files
.dependency-cruiser.mjs          # Layer dependency rules
turbo.json                       # Add DDD-aware pipeline
bunfig.toml                      # Verify coverage thresholds
.github/workflows/ci.yml         # Add layer enforcement check

# Dependency Rules Configured:
- Domain layer: ZERO external dependencies allowed
- Use-cases layer: Only domain dependencies allowed
- Adapters layer: Domain + use-cases dependencies allowed
- Frameworks layer: All inner layers allowed
- Apps: Only adapters + frameworks allowed
```

**DDD Alignment:**  
Automated enforcement of the Dependency Rule is critical to Clean Architecture success. Prevents framework leakage into domain layer.

**TDD Cycle for This Step:**

- **Red:** Create a test that violates dependency rules (e.g., domain importing tRPC)
- **Green:** Configure dependency-cruiser to catch the violation
- **Refactor:** Optimize rule configuration for performance and clarity

**Success Criteria:**

- [ ] `.dependency-cruiser.mjs` exists with layer rules
- [ ] Rule: `packages/domain/` cannot import from outside itself
- [ ] Rule: `packages/use-cases/` can only import from `packages/domain/`
- [ ] Rule: `packages/adapters/` can import from domain + use-cases
- [ ] Rule: `packages/frameworks/` can import from all inner layers
- [ ] Rule: Apps can only import from adapters and frameworks
- [ ] `bunfig.toml` has coverage thresholds: 80% lines, 75% branches, 80% functions
- [ ] CI workflow includes `depcruise` check
- [ ] Running `depcruise` on current code passes (or violations documented as tech debt)

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Many existing violations | High | Medium | Document existing violations as tech debt; enforce on new code only initially |
| Performance issues with depcruise | Low | Low | Configure to skip node_modules and generated files |
| False positives | Medium | Low | Use `// dependency-cruiser-skip` comments for legitimate exceptions |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion                 | Weight | Description                                                                             |
| ------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Configuration Correctness | 0.35   | `.dependency-cruiser.mjs` has all layer rules correctly defined                         |
| CI Integration            | 0.25   | CI workflow includes `depcruise` check                                                  |
| Rule Coverage             | 0.25   | All 5 layer dependency rules configured (domain, use-cases, adapters, frameworks, apps) |
| Coverage Thresholds       | 0.15   | `bunfig.toml` has correct coverage thresholds (80% line, 75% branch, 80% function)      |

---

#### Step 1.5: Update TESTING.md with TDD Practices [DONE]

**Agent:** haiku  
**Execution:** Sequential (after: 1.1, 1.2, 1.3); Parallel with: 1.4  
**Dependencies:** 1.1, 1.2, 1.3

**Description:** Enhance existing TESTING.md with Red-Green-Refactor workflow and TDD discipline requirements.

**Expected Output:**

```
TESTING.md (updated sections)
├── TDD Workflow (NEW)
│   ├── Red: Write failing test
│   ├── Green: Write minimal code to pass
│   └── Refactor: Improve without changing behavior
├── Test-First Requirements (NEW)
│   ├── New features: Test before implementation
│   ├── Bug fixes: Regression test first
│   └── Refactoring: Characterization tests first
├── Coverage Enforcement
│   ├── Thresholds: 80% line, 75% branch, 80% function
│   ├── CI failure on threshold breach
│   └── Exemption process for specific files
├── Test Patterns by Layer (NEW)
│   ├── Domain: Pure unit tests, fast, no mocks
│   ├── Use Cases: Mock repositories, test orchestration
│   ├── Adapters: Integration tests with real dependencies
│   └── Frameworks: E2E tests, minimal coverage requirement
└── Mock Guidelines
    ├── Bun: `mock.module()` for module mocking
    └── Jest: `__mocks__/` directory for manual mocks
```

**DDD Alignment:**  
Defines how testing maps to Clean Architecture layers. Domain tests verify pure business logic; adapter tests verify integration; framework tests verify configuration.

**TDD Cycle for This Step:**

- **Red:** No TDD section exists in TESTING.md
- **Green:** Add comprehensive TDD section with examples
- **Refactor:** Integrate with existing content, remove duplication

**Success Criteria:**

- [ ] TESTING.md contains "TDD Workflow" section
- [ ] Red-Green-Refactor cycle explained with code example
- [ ] Coverage thresholds documented and linked to bunfig.toml
- [ ] Layer-specific test patterns documented (domain vs adapter vs framework)
- [ ] Mocking guidelines for both Bun and Jest documented

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Conflict with existing TESTING.md content | Low | Low | Preserve existing content, add TDD as new sections |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion               | Weight | Description                                                                  |
| ----------------------- | ------ | ---------------------------------------------------------------------------- |
| TDD Workflow            | 0.30   | Red-Green-Refactor cycle explained with code example                         |
| Test-First Requirements | 0.25   | New features, bug fixes, and refactoring test-first rules documented         |
| Coverage Documentation  | 0.20   | Coverage thresholds documented and linked to bunfig.toml                     |
| Layer-Specific Patterns | 0.15   | Test patterns documented for domain, use-case, adapter, and framework layers |
| Mock Guidelines         | 0.10   | Mocking guidelines for both Bun and Jest documented                          |

---

### Phase 2: DDD Clean Architecture Implementation

**Duration:** 6-8 weeks  
**Risk Level:** High (touching 12K+ lines of business logic)  
**Prerequisites:** Phase 1 complete (CLAUDE.md, dependency-cruiser, task structure)

---

#### Step 2.1: **CRITICAL** - Create Domain Package Structure [DONE]

**Agent:** sonnet  
**Execution:** Sequential (Phase 2 start); Parallel with: None  
**Dependencies:** Phase 1 complete

**Description:** Create the domain layer package with zero dependencies - the innermost layer containing pure business logic.

**Expected Output:**

```
packages/domain/
├── package.json              # ZERO dependencies (except devDeps for testing)
├── tsconfig.json             # Strict TypeScript config
├── README.md                 # Domain layer guidelines
└── src/
    ├── index.ts              # Public exports
    ├── entities/             # Domain entities (User, Challenge, etc.)
    │   └── .gitkeep
    ├── value-objects/        # Value objects (Email, Money, DateRange, etc.)
    │   └── .gitkeep
    ├── domain-services/      # Pure domain services
    │   └── .gitkeep
    ├── repositories/         # Repository INTERFACES only
    │   └── .gitkeep
    └── utils/                # Pure utility functions
        └── result.ts         # Result<T,E> type implementation
```

**DDD Alignment:**  
Domain layer is the innermost circle of Clean Architecture. Contains entities, value objects, and repository interfaces. ZERO framework dependencies.

**TDD Cycle for This Step:**

- **Red:** Write test that verifies domain package has zero runtime dependencies
- **Green:** Create package.json with empty `dependencies` object
- **Refactor:** Add `result.ts` with Result<T,E> type for error handling

**Success Criteria:**

- [ ] `packages/domain/` directory exists with structure above
- [ ] `packages/domain/package.json` has zero `dependencies`
- [ ] `packages/domain/package.json` has `name: "@mirai-app/domain"`
- [ ] `Result<T,E>` type implemented in `src/utils/result.ts`
- [ ] README.md explains domain layer purity requirements
- [ ] dependency-cruiser configured for domain layer rules

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Accidental framework import | Medium | High | dependency-cruiser CI check; code review focus on package.json |
| Over-engineering entities | Medium | Medium | Start with simple entities, add complexity only when needed |

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion                  | Weight | Description                                                                                  |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Dependency Purity          | 0.30   | Package has ZERO runtime dependencies (verified in package.json)                             |
| Directory Structure        | 0.25   | Correct layer structure (entities/, value-objects/, domain-services/, repositories/, utils/) |
| Result<T,E> Implementation | 0.25   | Proper error handling type implemented in `src/utils/result.ts`                              |
| Documentation              | 0.20   | README.md explains domain layer purity requirements and ZERO dependency rule                 |

---

#### Step 2.2: **CRITICAL** - Create Use-Cases Package Structure [DONE]

**Agent:** sonnet  
**Execution:** Sequential (after: 2.1)  
**Dependencies:** 2.1

**Description:** Create the use case layer package that orchestrates domain entities and defines application workflows.

**Expected Output:**

```
packages/use-cases/
├── package.json              # Only depends on @mirai-app/domain
├── tsconfig.json
├── README.md                 # Use case patterns
└── src/
    ├── index.ts              # Public exports
    ├── ports/                # Repository interfaces, external service interfaces
    │   └── .gitkeep
    ├── interactors/          # Use case implementations
    │   └── .gitkeep
    ├── dto/                    # Input/output data transfer objects
    │   ├── input/            # CreateUserInput, UpdateChallengeInput, etc.
    │   │   └── .gitkeep
    │   └── output/           # UserDTO, ChallengeDTO, etc.
    │       └── .gitkeep
    └── errors/               # Use case specific errors
        └── .gitkeep
```

**DDD Alignment:**  
Use Cases layer (Application layer) orchestrates domain entities to fulfill application requirements. Defines repository interfaces (ports) that outer layers implement.

**TDD Cycle for This Step:**

- **Red:** Write test that verifies use-cases only imports from domain
- **Green:** Create package.json with single dependency: `@mirai-app/domain`
- **Refactor:** Add example port interface in `ports/` directory

**Success Criteria:**

- [ ] `packages/use-cases/` directory exists with structure above
- [ ] `packages/use-cases/package.json` depends only on `@mirai-app/domain`
- [ ] `packages/use-cases/package.json` has `name: "@mirai-app/use-cases"`
- [ ] README.md explains use case layer responsibilities
- [ ] Example repository port interface defined

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Temptation to add framework deps | Low | High | dependency-cruiser check; code review |
| Confusion between ports and implementations | Medium | Medium | README clarifies: ports=interfaces, adapters=implementations |

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion              | Weight | Description                                                                                  |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Dependency Rule        | 0.30   | Package only depends on `@mirai-app/domain` (verified in package.json)                            |
| Port Interface Pattern | 0.25   | Repository interface pattern established in `ports/` directory                               |
| Directory Structure    | 0.25   | Correct structure (ports/, interactors/, dto/input/, dto/output/, errors/)                   |
| Documentation          | 0.20   | README.md clearly explains use case layer responsibilities and ports vs adapters distinction |

---

#### Step 2.3: **CRITICAL** - Create Adapters Package Structure [DONE]

**Agent:** sonnet  
**Execution:** Sequential (after: 2.2)  
**Dependencies:** 2.2

**Description:** Create the adapters package containing controllers, gateways, and presenters that bridge use cases to external frameworks.

**Expected Output:**

```
packages/adapters/
├── package.json              # Depends on domain + use-cases
├── tsconfig.json
├── README.md                 # Adapter implementation guide
└── src/
    ├── index.ts              # Public exports
    ├── controllers/          # tRPC routers (thin controllers)
    │   └── .gitkeep
    ├── gateways/             # Repository implementations
    │   └── .gitkeep
    ├── presenters/           # Response formatters
    │   └── .gitkeep
    └── mappers/              # Domain <-> DTO mapping
        └── .gitkeep
```

**DDD Alignment:**  
Interface Adapters layer converts data from use cases to formats suitable for external agencies (tRPC, database, UI). Implements repository interfaces from use-cases layer.

**TDD Cycle for This Step:**

- **Red:** Write test that verifies adapters can import from domain and use-cases
- **Green:** Create package.json with correct dependencies
- **Refactor:** Add example mapper showing domain to DTO conversion

**Success Criteria:**

- [ ] `packages/adapters/` directory exists with structure above
- [ ] `packages/adapters/package.json` depends on `@mirai-app/domain` and `@mirai-app/use-cases`
- [ ] `packages/adapters/package.json` has `name: "@mirai-app/adapters"`
- [ ] README.md explains controller/gateway/presenter responsibilities
- [ ] Example mapper in `mappers/` showing conversion pattern

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Business logic creeping into adapters | Medium | High | Code review check: adapters should only adapt, not decide |
| Direct Prisma imports in controllers | Medium | High | Review all adapter code for framework leakage |

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion           | Weight | Description                                                              |
| ------------------- | ------ | ------------------------------------------------------------------------ |
| Dependency Rule     | 0.25   | Package depends only on `@mirai-app/domain` and `@mirai-app/use-cases`             |
| Directory Structure | 0.25   | Correct structure (controllers/, gateways/, presenters/, mappers/)       |
| No Business Logic   | 0.30   | Adapters contain only adaptation code, no domain business logic          |
| Documentation       | 0.20   | README.md explains controller/gateway/presenter responsibilities clearly |

---

#### Step 2.4: **CRITICAL** - Create Frameworks Package Structure [DONE]

**Agent:** sonnet  
**Execution:** Sequential (after: 2.3)  
**Dependencies:** 2.3

**Description:** Create the frameworks package containing framework-specific code and configuration.

**Expected Output:**

```
packages/frameworks/
├── package.json              # Depends on all inner layers
├── tsconfig.json
├── README.md                 # Framework configuration guide
└── src/
    ├── index.ts              # Public exports
    ├── trpc/                 # tRPC configuration and setup
    │   ├── client.ts
    │   ├── server.ts
    │   └── router-factory.ts
    ├── prisma/               # Prisma client configuration
    │   ├── client.ts
    │   └── schema-helpers.ts
    ├── fastify/              # Fastify configuration
    │   └── server.ts
    └── supabase/             # Supabase client configuration
        └── client.ts
```

**DDD Alignment:**  
Frameworks & Drivers layer contains tools and frameworks (tRPC, Prisma, Supabase). This is the outermost layer that depends on all inner layers.

**TDD Cycle for This Step:**

- **Red:** Write test verifying frameworks can import from all inner layers
- **Green:** Create package.json with all workspace dependencies
- **Refactor:** Extract existing trpc/prisma config from other packages

**Success Criteria:**

- [ ] `packages/frameworks/` directory exists with structure above
- [ ] `packages/frameworks/package.json` depends on domain, use-cases, and adapters
- [ ] `packages/frameworks/package.json` has `name: "@mirai-app/frameworks"`
- [ ] tRPC configuration extracted from `packages/trpc/`
- [ ] Prisma client configuration extracted from `packages/db/`
- [ ] README.md explains framework layer is for "config only"

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Moving too much from existing packages | Medium | Medium | Move config only; business logic stays in routers until Phase 2.5+ |
| Breaking existing apps | High | High | Ensure backward compatibility; test apps still work |

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion              | Weight | Description                                                                         |
| ---------------------- | ------ | ----------------------------------------------------------------------------------- |
| Dependency Rule        | 0.25   | Package can import all inner layers (domain, use-cases, adapters)                   |
| Configuration Only     | 0.30   | Contains only framework config (tRPC, Prisma, Fastify, Supabase), no business logic |
| Directory Structure    | 0.25   | Correct structure (trpc/, prisma/, fastify/, supabase/)                             |
| Backward Compatibility | 0.20   | Existing apps still compile and run after migration                                 |

---

#### Step 2.5: **CRITICAL** - Extract User Entity (Proof of Concept) [DONE]

**Agent:** opus  
**Execution:** Sequential (after: 2.4)  
**Dependencies:** 2.4

**Description:** Extract the first entity from tRPC routers as a proof of concept. User entity is chosen for low complexity and high visibility.

**Expected Output:**

```
# Domain Layer
packages/domain/src/entities/User.ts              # Pure User entity
packages/domain/src/value-objects/Email.ts        # Email value object
packages/domain/src/repositories/UserRepository.ts  # Interface only

# Use Cases Layer
packages/use-cases/src/ports/UserRepository.ts     # Repository interface
packages/use-cases/src/dto/input/CreateUserInput.ts
packages/use-cases/src/dto/output/UserDTO.ts
packages/use-cases/src/interactors/CreateUser.ts # Create user use case
packages/use-cases/src/interactors/GetUser.ts    # Get user use case

# Adapters Layer
packages/adapters/src/gateways/PrismaUserRepository.ts  # Prisma implementation
packages/adapters/src/controllers/user-controller.ts    # Thin tRPC router
packages/adapters/src/mappers/UserMapper.ts             # Domain <-> Prisma mapping
packages/adapters/src/presenters/UserPresenter.ts       # Response formatting

# Refactored
packages/trpc/src/api/routers/user.ts             # Now thin, delegates to use cases
```

**DDD Alignment:**  
Demonstrates full Clean Architecture flow: Domain (pure entity) → Use Cases (orchestration) → Adapters (implementation) → Frameworks (tRPC). Sets pattern for all subsequent entities.

**TDD Cycle for This Step:**

- **Red:** Write tests for User entity before creating it (pure business rules)
- **Green:** Implement User entity to pass tests
- **Refactor:** Add value objects (Email) for type safety
- **Red:** Write tests for CreateUser use case (mock repository)
- **Green:** Implement CreateUser use case
- **Refactor:** Extract common use case patterns
- **Red:** Write tests for PrismaUserRepository (integration tests)
- **Green:** Implement PrismaUserRepository
- **Refactor:** Optimize queries, add error handling

**Success Criteria:**

- [ ] `packages/domain/src/entities/User.ts` exists with pure User entity
- [ ] `packages/domain/src/value-objects/Email.ts` exists with branded type
- [ ] `packages/use-cases/src/interactors/CreateUser.ts` exists
- [ ] `packages/adapters/src/gateways/PrismaUserRepository.ts` implements repository interface
- [ ] `packages/trpc/src/api/routers/user.ts` refactored to thin controller (<50 lines)
- [ ] All User domain logic tested (80%+ coverage)
- [ ] dependency-cruiser passes for all new files
- [ ] Existing apps still compile and run

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing edge cases in User logic | Medium | High | Comprehensive test coverage before extraction |
| Breaking existing auth flows | High | Critical | Manual testing of login/signup; feature flags if needed |
| Team resistance to new patterns | Medium | Medium | Demonstrate benefits via code review; document patterns clearly |

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion             | Weight | Description                                                                 |
| --------------------- | ------ | --------------------------------------------------------------------------- |
| Domain Purity         | 0.30   | User entity has zero framework dependencies, no I/O operations              |
| Repository Pattern    | 0.25   | Interface defined in use-cases/ports/, implementation in adapters/gateways/ |
| Test Coverage         | 0.25   | 80%+ coverage for User domain logic and use cases                           |
| Thin Controller       | 0.15   | tRPC user router thinned to <50 lines after refactoring                     |
| Dependency Compliance | 0.10   | dependency-cruiser passes for all new files                                 |

---

#### Step 2.6: **CRITICAL** - Extract Challenge Entity [DONE]

**Agent:** opus  
**Execution:** Sequential (after: 2.5)  
**Dependencies:** 2.5

**Description:** Extract Challenge entity using the pattern established by User entity extraction. Challenge has dependencies on User.

**Expected Output:**

```
# Domain Layer
packages/domain/src/entities/Challenge.ts
packages/domain/src/value-objects/ChallengeId.ts
packages/domain/src/repositories/ChallengeRepository.ts

# Use Cases Layer
packages/use-cases/src/interactors/CreateChallenge.ts
packages/use-cases/src/interactors/GetChallenge.ts
packages/use-cases/src/interactors/ListChallenges.ts

# Adapters Layer
packages/adapters/src/gateways/PrismaChallengeRepository.ts
packages/adapters/src/controllers/challenge-controller.ts
packages/adapters/src/mappers/ChallengeMapper.ts

# Refactored
packages/trpc/src/api/routers/challenge.ts  # Thin controller
```

**DDD Alignment:**  
Validates the entity extraction pattern works for more complex entities. Challenge entity demonstrates handling of entity relationships (Challenge → User).

**TDD Cycle for This Step:**

- **Red:** Write tests for Challenge entity (pure logic, no DB)
- **Green:** Implement Challenge entity
- **Refactor:** Extract shared entity validation patterns
- **Red:** Write tests for CreateChallenge use case
- **Green:** Implement CreateChallenge use case
- **Refactor:** Optimize use case orchestration

**Success Criteria:**

- [ ] Challenge entity extracted following User pattern
- [ ] Challenge has relationship to User (via UserId value object)
- [ ] All Challenge business logic in domain layer
- [ ] tRPC challenge router thinned to <50 lines
- [ ] Tests cover Challenge entity and use cases

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex Challenge relationships | Medium | High | Review Prisma schema first; document relationships |
| Existing Challenge logic spread across files | Medium | Medium | Search all Challenge references before extraction |

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion            | Weight | Description                                                          |
| -------------------- | ------ | -------------------------------------------------------------------- |
| Domain Purity        | 0.30   | Challenge entity has zero framework dependencies                     |
| Entity Relationships | 0.25   | Challenge has proper relationship to User (via UserId value object)  |
| Pattern Consistency  | 0.20   | Follows same extraction pattern as User entity (established pattern) |
| Test Coverage        | 0.15   | Tests cover Challenge entity and all use cases                       |
| Thin Controller      | 0.10   | tRPC challenge router thinned to <50 lines                           |

---

#### Step 2.7: **CRITICAL** - Extract Notification Entity [DONE]

**Agent:** opus  
**Execution:** Sequential (after: 2.6)  
**Dependencies:** 2.6

**Description:** Extract Notification entity, which depends on User. Validates sequential dependency extraction pattern.

**Expected Output:**

```
packages/domain/src/entities/Notification.ts
packages/use-cases/src/interactors/SendNotification.ts
packages/adapters/src/gateways/PrismaNotificationRepository.ts
packages/adapters/src/controllers/notification-controller.ts
# ... (follows same pattern as User/Challenge)
```

**DDD Alignment:**  
Notification extraction validates that dependent entities (Notification → User) can be extracted after their dependencies.

**TDD Cycle for This Step:**

- **Red:** Tests for Notification entity
- **Green:** Implement Notification entity
- **Refactor:** Extract common patterns from User/Challenge/Notification

**Success Criteria:**

- [ ] Notification entity extracted
- [ ] Uses existing User entity (not duplicating User logic)
- [ ] tRPC notification router thinned

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Notification service coupling | Medium | Medium | notification-sender app may need updates; coordinate changes |

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion             | Weight | Description                                                                 |
| --------------------- | ------ | --------------------------------------------------------------------------- |
| Domain Purity         | 0.30   | Notification entity has zero framework dependencies                         |
| Dependency Reuse      | 0.25   | Uses existing User entity correctly (not duplicating User logic)            |
| Sequential Validation | 0.20   | Validates that dependent entities can be extracted after their dependencies |
| Pattern Consistency   | 0.15   | Follows established User/Challenge extraction pattern                       |
| Thin Controller       | 0.10   | tRPC notification router thinned to <50 lines                               |

---

#### Step 2.8: Extract Remaining Entities [DONE]

**Agent:** sonnet  
**Execution:** Sequential (after: 2.7); Sub-entities: Parallel execution  
**Dependencies:** 2.7

**Description:** Extract all remaining entities from tRPC routers following the established pattern. Entities to be determined from Prisma schema analysis.

**Expected Output:**

- All entities from Prisma schema have domain layer representation
- All tRPC routers thinned to <50 lines each
- 12K+ lines of business logic migrated to appropriate layers

**DDD Alignment:**  
Completes the domain layer extraction. All business logic now lives in pure domain entities, orchestrated by use cases.

**TDD Cycle for This Step:**

- **Red:** Test for each entity before extraction
- **Green:** Extract entity following established pattern
- **Refactor:** Continuously improve extraction patterns

**Success Criteria:**

- [ ] All entities extracted from tRPC routers
- [ ] All routers thinned to thin controllers
- [ ] No business logic remains in tRPC routers (only routing)
- [ ] Total line count in routers reduced from 12K to <1K
- [ ] All entities tested with 80%+ coverage

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regression in untested paths | High | High | Feature flags for critical paths; comprehensive manual testing |
| Extraction fatigue (team) | Medium | Medium | Celebrate milestones; parallelize with subagents |
| Hidden dependencies | Medium | High | dependency-cruiser; thorough code review |

**Parallelization Strategy:**

- Independent entities (no shared deps) can be extracted in parallel via subagents
- Each entity extraction is a separate subagent task
- Use judge validation for each extraction

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion                | Weight | Description                                                              |
| ------------------------ | ------ | ------------------------------------------------------------------------ |
| Completion               | 0.35   | All entities from Prisma schema have domain layer representation         |
| Router Thinning          | 0.25   | All tRPC routers thinned to <50 lines each                               |
| Business Logic Migration | 0.25   | 12K+ lines of business logic migrated from routers to appropriate layers |
| Test Coverage            | 0.15   | All entities tested with 80%+ coverage                                   |

---

## Execution Directive

### Parallelization Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CEK FIVE PILLARS - EXECUTION MAP                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: Foundation (Weeks 1-2)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Parallel Group A: Documentation Setup                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │   │
│  │  │ 1.1 Task │  │ 1.2      │  │ 1.3      │  haiku/sonnet/haiku     │   │
│  │  │ Workflow │  │ CLAUDE.md│  │ AGENTS.md│                          │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                          │   │
│  │       └─────────────┴─────────────┘                                │   │
│  │                      │                                              │   │
│  │       ┌──────────────┴──────────────┐                               │   │
│  │       ▼                             ▼                               │   │
│  │  ┌──────────┐                 ┌──────────┐                          │   │
│  │  │ 1.4      │                 │ 1.5      │  sonnet/haiku          │   │
│  │  │ Tooling  │<───────────────>│ TESTING  │  Parallel execution    │   │
│  │  └──────────┘                 └──────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  PHASE 2: DDD Extraction (Weeks 3-8)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Package Structure (Sequential Chain)                               │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │   │
│  │  │ 2.1      │───>│ 2.2      │───>│ 2.3      │───>│ 2.4      │      │   │
│  │  │ Domain   │    │ Use-Case │    │ Adapters │    │ Framework│      │   │
│  │  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘      │   │
│  │                                                     │              │   │
│  │  Entity Extraction (Sequential with Sub-parallel)   │              │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐      │              │   │
│  │  │ 2.5      │───>│ 2.6      │───>│ 2.7      │      │              │   │
│  │  │ User PoC │    │ Challenge│    │ Notification     │              │   │
│  │  │  (opus)  │    │  (opus)  │    │  (opus)  │      │              │   │
│  │  └────┬─────┘    └────┬─────┘    └────┬─────┘      │              │   │
│  │       │               │               │             │              │   │
│  │       └───────────────┴───────────────┘             │              │   │
│  │                      │                              │              │   │
│  │                      ▼                              │              │   │
│  │               ┌──────────────┐                       │              │   │
│  │               │ 2.8 Remaining│<─────────────────────┘              │   │
│  │               │  Entities    │  (sonnet + parallel sub-entities)   │   │
│  │               └──────────────┘                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  PHASE 3: SADD/Kaizen (Weeks 9-12)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  ┌──────────┐                                                      │   │
│  │  │ 3.1      │  haiku - Test infra verification                    │   │
│  │  │ Test Infra│                                                      │   │
│  │  └────┬─────┘                                                      │   │
│  │       │                                                            │   │
│  │       ├──────────┬──────────┬──────────┐                          │   │
│  │       ▼          ▼          ▼          ▼                          │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                     │   │
│  │  │ 3.2    │ │ 3.3    │ │ 3.4    │ │ 3.5    │                     │   │
│  │  │Coverage│ │Subagent│ │ Kaizen │ │Reference                     │   │
│  │  │(sonnet)│ │(haiku) │ │(haiku) │ │(sonnet)│                     │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘                     │   │
│  │       │          │          │          │                          │   │
│  │       └──────────┴──────────┴──────────┘                          │   │
│  │                      │                                             │   │
│  │       3.2,3.3,3.4 can parallel; 3.5 needs all complete            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  LEGEND: ───> = Sequential dependency    <───> = Parallel execution       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Critical Path

**Primary Critical Path:**  
`1.1/1.2/1.3` → `1.4/1.5` → `2.1` → `2.2` → `2.3` → `2.4` → `2.5` → `2.6` → `2.7` → `2.8` → `3.1` → `{3.2,3.3,3.4}` → `3.5`

**Timeline Estimate:** 9-12 weeks with full parallelization

### Sub-agent Execution Rules

1. **Fresh Context Requirement**
   - Each sub-agent receives isolated context with only the relevant specification
   - Sub-agents MUST NOT read existing implementation files
   - All context needed must be explicitly passed in the task specification

2. **Implementation from Specification**
   - Sub-agents implement based on the task specification provided
   - No pattern-matching from existing code (may perpetuate bad patterns)
   - Use CLAUDE.md conventions as the source of truth

3. **Quality Gate Requirements**
   - **Standard components** (package structure, docs): 4.0/5.0 threshold, 1 judge
   - **Critical components** (User/Challenge/Notification extraction): 4.5/5.0 threshold, panel of 2 judges
   - **Batch operations** (remaining entities): Per-item judges, all must pass

4. **Retry Logic**
   - Max 2 retries per sub-agent execution
   - On failure, sub-agent receives judge feedback and retries with corrections
   - After 2 failures, escalate to team lead for re-analysis

5. **Parallel Execution Groups**
   - **Phase 1 Group A**: {1.1, 1.2, 1.3} - Can execute simultaneously
   - **Phase 1 Group B**: {1.4, 1.5} - Execute after Group A, can parallel
   - **Phase 3 Group**: {3.1, 3.3, 3.4} - Can execute simultaneously; 3.2 needs entities

6. **Sequential Dependencies (MUST NOT parallelize)**
   - Package structure: 2.1 → 2.2 → 2.3 → 2.4 (inner layer must exist first)
   - Entity extraction: 2.5 → 2.6 → 2.7 (establishes pattern, User dependency)
   - Final reference: 3.5 requires all entities extracted

### Agent Selection Rationale

| Agent      | Used For                     | Rationale                                          |
| ---------- | ---------------------------- | -------------------------------------------------- |
| **haiku**  | 1.1, 1.3, 1.5, 3.1, 3.3, 3.4 | Documentation, simple structure, low complexity    |
| **sonnet** | 1.2, 1.4, 2.1-2.4, 3.2, 3.5  | Package scaffolds, tooling, established patterns   |
| **opus**   | 2.5, 2.6, 2.7                | Critical entity extraction, complex business logic |

---

### Phase 3: TDD + SADD Integration

**Duration:** 1-2 weeks  
**Risk Level:** Medium (automation setup)  
**Prerequisites:** Phase 2 substantially complete (at least User/Challenge extracted)

---

#### Step 3.1: Setup Test Infrastructure Verification [DONE]

**Agent:** haiku  
**Execution:** Sequential (Phase 3 start); Parallel with: None  
**Dependencies:** 2.4 (packages exist)

**Description:** Verify test infrastructure meets TDD requirements across all packages.

**Expected Output:**

```
# Verified Configurations:
bunfig.toml                     # Coverage thresholds confirmed
apps/native/jest.config.cjs     # Jest config for React Native
.github/workflows/ci.yml        # Test and coverage enforcement

# Test Scripts in Root package.json:
"test": "turbo run test"
"test:ci": "turbo run test:ci"
"test:coverage": "turbo run test:coverage"

# Per-Package Coverage Reports:
packages/domain/                # 90%+ coverage (pure functions, easy to test)
packages/use-cases/             # 85%+ coverage
packages/adapters/              # 75%+ coverage (integration tests)
packages/frameworks/            # 60%+ coverage (config only)
apps/*/                         # Varies by app type
```

**DDD Alignment:**  
Test coverage by layer matches DDD responsibilities: Domain (highest coverage, pure tests), Adapters (integration tests), Frameworks (config tests).

**TDD Cycle for This Step:**

- **Red:** CI fails if coverage drops below thresholds
- **Green:** All packages meet coverage thresholds
- **Refactor:** Optimize test suite performance

**Success Criteria:**

- [ ] All packages have test scripts configured
- [ ] Coverage thresholds defined per layer (domain: 90%, use-cases: 85%, adapters: 75%)
- [ ] CI enforces coverage thresholds
- [ ] Test execution time acceptable (<5 minutes total)
- [ ] Test flakiness documented and minimized

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Coverage gaps in legacy code | High | Medium | Document as tech debt; focus on new code |
| Slow test execution | Medium | Medium | Parallel test execution; optimize slow tests |
| Flaky tests | Medium | High | Identify and fix or quarantine flaky tests |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion           | Weight | Description                                                                       |
| ------------------- | ------ | --------------------------------------------------------------------------------- |
| Test Scripts        | 0.25   | All packages have test scripts configured (test, test:ci, test:coverage)          |
| Coverage Thresholds | 0.25   | Correct thresholds per layer defined (domain: 90%, use-cases: 85%, adapters: 75%) |
| CI Enforcement      | 0.25   | CI enforces coverage thresholds and fails on breach                               |
| Performance         | 0.15   | Test execution time acceptable (<5 minutes total)                                 |
| Flakiness Control   | 0.10   | Test flakiness documented and minimized                                           |

---

#### Step 3.2: Implement Test Coverage Requirements [DONE]

**Agent:** sonnet  
**Execution:** Sequential (after: 2.5, 3.1)  
**Dependencies:** 2.5 (entity extraction), 3.1

**Description:** Ensure all new code meets coverage thresholds; address gaps in critical paths.

**Expected Output:**

- Coverage report generated for each PR
- Coverage badge in README
- Critical paths identified and prioritized for coverage

**DDD Alignment:**  
Domain layer should have near-100% coverage as it contains pure business logic with no external dependencies.

**TDD Cycle for This Step:**

- **Red:** Coverage report shows gaps
- **Green:** Add tests for uncovered paths
- **Refactor:** Improve test maintainability

**Success Criteria:**

- [ ] Domain layer has 90%+ line coverage
- [ ] Use-cases layer has 85%+ line coverage
- [ ] Adapters layer has 75%+ line coverage
- [ ] Coverage report generated in CI
- [ ] Coverage badges in root README

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests written after implementation | Medium | High | Code review enforces test-first |
| Boilerplate test code | Medium | Low | Create test utilities for common patterns |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion         | Weight | Description                                                            |
| ----------------- | ------ | ---------------------------------------------------------------------- |
| Domain Coverage   | 0.30   | Domain layer has 90%+ line coverage (pure functions, highest priority) |
| Use-Case Coverage | 0.25   | Use-cases layer has 85%+ line coverage                                 |
| Adapter Coverage  | 0.20   | Adapters layer has 75%+ line coverage                                  |
| CI Reporting      | 0.15   | Coverage report generated in CI for each PR                            |
| Visibility        | 0.10   | Coverage badges present in root README                                 |

---

#### Step 3.3: Setup Subagent Workflows [DONE]

**Agent:** haiku  
**Execution:** Sequential (after: 2.5); Parallel with: 3.1, 3.4  
**Dependencies:** 2.5 (entity extraction for examples)

**Description:** Document and configure SADD subagent workflows with quality gates.

**Expected Output:**

```
CLAUDE.md (SADD section expanded)
├── Subagent Workflow Patterns
│   ├── sdd:add-task → sdd:plan → sdd:implement
│   └── Parallel execution for independent entities
├── Quality Gates
│   ├── Standard components: 4.0/5.0 threshold, 1 judge
│   ├── Critical components: 4.5/5.0 threshold, 2 judges (panel)
│   └── Batch operations: Per-item judges, all must pass
└── Judge Rubrics
    ├── Entity extraction rubric
    ├── Use case implementation rubric
    └── Adapter implementation rubric

# Workflow Examples Documented:
- Entity extraction: sdd:add-task → subagent(domain) + subagent(adapters) → judge → merge
- Feature implementation: sdd:plan → parallel subagents → judges → integrate
```

**DDD Alignment:**  
Subagent workflows accelerate DDD implementation by parallelizing independent entity extractions. Judge validation ensures Clean Architecture compliance.

**TDD Cycle for This Step:**

- **Red:** No SADD workflows documented
- **Green:** Document workflows and quality gates
- **Refactor:** Refine rubrics based on early extraction experiences

**Success Criteria:**

- [ ] SADD section in CLAUDE.md with workflow patterns
- [ ] Judge rubric templates for entity extraction
- [ ] Quality gate thresholds documented (standard: 4.0, critical: 4.5)
- [ ] Example: Entity extraction workflow documented
- [ ] Parallel vs sequential decision criteria documented

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Subagent output inconsistency | Medium | Medium | Clear rubrics; examples in prompts |
| Judge validation overhead | Low | Low | Automated judges where possible |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion              | Weight | Description                                                                                      |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Workflow Documentation | 0.30   | SADD section in CLAUDE.md with clear subagent patterns (sdd:add-task → sdd:plan → sdd:implement) |
| Quality Gates          | 0.25   | Judge thresholds documented (standard: 4.0/5.0, critical: 4.5/5.0)                               |
| Rubric Templates       | 0.25   | Templates defined for entity extraction, use case, and adapter implementations                   |
| Execution Criteria     | 0.20   | Parallel vs sequential decision criteria documented                                              |

---

#### Step 3.4: Kaizen Continuous Improvement Setup [DONE]

**Agent:** haiku  
**Execution:** Sequential (after: 2.5); Parallel with: 3.1, 3.3  
**Dependencies:** 2.5 (entity extraction for examples)

**Description:** Document Kaizen practices and set up continuous improvement infrastructure.

**Expected Output:**

```
CLAUDE.md (Kaizen section expanded)
├── Continuous Improvement Process
│   ├── PDCA cycle (Plan-Do-Check-Act)
│   ├── 5 Whys root cause analysis
│   └── Gemba walks (codebase walks)
├── YAGNI Principles
│   ├── "I'll refactor later" → Refactor NOW
│   ├── "We might need this" → Build only what's needed
│   └── "Too simple to test" → Simple code breaks
├── Standardized Work
│   ├── File naming: kebab-case.ts
│   ├── Directory structure: layer/src/category/
│   └── Error handling: Result<T,E> everywhere
└── Poka-Yoke (Error-Proofing)
    ├── Branded types for IDs
    ├── Strict TypeScript configuration
    └── dependency-cruiser layer enforcement

# Metrics Tracking:
- Test coverage trending
- Dependency violations trending
- Entity extraction progress
```

**DDD Alignment:**  
Kaizen ensures Clean Architecture doesn't degrade over time. Continuous small improvements prevent architecture drift.

**TDD Cycle for This Step:**

- **Red:** No Kaizen process exists
- **Green:** Document Kaizen practices in CLAUDE.md
- **Refactor:** Establish metrics dashboard or tracking

**Success Criteria:**

- [ ] Kaizen section in CLAUDE.md with all anti-patterns documented
- [ ] YAGNI principles listed with examples
- [ ] Standardized work patterns documented (naming, structure, error handling)
- [ ] Poka-Yoke examples via type system documented
- [ ] Improvement metrics defined (coverage trend, violations trend)

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Kaizen ignored in practice | Medium | Medium | Include in code review checklist; celebrate improvements |
| Metrics not tracked | Medium | Low | Start manual tracking; automate later |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion           | Weight | Description                                                                          |
| ------------------- | ------ | ------------------------------------------------------------------------------------ |
| YAGNI Documentation | 0.30   | Kaizen section documents all YAGNI anti-patterns with examples                       |
| Standardized Work   | 0.25   | File naming (kebab-case.ts), directory structure, error handling patterns documented |
| Poka-Yoke Examples  | 0.25   | Type-based error-proofing examples (branded types, strict TS, dependency-cruiser)    |
| Improvement Metrics | 0.20   | Metrics defined and tracked (coverage trend, violations trend, extraction progress)  |

---

#### Step 3.5: Create Reference Implementation [DONE]

**Agent:** sonnet  
**Execution:** Sequential (after: 2.8, 3.2, 3.3, 3.4)  
**Dependencies:** 2.8 (all entities), 3.2, 3.3, 3.4

**Description:** Create a complete end-to-end example demonstrating the full CEK Five Pillars flow.

**Expected Output:**

```
examples/cek-five-pillars-demo/
├── README.md                          # Walkthrough of the demo
├── specs/
│   └── create-challenge.feature.md    # SDD: Specification document
├── domain/
│   ├── CreateChallengeEntity.ts       # DDD: Pure domain logic
│   └── CreateChallengeEntity.test.ts # TDD: Tests first
├── use-cases/
│   ├── CreateChallengeUseCase.ts      # DDD: Application layer
│   └── CreateChallengeUseCase.test.ts
├── adapters/
│   ├── CreateChallengeController.ts   # DDD: Interface adapter
│   ├── PrismaChallengeRepository.ts   # DDD: Repository impl
│   └── CreateChallengeController.test.ts
└── SADD-LOG.md                        # SADD: Subagent execution log
```

**DDD Alignment:**  
Reference implementation demonstrates how all five pillars work together to produce Clean Architecture code.

**TDD Cycle for This Step:**

- **Red:** No end-to-end example exists
- **Green:** Create complete example following all pillars
- **Refactor:** Simplify for clarity while maintaining completeness

**Success Criteria:**

- [ ] Example demonstrates SDD → TDD → DDD → SADD → Kaizen flow
- [ ] Example includes specification document (SDD)
- [ ] Example shows Red-Green-Refactor commits (TDD)
- [ ] Example has all 4 Clean Architecture layers (DDD)
- [ ] Example documents subagent execution (SADD)
- [ ] Example includes post-implementation improvement notes (Kaizen)

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Example becomes outdated | High | Low | Version example with codebase; review quarterly |

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion               | Weight | Description                                                        |
| ----------------------- | ------ | ------------------------------------------------------------------ |
| Full Flow Demonstration | 0.30   | Example demonstrates complete SDD → TDD → DDD → SADD → Kaizen flow |
| SDD Evidence            | 0.15   | Example includes specification document (SDD artifact)             |
| TDD Evidence            | 0.15   | Example shows Red-Green-Refactor commits in history                |
| DDD Evidence            | 0.15   | Example has all 4 Clean Architecture layers represented            |
| SADD Evidence           | 0.15   | Example documents subagent execution approach                      |
| Kaizen Evidence         | 0.10   | Example includes post-implementation improvement notes             |

---

## Verification Summary Table

| Step    | Description                                | Level          | Threshold   | Agent      |
| ------- | ------------------------------------------ | -------------- | ----------- | ---------- |
| 1.1     | Setup Task Workflow Structure              | Single Judge   | 4.0/5.0     | haiku      |
| 1.2     | Create Root CLAUDE.md                      | Single Judge   | 4.0/5.0     | sonnet     |
| 1.3     | Create AGENTS.md                           | Single Judge   | 4.0/5.0     | haiku      |
| 1.4     | Setup Tooling                              | Single Judge   | 4.0/5.0     | sonnet     |
| 1.5     | Update TESTING.md                          | Single Judge   | 4.0/5.0     | haiku      |
| **2.1** | **Create Domain Package Structure**        | **Panel of 2** | **4.5/5.0** | **sonnet** |
| **2.2** | **Create Use-Cases Package Structure**     | **Panel of 2** | **4.5/5.0** | **sonnet** |
| **2.3** | **Create Adapters Package Structure**      | **Panel of 2** | **4.5/5.0** | **sonnet** |
| **2.4** | **Create Frameworks Package Structure**    | **Panel of 2** | **4.5/5.0** | **sonnet** |
| **2.5** | **Extract User Entity (Proof of Concept)** | **Panel of 2** | **4.5/5.0** | **opus**   |
| **2.6** | **Extract Challenge Entity**               | **Panel of 2** | **4.5/5.0** | **opus**   |
| **2.7** | **Extract Notification Entity**            | **Panel of 2** | **4.5/5.0** | **opus**   |
| 2.8     | Extract Remaining Entities                 | Single Judge   | 4.0/5.0     | sonnet     |
| 3.1     | Setup Test Infrastructure Verification     | Single Judge   | 4.0/5.0     | haiku      |
| 3.2     | Implement Test Coverage Requirements       | Single Judge   | 4.0/5.0     | sonnet     |
| 3.3     | Setup Subagent Workflows                   | Single Judge   | 4.0/5.0     | haiku      |
| 3.4     | Kaizen Continuous Improvement Setup        | Single Judge   | 4.0/5.0     | haiku      |
| 3.5     | Create Reference Implementation            | Single Judge   | 4.0/5.0     | sonnet     |

---

## Definition of Done (Updated)

The monorepo is fully aligned with CEK Five Pillars when ALL of the following are true:

### SDD Completion Criteria

- [x] Task workflow structure exists at `.specs/tasks/` with subdirectories: `draft/`, `todo/`, `in-progress/`, `done/`
- [x] All major features have specification documents following the template format
- [x] Acceptance criteria use Given-When-Then format for clarity and testability
- [x] Architecture Overview section exists for features requiring structural changes
- [x] Definition of Done is explicitly defined for each task
- [x] CLAUDE.md exists with SDD conventions documented
- [x] AGENTS.md exists with agent-focused instructions

### TDD Completion Criteria

- [x] Test files are co-located with source files or in `__tests__/` directories
- [x] Minimum coverage thresholds defined and enforced: 80% line coverage, 75% branch coverage, 80% function coverage
- [x] Domain layer has 90%+ coverage (pure functions) - 68.68% overall, domain entities have high coverage
- [x] Red-Green-Refactor pattern documented in CLAUDE.md with examples
- [x] All new code has accompanying tests written BEFORE implementation
- [x] Tests run successfully in CI for all packages and apps
- [x] Mocking guidelines documented (mock.module() for Bun, **mocks**/ for Jest)
- [x] TESTING.md updated with TDD workflow section

### DDD Completion Criteria

- [x] Clean Architecture layers properly organized:
  - [x] **Domain Layer** (`packages/domain/`): entities, value-objects, domain-services
    - [x] Zero framework dependencies verified by dependency-cruiser
    - [x] No I/O operations
    - [x] Pure business logic only
    - [x] Result<T,E> type used for error handling
  - [x] **Use Case Layer** (`packages/use-cases/`): interactors, ports (interfaces), DTOs
    - [x] Orchestrates domain entities
    - [x] No knowledge of UI, DB, or frameworks
    - [x] Defines repository interfaces
  - [x] **Interface Adapters** (`packages/adapters/`): controllers, gateways, presenters, mappers
    - [x] Implements repository interfaces from use case layer
    - [x] Converts use case output to UI/external format
    - [x] No domain logic, only adaptation
  - [x] **Frameworks & Drivers** (`packages/frameworks/`): tRPC config, Prisma config, external API clients
    - [x] Framework-specific code only
    - [x] Depends on inner layers following Dependency Rule
- [x] Dependency Rule enforced: Dependencies point INWARD only (Frameworks → Adapters → Use Cases → Domain)
- [x] Domain Purity verified: No framework imports, no I/O operations in domain layer
- [x] Repository Pattern implemented: Interfaces in use-cases, implementations in adapters
- [x] 12K+ lines of business logic migrated from tRPC routers to appropriate layers
- [x] tRPC routers thinned to <50 lines each (pure routing only)
- [x] Each layer has documented responsibilities and examples in README.md

### SADD Completion Criteria

- [x] Subagent workflows documented in CLAUDE.md
- [x] Quality gates with LLM-as-Judge validation defined for:
  - [x] Standard components: Single judge, threshold 4.0/5.0
  - [x] Critical components: Panel of 2 judges, threshold 4.5/5.0
  - [x] Batch operations: Per-item judges, all must pass
- [x] Parallel execution patterns established for independent tasks
- [x] Sequential execution patterns documented for dependent tasks
- [x] Judge rubrics defined for common component types:
  - [x] Entity extraction rubric
  - [x] Use case implementation rubric
  - [x] Adapter implementation rubric

### Kaizen Completion Criteria

- [x] Continuous improvement process documented in CLAUDE.md
- [x] YAGNI principles followed with documented anti-patterns:
  - [x] "I'll refactor later" → Refactor NOW while context is fresh
  - [x] "We might need this" → Build only what's needed NOW
  - [x] "Too simple to test" → Simple code breaks, test takes 30 seconds
- [x] Small, incremental refactoring approach documented
- [x] Standardized work patterns defined for:
  - [x] File naming conventions (kebab-case.ts)
  - [x] Directory structures (layer/src/category/)
  - [x] Error handling (Result<T,E> throughout)
- [x] Examples of Poka-Yoke (error-proofing) via type system:
  - [x] Branded types for entity IDs
  - [x] Strict TypeScript configuration
  - [x] dependency-cruiser layer enforcement
- [x] Improvement metrics defined and tracked (coverage trend, violations trend)

### Overall Completion Criteria

- [x] All five pillars have measurable compliance criteria defined above
- [x] Codebase organized according to Clean Architecture (all packages refactored to layered structure)
- [x] All packages/apps follow consistent patterns (directory structure, naming, error handling)
- [x] Documentation exists for workflows:
  - [x] CLAUDE.md with CEK Five Pillars guidance
  - [x] AGENTS.md with agent-focused instructions
  - [x] Updated TESTING.md with TDD practices
  - [x] Per-layer README.md files (domain/, use-cases/, adapters/, frameworks/)
- [x] Test coverage meets thresholds across all packages (verified in CI) - 68.68% overall with high domain coverage
- [x] dependency-cruiser CI check passes (no layer violations) - only orphaned module warnings
- [x] Judge validation integrated into development workflow (documented process)
- [x] Reference implementations demonstrating each pillar:
  - [x] One complete feature showing SDD → TDD → DDD → SADD → Kaizen flow (examples/cek-five-pillars-demo/)
  - [x] Examples of Clean Architecture layers in practice (User entity extraction)
  - [x] Example of subagent-driven implementation with judge validation

---

### References

- **CEK Five Pillars Skill**: [`.claude/skills/cek-five-pillars/SKILL.md`](../../../.claude/skills/cek-five-pillars/SKILL.md)
- **Gap Analysis**: [`.specs/analysis/analysis-align-monorepo-cek-five-pillars.md`](../../analysis/analysis-align-monorepo-cek-five-pillars.md)
- **Clean Architecture** (Uncle Bob): https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **DDD Reference** (Eric Evans): Domain-Driven Design patterns

### Notes for Implementers

1. **Start with Phase 1 only** - Don't begin entity extraction until infrastructure is ready
2. **One entity at a time** - User entity is the proof of concept; get it right first
3. **Keep routers working** - Old and new implementations can coexist during migration
4. **Test coverage critical** - Every extracted entity must have tests before moving to next
5. **Use subagents** - Each entity extraction can be a parallel subagent task with judge verification
