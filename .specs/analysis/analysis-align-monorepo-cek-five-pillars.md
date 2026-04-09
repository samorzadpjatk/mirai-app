# Monorepo CEK Five Pillars Gap Analysis

**Analysis Date:** 2026-04-09  
**Analyzed By:** sdd:code-explorer agent  
**Scope:** Full monorepo alignment assessment against CEK Five Pillars (SDD, TDD, DDD, SADD, Kaizen)

---

## Executive Summary

The Mirai App monorepo is a multi-platform application (React Native + Astro Web + Backend Server) using modern tooling (Bun, TypeScript, Turbo, tRPC, Prisma, Supabase). While the codebase demonstrates good engineering practices, significant gaps exist against the CEK Five Pillars framework. The project lacks structured SDD workflows, comprehensive TDD discipline, Clean Architecture DDD patterns, and formalized SADD/Kaizen processes.

---

## 1. Current Structure Mapping

### 1.1 Applications Overview

| App                        | Purpose                          | Framework           | Test Framework   | Lines of Code |
| -------------------------- | -------------------------------- | ------------------- | ---------------- | ------------- |
| `apps/native`              | Mobile application (iOS/Android) | React Native + Expo | Jest (jest-expo) | ~600+ files   |
| `apps/web`                 | Admin web dashboard              | Astro + React       | Bun test         | ~150+ files   |
| `apps/backend-server`      | WebSocket + HTTP API server      | Fastify + tRPC      | Bun test         | ~400 lines    |
| `apps/notification-sender` | Background notification service  | tRPC client         | Bun test         | ~200 lines    |
| `apps/seed`                | Database seeding utility         | Prisma + CSV/YAML   | Bun test         | ~500 lines    |

### 1.2 Packages Overview

| Package               | Responsibility                          | Dependencies     | Test Count    |
| --------------------- | --------------------------------------- | ---------------- | ------------- |
| `packages/trpc`       | tRPC routers, procedures, utilities     | 8 workspace deps | 35 test files |
| `packages/auth`       | Authentication logic, auth guards       | 3 workspace deps | 1 test file   |
| `packages/db`         | Prisma client, database access          | 2 workspace deps | 2 test files  |
| `packages/supabase`   | Supabase client configuration           | 0 workspace deps | 1 test file   |
| `packages/shared`     | Shared stores, design tokens, utilities | 0 workspace deps | 3 test files  |
| `packages/test-utils` | Test mocks and utilities                | 2 workspace deps | 0 test files  |

### 1.3 Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY RELATIONSHIPS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │   auth   │◄────│   db     │     │ supabase │◄────│   web    │       │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘       │
│       │                │                │                │             │
│       │         ┌──────▼──────┐         │                │             │
│       │         │  test-utils │◄────────┘                │             │
│       │         └─────────────┘                          │             │
│       │                                                   │             │
│       ▼                                                   │             │
│  ┌──────────┐     ┌──────────┐     ┌──────────────┐      │             │
│  │   trpc   │◄────│  shared  │     │ notification │      │             │
│  └────┬─────┘     └──────────┘     │   -sender    │      │             │
│       │                            └──────┬───────┘      │             │
│       │                                   │                │             │
│       ▼                                   ▼                ▼             │
│  ┌──────────┐                    ┌──────────────┐  ┌──────────┐         │
│  │  native  │                    │  backend-server│  │  seed    │         │
│  └──────────┘                    └──────────────┘  └──────────┘         │
│                                                                          │
│  LEGEND: ◄──── = depends on (consumer ◄─── provider)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Build/Test Tooling Configuration

| Tool           | Configuration Location                        | Purpose                                                |
| -------------- | --------------------------------------------- | ------------------------------------------------------ |
| **Turbo**      | `turbo.json`                                  | Monorepo task orchestration                            |
| **Bun**        | `bunfig.toml`                                 | Package manager + test runner (packages, web, backend) |
| **Jest**       | `apps/native/jest.config.cjs`                 | React Native test runner                               |
| **TypeScript** | `tsconfig.base.json` + per-package configs    | Type checking                                          |
| **ESLint**     | `eslint.config.base.js` + per-package configs | Linting                                                |
| **Prettier**   | Not found                                     | Code formatting (not configured)                       |

