# Analysis: Move tRPC middleware and context to higher DDD layers

**Task**: Move tRPC middleware and context to higher DDD layers  
**Analysis Date**: 2026-04-09  
**Analyst**: sdd:code-explorer

---

## Executive Summary

This analysis identifies all tRPC middleware usage, context definitions, and cross-cutting concerns that need to be migrated from the tRPC/Adapter layer to higher DDD layers (Use Cases and Domain). The primary goal is to move authentication, authorization, and logging logic out of tRPC middleware and into the Clean Architecture layers.

---

## 1. Current State Analysis

### 1.1 Middleware Inventory

| Middleware            | Location              | Purpose                                        | Target Layer           |
| --------------------- | --------------------- | ---------------------------------------------- | ---------------------- |
| `mobileAppMiddleware` | `api/trpc.ts:335-376` | Telemetry/logging (User-Agent, platform)       | Use Case (LoggerPort)  |
| `protectedProcedure`  | `api/trpc.ts:422-442` | Authentication (token validation, user lookup) | Use Case (AuthService) |
| `adminProcedure`      | `api/trpc.ts:477-498` | Admin authorization (role check)               | Use Case (AuthService) |
| `moderatorProcedure`  | `api/trpc.ts:452-473` | Moderator authorization (role check)           | Use Case (AuthService) |

### 1.2 Context Definitions

**TRPCContext** (`api/trpc.ts:189-208`):

```typescript
interface TRPCContext {
  db: PrismaClient; // Infrastructure
  supabase: SupabaseClient; // Infrastructure
  headers: Headers; // HTTP-specific
  accessToken: string | null; // Auth data
  di: DIContext; // DI container
}
```

**DIContext** (`api/trpc.ts:154-187`):

```typescript
interface DIContext {
  container: AwilixContainer;
  resolve: <T>(token: string) => T;
  scope: RequestScope;
}
```

