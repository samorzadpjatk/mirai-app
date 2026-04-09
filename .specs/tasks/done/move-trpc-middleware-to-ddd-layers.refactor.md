---
title: Move tRPC middleware and context to higher DDD layers
status: draft
issue_type: refactor
complexity: L
---

## Initial User Prompt

I don't want to use middleware and context inside tRPC framework - I want to move it into higher levels of DDD to keep it framework-agnostic

# Description

This refactoring extracts business-critical concerns currently embedded in tRPC middleware and context handling, moving them into the use case and domain layers where they belong in a proper DDD architecture.

Currently, authentication, authorization, and request context management are tightly coupled to tRPC's middleware pipeline. This creates several problems: the core business logic cannot be tested without mocking tRPC-specific objects, the application is locked into tRPC as the transport layer, and the architecture violates DDD principles by allowing the framework layer to contain business decisions.

The solution is to lift these concerns into higher layers: authentication becomes a port called by use cases, authorization moves to domain services using Result types (ok/err pattern), and context becomes explicit parameters passed to use cases rather than implicit dependencies. This preserves all existing functionality while making the core business logic framework-agnostic.

Developers will benefit from simplified testing (no tRPC mocks needed for use case tests), clearer architecture (transport concerns separated from business logic), and future flexibility (ability to add REST or GraphQL endpoints using the same core logic).

**Scope**:

- **Included**:
  - Extracting authentication logic from tRPC middleware to use case ports
  - Moving authorization checks to domain services
  - Refactoring use cases to accept identity/permissions as explicit parameters
  - Creating framework-agnostic ports for cross-cutting concerns
  - Updating DI wiring to support new patterns
  - Maintaining backward compatibility with existing tRPC routes
- **Excluded**:
  - Replacing tRPC with another framework
  - Changing the underlying authentication mechanism (Supabase/Clerk/etc.)
  - Adding new security features or permissions
  - Modifying database schema
  - Extracting tRPC-specific features that cannot be generalized

**User Scenarios**:

1. **Primary Flow**: Client sends request with Bearer token → Controller extracts token from HTTP headers (NOT from tRPC `ctx`) → Controller calls auth use case with explicit token → Use case validates via port → Domain checks authorization → Business logic executes → Response returns through stack
2. **Alternative Flow (Testing)**: Test creates mock identity with explicit parameters → Calls use case directly with typed parameters → No tRPC infrastructure or `ctx` involved → Same business logic executes
3. **Error Handling**: Invalid credentials or insufficient permissions cause `Result.err()` or `Promise.reject()` at appropriate layer, propagating clear errors to client

**Explicit Token Flow (No `ctx`)**:

```
Client Request (Authorization: Bearer <token>)
         ↓
tRPC Router (publicProcedure - no auth)
         ↓
Controller (extracts token from headers via TokenExtractor)
         ↓
AuthenticateUserUseCase (token passed explicitly)
         ↓
AuthPort → SupabaseAuthAdapter
         ↓
AuthContext returned to Controller
         ↓
Controller passes AuthContext explicitly to Business Use Case
         ↓
Response
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[Criterion 1]**: Authentication logic is extracted from tRPC middleware into use case layer ports
  - Given: A request with authentication credentials is received
  - When: The use case is invoked
  - Then: Authentication is performed via a port interface, not tRPC middleware

- [ ] **[Criterion 2]**: Authorization checks are moved to domain services using Result types
  - Given: An authenticated user attempts an action
  - When: Authorization is checked
  - Then: The domain service returns Result<Authorized, PermissionDenied> with no tRPC dependencies

- [ ] **[Criterion 3]**: Use cases accept user identity and permissions as explicit parameters
  - Given: A use case is being executed
  - When: User context is needed
  - Then: Identity and permissions are passed as typed parameters, NOT accessed via tRPC context (`ctx.user`, `ctx.token` do not exist)

- [ ] **[Criterion 4]**: No business logic AND no token extraction in tRPC middleware or context
  - Given: The tRPC framework layer is examined
  - When: Checking for business decisions or token handling
  - Then: `protectedProcedure`, `adminProcedure`, `moderatorProcedure` are DELETED; `ctx.token` does not exist; only transport concerns remain

- [ ] **[Criterion 5]**: Use cases can be unit tested without tRPC dependencies or mocks
  - Given: A developer writes a unit test
  - When: Testing a use case
  - Then: No tRPC types, mocks, or context objects are required - just pass explicit parameters

- [ ] **[Criterion 6]**: Controllers extract tokens from HTTP headers (not from ctx)
  - Given: A request is received
  - When: The controller processes it
  - Then: Token is extracted via `TokenExtractor` from request headers, NOT from `ctx.token`

- [ ] **[Criterion 7]**: Type safety is preserved throughout the stack with proper branded types
  - Given: IDs and typed parameters are used
  - When: Compiling the application
  - Then: TypeScript enforces correct branded types with no any types introduced

### Non-Functional Requirements

- [ ] **Testability**: All use cases can be tested with only Promise-based and Result patterns, zero external dependencies
- [ ] **Portability**: Core business logic has no imports from @trpc/server or tRPC-specific packages
- [ ] **Framework Decoupling**: tRPC layer contains ZERO auth awareness - auth happens in controllers

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] **NO `ctx.token` or `ctx.user` anywhere in codebase** (verified via grep)
- [ ] **Auth procedures deleted** (`protectedProcedure`, `adminProcedure`, `moderatorProcedure`)
- [ ] Tests written and passing (unit tests for extracted use cases, integration tests for routes)
- [ ] Documentation updated (CLAUDE.md patterns updated if applicable)
- [ ] Code reviewed following SADD quality gates
- [ ] dependency-cruiser validates no domain/use-case imports from tRPC

---

## Architecture Overview

### Result Type Pattern (No External Libraries)

This refactoring uses a lightweight, pure TypeScript Result type for error handling - **no Effect library or external dependencies** required:

```typescript
// packages/domain/src/types/Result.ts
export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ kind: "ok", value });
export const err = <E>(error: E): Result<never, E> => ({ kind: "err", error });
export const isOk = <T, E>(r: Result<T, E>): r is { kind: "ok"; value: T } =>
  r.kind === "ok";
export const isErr = <T, E>(r: Result<T, E>): r is { kind: "err"; error: E } =>
  r.kind === "err";