---

## 2. Gap Analysis by CEK Pillar

### 2.1 SDD (Specification-Driven Development) GAPS

| Gap                                      | Severity  | Current State                                                   | Expected State                                                                                                                      |
| ---------------------------------------- | --------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Missing specification documents**      | 🔴 HIGH   | Only 1 draft task exists (the one triggering this analysis)     | `.specs/tasks/draft/`, `.specs/tasks/todo/`, `.specs/tasks/in-progress/`, `.specs/tasks/done/` should contain structured task files |
| **No task workflow state management**    | 🔴 HIGH   | Task directories exist but are empty (except draft with 1 file) | Tasks should flow through draft → todo → in-progress → done                                                                         |
| **No structured workflow documentation** | 🔴 HIGH   | No SDD workflow files found                                     | SDD workflow files (researcher, analyst, architect, etc.) in `.claude/skills/` or `.specs/workflows/`                               |
| **No task decomposition artifacts**      | 🔴 HIGH   | No refined task specifications exist                            | Tasks should have acceptance criteria, architecture decisions, implementation steps                                                 |
| **No CLAUDE.md at root**                 | 🟡 MEDIUM | No agent guidance document                                      | Root-level `CLAUDE.md` with project-specific conventions                                                                            |
| **Incomplete OpenSpec integration**      | 🟡 MEDIUM | `.opencode/skills/` exist but minimal                           | Full OpenSpec workflow with all change artifacts                                                                                    |

**Evidence:**

- `.specs/tasks/draft/` - Contains only 1 file (the current task)
- `.specs/tasks/todo/` - Empty
- `.specs/tasks/in-progress/` - Empty
- `.specs/tasks/done/` - Empty
- `CLAUDE.md` - Not found in project root
- `AGENTS.md` - Not found in project root

**Risk Assessment:** HIGH - Development proceeds without structured specifications, acceptance criteria, or architectural planning. Leads to technical debt and rework.

---

### 2.2 TDD (Test-Driven Development) GAPS

| Gap                                      | Severity  | Current State                                                                | Expected State                                                           |
| ---------------------------------------- | --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Mixed test frameworks**                | 🟡 MEDIUM | Bun test (packages, web, backend) + Jest (native)                            | Unified test framework OR clear documentation on why hybrid is necessary |
| **Test location inconsistency**          | 🟡 MEDIUM | Tests in `__tests__/` subdirectories                                         | Some projects use colocated `*.test.ts` pattern inconsistently           |
| **Low test coverage on critical paths**  | 🔴 HIGH   | `packages/trpc` has 12K+ lines in routers, limited tests                     | All business logic should have 80%+ coverage                             |
| **No test-first discipline documented**  | 🔴 HIGH   | TESTING.md describes HOW but not RED-GREEN-REFACTOR workflow                 | TDD workflow should be enforced with test-first mandate                  |
| **Missing coverage enforcement**         | 🟡 MEDIUM | bunfig.toml has thresholds (80% lines, 75% branches) but may not be enforced | Automated CI enforcement with quality gates                              |
| **Mock pattern inconsistency**           | 🟡 MEDIUM | Different mocking approaches across packages                                 | Standardized mock patterns in `@mirai-app/test-utils`                    |
| **No test database strategy documented** | 🟡 MEDIUM | `packages/db` has Docker-based test DB                                       | Clear strategy for integration testing with test containers              |

**Evidence:**

- `bunfig.toml` - Coverage thresholds set but enforcement unclear
- `apps/native/jest.config.cjs` - Comprehensive Jest config with coverage
- `packages/trpc/src/api/routers/` - 12K+ lines, ~35 test files (ratio unclear)
- `TESTING.md` - Good documentation but lacks TDD discipline emphasis