### 1.3 Context Propagation Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. backend-server/src/server.ts                              │
│    - Fastify server initialization                            │
│    - DI container initialization (AppModule)                  │
│    - tRPC plugin registration with createContext callback     │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. adapters/src/api/trpc.ts:createTRPCContext()               │
│    - Extract headers and accessToken                        │
│    - Create PrismaClient and SupabaseClient                   │
│    - Create request-scoped DI container                       │
│    - Return TRPCContext with DIContext                        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. tRPC Procedure Middleware                                  │
│    - protectedProcedure: Validates token, adds user/dbUser    │
│    - adminProcedure: Checks role === "ADMIN"                   │
│    - moderatorProcedure: Checks role === MODERATOR/ADMIN      │
│    - mobileAppMiddleware: Logs telemetry to database          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Controller Resolution                                      │
│    - Controller = ctx.di.resolve("xxxController")            │
│    - Controller receives all dependencies via DI              │
│    - Controller calls use cases                               │
└──────────────────────────────────────────────────────────────┘
```

### 1.4 Cross-Cutting Concerns

| Concern                   | Current Location         | Current Implementation                                     | Proposed Location                              |
| ------------------------- | ------------------------ | ---------------------------------------------------------- | ---------------------------------------------- |
| Authentication            | `api/trpc.ts`            | `protectedProcedure` middleware calls `requireAuth()`      | Use Case: `AuthenticateUserUseCase`            |
| Authorization (Admin)     | `api/trpc.ts`            | `adminProcedure` middleware calls `requireAdmin()`         | Use Case: `RequireAdminRoleUseCase`            |
| Authorization (Moderator) | `api/trpc.ts`            | `moderatorProcedure` middleware calls `requireModerator()` | Use Case: `RequireModeratorRoleUseCase`        |
| Telemetry                 | `api/trpc.ts`            | `mobileAppMiddleware` logs to `ctx.db.userAgent`           | Use Case: `LogTelemetryUseCase` via LoggerPort |
| Request ID                | `frameworks/di/scope.ts` | `createRequestScope()` generates ID                        | Already in correct layer (frameworks)          |

---

## 2. Files Requiring Modification

### 2.1 Core Files (Create/Modify)

| File                                                       | Action     | Lines    | Purpose                              |
| ---------------------------------------------------------- | ---------- | -------- | ------------------------------------ |
| `packages/use-cases/src/ports/AuthPort.ts`                 | **CREATE** | ~30      | Port interface for auth operations   |
| `packages/use-cases/src/services/AuthService.ts`           | **CREATE** | ~150     | Auth logic migrated from middleware  |
| `packages/use-cases/src/interactors/AuthenticateUser.ts`   | **CREATE** | ~50      | Use case for authentication          |
| `packages/use-cases/src/interactors/AuthorizeAdmin.ts`     | **CREATE** | ~40      | Use case for admin authorization     |
| `packages/use-cases/src/interactors/AuthorizeModerator.ts` | **CREATE** | ~40      | Use case for moderator authorization |
| `packages/use-cases/src/ports/TelemetryPort.ts`            | **CREATE** | ~20      | Port for telemetry/logging           |
| `packages/adapters/src/api/trpc.ts`                        | **MODIFY** | -100/+50 | Remove middleware logic, keep wiring |
| `packages/adapters/src/controllers/auth/authServer.ts`     | **MODIFY** | -200/+50 | Deprecate; redirect to use cases     |

### 2.2 Router Files (19 files - Update imports if needed)

All files in `packages/adapters/src/api/routers/`:

1. `activityFeed.ts`
2. `challenge.ts`
3. `challengeSubmission.ts`
4. `challengeVote.ts`
5. `challengeVote.ts`
6. `coin.ts`
7. `coinTransaction.ts`
8. `group.ts`
9. `location.ts`
10. `notificationDelivery.ts`
11. `notificationSchedule.ts`
12. `notificationSender.ts`
13. `notifications.ts`
14. `reward.ts`
15. `sponsor.ts`
16. `storage.ts`
17. `submissionReport.ts`
18. `trip.ts`
19. `user.ts`
20. `root.ts` (router composition)

### 2.3 API Controller Wrappers (20 files - Context access)

All files in `packages/adapters/src/api/controllers/` use `ctx.di.resolve()`. These will need:

- Continue using `ctx.di` for controller resolution (no change needed)
- Controllers may receive additional auth context via DI

### 2.4 Test Files (14+ files requiring updates)

| File                                                                  | Updates Needed                 |
| --------------------------------------------------------------------- | ------------------------------ |
| `packages/adapters/src/api/routers/__tests__/*.test.ts`               | 14 files - Mock auth use cases |
| `packages/adapters/src/controllers/auth/__tests__/authServer.test.ts` | Redirect to use case tests     |
| `packages/use-cases/src/interactors/__tests__/*Auth*.test.ts`         | **CREATE** - New test files    |

### 2.5 DI Module Files (Update for new use cases)

| File                                                | Updates Needed              |
| --------------------------------------------------- | --------------------------- |
| `packages/adapters/src/modules/UseCaseModule.ts`    | Register new auth use cases |
| `packages/adapters/src/modules/ControllerModule.ts` | May need auth dependencies  |
| `packages/frameworks/src/di/AppModule.ts`           | Wire new auth module        |

---

## 3. Dependencies Between Framework and Domain Layers

### 3.1 Current Layer Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                     FRAMEWORKS LAYER                          │
│  (should only provide infrastructure, not business logic)   │
├──────────────────────────────────────────────────────────────┤
│  • PrismaClient (db)                                          │
│  • SupabaseClient                                             │
│  • DI Container (awilix)                                      │
│  • tRPC server configuration                                  │
│  ❌ Auth logic (currently here in server.ts)                 │
│  ❌ Authorization logic (currently here in server.ts)          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      ADAPTERS LAYER                           │
│  (should only adapt, not contain business logic)              │
├──────────────────────────────────────────────────────────────┤
│  • tRPC routers (thin)                                        │
│  • tRPC controllers (wrappers)                                  │
│  • Repository implementations (Prisma)                        │
│  ❌ Authentication middleware (currently here in trpc.ts)    │
│  ❌ Authorization middleware (currently here in trpc.ts)     │
│  ❌ Telemetry middleware (currently here in trpc.ts)         │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    USE CASES LAYER                            │
│  (should orchestrate business workflows)                      │
├──────────────────────────────────────────────────────────────┤
│  ⚠️  Missing: Auth use cases (needs to be created)            │
│  ⚠️  Missing: Telemetry use case (needs to be created)       │
│  • Existing use cases for domain operations                   │
│  • Ports (interfaces) for external services                   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                            │
│  (pure business logic - no external dependencies)             │
├──────────────────────────────────────────────────────────────┤
│  • Entities                                                   │
│  • Value Objects                                              │
│  • Domain Services                                            │
│  ⚠️  Missing: AuthContext value object (needs to be created) │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Violations Found

1. **Auth Logic in Adapter Layer**: `protectedProcedure` contains authentication logic that should be in Use Cases
2. **Role Checking in Adapter Layer**: `adminProcedure` and `moderatorProcedure` contain authorization logic
3. **Telemetry in Adapter Layer**: `mobileAppMiddleware` directly writes to database instead of using a port
4. **Context Pollution**: `TRPCContext` mixes HTTP concerns (headers) with business concerns (accessToken)

---

## 4. Proposed Architecture Changes

### 4.1 New Domain Layer Component

```typescript
// packages/domain/src/value-objects/AuthContext.ts
class AuthContext {
  readonly userId: string;
  readonly authUserId: string;
  readonly email: string | null;
  readonly role: UserRole;
  readonly accessToken: string;
  readonly isAuthenticated: boolean;
}
```

### 4.2 New Use Cases Layer Components

```typescript
// packages/use-cases/src/ports/AuthPort.ts
interface AuthPort {
  validateToken(token: string): Promise<AuthUser | null>;
  checkRole(userId: string, requiredRole: Role): Promise<boolean>;
}

// packages/use-cases/src/interactors/AuthenticateUser.ts
class AuthenticateUserUseCase {
  constructor(private authPort: AuthPort) {}
  execute(token: string): Either<AuthError, AuthContext>;
}

// packages/use-cases/src/interactors/AuthorizeAdmin.ts
class AuthorizeAdminUseCase {
  constructor(private authPort: AuthPort) {}
  execute(userId: string): Either<AuthorizationError, void>;
}
```

### 4.3 Modified Adapter Layer

```typescript
// packages/adapters/src/api/trpc.ts (simplified)
// Instead of inline auth logic:
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const authUseCase =
    ctx.di.resolve<AuthenticateUserUseCase>("authenticateUser");
  const result = await Effect.runPromise(authUseCase.execute(ctx.accessToken!));

  if (Either.isLeft(result)) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      authContext: result.right, // Pass AuthContext to downstream
    },
  });
});
```

---

## 5. Risk Assessment

### 5.1 Risk Level: **HIGH**

| Risk Factor                | Impact                     | Likelihood | Mitigation                           |
| -------------------------- | -------------------------- | ---------- | ------------------------------------ |
| Authentication breakage    | Critical (blocks all API)  | Low        | Comprehensive tests, staged rollout  |
| Context shape changes      | High (affects 156+ usages) | Medium     | Maintain backward compatibility      |
| DI container wiring issues | High                       | Low        | Test container resolution thoroughly |
| Test coverage gaps         | Medium                     | Medium     | Add tests before migration           |
| Role authorization bugs    | High                       | Medium     | Explicit role testing per endpoint   |

### 5.2 Rollback Strategy

- Keep original middleware implementations as `protectedProcedureLegacy`
- Feature flag for new auth pattern
- Gradual migration: one router at a time
- Monitoring: alert on auth error rate spikes

---

## 6. Key Integration Points

### 6.1 Integration Point 1: DI Container Request Scope

**Current**: `createRequestScope()` creates container with `userContext: null` (populated later by middleware)

**Proposed**: `createRequestScope()` should accept optional `authContext` upfront or use lazy resolution

**File**: `packages/frameworks/src/di/scope.ts`

**Challenge**: Request scope is created before authentication happens (chicken-and-egg problem)

**Solution**:

- Option A: Keep auth resolution in middleware, but delegate to use case instead of inline logic
- Option B: Create auth context early in request lifecycle, before DI scope creation

### 6.2 Integration Point 2: tRPC Procedure to Use Case Delegation

**Current**: Middleware contains inline auth logic

**Proposed**: Middleware delegates to use cases via DI

**Pattern**:

```typescript
// Middleware (Adapter layer) - thin wrapper
const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const useCase = ctx.di.resolve<AuthenticateUserUseCase>("authenticateUser");
  const result = await useCase.execute(ctx.accessToken);
  // ... handle result
});

// Use Case (Use Cases layer) - contains business logic
class AuthenticateUserUseCase {
  execute(token: string): Either<AuthError, AuthContext> {
    // All auth logic here
  }
}
```

### 6.3 Integration Point 3: Backward Compatibility for Controllers

**Current**: Controllers receive dependencies via DI, auth is already validated by middleware

**Proposed**: Controllers continue receiving dependencies via DI; auth context may be added as parameter

**Pattern**:

```typescript
// Current - auth is implicit (already validated)
class UserController {
  async getById(input: { id: string }): Promise<ControllerResult<User>>;
}

// Proposed - auth context explicitly available if needed
class UserController {
  async getById(
    input: { id: string },
    authContext?: AuthContext, // Optional - for audit/logging
  ): Promise<ControllerResult<User>>;
}
```

---

## 7. Migration Strategy

### Phase 1: Foundation (Low Risk)

1. Create domain `AuthContext` value object
2. Create `AuthPort` interface in use-cases
3. Create `AuthenticateUserUseCase` with tests
4. Keep existing middleware, add delegation to use case

### Phase 2: Authorization (Medium Risk)

1. Create `AuthorizeAdminUseCase` and `AuthorizeModeratorUseCase`
2. Migrate `adminProcedure` and `moderatorProcedure` to delegate to use cases
3. Comprehensive role-based testing

### Phase 3: Telemetry (Low Risk)

1. Create `TelemetryPort` interface
2. Create `LogTelemetryUseCase`
3. Migrate `mobileAppMiddleware` to use case

### Phase 4: Context Cleanup (Medium Risk)

1. Remove deprecated context fields from TRPCContext
2. Deprecate `authServer.ts` functions
3. Update documentation

---

## 8. File Count Summary

| Category                 | Count   | Action                                    |
| ------------------------ | ------- | ----------------------------------------- |
| Core files to modify     | 2       | `trpc.ts`, `authServer.ts`                |
| New files to create      | 7+      | Auth use cases, ports, domain objects     |
| Router files affected    | 19      | Import/procedure updates                  |
| API controller wrappers  | 20      | Context access pattern (no change needed) |
| Test files to update     | 14+     | Mock updates, new tests                   |
| DI module files          | 3       | Register new use cases                    |
| **Total Files Affected** | **~65** |                                           |

---

## 9. Conclusion

The tRPC middleware and context currently contain business logic (authentication, authorization, telemetry) that violates Clean Architecture principles by residing in the Adapter layer. This analysis identified:

1. **4 middleware components** that need migration to Use Cases
2. **156+ procedure usages** across 19 router files
3. **Context pollution** mixing HTTP and business concerns
4. **65+ files** requiring modification
5. **HIGH risk** due to authentication being critical path

**Recommended Approach**: Incremental migration with backward compatibility, starting with authentication use case creation, then gradually migrating each middleware component while maintaining comprehensive test coverage.