```

**Why this pattern?**

- Zero external dependencies (no Effect library to install/maintain)
- Type-safe error handling without exceptions
- Works with standard JavaScript/TypeScript patterns
- Easy to test and mock
- Access values via `result.value` (for ok) or `result.error` (for err)

### Solution Strategy

This refactoring applies the **Ports and Adapters** pattern to extract business-critical concerns from tRPC middleware into higher DDD layers. The high-level approach follows an incremental, backward-compatible migration:

1. **Extract Authentication**: Move token validation and user lookup from `protectedProcedure` middleware into a framework-agnostic `AuthenticateUserUseCase` that lives in the Use Cases layer.

2. **Lift Authorization**: Migrate role-based checks (`adminProcedure`, `moderatorProcedure`) into dedicated use cases (`AuthorizeAdminUseCase`, `AuthorizeModeratorUseCase`) using Result types for error handling.

3. **Decouple Telemetry**: Extract `mobileAppMiddleware` logging into a `LogTelemetryUseCase` backed by a `TelemetryPort`, removing direct database access from the Adapter layer.

4. **Thin tRPC Layer**: Reduce tRPC procedures to pure HTTP adapters—parsing input, extracting tokens, and delegating to use cases via DI. No business logic remains in middleware.

5. **Backward Compatibility**: Maintain existing `TRPCContext` shape during migration; deprecate fields gradually to avoid breaking 156+ procedure usages.

### Key Decisions

| Decision                                    | Rationale                                                                                                                                                                                    | Trade-offs                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Use Cases over Domain Services for Auth** | Authentication is orchestration (crosses boundaries), not pure business logic. Use Cases layer handles async operations and DI.                                                              | Slightly more ceremony than domain services, but correct layer placement per Clean Architecture.           |
| **Result for Authorization Errors**         | Domain layer uses Result type; authorization is a business concern ("can this user do this?"). Provides type-safe error handling without exceptions. Pure TypeScript, no external libraries. | Requires unwrap at adapter boundary; adds functional programming patterns to codebase.                     |
| **Eliminate Auth Middleware Entirely**      | Delete `protectedProcedure`, `adminProcedure`, `moderatorProcedure`. Auth happens in controllers via explicit token parameter passing.                                                       | More controller code changes (19 files), but complete decoupling from tRPC context. Cleanest architecture. |
| **Token as Explicit Parameter**             | Token extracted from HTTP headers in controllers, passed explicitly to use cases. No `ctx.token` anywhere.                                                                                   | All controllers must be updated to accept/handle auth, but auth flow is explicit and testable.             |
| **Promise-based over Effect**               | CLAUDE.md specifies Promise-based orchestration in Use Cases layer; Effect is removed from this codebase. Follows established conventions.                                                   | Less powerful error composition than Effect, but aligns with existing patterns and team familiarity.       |
| **Ports for Cross-Cutting Concerns**        | Define `AuthPort` and `TelemetryPort` interfaces in Use Cases layer. Framework-specific implementations (Supabase, Prisma) stay in Adapters.                                                 | Requires interface/implementation pairs, but enables testing without framework mocks.                      |

### Expected Changes

#### New Files (7 core files)

| File                                                       | Layer     | Purpose                                                    |
| ---------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| `packages/domain/src/value-objects/AuthContext.ts`         | Domain    | Immutable auth context VO with branded UserId, role, email |
| `packages/use-cases/src/ports/AuthPort.ts`                 | Use Cases | Interface for token validation and role checking           |
| `packages/use-cases/src/ports/TelemetryPort.ts`            | Use Cases | Interface for telemetry logging                            |
| `packages/use-cases/src/interactors/AuthenticateUser.ts`   | Use Cases | Token validation use case with Result type                 |
| `packages/use-cases/src/interactors/AuthorizeAdmin.ts`     | Use Cases | Admin role authorization use case                          |
| `packages/use-cases/src/interactors/AuthorizeModerator.ts` | Use Cases | Moderator role authorization use case                      |
| `packages/use-cases/src/interactors/LogTelemetry.ts`       | Use Cases | Telemetry logging use case                                 |

#### New Files (8 core files + TokenExtractor)

| File                                                       | Layer     | Purpose                                                    |
| ---------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| `packages/domain/src/value-objects/AuthContext.ts`         | Domain    | Immutable auth context VO with branded UserId, role, email |
| `packages/domain/src/types/Result.ts`                      | Domain    | Result<T,E> type and helpers (ok, err, isOk, isErr)        |
| `packages/use-cases/src/ports/AuthPort.ts`                 | Use Cases | Interface for token validation and role checking           |
| `packages/use-cases/src/ports/TelemetryPort.ts`            | Use Cases | Interface for telemetry logging                            |
| `packages/use-cases/src/interactors/AuthenticateUser.ts`   | Use Cases | Token validation use case with Result type                 |
| `packages/use-cases/src/interactors/AuthorizeAdmin.ts`     | Use Cases | Admin role authorization use case                          |
| `packages/use-cases/src/interactors/AuthorizeModerator.ts` | Use Cases | Moderator role authorization use case                      |
| `packages/use-cases/src/interactors/LogTelemetry.ts`       | Use Cases | Telemetry logging use case                                 |
| `packages/adapters/src/utils/TokenExtractor.ts`            | Adapters  | Extract Bearer token from HTTP request headers (NO ctx)    |

#### Modified Files (3 core files)

| File                                                   | Changes                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/adapters/src/api/trpc.ts`                    | **DELETE** `protectedProcedure`, `adminProcedure`, `moderatorProcedure`, `mobileAppMiddleware`. Only `publicProcedure` remains. |
| `packages/adapters/src/controllers/**/*.ts`            | All 20 controller files: Add token extraction from headers, call auth use cases explicitly, pass AuthContext to use cases       |
| `packages/adapters/src/controllers/auth/authServer.ts` | Deprecate existing auth functions; redirect to new use cases                                                                    |

#### DI Module Updates (3 files)

| File                                                | Updates                                             |
| --------------------------------------------------- | --------------------------------------------------- |
| `packages/adapters/src/modules/UseCaseModule.ts`    | Register new auth/telemetry use cases               |
| `packages/adapters/src/modules/ControllerModule.ts` | Inject auth dependencies into controllers as needed |
| `packages/frameworks/src/di/AppModule.ts`           | Wire new auth module into application container     |

#### Router Files (19 files - significant changes required)

All files in `packages/adapters/src/api/routers/` must change from:

```typescript
// BEFORE: Using auth-aware procedures
export const userRouter = createTRPCRouter({
  getById: protectedProcedure // ← will be deleted
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      return controller.getById(input, ctx); // ← auth implicit in ctx
    }),
});
```

To:

```typescript
// AFTER: Auth handled in controller, routers use publicProcedure only
export const userRouter = createTRPCRouter({
  getById: publicProcedure // ← no auth here
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      return controller.getById(input, ctx.container); // ← controller handles auth
    }),
});
```

**Migration Strategy**: Since all 19 router files need similar changes, this will be handled as a **bulk migration script** in Step 3.1 rather than manual file-by-file changes.

### Layer-by-Layer Breakdown

#### Current State (Violations)

```
┌──────────────────────────────────────────────────────────────┐
│  FRAMEWORKS (tRPC)                                            │
│  ✓ PrismaClient, SupabaseClient, DI container                 │
│  ✗ Auth logic in server.ts (to verify)                        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  ADAPTERS (tRPC)                                              │
│  ✓ Routers (thin), Controllers, Repositories                │
│  ✗ protectedProcedure: token validation + user lookup       │
│  ✗ adminProcedure: role === "ADMIN" check                     │
│  ✗ moderatorProcedure: role === "MODERATOR"/"ADMIN"           │
│  ✗ mobileAppMiddleware: direct DB write to userAgent          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  USE CASES                                                    │
│  ✓ Existing use cases                                         │
│  ✗ Missing: Auth use cases, Telemetry use case                │
│  ✗ Missing: AuthPort, TelemetryPort                           │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  DOMAIN                                                       │
│  ✓ Entities, Value Objects                                     │
│  ✗ Missing: AuthContext Value Object                         │
└──────────────────────────────────────────────────────────────┘
```

#### Target State (Clean Architecture)