**Test File Count by Package:**

- `packages/*` - 35 test files
- `apps/native` - 18 test files
- `apps/web` - 18 test files
- `apps/backend-server` - 3 test files

**Risk Assessment:** MEDIUM-HIGH - Tests exist but TDD discipline (test-first) is not enforced. Coverage gaps on critical business logic.

---

### 2.3 DDD (Domain-Driven Design / Clean Architecture) GAPS

| Gap                                        | Severity    | Current State                                                               | Expected State                                                                |
| ------------------------------------------ | ----------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **No Clean Architecture layer separation** | 🔴 CRITICAL | All code mixed in `src/` without domain/use-case/adapter layers             | Clear layer organization: `domain/`, `use-cases/`, `adapters/`, `frameworks/` |
| **Business logic in tRPC routers**         | 🔴 CRITICAL | 12K+ lines of business logic in `packages/trpc/src/api/routers/`            | Routers should delegate to use cases, contain only routing logic              |
| **No domain layer purity**                 | 🔴 CRITICAL | Entities and business rules mixed with framework code (tRPC, Prisma, React) | Domain layer with pure TypeScript, no framework dependencies                  |
| **No use case layer**                      | 🔴 CRITICAL | Business logic directly in router procedures                                | Use case layer orchestrating domain entities                                  |
| **No repository pattern**                  | 🔴 HIGH     | Prisma client used directly throughout                                      | Repository interfaces in use case layer, implementations in adapters          |
| **No dependency inversion**                | 🔴 HIGH     | Direct imports from outer layers to inner layers                            | Dependencies point inward only, interfaces defined in inner layers            |
| **No domain entities**                     | 🔴 HIGH     | No `domain/entities/` directory found                                       | Domain entities with business logic and validation                            |
| **No value objects**                       | 🟡 MEDIUM   | Primitive types used throughout                                             | Value objects for domain concepts (Email, Money, etc.)                        |
| **No anti-corruption layer**               | 🟡 MEDIUM   | Direct Supabase/Prisma dependencies in business logic                       | Anti-corruption layers for external integrations                              |

**Evidence:**

- `packages/trpc/src/api/routers/*.ts` - Business logic mixed with tRPC routing (12K+ lines)
- `packages/trpc/src/utils/*.ts` - Service utilities mixed with business logic
- No `domain/`, `use-cases/`, `entities/` directories found
- Direct Prisma usage in routers without repository abstraction

**Code Organization Analysis:**

```
Current (Mixed):
  packages/trpc/src/
    api/
      routers/
        user.ts (business logic + routing + DB access)
        challenge.ts (business logic + routing + DB access)
        ... 15+ more files with mixed concerns

Expected (Clean Architecture):
  packages/
    domain/
      src/
        entities/       - User, Challenge, etc. (pure)
        value-objects/  - Email, DateRange, etc. (pure)
        services/       - Domain services (interfaces)
    use-cases/
      src/
        ports/          - Repository interfaces
        interactors/    - Use case implementations
    adapters/
      src/
        controllers/    - tRPC routers (thin)
        gateways/         - Repository implementations
        presenters/       - Response formatting
    frameworks/
      src/
        trpc/             - tRPC setup
        prisma/           - Prisma configuration
```

**Risk Assessment:** CRITICAL - The entire business logic is tightly coupled to tRPC and Prisma. Refactoring requires significant effort but is essential for maintainability.

---

### 2.4 SADD (Subagent-Driven Development) GAPS

