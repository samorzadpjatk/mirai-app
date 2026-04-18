---
title: Implement gateway-level auth protection with Effect DI
status: draft
issue_type: feature
complexity: L
---

## Initial User Prompt

Look at the pjapp-main tRPC endpoints, how they solve authn/authz - I want my gateway operations to also be protected

## Description

**Problem Statement**
Current gateway implementations lack consistent authentication and authorization protection, creating potential security vulnerabilities where users could access data they don't own. We need a Clean Architecture solution that centralizes auth logic while maintaining separation of concerns.

**Solution Overview**
Implement a layered authentication system using Effect's dependency injection where domain defines the auth contract (IAuthPort), use-cases provide the injection point (AuthPortTag), adapters implement Supabase-based verification (SupabaseAuthGateway), and frameworks wire it all together (auth Layer). This enables resource-level permission checks at the gateway layer, ensuring users can only access their own data.

**Business Value**
- **Security**: Prevents unauthorized data access through consistent access controls
- **Compliance**: Enables data protection by verifying permissions at data access layer
- **Developer Experience**: Provides clear pattern for implementing auth in all gateways
- **Maintainability**: Centralized auth logic makes auditing and updates easier

**Constraints**
- Must use Effect's Context.Tag for dependency injection
- Must follow Clean Architecture layering (domain → use-cases → adapters → frameworks)
- Must integrate with existing Supabase authentication
- Must support both authenticated and public operations
- Must not break existing gateway implementations during migration

**Scope**:
- **Included**:
  - Domain layer: IAuthPort interface, AuthErrors (UnauthorizedError, ForbiddenError, AuthServiceError)
  - Use-cases layer: AuthPortTag Context.Tag for DI
  - Adapters layer: SupabaseAuthGateway implementing IAuthPort
  - Frameworks layer: makeAuthLayer() for Layer composition
  - Integration with existing DI system (packages/frameworks/src/di/)
  - Migration pattern for existing gateways (TripDrizzleGateway, UserDrizzleGateway)
- **Excluded**:
  - User interface for authentication (login/logout pages)
  - Token generation or issuance (handled by Supabase Auth)
  - OAuth provider integrations (handled by Supabase)
  - Password reset flows
  - Multi-factor authentication (MFA)
  - Rate limiting implementation
  - Audit logging infrastructure
  - Role-based access control (RBAC) - basic resource ownership only for this iteration

**User Scenarios**:
1. **Primary Flow**: Authenticated user with valid token accesses their own resource → Auth verified → Operation succeeds
2. **Alternative Flow**: Anonymous user accesses public resource → Auth skipped → Operation succeeds
3. **Error Handling**: Invalid token, expired token, or wrong resource owner → Specific AuthError returned → Operation blocked with appropriate error

---

## Design Reference

See `.specs/plans/gateway-auth-protection.design.md` for the complete architecture design.

### Implementation Summary

Create a Clean Architecture auth solution where `SupabaseAuthGateway` protects gateway operations via Effect's dependency injection:

1. **Domain Layer**: Create `IAuthPort` interface with `verifyAccess()` method
2. **Use-Cases Layer**: Create `AuthPortTag` Context.Tag
3. **Adapters Layer**: Implement `SupabaseAuthGateway` with unified session + resource verification
4. **Frameworks Layer**: Wire auth Layer into DI composition
5. **Migration**: Update existing gateways to accept auth tokens and verify access

---

## Architecture Overview

### Solution Strategy and Key Decisions

This implementation uses **Clean Architecture with Effect Dependency Injection** to centralize authentication and authorization logic at the gateway layer while maintaining separation of concerns across layers.

**Key Decisions:**
1. **Unified Verification**: Single `verifyAccess()` method handles both session validation (JWT) and resource permission checks, avoiding separate calls and reducing complexity.
2. **Port Naming Convention**: Domain uses `IAuthPort` interface (I-prefix), use-cases use `AuthPortTag` class (Tag suffix) to avoid ESLint's `no-unsafe-declaration-merging` rule.
3. **Inference-First Return Types**: Gateway implementations rely on TypeScript inference from the interface rather than explicit return type annotations.
4. **Token as Parameter**: Auth token passed as method parameter (not stored in DI layer), allowing per-method flexibility for authenticated vs public operations.
5. **Phased Migration**: Gradual rollout starting with high-security operations (delete, update) before full gateway coverage.
6. **Effect Context Pattern**: Gateways access auth port via `yield* AuthPortTag` within `Effect.gen`, maintaining composability and testability.

### Component Overview

**Domain Layer (`packages/domain/`):**
- `IAuthPort` interface with session management and `verifyAccess()` method
- `AccessCheckRequest` type defining resource type, ID, and required permission
- `AuthSessionExpiredError`, `PermissionDeniedError`, `TokenMissingError` extending `Data.TaggedError`

**Use-Cases Layer (`packages/use-cases/`):**
- `AuthPortTag` Context.Tag for Effect dependency injection
- Provides type-safe access to `IAuthPort` within Effect workflows

**Adapters Layer (`packages/adapters/`):**
- `SupabaseAuthGateway` implementing `IAuthPort`
- Validates JWT tokens via Supabase Auth API
- Queries domain tables (trip_participants, group_members) for resource permissions
- Migration of existing gateways: `TripDrizzleGateway`, `UserDrizzleGateway`, `GroupDrizzleGateway`, `ChallengeDrizzleGateway`