```
┌──────────────────────────────────────────────────────────────┐
│  FRAMEWORKS (tRPC)                                            │
│  ✓ PrismaClient, SupabaseClient, DI container                 │
│  ✓ Request scope creation                                    │
│  ✗ NO business logic                                          │
│  ✗ NO token extraction (moved to controllers)                │
│  ✗ NO auth middleware (deleted)                              │
└──────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────────────────────────────────────────────────────┐
│  ADAPTERS (Controllers + tRPC Routers)                        │
│  ✓ TokenExtractor: extracts Bearer token from HTTP headers    │
│  ✓ Routers: parse input, call controller (NO auth awareness) │
│  ✓ Controllers: extract token, call auth use cases            │
│  ✓ Controllers: pass AuthContext explicitly to use cases    │
│  ✓ SupabaseAuthAdapter: implements AuthPort                   │
│  ✓ PrismaTelemetryAdapter: implements TelemetryPort           │
│  ✗ NO protectedProcedure (use publicProcedure everywhere)     │
│  ✗ NO adminProcedure (auth moved to controllers)            │
│  ✗ NO moderatorProcedure (auth moved to controllers)          │
│  ✗ NO mobileAppMiddleware (telemetry in controllers)        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  USE CASES                                                    │
│  ✓ AuthenticateUserUseCase: validate token, return AuthContext│
│  ✓ AuthorizeAdminUseCase: check role, return Result            │
│  ✓ AuthorizeModeratorUseCase: check role, return Result     │
│  ✓ LogTelemetryUseCase: log via TelemetryPort                 │
│  ✓ AuthPort: interface for auth operations                  │
│  ✓ TelemetryPort: interface for logging                     │
│  ✓ Existing use cases (unchanged)                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  DOMAIN                                                       │
│  ✓ AuthContext: value object with UserId, Role, Email         │
│  ✓ UserRole enum (ADMIN, MODERATOR, USER)                    │
│  ✓ Entities (unchanged)                                       │
│  ✓ Value Objects (unchanged)                                  │
└──────────────────────────────────────────────────────────────┘
```

#### Concern Migration Matrix

| Concern              | From (Current)                  | To (Target)                             | Mechanism                         |
| -------------------- | ------------------------------- | --------------------------------------- | --------------------------------- |
| Token extraction     | tRPC context (`ctx.token`)      | Adapter controller (explicit parameter) | Moved OUT of framework - no `ctx` |
| Token validation     | `protectedProcedure` middleware | `AuthenticateUserUseCase`               | Port → Adapter implementation     |
| User lookup          | `protectedProcedure` middleware | `AuthenticateUserUseCase`               | Port → Supabase/DB adapter        |
| Admin role check     | `adminProcedure` middleware     | `AuthorizeAdminUseCase`                 | Result type in Use Cases          |
| Moderator role check | `moderatorProcedure` middleware | `AuthorizeModeratorUseCase`             | Result type in Use Cases          |
| Telemetry logging    | `mobileAppMiddleware`           | `LogTelemetryUseCase`                   | Port → Prisma adapter             |
| Request ID           | `createRequestScope()`          | `createRequestScope()`                  | Already in correct layer          |

### Component Inventory

| Component                   | Type         | Layer     | Responsibility                            |
| --------------------------- | ------------ | --------- | ----------------------------------------- |
| `AuthContext`               | Value Object | Domain    | Immutable auth state container            |
| `UserRole`                  | Enum         | Domain    | Role enumeration (ADMIN, MODERATOR, USER) |
| `AuthPort`                  | Interface    | Use Cases | Contract for auth operations              |
| `TelemetryPort`             | Interface    | Use Cases | Contract for telemetry operations         |
| `AuthenticateUserUseCase`   | Interactor   | Use Cases | Token → AuthContext validation            |
| `AuthorizeAdminUseCase`     | Interactor   | Use Cases | Admin role authorization with Result      |
| `AuthorizeModeratorUseCase` | Interactor   | Use Cases | Moderator role authorization with Result  |
| `LogTelemetryUseCase`       | Interactor   | Use Cases | Telemetry logging orchestration           |
| `SupabaseAuthAdapter`       | Adapter      | Adapters  | AuthPort implementation using Supabase    |
| `PrismaTelemetryAdapter`    | Adapter      | Adapters  | TelemetryPort implementation using Prisma |
| `protectedProcedure`        | Middleware   | Adapters  | Thin wrapper delegating to use case       |
| `adminProcedure`            | Middleware   | Adapters  | Thin wrapper delegating to use case       |
| `moderatorProcedure`        | Middleware   | Adapters  | Thin wrapper delegating to use case       |
| `mobileAppMiddleware`       | Middleware   | Adapters  | Thin wrapper delegating to use case       |

---

## Implementation Process

> **Parallelization Guide**: This section has been reorganized for maximum parallel execution.
> See `.specs/scratchpad/move-trpc-middleware-to-ddd-layers.parallelization.md` for detailed analysis.

### Parallelization Overview

```
Execution Flow (4-way parallel at peak):

Wave 1 (2 parallel):  0.1 ──┐
                           ├──→ Phase 1
Wave 2:               0.2 ──┘

Phase 1 (2+1 parallel):
                      1.1 ──┐
                           ├──→ 1.2 ──→ 1.3
                      2.2 ──┘ (starts after 1.1!)

Phase 2 (4 parallel): 2.1 ──┐
                           ├──→ 2.4 ──→ 2.6
                      2.2 ──┤       (integration)
                           ├──→ 2.5
                      2.3 ──┘

Phase 3 (2 parallel):  3.1 ──┐
                           ├──→ 3.3
                      3.2 ──┘

Phase 4:              4.1 ──→ 4.2/4.3
```

**Agent Assignment Key**:

- `(haiku)` = sdd:developer with haiku model - simple tasks
- `(sonnet)` = sdd:developer or sdd:tech-lead with sonnet model - medium complexity
- `(opus)` = sdd:tech-lead with opus model - critical integration
- `(review)` = code-review:review-local-changes - verification

---

### Phase 0: Setup (Baselines, Environments)

> **Can Parallel**: Steps 0.1 and 0.2 are completely independent.
> **Launch**: Dispatch both simultaneously to different haiku agents.

#### Step 0.1: Establish Baseline Metrics [DONE]

**Goal:** Capture current state before refactoring  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 0.2  
**Dependencies**: None  
**Outputs:**

- `baseline-coverage.json` - Test coverage report
- `middleware-inventory.md` - List of all tRPC middleware and their responsibilities
- `router-audit.md` - Count of routes using protected/admin/moderator procedures

**Subtasks:**

1. Run `bun test --coverage` and save baseline
2. Audit `packages/adapters/src/api/trpc.ts` for middleware implementations
3. Search all router files for `protectedProcedure`, `adminProcedure`, `moderatorProcedure` usage
4. Document current `TRPCContext` shape and dependencies

**Success Criteria:**

- Baseline metrics saved to `.specs/tasks/in-progress/baseline/`
- All middleware locations identified
- Router usage count documented (expected: ~156+ usages)

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Documentation):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Clarity | 0.45 | Clear language, logical structure |
| Completeness | 0.35 | All middleware documented, metrics captured |
| Examples | 0.20 | Sample metrics, file paths documented |

**Estimated Effort:** 2-3 hours

#### Step 0.2: Create Test Environment [DONE]

**Goal:** Ensure test infrastructure supports new patterns  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 0.1  
**Dependencies**: None  
**Outputs:**