| Gap                                    | Severity  | Current State                                | Expected State                                    |
| -------------------------------------- | --------- | -------------------------------------------- | ------------------------------------------------- |
| **No SADD workflow documentation**     | 🔴 HIGH   | No SADD-specific documentation or skills     | SADD workflows documented with subagent patterns  |
| **No meta-judge infrastructure**       | 🔴 HIGH   | No evidence of LLM-as-judge quality gates    | Judge subagents with evaluation rubrics           |
| **No multi-agent execution patterns**  | 🔴 HIGH   | Development appears single-agent             | Parallel subagent execution for independent tasks |
| **No quality gate automation**         | 🔴 HIGH   | Manual code review only                      | Automated quality gates with judge validation     |
| **Skill system partially implemented** | 🟡 MEDIUM | OpenSpec skills exist in `.opencode/skills/` | Full skill library with all CEK pillars           |

**Evidence:**

- `.opencode/skills/` - Contains OpenSpec skills (10 skills present)
- No `sdd:*` skills found (add-task, plan, implement)
- No `sadd:*` skills found (do-and-judge, launch-sub-agent)
- No `tdd:*` skills found
- No `ddd:*` skills found
- No `kaizen:*` skills found

**Risk Assessment:** HIGH - Development efficiency is limited by single-agent execution. Quality gates are manual, not automated.

---

### 2.5 Kaizen (Continuous Improvement) GAPS

| Gap                                         | Severity  | Current State                     | Expected State                                    |
| ------------------------------------------- | --------- | --------------------------------- | ------------------------------------------------- |
| **No continuous improvement documentation** | 🟡 MEDIUM | No Kaizen-specific documentation  | Kaizen practices documented (PDCA, 5 Whys, etc.)  |
| **No refactoring patterns documented**      | 🟡 MEDIUM | Refactoring is ad-hoc             | Documented refactoring patterns and when to apply |
| **No YAGNI enforcement**                    | 🟡 MEDIUM | No evidence of YAGNI discipline   | YAGNI principle enforced in code reviews          |
| **No technical debt tracking**              | 🟡 MEDIUM | No visible debt tracking system   | Technical debt documented and prioritized         |
| **No improvement metrics**                  | 🟡 MEDIUM | No metrics on code quality trends | Code quality metrics tracked over time            |

**Evidence:**

- No Kaizen-specific files found
- `docs/testing-lessons-learned.md` - Some improvement documentation exists
- No formal improvement process documented

**Risk Assessment:** MEDIUM - Improvements happen but are not systematic. YAGNI violations may accumulate.

---

## 3. File Inventory

### 3.1 Source Files by Package/App

#### Apps

```
apps/backend-server/src/         ~7 files (400 lines)
apps/native/src/                 ~600+ files (React Native app)
apps/notification-sender/src/    ~5 files (200 lines)
apps/seed/src/                   ~15 files (500 lines)
apps/web/src/                    ~150+ files (Astro web app)
```

#### Packages

```
packages/auth/src/                 ~8 files (auth logic + hooks + store)
packages/db/src/                   ~10 files (Prisma client + migrations)
packages/shared/src/               ~15 files (stores + design-tokens + storage)
packages/supabase/src/             ~5 files (Supabase client config)
packages/test-utils/src/           ~2 files (mocks + index)
packages/trpc/src/                 ~50+ files (routers + utils + client + hooks)
  - api/routers/                   18 router files (~12K lines)
  - utils/                         12 utility files
  - client/                        5 client files
  - hooks/                         10 hook files
  - services/                      1 service file
```

### 3.2 Framework Dependencies

| Framework          | Usage Location                                                  | Coupling Risk                      |
| ------------------ | --------------------------------------------------------------- | ---------------------------------- |
| **tRPC**           | `packages/trpc/` (core), all apps                               | HIGH - Business logic in routers   |
| **Prisma**         | `packages/db/`, `packages/trpc/`                                | HIGH - Direct DB access throughout |
| **Supabase**       | `packages/supabase/`, `packages/auth/`                          | MEDIUM - Auth coupling             |
| **React**          | `apps/web/`, `apps/native/`, `packages/trpc/`, `packages/auth/` | MEDIUM - Component/UI coupling     |
| **Expo**           | `apps/native/`                                                  | MEDIUM - Mobile platform lock-in   |
| **Astro**          | `apps/web/`                                                     | LOW - Isolated to web app          |
| **Fastify**        | `apps/backend-server/`                                          | LOW - Isolated to backend          |
| **Zustand**        | `packages/shared/`, `packages/auth/`, `apps/native/`            | MEDIUM - State management coupling |
| **TanStack Query** | `apps/web/`, `apps/native/`, `packages/trpc/`                   | MEDIUM - Data fetching coupling    |