**Frameworks Layer (`packages/frameworks/`):**
- `makeAuthLayer(supabase)` function returning `Layer.succeed(AuthPortTag, SupabaseAuthGateway)`
- Integration into `makeAppLayer()` via `Layer.mergeAll(authLayer, repoLayer, serviceLayer)`
- Mock auth layer in `test.ts` for bypassing auth in tests

### Contracts and Interfaces

**IAuthPort Interface:**
```typescript
interface IAuthPort {
  // Session management (existing)
  signIn(credentials: Credentials): Effect<AuthSession, AuthError, never>;
  signOut(sessionId: string): Effect<void, AuthError, never>;
  getSession(token: string): Effect<AuthSession | null, AuthError, never>;
  
  // New unified verification
  verifyAccess(request: AccessCheckRequest): Effect<void, AuthError, never>;
}
```

**AccessCheckRequest:**
```typescript
interface AccessCheckRequest {
  token: string;
  resourceType: "trip" | "group" | "challenge" | "user" | "activity" | 
                "notification" | "reward" | "sponsor" | "coin" | "submission";
  resourceId: string;
  requiredPermission: "read" | "write" | "admin";
  requireOwnership?: boolean;
}
```

**Modified Gateway Signatures:**
```typescript
// Before
findById(id: TripId): Effect<Trip | null, IPortError, never>;

// After
findById(id: TripId, authToken: string): Effect<Trip | null, IPortError, never>;
```

### Data Flow

```
GraphQL Request → Resolver → Gateway → Auth Verification → Data Operation
     ↓              ↓           ↓             ↓                  ↓
  Extract        Pass     yield*      SupabaseAuth        Database
  Authorization  token    AuthPortTag Gateway             Query
  Header         via      from        ↓
                 ctx      context     1. Validate JWT
                 ↓                      via Supabase
              ctx.runWithAppLayer        Auth
                 ↓                      ↓
              Effect.gen             2. Check
              (effect)                permissions
                 ↓                      via domain
              yield* tripPort         tables
              yield* tripPort
              .findById(id, token)   ↓
                 ↓                   3. Return
              authPort             success/fail
              .verifyAccess({       ↓
                token,              Effect
                resourceType,       (void)
                resourceId,        or
                requiredPermission  AuthError
              })
```

**Detailed Flow:**
1. **GraphQL Resolver**: Extracts `Authorization` header and passes `accessToken` to context
2. **Resolver Logic**: Calls `ctx.runWithAppLayer(effect)` with `Effect.gen` workflow
3. **Gateway Access**: Resolvers yield `TripPortTag` (or other port) to get gateway instance
4. **Token Passing**: Gateway method receives `authToken` as parameter (e.g., `tripPort.findById(id, token)`)
5. **Auth Verification**: Within `Effect.gen`, gateway yields `AuthPortTag` and calls `authPort.verifyAccess()`
6. **Session Validation**: `SupabaseAuthGateway.verifyAccess()` validates JWT via Supabase Auth API
7. **Permission Check**: Queries domain tables (e.g., `trip_participants`) to verify user has required permission
8. **Outcome**: 
   - Success: Returns `Effect.succeed(void 0)`, gateway proceeds with data operation
   - Failure: Returns `Effect.fail(AuthError)`, error propagates through Effect chain
9. **Error Mapping**: Framework layer maps domain errors to GraphQL error codes (401/403)

### Integration Points

**GraphQL Context Integration:**
- `accessToken` extracted from `Authorization` header and stored in GraphQL context
- Context provides `runWithAppLayer(effect)` helper for executing Effect workflows with DI
- Controllers/resolvers pass token to gateway methods

**Error Mapping:**
- `AuthSessionExpiredError` → GraphQL UNAUTHENTICATED (401)
- `PermissionDeniedError` → GraphQL FORBIDDEN (403)
- `ResourceNotFoundError` → GraphQL NOT_FOUND (404) or FORBIDDEN (security through obscurity)

**Testing Integration:**
- Mock auth layer in `packages/frameworks/src/di/layer/test.ts`
- `Layer.succeed(AuthPortTag, { verifyAccess: () => Effect.succeed(void 0) })` for bypassing auth
- Integration tests use real auth layer with test Supabase instance

**DI Layer Composition:**
- `makeAppLayer()` merges `authLayer`, `repoLayer`, `serviceLayer` via `Layer.mergeAll()`
- Auth layer must be provided before gateways that depend on `AuthPortTag`

### Expected Changes

**Files to Create (3):**
| File | Purpose |
|------|---------|
| `packages/domain/src/auth/errors/AuthErrors.ts` | Auth-specific error classes |
| `packages/use-cases/src/auth/ports/AuthPort.ts` | AuthPortTag Context.Tag |
| `packages/frameworks/src/di/layer/auth.ts` | makeAuthLayer() function |