- Updated test utilities for awilix-modular DI mocking
- Test fixtures for AuthContext and UserRole

**Subtasks:**

1. Review `createTestContainer()` in frameworks/di
2. Add mock factories for AuthPort and TelemetryPort
3. Create test fixtures for branded UserId types

**Success Criteria:**

- Tests can inject mocked auth dependencies
- No Supabase/tRPC mocks needed in use case tests

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Code/Function):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Code Quality | 0.30 | Clean utilities, proper factory patterns |
| Error Handling | 0.35 | Proper error types, graceful failures |
| Test Coverage | 0.35 | Mock factories tested, fixtures validated |

**Estimated Effort:** 2 hours

---

### Phase 1: Foundational (Core Abstractions, DI Wiring)

> **Critical Path**: 1.1 → 1.2 → 1.3 (sequential)
> **Parallel Opportunity**: Step 2.2 can start immediately after 1.1 completes!
> It only needs domain types, NOT ports or DI wiring.

#### Step 1.1: Create Domain Layer Auth Types [DONE]

**Goal:** Implement AuthContext Value Object and UserRole enum  
**Agent**: sdd:tech-lead (sonnet)  
**Dependencies**: None (foundation)  
**Unblocks**: 1.2, 2.2  
**Outputs:**

- `packages/domain/src/value-objects/AuthContext.ts`
- `packages/domain/src/enums/UserRole.ts`

**Subtasks:**

1. Define `UserRole` enum (ADMIN, MODERATOR, USER)
2. Create `UserId` branded type if not exists
3. Implement `AuthContext` class with factory method using Result<AuthContext, ValidationError>
4. Add unit tests achieving 100% domain coverage

**Success Criteria:**

- `AuthContext.create()` returns Result type
- Branded types prevent mixing with other IDs
- Tests pass: 100% domain coverage

**Verification:**

| Level | Threshold | Method   |
| ----- | --------- | -------- |
| Panel | 4.5/5.0   | 2 Judges |

**Rubric (Code/Function):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Code Quality | 0.30 | Clean code, proper naming, immutable VO |
| Error Handling | 0.35 | Result pattern, ValidationError type |
| Test Coverage | 0.35 | 100% coverage, branded types tested |

**Criticality:** Foundation for all auth - branded types and Result pattern must be correct

**Estimated Effort:** 3-4 hours  
**Blockers:** None

#### Step 1.2: Define Use Case Ports [DONE]

**Goal:** Create port interfaces for cross-cutting concerns  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 2.2 (launches after 1.1)  
**Dependencies**: 1.1 (AuthContext types)  
**Unblocks**: 1.3, 2.1, 2.3, 2.4, 2.5  
**Outputs:**

- `packages/use-cases/src/ports/AuthPort.ts`
- `packages/use-cases/src/ports/TelemetryPort.ts`

**Subtasks:**

1. `AuthPort` interface with `validateToken()` and `refreshSession()` methods
2. `TelemetryPort` interface with `log(event: TelemetryEvent)` method
3. Add domain errors: `AuthError`, `InvalidTokenError`, `SessionExpiredError`

**Success Criteria:**

- Ports have no framework dependencies
- Errors use Result pattern
- TypeScript strict mode passes

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Interface/Port):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Contract Completeness | 0.40 | All methods defined, proper types, no framework deps |
| Error Types | 0.35 | Domain errors defined, Result pattern, clear messages |
| Documentation | 0.25 | JSDoc comments, usage clear |

**Estimated Effort:** 2-3 hours  
**Blockers:** Requires Step 1.1 (AuthContext)

#### Step 1.3: Update DI Module Infrastructure [DONE]

**Goal:** Register new dependencies in awilix-modular  
**Agent**: sdd:tech-lead (sonnet)  
**Dependencies**: 1.2 (ports defined)  
**Unblocks**: 2.1  
**Outputs:**

- Updated `UseCaseModule.ts`
- Updated `ControllerModule.ts`
- Updated `AppModule.ts`

**Subtasks:**

1. Add port registrations (abstract, no implementation yet)
2. Create factory registrations for upcoming use cases
3. Ensure scoped lifetime for auth-related dependencies
4. Add request-scoped `AuthContext` provider placeholder

**Success Criteria:**

- `bun test` passes (no runtime errors)
- DI graph resolves without circular dependencies
- Type inference works for string-key resolution

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Code/Function):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Code Quality | 0.30 | Clean registrations, proper lifetimes |
| Error Handling | 0.35 | No circular deps, proper error messages |
| Test Coverage | 0.35 | DI wiring tested, type inference verified |

**Estimated Effort:** 2-3 hours  
**Blockers:** Requires Step 1.2 (ports defined)

---

### Phase 2: User Stories (Ports, Use Cases, Adapters)

> **Maximum Parallelism Zone**: 4 agents can work simultaneously during this phase!
>
> **Parallel Wave** (launch together when unblocked):
>
> - 2.1 (Auth UC) - needs 1.2, 1.3
> - 2.2 (Authorization UC) - needs 1.1 only (can start after 1.1!)
> - 2.3 (Telemetry UC) - needs 1.2 only
> - 2.5 (Prisma Adapter) - needs 1.2 only
>
> **Sequential**: 2.4 (Supabase Adapter) needs 2.1, so it runs after the parallel wave.
> **Integration**: 2.6 (Middleware Refactor) needs ALL previous steps - use opus agent.

#### Step 2.1: Implement Authentication Use Case

**Goal:** Extract token validation logic from middleware  
**Agent**: sdd:tech-lead (sonnet)  
**Parallel With**: 2.2, 2.3, 2.5  
**Dependencies**: 1.2 (AuthPort), 1.3 (DI)  
**Unblocks**: 2.4, 2.6  
**Outputs:**

- `packages/use-cases/src/interactors/AuthenticateUser.ts`
- `packages/use-cases/src/interactors/__tests__/AuthenticateUser.test.ts`

**Subtasks:**

1. Create `AuthenticateUserUseCase` class with `execute(token: string)` method
2. Implement delegation to `AuthPort.validateToken()`
3. Return Result<AuthContext, AuthError>
4. Write unit tests with mocked AuthPort (no Supabase/tRPC)

**Success Criteria:**

- Use case is framework-agnostic
- Tests use mocked AuthPort
- Result type properly propagated

**Verification:**

| Level | Threshold | Method   |
| ----- | --------- | -------- |
| Panel | 4.5/5.0   | 2 Judges |

**Rubric (Use Case):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Business Logic | 0.40 | Correct token validation flow, no framework coupling |
| Error Handling | 0.30 | Result pattern, AuthError types, graceful failures |
| Testability | 0.30 | Mocked AuthPort tests, no Supabase/tRPC deps |

**Criticality:** Security-sensitive authentication logic - core use case

**Estimated Effort:** 4-5 hours  
**Blockers:** Requires Step 1.2 (AuthPort), Step 1.3 (DI)  
**Risks:** Token validation logic might be scattered - need to consolidate from `protectedProcedure`

#### Step 2.2: Implement Authorization Use Cases

**Goal:** Move role-based checks to use case layer  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 1.2, 1.3, 2.1, 2.3, 2.5  
**Dependencies**: 1.1 (UserRole, AuthContext) - **CAN START AFTER 1.1!**  
**Unblocks**: 2.6  
**Outputs:**