### 3.3 Architectural Violations Detected

| Violation                       | Location                                             | Severity | Description                                               |
| ------------------------------- | ---------------------------------------------------- | -------- | --------------------------------------------------------- |
| **Business logic in routers**   | `packages/trpc/src/api/routers/*.ts`                 | CRITICAL | Routers contain validation, business rules, DB operations |
| **No repository abstraction**   | `packages/trpc/src/api/routers/*.ts`                 | HIGH     | Prisma client used directly in business logic             |
| **Framework deps in shared**    | `packages/shared/`                                   | MEDIUM   | Shared package has React/Query peer deps                  |
| **Cross-package circular deps** | `packages/trpc/` → `packages/auth/` → `packages/db/` | MEDIUM   | Dependency chain may hide circularities                   |
| **No domain isolation**         | All packages                                         | CRITICAL | Business logic scattered across packages                  |

---

## 4. Risk Assessment

### 4.1 High-Risk Areas for Refactoring

| Area                                  | Risk Level  | Impact                                    | Effort             | Priority |
| ------------------------------------- | ----------- | ----------------------------------------- | ------------------ | -------- |
| **tRPC Routers**                      | 🔴 CRITICAL | Business logic tightly coupled to routing | Large (12K+ lines) | P0       |
| **Domain Layer Extraction**           | 🔴 CRITICAL | No domain layer exists                    | Very Large         | P0       |
| **Repository Pattern Implementation** | 🔴 HIGH     | Direct Prisma coupling                    | Large              | P1       |
| **Test Framework Unification**        | 🟡 MEDIUM   | Maintenance overhead                      | Medium             | P2       |
| **SDD Workflow Setup**                | 🟡 MEDIUM   | Development efficiency                    | Medium             | P1       |
| **SADD Infrastructure**               | 🟡 MEDIUM   | Quality gates, efficiency                 | Medium             | P2       |

### 4.2 Breaking Changes Potential

| Change                            | Breaking? | Migration Strategy                         |
| --------------------------------- | --------- | ------------------------------------------ |
| Extract domain layer from routers | YES       | Gradual extraction with router refactoring |
| Implement repository pattern      | YES       | Abstract repositories behind interfaces    |
| Unify test frameworks             | NO        | Can migrate incrementally                  |
| Add SDD workflows                 | NO        | Process change, no code impact             |
| Add SADD quality gates            | NO        | Additional automation, no code impact      |

### 4.3 Dependency Cycles

```
Detected Chain:
  trpc → auth → db → supabase
  ↓
  shared ← trpc (via hooks)

Risk: If auth depends on trpc features, circular dependency may exist.
Recommendation: Audit all cross-package imports for cycles.
```

### 4.4 Critical Path for Implementation

```
Phase 1: Foundation (SDD + TDD Infrastructure)
  ├─ Set up SDD workflow (add-task → plan → implement)
  ├─ Create root CLAUDE.md with conventions
  ├─ Standardize test patterns
  └─ Add coverage enforcement to CI

Phase 2: DDD Clean Architecture (Highest Risk)
  ├─ Create packages/domain/ (pure domain layer)
  ├─ Extract entities from trpc routers
  ├─ Create use-cases layer
  ├─ Implement repository pattern
  ├─ Refactor routers to thin controllers
  └─ Migrate business logic incrementally

Phase 3: SADD + Kaizen
  ├─ Implement subagent workflows
  ├─ Add judge quality gates
  ├─ Document Kaizen practices
  └─ Set up continuous improvement metrics
```