**Files to Modify - Core (6):**
| File | Change |
|------|--------|
| `packages/domain/src/shared/services/index.ts` | Add `verifyAccess()` to IAuthPort interface |
| `packages/domain/src/index.ts` | Export auth errors |
| `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts` | Implement `verifyAccess()` method |
| `packages/adapters/src/index.ts` | Export auth errors if needed |
| `packages/frameworks/src/di/layer/app.ts` | Integrate auth layer into makeAppLayer() |
| `packages/frameworks/src/di/index.ts` | Export makeAuthLayer |
| `packages/frameworks/src/di/layer/test.ts` | Add mock auth layer for testing |

**Files to Modify - Gateway Migration (4+):**
| File | Change |
|------|--------|
| `packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.ts` | Add authToken parameter to findById, create, update, delete |
| `packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts` | Add authToken parameter to CRUD methods |
| `packages/adapters/src/group/gateways/drizzle/GroupDrizzleGateway.ts` | Add authToken parameter |
| `packages/adapters/src/challenge/gateways/drizzle/ChallengeDrizzleGateway.ts` | Add authToken parameter |

**Interface Updates (Domain Layer):**
- `IAuthPort` adds `verifyAccess(request: AccessCheckRequest): Effect<void, AuthError, never>`
- `ITripPort`, `IUserPort`, `IGroupPort`, `IChallengePort` add `authToken: string` parameter to protected methods

---

## Acceptance Criteria

### Functional Requirements

1. **Domain Layer - AuthPort Interface**
   - [ ] **IAuthPort interface exists**: Domain exports IAuthPort interface with verifyAccess method
     - Given: Domain module is imported
     - When: Checking exported interfaces
     - Then: IAuthPort is available with signature: `verifyAccess(token: string, resourceUserId: string): Effect<boolean, AuthError, never>`

2. **Domain Layer - Auth Errors**
   - [ ] **Auth error hierarchy exists**: Domain exports three auth error types extending Data.TaggedError
     - Given: Error types are imported from domain
     - When: Instantiating errors
     - Then: UnauthorizedError, ForbiddenError, and AuthServiceError are available with proper _tag fields

3. **Use-Cases Layer - DI Tag**
   - [ ] **AuthPortTag Context.Tag exists**: Use-cases exports AuthPortTag for Effect dependency injection
     - Given: Use-cases module is imported
     - When: Accessing Context.Tag exports
     - Then: AuthPortTag is available and can be used with `yield* AuthPortTag` in Effect.gen

4. **Adapters Layer - Gateway Implementation**
   - [ ] **SupabaseAuthGateway implements IAuthPort**: Gateway validates tokens via Supabase and checks resource ownership
     - Given: Valid JWT token and matching resource user ID
     - When: Calling verifyAccess(token, resourceUserId)
     - Then: Returns Effect.succeed(true)
     - Given: Invalid or expired token
     - When: Calling verifyAccess(token, resourceUserId)
     - Then: Returns Effect.fail(new UnauthorizedError({ ... }))
     - Given: Valid token but different resource owner
     - When: Calling verifyAccess(token, resourceUserId)
     - Then: Returns Effect.fail(new ForbiddenError({ ... }))

5. **Frameworks Layer - Layer Composition**
   - [ ] **makeAuthLayer() function exists**: Frameworks exports function that creates auth Layer
     - Given: Supabase client is configured
     - When: Calling makeAuthLayer({ supabase })
     - Then: Returns properly typed Layer that can be merged with app Layer

6. **DI Integration**
   - [ ] **Auth Layer integrated into app composition**: packages/frameworks/src/di/layer/app.ts includes auth Layer
     - Given: makeAppLayer is called with config
     - When: Layer composition is built
     - Then: Auth dependencies are available to all gateways via merged Layers

7. **Gateway Migration Pattern**
   - [ ] **Existing gateways accept auth token**: TripDrizzleGateway and UserDrizzleGateway accept optional authToken parameter
     - Given: Existing gateway method is called
     - When: Auth token is provided
     - Then: Gateway uses authPort.verifyAccess before executing database query
     - Given: Existing gateway method is called
     - When: No auth token provided
     - Then: Gateway skips auth check (for public operations)

8. **Error Propagation**
   - [ ] **Auth errors propagate correctly**: Failed auth verification returns domain errors, not generic errors
     - Given: Auth verification fails with invalid token
     - When: Effect is executed
     - Then: Either.isLeft returns true and left value is instance of UnauthorizedError

### Non-Functional Requirements

9. **Performance**
   - [ ] **Auth verification latency**: Auth check adds less than 50ms to request processing
     - Given: Valid token and resource
     - When: Measuring verifyAccess execution time
     - Then: Average latency is under 50ms (excluding network calls to Supabase)

10. **Security**
    - [ ] **Token security**: Tokens are never logged or exposed in error messages
      - Given: Auth failure occurs
      - When: Error is logged or returned
      - Then: Token value is not present in logs or error messages

11. **Testability**
    - [ ] **Mock auth layer**: Test utilities can provide mock auth that always succeeds/fails
      - Given: Testing a gateway method
      - When: Providing Layer.succeed(AuthPortTag, mockAuth)
      - Then: Gateway uses mock auth instead of real SupabaseAuthGateway

---

## Implementation Process

### Parallel Execution Directive

**Execution Strategy**: This implementation follows Clean Architecture layering with natural dependencies between layers. Most steps are sequential due to interface contracts (domain → use-cases → adapters → frameworks). However, gateway migrations are parallelizable once DI integration is complete.