- `packages/use-cases/src/interactors/AuthorizeAdmin.ts`
- `packages/use-cases/src/interactors/AuthorizeModerator.ts`
- Unit tests for both

**Subtasks:**

1. `AuthorizeAdminUseCase`: Check `authContext.role === UserRole.ADMIN`, return Result
2. `AuthorizeModeratorUseCase`: Check `role === MODERATOR || role === ADMIN`, return Result
3. Both return Result with domain errors (PermissionDenied)
4. Write unit tests for all role combinations

**Success Criteria:**

- No async needed (pure domain logic)
- Result pattern for all errors
- 100% test coverage

**Verification:**

| Level | Threshold | Method   |
| ----- | --------- | -------- |
| Panel | 4.5/5.0   | 2 Judges |

**Rubric (Use Case):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Business Logic | 0.40 | Correct role checks, no framework coupling |
| Error Handling | 0.30 | Result pattern, PermissionDenied errors |
| Testability | 0.30 | All role combinations tested, pure functions |

**Criticality:** Security-sensitive authorization logic - permission system

**Estimated Effort:** 3-4 hours  
**Blockers:** Requires Step 1.1 (UserRole, AuthContext)  
**Risks:** Authorization logic might be embedded in multiple middleware - verify all locations
**Parallelization Note**: This is the **key parallel opportunity** - starts immediately after 1.1, runs parallel to 1.2, 1.3, and all of Phase 2 except 2.4/2.6.

#### Step 2.3: Implement Telemetry Use Case

**Goal:** Extract mobileAppMiddleware logging  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 2.1, 2.2, 2.5  
**Dependencies**: 1.2 (TelemetryPort)  
**Unblocks**: 2.6  
**Outputs:**

- `packages/use-cases/src/interactors/LogTelemetry.ts`
- Unit tests with mocked TelemetryPort

**Subtasks:**

1. Create `TelemetryEvent` DTO (userAgent, appVersion, platform, timestamp, userId)
2. `LogTelemetryUseCase` delegates to `TelemetryPort.log(event)`
3. Write tests with mocked TelemetryPort

**Success Criteria:**

- Use case delegates to port
- No Prisma/Direct DB access in use case
- Async/await pattern

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Use Case):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Business Logic | 0.40 | Correct telemetry delegation, DTO validation |
| Error Handling | 0.30 | Proper error propagation, port errors handled |
| Testability | 0.30 | Mocked TelemetryPort tests, no Prisma deps |

**Estimated Effort:** 2-3 hours  
**Blockers:** Requires Step 1.2 (TelemetryPort)

#### Step 2.4: Implement Supabase Auth Adapter

**Goal:** Create framework-specific AuthPort implementation  
**Agent**: sdd:developer (sonnet)  
**Parallel With**: Nothing (sequential after Wave 3)  
**Dependencies**: 1.2 (AuthPort), 2.1 (use case interface)  
**Unblocks**: 2.6  
**Outputs:**

- `packages/adapters/src/gateways/SupabaseAuthAdapter.ts`
- `packages/adapters/src/gateways/__tests__/SupabaseAuthAdapter.test.ts`

**Subtasks:**

1. Create adapter class implementing `AuthPort` with injected `SupabaseClient`
2. Implement `validateToken` using `supabase.auth.getUser(token)`
3. Map Supabase response to AuthContext
4. Integration test with real Supabase or mock for unit

**Success Criteria:**

- Adapter wraps Supabase dependency
- Returns Result types
- No business logic (just mapping)

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Adapter):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Implementation Quality | 0.35 | Thin wrapper, no business logic, clean mapping |
| Error Mapping | 0.35 | Supabase errors mapped to domain errors, Result types |
| Integration | 0.30 | Integration tests exist, real/mock Supabase tested |

**Estimated Effort:** 3-4 hours  
**Blockers:** Requires Step 1.2 (AuthPort), Step 2.1 (understand use case needs)  
**Risks:** Supabase auth API surface area - may need additional methods
**Parallelization Note**: Only step in Phase 2 that cannot parallel with others. Consider having this developer assist 2.1 if 2.1 is delayed.

#### Step 2.5: Implement Prisma Telemetry Adapter

**Goal:** Create TelemetryPort implementation  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 2.1, 2.2, 2.3  
**Dependencies**: 1.2 (TelemetryPort)  
**Unblocks**: 2.6  
**Outputs:**

- `packages/adapters/src/gateways/PrismaTelemetryAdapter.ts`
- Integration tests with test database

**Subtasks:**

1. Inject `PrismaClient` via DI
2. Implement `log(event: TelemetryEvent)` to persist telemetry data
3. Handle Prisma errors appropriately
4. Write integration tests

**Success Criteria:**

- Persists telemetry data
- Error handling for DB failures
- No use case logic in adapter

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Adapter):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Implementation Quality | 0.35 | Thin wrapper, no business logic, clean persistence |
| Error Mapping | 0.35 | Prisma errors handled, graceful failures |
| Integration | 0.30 | Integration tests with test database |

**Estimated Effort:** 2-3 hours  
**Blockers:** Requires Step 1.2 (TelemetryPort)

#### Step 2.6: Remove Auth from tRPC Middleware - Move to Controllers

**Goal:** Eliminate auth logic from tRPC layer entirely - extract token at controller level, pass explicitly to use cases  
**Agent**: sdd:tech-lead (opus)  
**Parallel With**: Nothing (integration point)  
**Dependencies**: 2.1, 2.2, 2.3, 2.4, 2.5 (ALL previous steps)  
**Unblocks**: 3.1, 3.2  
**Outputs:**

- Updated `packages/adapters/src/api/trpc.ts` (procedures no longer auth-aware)
- Updated controller files to extract token from request headers
- New `TokenExtractor` utility in adapters layer

**Subtasks:**

1. **Create `TokenExtractor`** utility: Extract Bearer token from HTTP headers (not from `ctx`)
2. **Remove `protectedProcedure`**: Delete the auth-aware procedure - use `publicProcedure` everywhere
3. **Remove `adminProcedure`**: Delete role-checking procedure
4. **Remove `moderatorProcedure`**: Delete role-checking procedure
5. **Remove `mobileAppMiddleware`**: Delete telemetry middleware
6. **Update all controllers**:
   - Extract token via `TokenExtractor` from request headers
   - Call `AuthenticateUserUseCase` explicitly with token
   - Call `AuthorizeAdminUseCase`/`AuthorizeModeratorUseCase` as needed
   - Pass `AuthContext` explicitly to downstream use cases
7. **Simplify `TRPCContext`**: Remove `user`, `token`, auth-related fields (keep only `container`)

**Success Criteria:**

- ZERO auth logic in `packages/adapters/src/api/trpc.ts`
- ZERO token access via `ctx.token` or `ctx.user`
- Token extracted from HTTP headers in controllers only
- All auth decisions made in use cases with explicit parameters
- Controllers receive `Result<AuthContext, AuthError>` and handle error mapping to tRPC
- All 156+ routes still work (controllers handle auth now)

**Verification:**

| Level | Threshold | Method   |
| ----- | --------- | -------- |
| Panel | 4.5/5.0   | 2 Judges |

**Rubric (Code/Function):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Code Quality | 0.25 | Auth procedures DELETED, only `publicProcedure` remains, clean separation |
| Error Handling | 0.35 | Controllers properly map Result errors to tRPC errors, no ctx.token |
| Test Coverage | 0.40 | All 156+ routes tested with new controller-based auth flow |