---

## 5. Key Integration Points

### 5.1 Cross-Package Integration Risks

| Integration Point   | Risk                                  | Mitigation                     |
| ------------------- | ------------------------------------- | ------------------------------ |
| `trpc` ↔ `auth`     | Auth logic changes affect all routers | Define clear auth interfaces   |
| `trpc` ↔ `db`       | Schema changes break routers          | Repository pattern abstraction |
| `auth` ↔ `supabase` | Supabase SDK updates                  | Anti-corruption layer          |
| `shared` ↔ all apps | Shared state changes ripple widely    | Versioning, careful API design |

### 5.2 Recommended Integration Boundaries

```typescript
// Current (tight coupling):
// packages/trpc/src/api/routers/user.ts
export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Business logic mixed with DB access
      const user = await ctx.db.user.create({ data: input });
      return user;
    }),
});

// Recommended (Clean Architecture):
// packages/use-cases/src/ports/UserRepository.ts
interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
}

// packages/adapters/src/gateways/PrismaUserRepository.ts
class PrismaUserRepository implements UserRepository {
  constructor(private db: PrismaClient) {}
  async create(input: CreateUserInput): Promise<User> {
    const user = await this.db.user.create({ data: input });
    return UserMapper.toDomain(user);
  }
}

// packages/trpc/src/api/routers/user.ts (thin controller)
export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const useCase = ctx.container.resolve(CreateUserUseCase);
      return useCase.execute(input);
    }),
});
```

---

## 6. Recommendations Summary

### Immediate Actions (Week 1)

1. **Create root CLAUDE.md** with project conventions and CEK Five Pillars alignment
2. **Set up SDD workflow** - Create task templates and workflow documentation
3. **Audit test coverage** - Identify critical paths with <80% coverage
4. **Document current architecture** - Create architecture decision records (ADRs)

### Short-Term (Month 1)

1. **Implement repository pattern** for critical entities (User, Challenge, etc.)
2. **Extract first domain entity** from tPC routers as proof of concept
3. **Standardize test patterns** across all packages
4. **Add SADD quality gates** for critical changes

### Long-Term (Quarter 1)

1. **Full Clean Architecture migration** - Domain, use-case, adapter layers
2. **Business logic extraction** - Move all business rules from routers to domain
3. **SADD infrastructure** - Subagent workflows with judge validation
4. **Kaizen process** - Continuous improvement with metrics

---

## Appendix A: Affected Files List

### Critical Files for DDD Refactoring (12K+ lines)

- `packages/trpc/src/api/routers/*.ts` (18 files)
- `packages/trpc/src/utils/*.ts` (12 files)

### Configuration Files to Update

- `turbo.json` - Add DDD layer build tasks
- `bunfig.toml` - Verify coverage thresholds
- `package.json` (root) - Add workspace scripts for DDD layers

### New Files to Create

- `CLAUDE.md` (root) - Project conventions
- `.specs/workflows/sdd-workflow.md` - SDD process
- `packages/domain/package.json` - Domain layer package
- `packages/use-cases/package.json` - Use case layer package
- `packages/adapters/package.json` - Adapter layer package

---

## Appendix B: CEK Five Pillars Alignment Scorecard

| Pillar      | Current Score | Target Score | Gap    |
| ----------- | ------------- | ------------ | ------ |
| **SDD**     | 2/10          | 8/10         | -6     |
| **TDD**     | 5/10          | 9/10         | -4     |
| **DDD**     | 2/10          | 8/10         | -6     |
| **SADD**    | 3/10          | 8/10         | -5     |
| **Kaizen**  | 3/10          | 7/10         | -4     |
| **OVERALL** | **3/10**      | **8/10**     | **-5** |

---

_Analysis complete. Recommend proceeding with Phase 1 (Foundation) immediately._