**Max Parallel Depth**: 2  
**Parallel Groups**: Steps 10 and 11 (gateway migrations)  
**Agent Pool**: sdd:developer (opus, sonnet, haiku), code-review:bug-hunter, general

**Parallelization Flow**:
```
Setup (Seq)        Foundation (Seq)              Feature (Parallel)            Polish (Seq)
  ┌─────┐           ┌───────────┐                 ┌─────────┐              ┌─────────┐
  │Step1│ → Step2 → │Step4-8    │ → Step9 (opus) → │Step10   │ ════════════ │Step12   │ → 13 → 14
  │(h)  │   (h)      │(mixed)    │   DI Integration │(sonnet) │    Parallel  │(opus)   │
  └─────┘           └───────────┘                 └────┬────┘              └─────────┘
                                                         ║
                                                    Step11║(sonnet)
                                                    (parallel)

Legend: (h)=haiku, (s)=sonnet, (o)=opus, ══=parallel execution
```

---

### Setup Phase

#### Step 1: Project Setup & Analysis
**Agent**: haiku  
**Goal**: Analyze existing codebase structure and verify integration points  
**Output**: Documented understanding of current auth implementation and DI patterns  
**Acceptance Criteria**: N/A (preparatory)  
**Time Estimate**: Small (30-60 min)  
**Subtasks**:
- Read `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts` for existing structure
- Read `packages/frameworks/src/di/layer/app.ts` for current Layer composition
- Read `packages/domain/src/shared/services/index.ts` for IAuthPort location
- Verify existing error patterns in `packages/domain/src/shared/errors/`
- Check test patterns in `packages/frameworks/src/di/layer/test.ts`
**Blockers and Risks**: None
**Dependencies**: None
**Parallel with**: None

**Verification**:
- **Level**: MEDIUM
- **Rubric**:
  1. All 5 target files were read and analyzed (0.25)
  2. Existing auth implementation patterns documented (0.25)
  3. DI patterns and Layer composition understood (0.25)
  4. Integration points identified with specific file paths (0.25)
- **Threshold**: 4.0/5.0
- **How to verify**: Panel - Review analysis document for completeness

#### Step 2: Interface Design Validation
**Agent**: haiku  
**Goal**: Validate interface contracts against existing patterns  
**Output**: Confirmed interface signatures and type locations  
**Acceptance Criteria**: N/A (preparatory)  
**Time Estimate**: X-Small (10-30 min)  
**Subtasks**:
- Confirm IAuthPort extends existing service interfaces
- Verify AccessCheckRequest type structure matches resource models
- Check for naming conflicts with existing "Auth" exports
**Blockers and Risks**: Naming conflicts with existing auth exports
**Dependencies**: Step 1
**Parallel with**: None

**Verification**:
- **Level**: MEDIUM
- **Rubric**:
  1. IAuthPort interface signature confirmed and documented (0.3)
  2. AccessCheckRequest type structure validated (0.3)
  3. Naming conflicts identified and resolved (0.2)
  4. Interface contracts match existing port patterns (0.2)
- **Threshold**: 4.0/5.0
- **How to verify**: Panel - Review interface design document

#### Step 3: Test Infrastructure Setup
**Agent**: haiku  
**Goal**: Prepare test environment for auth testing  
**Output**: Test utilities ready for TDD workflow  
**Acceptance Criteria**: AC #11 (Mock auth layer) - partial  
**Time Estimate**: Small (30-60 min)  
**Subtasks**:
- Create test helper for mock auth port
- Verify Effect.either patterns in existing tests
- Document test patterns for auth failures
**Blockers and Risks**: None
**Dependencies**: Step 2
**Parallel with**: None

**Verification**:
- **Level**: MEDIUM
- **Rubric**:
  1. Mock auth port helper created and functional (0.3)
  2. Effect.either patterns documented for tests (0.25)
  3. Test patterns cover success and failure cases (0.25)
  4. Integration with existing test utilities verified (0.2)
- **Threshold**: 4.0/5.0
- **How to verify**: Panel - Review test utilities and documentation

### Foundational Components Phase

#### Step 4: Domain Layer - Auth Errors
**Agent**: sonnet  
**Goal**: Create auth-specific error hierarchy  
**Output**: `packages/domain/src/auth/errors/AuthErrors.ts` with three error types  
**Acceptance Criteria**: AC #2 (Auth error hierarchy)  
**Time Estimate**: Small (30-60 min)  
**Subtasks**:
- Create `packages/domain/src/auth/errors/AuthErrors.ts`
  - Define `AuthSessionExpiredError` extends Data.TaggedError
  - Define `PermissionDeniedError` extends Data.TaggedError
  - Define `TokenMissingError` extends Data.TaggedError
- Export errors from `packages/domain/src/index.ts`
- Add exports to `packages/domain/src/auth/index.ts` (create if needed)
**Blockers and Risks**: Naming conflicts with existing error exports
**Dependencies**: Step 3
**Parallel with**: None

**Verification**:
- **Level**: HIGH
- **Rubric**:
  1. AuthSessionExpiredError extends Data.TaggedError with correct _tag (0.25)
  2. PermissionDeniedError extends Data.TaggedError with correct _tag (0.25)
  3. TokenMissingError extends Data.TaggedError with correct _tag (0.25)
  4. All errors properly exported from domain index (0.15)
  5. Error types follow existing error patterns in codebase (0.1)