**Criticality:** Critical integration point - affects 156+ routes. ZERO backward compatibility for `protectedProcedure`/`adminProcedure` - these are DELETED, not refactored.

**Estimated Effort:** 6-8 hours  
**Blockers:** Requires Step 2.1, 2.2, 2.3 (use cases), Step 2.4, 2.5 (adapters)  
**Risks:**

- **HIGH:** All 19 router files need changes (protectedProcedure → publicProcedure)
- **HIGH:** All 20 controller files need auth logic added
- **HIGH:** Error propagation to tRPC - need proper error mapping
  **Parallelization Note**: Critical integration point - requires **opus** agent. All other Phase 2 work must complete first. Daily sync with parallel teams recommended.

---

### Phase 3: Router Migration (Breaking Changes Required)

> **All 19 router files MUST change** - this is a breaking change, not backward compatible.
> The auth procedures (`protectedProcedure`, `adminProcedure`, `moderatorProcedure`) are DELETED.

#### Step 3.1: Bulk Router Migration

**Goal:** Update all 19 router files to use `publicProcedure` + controller auth  
**Agent**: sdd:developer (sonnet)  
**Parallel With**: 3.2, 3.3  
**Dependencies**: 2.6 (middleware deleted, controllers updated)  
**Outputs:**

- All 19 router files updated
- Migration script for pattern replacement

**Subtasks:**

1. **Create migration script** to replace patterns:
   - `protectedProcedure` → `publicProcedure`
   - `adminProcedure` → `publicProcedure` (admin check in controller)
   - `moderatorProcedure` → `publicProcedure` (mod check in controller)
   - Remove `ctx.user` / `ctx.token` references from routers
2. **Run migration script** on all 19 router files
3. **Verify compilation** - all TypeScript errors resolved
4. **Update integration tests** to work with new controller-based auth

**Success Criteria:**

- All 19 router files compile without errors
- Zero references to `protectedProcedure`, `adminProcedure`, `moderatorProcedure`
- Zero references to `ctx.user`, `ctx.token` in router files
- All integration tests pass with new auth flow

**Verification:**

| Level | Threshold | Method   |
| ----- | --------- | -------- |
| Panel | 4.5/5.0   | 2 Judges |

**Rubric (Test):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Coverage | 0.40 | All 19 router files tested, 156+ usages verified |
| Assertions | 0.35 | Clear pass/fail criteria, compatibility documented |
| Mock Quality | 0.25 | No mocking needed for compatibility tests |

**Criticality:** High risk - 156+ routes affected, breaking changes would be critical

**Estimated Effort:** 3-4 hours  
**Blockers:** Requires Step 2.6 (middleware refactored)

#### Step 3.2: Update Controller Auth Helpers

**Goal:** Refactor authServer.ts to use new use cases  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 3.1, 3.3  
**Dependencies**: 2.1, 2.2 (auth use cases) - **CAN START BEFORE 2.6!**  
**Outputs:**

- Updated `packages/adapters/src/controllers/auth/authServer.ts`

**Subtasks:**

1. Audit existing `authServer.ts` functions
2. Replace inline logic with use case calls
3. Add deprecation notices to old functions
4. Update DI wiring if needed

**Success Criteria:**

- Controllers delegate to use cases
- Backward compatibility maintained
- No duplication between old and new

**Verification:**

| Level    | Threshold | Method       |
| -------- | --------- | ------------ |
| Per-Item | 4.0/5.0   | Single Judge |

**Rubric (Code/Function):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Code Quality | 0.30 | Clean delegation, proper deprecation notices |
| Error Handling | 0.35 | Errors properly propagated, backward compatibility |
| Test Coverage | 0.35 | Controller tests updated, no regression |

**Estimated Effort:** 2-3 hours  
**Blockers:** Requires Step 2.1, 2.2 (auth use cases)
**Parallelization Note**: Can start as soon as 2.1/2.2 complete - no need to wait for 2.6! Run parallel with 3.1.

#### Step 3.3: Create Migration Guide

**Goal:** Document changes for developers  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 3.1, 3.2  
**Dependencies**: Phase 2 complete (for technical accuracy)  
**Outputs:**

- Migration guide in `.specs/tasks/in-progress/`

**Subtasks:**

1. Document old vs new patterns
2. Provide example refactors for common scenarios
3. Add troubleshooting section

**Success Criteria:**

- Clear before/after examples
- Common pitfalls documented

**Verification:**

| Level | Threshold | Method |
| ----- | --------- | ------ |
| None  | N/A       | N/A    |

**Rationale:** Documentation only - no code verification required

**Estimated Effort:** 2 hours
**Parallelization Note**: Can be drafted during 3.1/3.2 execution, finalized after integration testing.

---

### Phase 4: Polish (Cleanup, Final Verification)

> **Sequential Phase**: All verification must happen after implementation.
> 4.2 (docs) can start when 4.1 is partially complete.

#### Step 4.1: Comprehensive Testing

**Goal:** Full test coverage for new components  
**Agent**: code-review:review-local-changes (sonnet)  
**Parallel With**: Nothing (verification gate)  
**Dependencies**: All previous steps complete  
**Unblocks**: 4.2, 4.3  
**Outputs:**

- Unit tests: all new use cases (target 80%+ coverage)
- Integration tests: router + middleware
- dependency-cruiser validation

**Subtasks:**

1. Write missing unit tests for any gaps
2. Run `bun test --coverage`
3. Run `bunx dependency-cruiser --validate .dependency-cruiser.mjs .`
4. Verify no domain/use-case imports from @trpc/server

**Success Criteria:**

- Coverage meets threshold
- No architectural violations
- All tests pass

**Verification:**

| Level | Threshold | Method   |
| ----- | --------- | -------- |
| Panel | 4.5/5.0   | 2 Judges |

**Rubric (Test):**
| Criteria | Weight | Description |
|----------|--------|-------------|
| Coverage | 0.45 | ≥80% coverage for new use cases, no regression |
| Assertions | 0.35 | Clear assertions, all paths tested |
| Mock Quality | 0.20 | Appropriate mocks, no framework dependencies in tests |

**Criticality:** Final verification gate - must ensure all quality criteria met

**Estimated Effort:** 4-6 hours  
**Blockers:** All previous steps complete

#### Step 4.2: Documentation Updates

**Goal:** Update CLAUDE.md with new patterns  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 4.3 (can run together)  
**Dependencies**: 4.1 (verification complete)  
**Outputs:**

- Updated CLAUDE.md with authentication patterns
- Code comments for DI wiring

**Subtasks:**

1. Check if auth pattern examples exist in CLAUDE.md
2. Add authentication/authorization pattern section
3. Document new ports and use cases

**Success Criteria:**

- Future developers can follow patterns
- DI setup documented

**Verification:**

| Level | Threshold | Method |
| ----- | --------- | ------ |
| None  | N/A       | N/A    |

**Rationale:** Documentation only - no code verification required

**Estimated Effort:** 2-3 hours

#### Step 4.3: Final Review and Cleanup

**Goal:** Remove deprecated code, polish  
**Agent**: sdd:developer (haiku)  
**Parallel With**: 4.2  
**Dependencies**: 4.1 (verification complete)  
**Outputs:**

- Clean codebase with deprecation markers on old patterns

**Subtasks:**