- **Threshold**: 4.5/5.0
- **How to verify**: Per-Item - Each error class reviewed individually

#### Step 5: Domain Layer - IAuthPort Interface
**Agent**: sonnet  
**Goal**: Define auth port interface with verifyAccess method  
**Output**: Updated `packages/domain/src/shared/services/index.ts` with IAuthPort  
**Acceptance Criteria**: AC #1 (IAuthPort interface)  
**Time Estimate**: Small (30-60 min)  
**Subtasks**:
- Define `AccessCheckRequest` type in `packages/domain/src/auth/types.ts` (create if needed)
- Add `verifyAccess(request: AccessCheckRequest): Effect<void, AuthError, never>` to IAuthPort
- Ensure IAuthPort follows existing port naming convention (I-prefix)
- Export from `packages/domain/src/index.ts`
**Blockers and Risks**: Interface signature changes require cascading updates
**Dependencies**: Step 4
**Parallel with**: None

**Verification**:
- **Level**: HIGH
- **Rubric**:
  1. AccessCheckRequest type defined with all required fields (0.25)
  2. verifyAccess method signature correct: Effect<void, AuthError, never> (0.3)
  3. IAuthPort interface exported from domain (0.2)
  4. Interface follows I-prefix naming convention (0.15)
  5. Resource type union includes all required types (0.1)
- **Threshold**: 4.5/5.0
- **How to verify**: Per-Item - Interface definition and type exports

#### Step 6: Use-Cases Layer - AuthPortTag
**Agent**: haiku  
**Goal**: Create Context.Tag for auth dependency injection  
**Output**: `packages/use-cases/src/auth/ports/AuthPort.ts`  
**Acceptance Criteria**: AC #3 (AuthPortTag Context.Tag)  
**Time Estimate**: X-Small (10-30 min)  
**Subtasks**:
- Create `packages/use-cases/src/auth/ports/AuthPort.ts`
  - Import IAuthPort from @mirai-app/domain
  - Define `AuthPortTag` class extending Context.Tag
- Export from `packages/use-cases/src/index.ts` via auth namespace
**Blockers and Risks**: Must avoid declaration merging (use Tag suffix, not same name as interface)
**Dependencies**: Step 5
**Parallel with**: None

**Verification**:
- **Level**: HIGH
- **Rubric**:
  1. AuthPortTag class extends Context.Tag with correct identifier (0.3)
  2. IAuthPort type properly imported from domain (0.2)
  3. Tag exported from use-cases index via auth namespace (0.25)
  4. No declaration merging with IAuthPort interface (0.15)
  5. Can be used with yield* AuthPortTag in Effect.gen (0.1)
- **Threshold**: 4.5/5.0
- **How to verify**: Per-Item - Context.Tag definition and export

#### Step 7: Adapters Layer - SupabaseAuthGateway Implementation
**Agent**: opus  
**Goal**: Implement IAuthPort with verifyAccess method  
**Output**: Updated `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts`  
**Acceptance Criteria**: AC #4 (Gateway implementation)  
**Time Estimate**: Medium (1-4 hours)  
**Subtasks**:
- Import IAuthPort and AccessCheckRequest from @mirai-app/domain
- Import AuthPortTag from @mirai-app/use-cases
- Implement `verifyAccess(request: AccessCheckRequest): Effect<void, AuthError, never>`
  - Validate JWT via Supabase Auth API (use existing supabase client)
  - Query resource tables (trip_participants, group_members) for ownership
  - Return Effect.succeed(void 0) on success
  - Return Effect.fail with appropriate error type on failure
- Update `packages/adapters/src/index.ts` if needed
**Blockers and Risks**: 
- Supabase client configuration dependencies
- Database query patterns for permission checks
**Dependencies**: Step 6
**Parallel with**: None

**Verification**:
- **Level**: HIGH
- **Rubric**:
  1. verifyAccess validates JWT via Supabase Auth API (0.25)
  2. Resource ownership checked via domain tables (0.25)
  3. Returns Effect.succeed(void 0) on success (0.15)
  4. Returns appropriate AuthError on failure (0.2)
  5. Supabase client properly injected/configured (0.15)
- **Threshold**: 4.5/5.0
- **How to verify**: Per-Item - verifyAccess implementation code review

#### Step 8: Frameworks Layer - makeAuthLayer()
**Agent**: haiku  
**Goal**: Create Layer composition function for auth  
**Output**: `packages/frameworks/src/di/layer/auth.ts`  
**Acceptance Criteria**: AC #5 (makeAuthLayer function)  
**Time Estimate**: Small (30-60 min)  
**Subtasks**:
- Create `packages/frameworks/src/di/layer/auth.ts`
  - Import AuthPortTag from @mirai-app/use-cases
  - Import SupabaseAuthGateway from @mirai-app/adapters
  - Export `makeAuthLayer({ supabase })` returning `Layer.succeed(AuthPortTag, gateway)`
- Export from `packages/frameworks/src/di/index.ts`
- Export from `packages/frameworks/src/di/layer/index.ts`
**Blockers and Risks**: Type inference must match expected Layer type
**Dependencies**: Step 7
**Parallel with**: None

**Verification**:
- **Level**: MEDIUM
- **Rubric**:
  1. makeAuthLayer function exported from di layer (0.25)
  2. Function returns Layer.succeed with correct types (0.25)
  3. SupabaseAuthGateway properly instantiated (0.2)
  4. Exported from frameworks di index (0.15)
  5. Type inference matches expected Layer<AuthPortTag> (0.15)
- **Threshold**: 4.0/5.0
- **How to verify**: Panel - Layer composition structure review

### User Stories/Feature Phase

#### Step 9: DI Integration - App Layer Composition
**Agent**: opus  
**Goal**: Integrate auth Layer into application DI composition  
**Output**: Updated app.ts with auth Layer merged, updated test.ts with mock  
**Acceptance Criteria**: AC #6 (Auth Layer integrated), AC #11 (Mock auth layer)  
**Time Estimate**: Medium (1-4 hours)  
**Subtasks**:
- Update `packages/frameworks/src/di/layer/app.ts`
  - Import `makeAuthLayer` from `./auth`
  - Modify `makeAppLayer()` to call `makeAuthLayer({ supabase })`
  - Add `authLayer` to `Layer.mergeAll(authLayer, repoLayer, serviceLayer)`
  - Ensure correct Layer ordering (auth before repos that use it)
- Update `packages/frameworks/src/di/layer/test.ts`
  - Create mock auth layer: `Layer.succeed(AuthPortTag, { verifyAccess: () => Effect.succeed(void 0) })`
  - Export mock for testing
- Run type checks: `bun tsc --noEmit`
**Blockers and Risks**: 
- Circular dependency if auth Layer depends on repos
- Layer ordering affects dependency resolution
**Dependencies**: Step 8
**Parallel with**: None

**Verification**:
- **Level**: HIGH
- **Rubric**:
  1. makeAuthLayer called in makeAppLayer with correct config (0.2)
  2. authLayer merged with repoLayer and serviceLayer (0.25)
  3. Layer ordering prevents circular dependencies (0.2)
  4. Mock auth layer created in test.ts (0.2)
  5. Type checks pass: bun tsc --noEmit (0.15)
- **Threshold**: 4.5/5.0
- **How to verify**: Per-Item - Layer merge configuration and test mock

#### Step 10: Gateway Migration - TripDrizzleGateway
**Agent**: sonnet  
**Goal**: Add auth protection to TripDrizzleGateway  
**Output**: Updated TripDrizzleGateway with optional authToken parameter and verifyAccess calls  
**Acceptance Criteria**: AC #7 (Gateway migration pattern)  
**Time Estimate**: Medium (1-4 hours)  
**Subtasks**:
- Update `packages/use-cases/src/trip/ports/TripPort.ts` (ITripPort interface)
  - Add optional `authToken?: string` to protected methods (findById, create, update, delete)
- Update `packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.ts`
  - Import AuthPortTag from @mirai-app/use-cases
  - Add `authToken?: string` parameter to CRUD methods
  - Add `Effect.gen` blocks with `yield* AuthPortTag` for auth verification
  - Call `authPort.verifyAccess()` before database operations when token provided
  - Skip auth check when token is undefined (public operations)
- Update any GraphQL resolvers in `apps/backend-server/` that call TripPort
**Blockers and Risks**: 
- Resolvers may need updates to pass token from context
- Breaking change if authToken not made optional
**Dependencies**: Step 9
**Parallel with**: [Step 11]

**Verification**:
- **Level**: MEDIUM
- **Rubric**:
  1. ITripPort interface updated with optional authToken (0.2)
  2. TripDrizzleGateway CRUD methods accept authToken parameter (0.25)
  3. Auth verification called via yield* AuthPortTag (0.25)
  4. Auth skipped when token undefined (backward compat) (0.2)
  5. GraphQL resolvers updated to pass token from context (0.1)
- **Threshold**: 4.0/5.0
- **How to verify**: Per-Item - Each CRUD method reviewed

#### Step 11: Gateway Migration - UserDrizzleGateway
**Agent**: sonnet  
**Goal**: Add auth protection to UserDrizzleGateway  
**Output**: Updated UserDrizzleGateway with optional authToken parameter and verifyAccess calls  
**Acceptance Criteria**: AC #7 (Gateway migration pattern)  
**Time Estimate**: Medium (1-4 hours)  
**Subtasks**:
- Update `packages/use-cases/src/user/ports/UserPort.ts` (IUserPort interface)
  - Add optional `authToken?: string` to protected methods
- Update `packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts`
  - Import AuthPortTag from @mirai-app/use-cases
  - Add `authToken?: string` parameter to CRUD methods
  - Add auth verification logic same pattern as TripDrizzleGateway
- Update GraphQL resolvers in `apps/backend-server/` that call UserPort
**Blockers and Risks**: Same as Step 10
**Dependencies**: Step 9
**Parallel with**: [Step 10]

**Verification**:
- **Level**: MEDIUM
- **Rubric**:
  1. IUserPort interface updated with optional authToken (0.2)
  2. UserDrizzleGateway CRUD methods accept authToken parameter (0.25)
  3. Auth verification called via yield* AuthPortTag (0.25)
  4. Auth skipped when token undefined (backward compat) (0.2)
  5. GraphQL resolvers updated to pass token from context (0.1)