1. Add `@deprecated` JSDoc to old auth functions
2. Remove dead code if safe
3. Final lint check: `bunx eslint .`
4. Format: `bunx prettier --write`

**Success Criteria:**

- No lint errors
- Clean imports (no unused)
- Deprecation warnings help migration

**Verification:**

| Level | Threshold | Method |
| ----- | --------- | ------ |
| None  | N/A       | N/A    |

**Rationale:** Cleanup tasks only - linting, formatting, no verification required

**Estimated Effort:** 2 hours

---

### Blockers and Resolutions

| Blocker                        | Impact                                  | Resolution                   | Parallel Opportunity                          |
| ------------------------------ | --------------------------------------- | ---------------------------- | --------------------------------------------- |
| Step 1.2 → 1.3                 | Ports must exist before DI registration | Sequential dependency        | 2.2 can start after 1.1, parallel to 1.2/1.3  |
| Step 1.3 → 2.1                 | DI must be ready before auth use case   | Complete DI wiring first     | 2.3, 2.5 can start after 1.2, parallel to 1.3 |
| Step 2.1 → 2.4                 | Auth UC interface needed for adapter    | 2.4 waits for 2.1            | 2.2, 2.3, 2.5 run parallel while waiting      |
| Step 2.1,2.2,2.3,2.4,2.5 → 2.6 | All components needed for integration   | All must complete before 2.6 | Use opus agent; daily sync during Wave 3      |
| Step 2.1,2.2 → 3.2             | Auth use cases needed for controller    | Can start before 2.6!        | 3.2 runs parallel to 3.1                      |
| Step 2.6 → 3.1                 | Middleware needed for verification      | Sequential                   | None                                          |

### Parallel Execution Waves

```
Wave 1 (Setup):      0.1 + 0.2                    → 2-3h (2 parallel)
Wave 2 (Foundation): 1.1 → (1.2 ∥ 2.2) → 1.3    → 7-10h (2.2 early start)
Wave 3 (Core):       2.1 ∥ 2.2 ∥ 2.3 ∥ 2.5      → 4-5h (4-way parallel!)
Wave 4 (Adapter):    2.4                        → 3-4h (sequential)
Wave 5 (Integration):2.6                        → 6-8h (opus agent)
Wave 6 (Migration):  3.1 ∥ 3.2 ∥ 3.3            → 3-4h (3 parallel)
Wave 7 (Final):      4.1 → (4.2 ∥ 4.3)          → 6-8h

OPTIMIZED TOTAL: ~4.3 days (vs 7 days sequential) = 38% faster
```

---

### Risks and Mitigations

#### High Priority Risks

| Risk                                             | Probability | Impact   | Mitigation                                                                                                                                                       |
| ------------------------------------------------ | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breaking existing routes with context change     | High        | Critical | Maintain backward-compatible TRPCContext shape during migration; add deprecation notices instead of immediate removal; extensive integration testing in Step 3.1 |
| Token validation scattered in multiple locations | Medium      | Medium   | Thorough code search in Step 0.1; create inventory; consolidate all auth logic into use case                                                                     |
| Supabase auth edge cases                         | Medium      | Medium   | Integration tests with real Supabase in test environment; document all token validation scenarios                                                                |
| Error propagation to tRPC format changes         | Medium      | High     | Ensure Result errors map to existing tRPC error format; test error responses match current behavior                                                              |

#### Medium Priority Risks

| Risk                                     | Probability | Impact | Mitigation                                                                        |
| ---------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------- |
| DI scope issues with request-scoped auth | Medium      | Medium | Test scoped container creation; verify ordering (auth before dependent use cases) |
| Performance regression from extra layers | Low         | Medium | Benchmark before/after; use cases are thin wrappers, overhead should be minimal   |
| Test flakiness with async auth           | Low         | Low    | Proper async/await in tests; no Promise.all without proper handling               |

---

### Implementation Summary Table

| Phase | Step | Goal                    | Agent             | Effort | Dependencies | Can Parallel With       | Risk     |
| ----- | ---- | ----------------------- | ----------------- | ------ | ------------ | ----------------------- | -------- |
| 0     | 0.1  | Baseline metrics        | sdd:dev (haiku)   | 2-3h   | None         | 0.2                     | Low      |
| 0     | 0.2  | Test environment        | sdd:dev (haiku)   | 2h     | None         | 0.1                     | Low      |
| 1     | 1.1  | Domain auth types       | sdd:lead (sonnet) | 3-4h   | None         | -                       | Low      |
| 1     | 1.2  | Use case ports          | sdd:dev (haiku)   | 2-3h   | 1.1          | 2.2                     | Low      |
| 1     | 1.3  | DI modules              | sdd:lead (sonnet) | 2-3h   | 1.2          | -                       | Medium   |
| 2     | 2.1  | Auth use case           | sdd:lead (sonnet) | 4-5h   | 1.2, 1.3     | 2.2, 2.3, 2.5           | Medium   |
| 2     | 2.2  | Authorization use cases | sdd:dev (haiku)   | 3-4h   | 1.1          | 1.2, 1.3, 2.1, 2.3, 2.5 | Medium   |
| 2     | 2.3  | Telemetry use case      | sdd:dev (haiku)   | 2-3h   | 1.2          | 2.1, 2.2, 2.5           | Low      |
| 2     | 2.4  | Supabase adapter        | sdd:dev (sonnet)  | 3-4h   | 1.2, 2.1     | -                       | Medium   |
| 2     | 2.5  | Prisma adapter          | sdd:dev (haiku)   | 2-3h   | 1.2          | 2.1, 2.2, 2.3           | Low      |
| 2     | 2.6  | Middleware refactor     | sdd:lead (opus)   | 6-8h   | 2.1-2.5      | -                       | **High** |
| 3     | 3.1  | Router compatibility    | sdd:dev (sonnet)  | 3-4h   | 2.6          | 3.2, 3.3                | High     |
| 3     | 3.2  | Controller updates      | sdd:dev (haiku)   | 2-3h   | 2.1, 2.2     | 3.1, 3.3                | Medium   |
| 3     | 3.3  | Migration guide         | sdd:dev (haiku)   | 2h     | Phase 2      | 3.1, 3.2                | Low      |
| 4     | 4.1  | Testing & validation    | code-review       | 4-6h   | All          | -                       | Medium   |
| 4     | 4.2  | Documentation           | sdd:dev (haiku)   | 2-3h   | 4.1          | 4.3                     | Low      |
| 4     | 4.3  | Cleanup                 | sdd:dev (haiku)   | 2h     | 4.1          | 4.2                     | Low      |

**Totals:**

- **Implementation Steps:** 17
- **Total Subtasks:** ~45
- **Total Estimated Effort:** 45-60 hours
- **Sequential Timeline:** ~7 days
- **Parallel Timeline:** ~4.3 days (**38% faster**)
- **Maximum Parallel Depth:** 4 agents simultaneously (Wave 3)
- **High Priority Risks:** 4
- **Critical Path Steps:** 9 (0.1 → 1.1 → 1.2 → 1.3 → 2.1 → 2.4 → 2.6 → 3.1 → 4.1)

---

### Verification Summary