- **Threshold**: 4.0/5.0
- **How to verify**: Per-Item - Each CRUD method reviewed

### Polish Phase

#### Step 12: Error Propagation & Testing
**Agent**: opus  
**Goal**: Verify auth errors propagate correctly and add comprehensive tests  
**Output**: Unit tests for SupabaseAuthGateway, integration tests for Layer, passing AC #8  
**Acceptance Criteria**: AC #8 (Error propagation)  
**Time Estimate**: Medium (1-4 hours)  
**Subtasks**:
- Create unit tests for `SupabaseAuthGateway`
  - Mock Supabase client
  - Test verifyAccess success case
  - Test verifyAccess with invalid token (UnauthorizedError)
  - Test verifyAccess with wrong owner (PermissionDeniedError)
  - Use Effect.either with Either.isLeft/Either.isRight assertions
- Create integration tests for auth Layer
  - Test Layer composition in makeAppLayer
  - Test mock auth layer in test utilities
- Verify error types are correctly identified using `instanceof` checks
**Blockers and Risks**: 
- Supabase mocking complexity
- Effect testing patterns must be followed
**Dependencies**: Steps 10, 11
**Parallel with**: None

**Verification**:
- **Level**: HIGH
- **Rubric**:
  1. Unit tests for SupabaseAuthGateway with mocked client (0.2)
  2. Test verifyAccess success case passes (0.15)
  3. Test verifyAccess with invalid token returns UnauthorizedError (0.2)
  4. Test verifyAccess with wrong owner returns PermissionDeniedError (0.2)
  5. Effect.either with Either.isLeft/isRight assertions used (0.15)
  6. Integration tests for Layer composition pass (0.1)
- **Threshold**: 4.5/5.0
- **How to verify**: Per-Item - Each test case execution

#### Step 13: Performance & Security Validation
**Agent**: haiku  
**Goal**: Validate performance and security requirements  
**Output**: Performance benchmarks, security audit confirmation  
**Acceptance Criteria**: AC #9 (Performance), AC #10 (Token security)  
**Time Estimate**: Small (30-60 min)  
**Subtasks**:
- Measure verifyAccess latency (add timing logs, verify < 50ms)
- Audit code for token logging:
  - Check error messages don't include token
  - Check logs don't include token
  - Verify AccessCheckRequest.toString() doesn't expose token
- Review SupabaseAuthGateway for security best practices
**Blockers and Risks**: Latency may depend on Supabase network calls
**Dependencies**: Step 12
**Parallel with**: None

**Verification**:
- **Level**: HIGH
- **Rubric**:
  1. verifyAccess latency measured under 50ms average (0.25)
  2. Error messages do not include token values (0.25)
  3. Logs do not include token values (0.25)
  4. AccessCheckRequest.toString() does not expose token (0.15)
  5. Security best practices followed in implementation (0.1)
- **Threshold**: 4.5/5.0
- **How to verify**: Panel - Security audit and performance measurement

#### Step 14: Documentation & Final Review
**Agent**: haiku  
**Goal**: Complete documentation and final quality checks  
**Output**: Updated AGENTS.md, migration guide, code review ready  
**Acceptance Criteria**: All remaining documentation in original DoD  
**Time Estimate**: Small (30-60 min)  
**Subtasks**:
- Update `AGENTS.md` with auth patterns
  - Add section for gateway-level auth protection
  - Document migration pattern for existing gateways
  - Include examples of Effect.gen with AuthPortTag
- Create migration guide for other gateways (Group, Challenge, etc.)
- Run full test suite: `bun test`
- Run lint: `bun lint`
- Verify no breaking changes to public APIs
**Blockers and Risks**: None
**Dependencies**: Steps 12, 13
**Parallel with**: None

**Verification**:
- **Level**: LOW
- **Rubric**:
  1. AGENTS.md updated with auth patterns section (0.3)
  2. Migration guide created for other gateways (0.25)
  3. Full test suite passes: bun test (0.2)
  4. Lint passes: bun lint (0.15)
  5. No breaking changes to public APIs (0.1)
- **Threshold**: 4.0/5.0
- **How to verify**: Panel - Documentation review and CI checks

---

## Verification Summary

| Step | Description | Level | Threshold | How to Verify |
|------|-------------|-------|-----------|---------------|
| 1 | Project Setup & Analysis | MEDIUM | 4.0/5.0 | Panel |
| 2 | Interface Design Validation | MEDIUM | 4.0/5.0 | Panel |
| 3 | Test Infrastructure Setup | MEDIUM | 4.0/5.0 | Panel |
| 4 | Domain Layer - Auth Errors | HIGH | 4.5/5.0 | Per-Item |
| 5 | Domain Layer - IAuthPort Interface | HIGH | 4.5/5.0 | Per-Item |
| 6 | Use-Cases Layer - AuthPortTag | HIGH | 4.5/5.0 | Per-Item |
| 7 | Adapters Layer - SupabaseAuthGateway | HIGH | 4.5/5.0 | Per-Item |
| 8 | Frameworks Layer - makeAuthLayer() | MEDIUM | 4.0/5.0 | Panel |
| 9 | DI Integration - App Layer Composition | HIGH | 4.5/5.0 | Per-Item |
| 10 | Gateway Migration - TripDrizzleGateway | MEDIUM | 4.0/5.0 | Per-Item |
| 11 | Gateway Migration - UserDrizzleGateway | MEDIUM | 4.0/5.0 | Per-Item |
| 12 | Error Propagation & Testing | HIGH | 4.5/5.0 | Per-Item |
| 13 | Performance & Security Validation | HIGH | 4.5/5.0 | Panel |
| 14 | Documentation & Final Review | LOW | 4.0/5.0 | Panel |