| Step | Phase      | Artifact Type  | Verification Level | Threshold | Method       | Criticality  |
| ---- | ---------- | -------------- | ------------------ | --------- | ------------ | ------------ |
| 0.1  | Setup      | Documentation  | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 0.2  | Setup      | Code/Function  | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 1.1  | Foundation | Code/Function  | **Panel**          | 4.5/5.0   | 2 Judges     | **Critical** |
| 1.2  | Foundation | Interface/Port | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 1.3  | Foundation | Code/Function  | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 2.1  | Core       | Use Case       | **Panel**          | 4.5/5.0   | 2 Judges     | **Critical** |
| 2.2  | Core       | Use Case       | **Panel**          | 4.5/5.0   | 2 Judges     | **Critical** |
| 2.3  | Core       | Use Case       | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 2.4  | Core       | Adapter        | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 2.5  | Core       | Adapter        | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 2.6  | Core       | Code/Function  | **Panel**          | 4.5/5.0   | 2 Judges     | **Critical** |
| 3.1  | Migration  | Test           | **Panel**          | 4.5/5.0   | 2 Judges     | **Critical** |
| 3.2  | Migration  | Code/Function  | Per-Item           | 4.0/5.0   | Single Judge | Standard     |
| 3.3  | Migration  | Documentation  | None               | N/A       | N/A          | N/A          |
| 4.1  | Final      | Test           | **Panel**          | 4.5/5.0   | 2 Judges     | **Critical** |
| 4.2  | Final      | Documentation  | None               | N/A       | N/A          | N/A          |
| 4.3  | Final      | Cleanup        | None               | N/A       | N/A          | N/A          |

**Verification Breakdown:**

| Category              | Count  | Percentage               |
| --------------------- | ------ | ------------------------ |
| Panel (2+ judges)     | 6      | 35%                      |
| Per-Item (1 judge)    | 10     | 59%                      |
| None                  | 3      | 18%                      |
| **Total Steps**       | **17** | **100%**                 |
| **Total Evaluations** | **22** | (Panel ×2 + Per-Item ×1) |

**Critical Path Panel Verifications:**

1. **Step 1.1** (Domain auth types) - Foundation for all auth
2. **Step 2.1** (Auth use case) - Security-sensitive core logic
3. **Step 2.2** (Authorization use cases) - Permission system
4. **Step 2.6** (Middleware refactor) - Integration point, 156+ routes
5. **Step 3.1** (Router compatibility) - High-risk compatibility verification
6. **Step 4.1** (Comprehensive testing) - Final quality gate

---

### Sub-Agent Execution Directives

> **How to dispatch parallel work using available agents**

#### Launch Commands by Wave

```bash
# WAVE 1: Setup (dispatch simultaneously)
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 0.1
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 0.2

# WAVE 2: Foundation (wait for 1.1, then parallel)
# Wait: 1.1 complete
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 1.2
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 2.2  # EARLY START!
sadd:launch-sub-agent --agent sdd:tech-lead --model sonnet --task 1.3

# WAVE 3: Core (4-way parallel - maximum parallelism)
# Wait: 1.2, 1.3 complete
sadd:launch-sub-agent --agent sdd:tech-lead --model sonnet --task 2.1
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 2.3
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 2.5
# Note: 2.2 is already running from Wave 2

# WAVE 4: Adapter (sequential after 2.1)
# Wait: 2.1 complete
sadd:launch-sub-agent --agent sdd:developer --model sonnet --task 2.4

# WAVE 5: Critical Integration (opus required)
# Wait: 2.1, 2.2, 2.3, 2.4, 2.5 complete
sadd:launch-sub-agent --agent sdd:tech-lead --model opus --task 2.6

# WAVE 6: Migration (3-way parallel)
# Wait: 2.6 complete (for 3.1), or 2.1/2.2 (for 3.2)
sadd:launch-sub-agent --agent sdd:developer --model sonnet --task 3.1
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 3.2  # Can start earlier!
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 3.3

# WAVE 7: Final verification
# Wait: All previous complete
sadd:launch-sub-agent --agent code-review:review-local-changes --model sonnet --task 4.1
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 4.2
sadd:launch-sub-agent --agent sdd:developer --model haiku --task 4.3
```

#### File Ownership (Conflict Prevention)

| Step | Agent                  | Primary Files                                | Handoff Contract                  |
| ---- | ---------------------- | -------------------------------------------- | --------------------------------- |
| 1.1  | sdd:tech-lead (sonnet) | `AuthContext.ts`, `UserRole.ts`              | Types exported for downstream     |
| 1.2  | sdd:dev (haiku)        | `AuthPort.ts`, `TelemetryPort.ts`            | Interfaces for 2.1, 2.3, 2.4, 2.5 |
| 2.1  | sdd:tech-lead (sonnet) | `AuthenticateUser.ts`                        | Use case interface for 2.4        |
| 2.2  | sdd:dev (haiku)        | `AuthorizeAdmin.ts`, `AuthorizeModerator.ts` | Authorization logic (independent) |
| 2.3  | sdd:dev (haiku)        | `LogTelemetry.ts`                            | Telemetry use case                |
| 2.4  | sdd:dev (sonnet)       | `SupabaseAuthAdapter.ts`                     | Adapter for 2.6                   |
| 2.5  | sdd:dev (haiku)        | `PrismaTelemetryAdapter.ts`                  | Adapter for 2.6                   |
| 2.6  | sdd:tech-lead (opus)   | `trpc.ts` middleware                         | Integration - owns final file     |

#### Quality Gates for Parallel Work

| Component           | Threshold        | Verification                     |
| ------------------- | ---------------- | -------------------------------- |
| Domain types (1.1)  | 100% coverage    | sadd:judge                       |
| Ports (1.2)         | Type-safe        | TypeScript strict                |
| Use cases (2.1-2.3) | 80% coverage     | sadd:judge                       |
| Adapters (2.4-2.5)  | Integration test | sadd:do-and-judge                |
| Middleware (2.6)    | All tests pass   | code-review:review-local-changes |

#### Risk Mitigation for Parallel Execution

| Risk                           | Mitigation Strategy                                        |
| ------------------------------ | ---------------------------------------------------------- |
| **Merge conflicts**            | Strict file ownership table above; no overlapping files    |
| **Interface drift**            | Detailed specs in scratchpad; daily standup sync           |
| **2.1 delays block 2.4**       | 2.4 developer assists 2.1 if blocked; both use sonnet      |
| **Integration failure at 2.6** | Pre-integration test plan; daily sync during Wave 3        |
| **Context shape changes**      | 2.6 maintains backward compatibility; test all 156+ routes |

---

### Definition of Done (Refined)

#### Technical Completion

- [ ] All 7 new core files created (per Architecture Overview)
- [ ] All 2+ modified files updated
- [ ] 19 router files unchanged (verified compatible)
- [ ] Zero business logic in tRPC middleware
- [ ] dependency-cruiser validates no domain/use-case tRPC imports

#### Quality Gates

- [ ] Unit test coverage ≥80% for new use cases
- [ ] Integration tests pass for all protected routes
- [ ] Baseline metrics show no coverage regression
- [ ] No lint errors, no TypeScript errors

#### Documentation

- [ ] Migration guide complete
- [ ] CLAUDE.md updated with auth patterns
- [ ] Code comments for DI wiring
- [ ] Deprecation notices on old functions

#### Verification

- [ ] All 7 acceptance criteria pass
- [ ] Manual testing of protected/admin/moderator routes
- [ ] Telemetry logging verified
- [ ] Performance benchmark (no regression >10%)