**Summary by Level**:
- **HIGH** (7 steps): Steps 4, 5, 6, 7, 9, 12, 13 - Core auth infrastructure and security
- **MEDIUM** (6 steps): Steps 1, 2, 3, 8, 10, 11 - Setup, validation, and migrations
- **LOW** (1 step): Step 14 - Documentation polish

---

### Parallelization Summary

```
Execution Timeline:
─────────────────────────────────────────────────────────────────────────────

Setup Phase:        [1:h][2:h][3:h]
                    30m  20m  40m
                    ─────────────────────────────────────────────────────────►

Foundation Phase:                    [4:s][5:s][6:h][7:o][8:h]
                                     45m  45m  15m  2h   45m
                    ─────────────────────────────────────────────────────────►

Feature Phase:                                                      [9:o]
                                                                    DI Int
                                                                    2h
                    ─────────────────────────────────────────────────────────►
                                                                     │
                                                                     ↓
                                                          [10:s] ═════════ [11:s]
                                                          TripGW         UserGW
                                                          2h             2h
                                                          ─────────────────────►
                                                                     │
                                                                     ↓
Polish Phase:                                           [12:o][13:h][14:h]
                                                        Test  Perf  Docs
                                                        2h    40m   40m
                    ─────────────────────────────────────────────────────────►

Parallel Depth: 2 (Steps 10 & 11)
Total Sequential Path: 1→2→3→4→5→6→7→8→9→(10|11)→12→13→14 ≈ 10 hours
Total Wall Clock (with parallel): ≈ 8 hours

Legend: [N:agent] where agent is h=haiku, s=sonnet, o=opus
        ════════ = parallel execution block
```

---

## Definition of Done

### Technical Completion
- [ ] All 14 implementation steps completed
- [ ] All 11 acceptance criteria (AC #1-11) pass
- [ ] Unit tests for SupabaseAuthGateway with mocked Supabase client
- [ ] Integration tests for auth Layer composition
- [ ] Migration example for TripDrizzleGateway and UserDrizzleGateway
- [ ] No breaking changes to existing public APIs (backward compatible)
- [ ] `bun test` passes (all tests green)
- [ ] `bun tsc --noEmit` passes (no type errors)
- [ ] `bun lint` passes (no lint errors)

### Documentation
- [ ] AGENTS.md updated with gateway auth protection patterns
- [ ] Migration guide created for other gateways
- [ ] Code comments for non-obvious auth logic (business rationale)

### Quality Gates
- [ ] Code reviewed and approved
- [ ] Performance validation: auth latency < 50ms
- [ ] Security audit: tokens never logged or exposed
- [ ] Effect patterns followed (Effect.gen, yield*, Context.Tag)
- [ ] Clean Architecture layering respected

### Files Summary
**Created (3)**:
1. `packages/domain/src/auth/errors/AuthErrors.ts`
2. `packages/use-cases/src/auth/ports/AuthPort.ts`
3. `packages/frameworks/src/di/layer/auth.ts`

**Modified (11)**:
1. `packages/domain/src/shared/services/index.ts`
2. `packages/domain/src/index.ts`
3. `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts`
4. `packages/adapters/src/index.ts`
5. `packages/frameworks/src/di/layer/app.ts`
6. `packages/frameworks/src/di/index.ts`
7. `packages/frameworks/src/di/layer/test.ts`
8. `packages/use-cases/src/trip/ports/TripPort.ts`
9. `packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.ts`
10. `packages/use-cases/src/user/ports/UserPort.ts`
11. `packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts`

**GraphQL Resolvers (TBD during migration)**:
- Resolvers in `apps/backend-server/` that use TripPort and UserPort

---

## Appendix: Implementation Notes

### Layer Ordering Principle
In `makeAppLayer()`, Layers are merged with `Layer.mergeAll(authLayer, repoLayer, serviceLayer)`. The authLayer must come first in the merge list when repositories depend on it, but Effect's Layer.mergeAll is commutative - order doesn't affect resolution. However, for clarity and to match dependency graph visualization, authLayer should be first.

### Optional Token Strategy
The authToken parameter is optional (`authToken?: string`) to maintain backward compatibility during migration. Gateways skip auth verification when token is undefined, allowing gradual migration of resolvers to pass the token.

### Error Type Testing Pattern
```typescript
const either = await Effect.runPromise(Effect.either(effect));
expect(Either.isLeft(either)).toBe(true);
if (Either.isLeft(either)) {
  expect(either.left).toBeInstanceOf(UnauthorizedError);
}
```

### Migration Priority
1. High-risk operations first: delete, update (write operations)
2. Read operations with sensitive data: findById with full details
3. List operations: may need different auth pattern (filter by ownership)
4. Public operations: explicitly skip auth

