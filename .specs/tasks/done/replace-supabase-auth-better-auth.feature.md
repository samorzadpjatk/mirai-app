---
title: Replace Supabase Auth with Better Auth in Clean Architecture
depends_on: []
---

## Initial User Prompt

I want to replace Supabase Auth with Better Auth in a Clean Architecture fashion

## Description

This task involves migrating the authentication system from Supabase Auth to Better Auth while strictly adhering to Clean Architecture principles. The primary business driver is reducing vendor lock-in and establishing a more flexible, maintainable authentication infrastructure that can adapt to future requirements without significant architectural changes.

The migration must maintain all existing authentication functionality including user registration, login, logout, password reset, session management, and any OAuth provider integrations currently in use. All existing user accounts, credentials, and active sessions must remain functional throughout and after the migration process.

The implementation follows Clean Architecture boundaries: Better Auth integration is contained exclusively within the Adapter layer, with the Domain layer defining interfaces and the Use Case layer orchestrating authentication flows through those interfaces. This approach ensures that business logic remains independent of the specific authentication technology, enabling future provider changes with minimal impact.

The migration requires careful planning for data compatibility (user records, password hashes, sessions) and comprehensive testing across all layers to ensure no regression in security or functionality.

**Scope**:
- Included: Better Auth gateway implementation in Adapter layer, Domain layer interface updates (if required), Use Case layer adaptation to new gateway, User data and credentials migration, Session management replacement, All existing auth flow implementations, Comprehensive testing (unit, integration), Framework layer configuration updates
- Excluded: Database system replacement (keeping Supabase PostgreSQL), New authentication features beyond current parity, UI/UX changes to authentication screens, Authorization system modifications (roles/permissions), Changes to non-authentication Supabase features (storage, realtime)

**User Scenarios**:
1. **Primary Flow**: User logs in with email/password, system authenticates via Better Auth, session created, user accesses protected resources
2. **Alternative Flow**: User resets forgotten password via email link, sets new password, logs in with new credentials
3. **Error Handling**: Invalid credentials show generic error (security), expired sessions redirect to login with return URL, OAuth failures show user-friendly error messages

## Acceptance Criteria

### Functional Requirements

- [ ] **[Criterion 1]**: Better Auth gateway implements IAuthPort interface
  - Given: IAuthPort interface is defined in Domain layer
  - When: BetterAuthGateway is implemented
  - Then: All interface methods use Better Auth SDK and return proper Effect types

- [ ] **[Criterion 2]**: User login flow works with Better Auth
  - Given: User exists with valid credentials
  - When: User submits login request
  - Then: User is authenticated, session/token created, and user data returned

- [ ] **[Criterion 3]**: User signup flow works with Better Auth
  - Given: New user provides valid registration data
  - When: User submits registration request
  - Then: User account created in Better Auth and can log in

- [ ] **[Criterion 4]**: Password reset flow works with Better Auth
  - Given: User has registered email address
  - When: User requests password reset
  - Then: Reset email sent, user can set new password, new password works for login

- [ ] **[Criterion 5]**: Session validation works with Better Auth tokens
  - Given: User has active session/token
  - When: User makes authenticated request
  - Then: Session is validated and request proceeds successfully

- [ ] **[Criterion 6]**: Logout invalidates Better Auth session
  - Given: User is logged in with active session
  - When: User initiates logout
  - Then: Session/token is invalidated and cannot be reused

- [ ] **[Criterion 7]**: Clean Architecture boundaries preserved
  - Given: Codebase analyzed for dependencies
  - When: Checking Domain and Use Case layers
  - Then: No Better Auth imports or dependencies found in Domain/Use Case layers



## Architecture Overview

### Solution Strategy

The migration follows the **Strangler Fig Pattern** - gradual replacement of Supabase Auth with Better Auth while maintaining full backward compatibility and zero downtime. The approach preserves Clean Architecture boundaries by isolating all Better Auth specifics to the Adapter and Framework layers.

**Migration Phases:**
1. **Phase 1: Parallel Implementation** - Create BetterAuthGateway alongside SupabaseAuthGateway
2. **Phase 2: Dual-Run Period** - Support both auth providers with feature flag control
3. **Phase 3: Supabase Auth Removal** - Clean up after confirming Better Auth works

**Key Design Principles:**
- Domain layer remains technology-agnostic (IAuthPort interface extended, not replaced)
- Use-case layer unchanged (AuthPortTag provides dependency injection)
- Adapter layer contains all Better Auth SDK imports
- Effect-based error handling preserved throughout

**Research References:** This strategy is based on:
- `.specs/analysis/analysis-better-auth-migration.md` - Complete codebase audit identifying 46 affected files across all layers
- `.claude/skills/better-auth-migration/SKILL.md` - Better Auth framework-specific patterns and migration patterns from Supabase Auth
- `.specs/plans/better-auth-migration.design.md` - Detailed design decisions for Clean Architecture integration

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database Adapter** | Drizzle ORM | Consistent with existing database layer; Better Auth provides official Drizzle adapter |
| **Deployment Model** | Embedded in backend-server | Simplifies infrastructure; shares database connection pool with app |
| **Session Strategy** | Cookie-based sessions | Better Auth native; more secure than JWT (httpOnly, secure, sameSite by default) |
| **Route Structure** | `/api/auth/*` for Better Auth, `/api/graphql` for GraphQL | Clear separation; REST convention for auth, dedicated path for GraphQL |
| **Authorization** | Domain-level `verifyAccess()` | Better Auth handles authentication; domain layer handles resource permissions via existing gateway-auth-protection pattern |
| **Mobile Session** | Cookie jar with SecureStore | React Native uses `expo-secure-store` for session persistence; compatible with Better Auth cookie model |
| **User Migration** | Email OTP flow | Seamless migration - users verify via OTP, set new password, no data loss |

**Research Reference:** Decisions informed by `.specs/analysis/analysis-better-auth-migration.md` (interface compatibility analysis) and `.claude/skills/better-auth-migration/SKILL.md` (Better Auth capabilities and constraints).

#### Alternatives Considered

| Alternative | Status | Reasoning |
|-------------|--------|-----------|
| **Direct migration (big bang)** | Rejected | Too risky for production auth system; zero user downtime requirement necessitates gradual approach |
| **Keep Supabase Auth indefinitely** | Rejected | Vendor lock-in conflicts with business goal; Supabase Auth limitations (customization, data ownership) |
| **JWT token strategy** | Rejected | Better Auth natively uses cookies; JWT would require custom implementation deviating from framework conventions |
| **Separate auth microservice** | Rejected | Adds operational complexity; embedded approach leverages existing database connection pool |
| **Strangler Fig with dual-run** | Selected | Balances risk and progress; allows gradual user migration with full rollback capability |

#### Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| User data loss during migration | High | OTP-based migration ensures users verify identity before account transfer; existing Supabase users remain functional during dual-run |
| Session incompatibility (mobile) | Medium | Cookie jar pattern with SecureStore tested per `.claude/skills/better-auth-migration/SKILL.md` mobile integration patterns |
| Performance degradation | Low | Load testing during Phase 2; Better Auth embedded deployment eliminates network latency vs external Supabase Auth |
| Rollback complexity | Medium | Feature flag enables instant rollback; SupabaseAuthGateway retained until 100% migration confirmed |

#### Rollback Strategy

If migration fails at any phase:

1. **Feature flag reversion:** Toggle `USE_BETTER_AUTH=false` in environment config to route all auth traffic back to SupabaseAuthGateway
2. **User impact:** Zero - users keep existing Supabase sessions during dual-run period
3. **Data integrity:** No data loss - Better Auth tables are additive; Supabase auth tables remain untouched
4. **Cleanup:** Remove Better Auth routes and gateway implementation; revert DI wiring to Supabase-only

**Rollback trigger conditions:**
- Auth error rate > 1% during Phase 2
- Session validation failures reported
- Performance regression > 100ms p95 latency increase
- Security audit findings in Better Auth implementation

#### Dual-Run Performance Impact

During Phase 2 (both gateways active):
- **Memory:** ~5MB additional heap for Better Auth instance
- **Cold start:** No impact (Better Auth embedded, not external service)
- **Request latency:** No additional network hops vs Supabase Auth external API calls
- **Database:** Additional connection pool usage minimal (shared with app connections)

### Architecture Diagrams

#### Layer Interaction (Clean Architecture Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│  Application Layer (apps/)                                        │
│  ────────────────────────                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │backend-server│  │    native    │  │     web      │            │
│  │   (/api/*)   │  │ (mobile app) │  │   (frontend) │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼─────────────────┼─────────────────┼─────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frameworks Layer (packages/frameworks/)                       │
│  ───────────────────────────────────────                        │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │  createBetter  │  │   DI Wiring    │  │  Auth Stores   │        │
│  │   Auth()       │  │ (Layer.succeed)│  │ (better-auth)  │        │
│  │                │  │                │  │                │        │
│  │ - Config       │  │ - AuthPortTag  │  │ - Session      │        │
│  │ - Plugins      │  │ - Storage      │  │   management   │        │
│  │ - Routes       │  │ - EventBus     │  │ - Cookie jar   │        │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘        │
│          │                   │                   │                │
│          └───────────────────┴───────────────────┘                │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Adapters Layer (packages/adapters/)                             │
│  ───────────────────────────────────                            │
│  ┌─────────────────────────────────────────┐                     │
│  │      BetterAuthGateway                  │                     │
│  │   (implements IAuthPort)                │                     │
│  │                                         │                     │
│  │ - signInWithPassword()                  │                     │
│  │ - signInWithOtp()                       │                     │
│  │ - sendSignInOtp() [NEW]                 │                     │
│  │ - signUp()                              │                     │
│  │ - signOut()                             │                     │
│  │ - getSession()                          │                     │
│  │ - refreshSession()                      │                     │
│  │ - verifyAccess()                        │                     │
│  └─────────────────────────────────────────┘                     │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────┐       │
│  │  Other Gateways (unchanged)                           │       │
│  │  - SupabaseStorageGateway [retained]                  │       │
│  │  - SupabaseRealtimeEventBusGateway [retained]         │       │
│  └───────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Use-Cases Layer (packages/use-cases/)                             │
│  ───────────────────────────────────                            │
│  ┌─────────────────────────────────────────┐                     │
│  │         AuthPortTag                     │                     │
│  │    Context.Tag<IAuthPort>               │                     │
│  │                                         │                     │
│  │  Effect.gen(function* () {               │                     │
│  │    const auth = yield* AuthPortTag;    │                     │
│  │    return yield* auth.signIn(...);     │                     │
│  │  })                                     │                     │
│  └─────────────────────────────────────────┘                     │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Domain Layer (packages/domain/)                                   │
│  ───────────────────────────────                                  │
│  ┌─────────────────────────────────────────┐                       │
│  │          IAuthPort                      │                       │
│  │    (interface contract)                 │                       │
│  │                                         │                       │
│  │ - Core auth methods                     │                       │
│  │ - Session contracts                     │                       │
│  │ - Error type definitions                │                       │
│  └─────────────────────────────────────────┘                       │
│                              │                                    │
│  ┌───────────────────────────┴───────────────────────────┐         │
│  │  Error Types (new)                                      │         │
│  │  - AuthSessionExpiredError                            │         │
│  │  - PermissionDeniedError                                │         │
│  │  - UserAlreadyExistsError                               │         │
│  │  - RateLimitError                                       │         │
│  │  - AuthenticationError                                  │         │
│  └───────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

#### Component Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                     Better Auth System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Configuration Layer                                    │     │
│  │  ─────────────────────                                  │     │
│  │  createBetterAuth(db, config)                           │     │
│  │  • Drizzle adapter (provider: "pg")                     │     │
│  │  • emailAndPassword plugin                              │     │
│  │  • emailOTP plugin (sendVerificationOTP callback)       │     │
│  │  • basePath: "/api/auth"                                  │     │
│  │  • session config (7 day expiry, 1 day refresh)         │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Route Handler (backend-server)                           │     │
│  │  ─────────────────────────────                            │     │
│  │  Hono route: /api/auth/*                                 │     │
│  │  auth.handler(c.req.raw) → Better Auth processing        │     │
│  │  • sign-up, sign-in, sign-out                           │     │
│  │  • OTP send/verify                                       │     │
│  │  • session management                                    │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Gateway Bridge (Effect wrapper)                          │     │
│  │  ─────────────────────────────                            │     │
│  │  BetterAuthGateway implements IAuthPort                   │     │
│  │  • Wraps Better Auth API calls in Effect.tryPromise       │     │
│  │  • Converts responses to domain types                     │     │
│  │  • Maps errors to domain error types                      │     │
│  │  • Provides verifyAccess() for resource auth            │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Session Storage (per platform)                           │     │
│  │  ─────────────────────────────                            │     │
│  │  Web: httpOnly cookies (browser managed)                  │     │
│  │  Mobile: SecureStore (Keychain/Keystore)                │     │
│  │  Server: Cookie jar or Authorization header               │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Domain Layer Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **IAuthPort** | `packages/domain/src/shared/services/index.ts` | Defines authentication contract (methods, signatures, error types) |
| **Auth Errors** | `packages/domain/src/shared/errors/auth-errors.ts` | New error types: AuthSessionExpiredError, PermissionDeniedError, UserAlreadyExistsError, RateLimitError, AuthenticationError |

#### 2. Use-Cases Layer Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **AuthPortTag** | `packages/use-cases/src/shared/ports/index.ts` | Effect Context.Tag for dependency injection; unchanged in migration |

#### 3. Adapter Layer Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **BetterAuthGateway** | `packages/adapters/src/auth/gateways/better-auth/BetterAuthGateway.ts` | Implements IAuthPort using Better Auth SDK; wraps API calls in Effect |

#### 4. Framework Layer Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **createBetterAuth** | `packages/frameworks/src/better-auth/index.ts` | Factory function configuring Better Auth instance with Drizzle adapter, plugins, session settings |
| **Service Layer** | `packages/frameworks/src/di/layer/service.ts` | DI wiring creating BetterAuthGateway and injecting into AuthPortTag |
| **Auth Store (Mobile)** | `packages/frameworks/src/stores/auth/better-auth.ts` | React Native session management using SecureStore |

#### 5. Application Layer Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **Auth Routes** | `apps/backend-server/src/server.ts` | Hono route mounting Better Auth at /api/auth/* |
| **Native Provider** | `apps/native/src/app/_layout.tsx` | BetterAuthProvider wrapping the native app |

### Contracts/Interfaces

**Note:** Full interface implementations are documented in `.specs/plans/better-auth-migration.design.md`. Below are the critical signatures for quick reference.

#### IAuthPort Interface (Domain Contract)

**Location:** `packages/domain/src/shared/services/index.ts`
**Research Reference:** Based on analysis in `.specs/analysis/analysis-better-auth-migration.md` (lines 163-205) showing current IAuthPort methods.

**Core Methods:**
- `signInWithPassword(email, password)` - Email/password authentication
- `sendSignInOtp(email)` - NEW: Send OTP for sign-in (Better Auth specific)
- `signInWithOtp(email, otp)` - OTP-based authentication
- `signUp(email, password)` - User registration
- `signOut()` - Session termination
- `getSession()` - Current session retrieval
- `refreshSession()` - Session token refresh
- `verifyAccess(request)` - Gateway-level resource authorization

**Effect Return Types:** All methods return `Effect.Effect<T, IPortError, never>` per Clean Architecture conventions.

#### Error Types (New Domain Errors)

**Location:** `packages/domain/src/shared/errors/auth-errors.ts`

**New Error Classes:**
- `AuthSessionExpiredError` - Invalid or expired session tokens
- `PermissionDeniedError` - Resource access denied
- `UserAlreadyExistsError` - Duplicate registration attempt
- `RateLimitError` - Too many auth attempts
- `AuthenticationError` - General auth failures

**Full implementation:** See `.specs/plans/better-auth-migration.design.md` lines 357-417.

#### Better Auth Configuration Contract

**Location:** `packages/frameworks/src/better-auth/index.ts`
**Research Reference:** Configuration patterns from `.claude/skills/better-auth-migration/SKILL.md` (lines 70-113).

**Key Configuration:**
```typescript
{
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/api/auth",
  emailAndPassword: { enabled: true },
  plugins: [emailOTP({ sendVerificationOTP, expiresIn: 300 })],
  session: { expiresIn: 604800, updateAge: 86400 } // 7 days / 1 day
}
```

### Dual-Run DI Configuration

**Research Reference:** DI patterns from `.specs/plans/better-auth-migration.design.md` (lines 419-454).

During Phase 2 dual-run period, both gateways coexist via Layer composition:

```typescript
// packages/frameworks/src/di/layer/service.ts
export const makeServiceLayer = (config: ServiceLayerConfig) => {
  // Better Auth instance for new auth flows
  const betterAuth = createBetterAuth(config.db);

  // Primary auth layer (configurable via feature flag)
  const authLayer = config.useBetterAuth
    ? Layer.succeed(AuthPortTag, new BetterAuthGateway(betterAuth))
    : Layer.succeed(AuthPortTag, new SupabaseAuthGateway(config.supabase));

  // Storage remains Supabase during transition
  const storageLayer = Layer.succeed(
    StoragePortTag,
    new SupabaseStorageGateway(config.supabase)
  );

  return Layer.mergeAll(authLayer, storageLayer);
};
```

**Feature Flag Approach:**
- Environment variable `USE_BETTER_AUTH` controls gateway selection
- Gradual rollout: 1% → 10% → 50% → 100%
- Instant rollback: Toggle flag to route all traffic to SupabaseAuthGateway

**Coexistence Strategy:**
- SupabaseAuthGateway: Handles existing user sessions during dual-run
- BetterAuthGateway: Handles new registrations and testing
- Full cutover: When confident, enable 100% Better Auth and remove Supabase Auth

### Expected Changes

#### Files to Create (New Components)

| File | Purpose |
|------|---------|
| `packages/frameworks/src/better-auth/index.ts` | Better Auth configuration factory |
| `packages/frameworks/src/better-auth/schema.ts` | Drizzle schema definitions for Better Auth tables |
| `packages/adapters/src/auth/gateways/better-auth/BetterAuthGateway.ts` | IAuthPort implementation using Better Auth |
| `packages/domain/src/shared/errors/auth-errors.ts` | New authentication error types |
| `packages/frameworks/src/stores/auth/better-auth.ts` | React Native auth store using SecureStore |
| `apps/backend-server/src/routes/auth.ts` | Better Auth route mounting (Hono) |
| `apps/native/src/providers/BetterAuthProvider.tsx` | React Native auth provider |
| `apps/native/src/hooks/useBetterAuth.ts` | React Native auth hooks |

#### Files to Modify (Existing Updates)

| File | Change Description |
|------|-------------------|
| `packages/domain/src/shared/services/index.ts` | Extend IAuthPort with `sendSignInOtp()` method; add `AccessCheckRequest` interface |
| `packages/frameworks/src/di/layer/service.ts` | Replace `SupabaseAuthGateway` with `BetterAuthGateway` in DI wiring |
| `packages/frameworks/src/di/layer/app.ts` | Update `makeAppLayer` to use Better Auth client |
| `packages/frameworks/src/supabase/client.ts` | Add `createBetterAuthClient` factory (retain Supabase for storage) |
| `packages/adapters/src/index.ts` | Export `BetterAuthGateway` |
| `apps/backend-server/src/server.ts` | Mount `/api/auth/*` routes for Better Auth; move GraphQL to `/api/graphql` |
| `apps/backend-server/src/infrastructure.ts` | Add Better Auth client initialization |
| `apps/backend-server/src/config.ts` | Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` environment variables |
| `apps/native/src/app/_layout.tsx` | Replace `SupabaseProvider` with `BetterAuthProvider` |
| `apps/native/src/stores/auth/authStore.ts` | Update to use Better Auth client |
| `packages/frameworks/src/graphql/context.ts` | Update auth context extraction for Better Auth session |
| `packages/frameworks/src/di/layer/test.ts` | Update test mocks for Better Auth |

#### Files to Delete (Post-Migration Cleanup)

| File | Deletion Criteria |
|------|-------------------|
| `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts` | After 100% user migration to Better Auth |
| `packages/frameworks/src/stores/auth/supabase.ts` | After native app fully migrated |
| `packages/frameworks/src/supabase/react.tsx` | If no longer using SupabaseProvider |

#### Database Schema Changes

Better Auth requires the following tables (auto-generated via Drizzle adapter):

| Table | Purpose |
|-------|---------|
| `user` | User accounts (id, email, emailVerified, name, image, createdAt, updatedAt) |
| `session` | Active sessions (id, token, userId, expiresAt, ipAddress, userAgent) |
| `account` | OAuth connections and credentials (provider, accessToken, refreshToken) |
| `verification` | OTP codes and email verification tokens |

**Migration Strategy:** Run `npx auth@latest generate` then `npx drizzle-kit migrate` to create tables alongside existing schema.

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] Unit tests written and passing (>90% coverage for auth code)
- [ ] Integration tests written and passing (full auth flows)
- [ ] No regression in existing test suites
- [ ] Clean Architecture linting rules pass
- [ ] Documentation updated (architecture decisions, migration guide)
- [ ] Code reviewed and approved
- [ ] Migration plan documented and tested in staging

---

## Implementation Process

### Overview

This section provides the complete implementation roadmap for migrating from Supabase Auth to Better Auth. Steps are organized by dependency order with parallel execution paths identified. The decomposition is documented in `.specs/scratchpad/decomposition.md`.

**Total Estimated Effort:** 30-42 hours with parallel execution  
**Critical Path Duration:** ~12-16 hours (must be sequential)  
**Optimal Team Size:** 2-3 developers

---

### Phase 1: Setup (Foundation)

#### Step 1.1: Domain Error Types
**Goal:** Create new authentication error types for Better Auth integration  
**Output:** `packages/domain/src/shared/errors/auth-errors.ts` with 5 error classes  
**Depends on:** None (can start immediately)  
**Parallel with:** Step 1.3  
**Agent:** haiku  
**Risk:** LOW

**Success Criteria:**
- [ ] All error classes extend `Data.TaggedError` and implement `IPortError`
- [ ] Error classes: `AuthSessionExpiredError`, `PermissionDeniedError`, `UserAlreadyExistsError`, `RateLimitError`, `AuthenticationError`
- [ ] Each error has appropriate `message` property and typed fields
- [ ] ESLint passes with no errors
- [ ] TypeScript compilation succeeds

**Subtasks:**
- [ ] Create file structure based on existing domain error patterns
- [ ] Implement `AuthSessionExpiredError` with token field
- [ ] Implement `PermissionDeniedError` with user/resource context
- [ ] Implement `UserAlreadyExistsError` with email field
- [ ] Implement `RateLimitError` with retryAfter field
- [ ] Implement `AuthenticationError` with generic message support
- [ ] Export from domain barrel file
- [ ] Write unit tests for error constructors

**Blockers and Risks:**
- Risk: Error naming conflicts with existing errors
  - Mitigation: Verify no duplicate names in domain package first
- Risk: IPortError interface mismatch
  - Mitigation: Check interface definition before implementation

**Risk Level:** LOW

**Estimated Duration:** 1-2 hours

**Verification:**
- **Level:** NONE
- **Rationale:** Boilerplate error classes following established Data.TaggedError patterns. Changes are additive with no interface modifications.

---

#### Step 1.2: Extend IAuthPort Interface
**Goal:** Extend domain authentication interface with Better Auth-specific methods  
**Output:** Updated `packages/domain/src/shared/services/index.ts` with `sendSignInOtp()` and `verifyAccess()`  
**Depends on:** Step 1.1  
**Parallel with:** None  
**Agent:** haiku  
**Risk:** LOW

**Success Criteria:**
- [ ] `sendSignInOtp(email)` method added returning `Effect<void, IPortError, never>`
- [ ] `AccessCheckRequest` interface defined with token, resourceType, resourceId, requiredPermission fields
- [ ] `verifyAccess(request)` method added returning `Effect<void, AuthError, never>`
- [ ] All existing methods remain unchanged (backward compatibility)
- [ ] TypeScript compilation passes

**Subtasks:**
- [ ] Review current IAuthPort interface implementation
- [ ] Define `AccessCheckRequest` interface with proper typing
- [ ] Add `sendSignInOtp` method signature
- [ ] Add `verifyAccess` method signature
- [ ] Update interface documentation comments
- [ ] Verify no breaking changes to existing methods
- [ ] Write interface contract tests

**Blockers and Risks:**
- Blocker: Step 1.1 must complete first (error types available)
- Risk: Breaking changes to existing interface
  - Mitigation: Only additive changes allowed; no method signature modifications

**Risk Level:** LOW

**Estimated Duration:** 1 hour

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.0/5.0
- **Artifact:** `packages/domain/src/shared/services/index.ts`
- **Context:** Interface extension must maintain backward compatibility while adding new methods for Better Auth integration.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Clean Architecture | 0.30 | Better Auth types leak into interface | Some coupling to external types | Pure domain types only, no external dependencies |
  | Backward Compatibility | 0.35 | Breaking changes to existing methods | Additive only but inconsistent | Fully additive, existing methods unchanged |
  | Type Safety | 0.20 | Any types used | Some implicit any | Strict typing, Effect return types correct |
  | Documentation | 0.15 | No JSDoc comments | Partial documentation | Complete JSDoc for new methods |

---

#### Step 1.3: Create Better Auth Database Schema
**Goal:** Generate Drizzle schema for Better Auth tables alongside existing schema  
**Output:** `packages/frameworks/src/better-auth/schema.ts` with user, session, account, verification tables  
**Depends on:** None (can start immediately)  
**Parallel with:** Step 1.1  
**Agent:** haiku  
**Risk:** MEDIUM

**Success Criteria:**
- [ ] Schema file exports `user`, `session`, `account`, `verification` tables
- [ ] Tables match Better Auth Drizzle adapter requirements
- [ ] No conflicts with existing schema tables
- [ ] Migration files can be generated without errors
- [ ] TypeScript compilation passes

**Subtasks:**
- [ ] Run `npx auth@latest generate` to get base schema
- [ ] Review generated schema against project naming conventions
- [ ] Integrate into `packages/frameworks/src/better-auth/schema.ts`
- [ ] Verify table name uniqueness with existing schema
- [ ] Generate drizzle-kit migration
- [ ] Apply migration to local database
- [ ] Verify tables created successfully

**Blockers and Risks:**
- Risk: Table naming conflicts with existing schema
  - Mitigation: Better Auth uses `user`, `session` - verify no duplicates
- Risk: Migration conflicts with existing data
  - Mitigation: Test migrations on isolated database first

**Risk Level:** MEDIUM

**Estimated Duration:** 2-3 hours

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.0/5.0
- **Artifact:** `packages/frameworks/src/better-auth/schema.ts`
- **Context:** Drizzle schema for Better Auth tables must match official adapter requirements and avoid conflicts with existing tables.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Schema Correctness | 0.35 | Missing required tables/columns | All tables present but some types incorrect | Complete match with Better Auth Drizzle adapter spec |
  | Table Name Conflicts | 0.30 | Conflicts with existing schema | No conflicts but naming inconsistent | Clean separation, no naming collisions |
  | Migration Compatibility | 0.20 | Migration fails or corrupts data | Migration runs with warnings | Migration runs cleanly, additive only |
  | Type Safety | 0.15 | No Drizzle types defined | Some types defined | Full Drizzle table types exported |

---

### Phase 2: Core Implementation

#### Step 2.1: Create Better Auth Configuration Factory
**Goal:** Implement Better Auth factory with Drizzle adapter and email OTP plugin  
**Output:** `packages/frameworks/src/better-auth/index.ts` exporting `createBetterAuth()`  
**Depends on:** Step 1.3  
**Parallel with:** None  
**Agent:** opus  
**Risk:** MEDIUM

**Success Criteria:**
- [ ] Factory accepts Database instance and returns configured Better Auth instance
- [ ] Drizzle adapter configured with `provider: "pg"`
- [ ] `emailAndPassword` plugin enabled
- [ ] `emailOTP` plugin configured with `sendVerificationOTP` callback placeholder
- [ ] Session configuration: 7-day expiry, 1-day refresh
- [ ] Base path set to `/api/auth`
- [ ] TypeScript types exported (`BetterAuthInstance`)

**Subtasks:**
- [ ] Install `better-auth` and `@better-auth/drizzle-adapter` dependencies
- [ ] Create factory function skeleton
- [ ] Configure Drizzle adapter with database instance
- [ ] Configure emailAndPassword plugin
- [ ] Configure emailOTP plugin with callback stub
- [ ] Set session expiration parameters
- [ ] Configure basePath and other options
- [ ] Export type definitions
- [ ] Write factory unit tests

**Blockers and Risks:**
- Blocker: Step 1.3 must complete (schema ready)
- Risk: Email OTP callback needs email service integration
  - Mitigation: Implement as stub initially; integrate in Step 2.4
- Risk: Database connection pool conflicts
  - Mitigation: Use same connection pool as existing Drizzle setup

**Risk Level:** MEDIUM

**Estimated Duration:** 2-3 hours

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.5/5.0
- **Artifact:** `packages/frameworks/src/better-auth/index.ts`
- **Context:** Factory must correctly configure Better Auth with Drizzle adapter, plugins, and session settings for production use.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Configuration Correctness | 0.35 | Missing critical config (adapter, basePath) | Config present but some options wrong | All options match requirements exactly |
  | Plugin Integration | 0.25 | Plugins not configured | Plugins added but callbacks missing | Full plugin setup with proper callbacks |
  | Session Security | 0.25 | Insecure defaults used | Secure but session duration wrong | httpOnly, secure, sameSite, correct expiry |
  | Type Exports | 0.15 | No types exported | Some types missing | Complete BetterAuthInstance type exported |

---

#### Step 2.2: Implement BetterAuthGateway
**Goal:** Create IAuthPort implementation wrapping Better Auth API calls in Effect  
**Output:** `packages/adapters/src/auth/gateways/better-auth/BetterAuthGateway.ts`  
**Depends on:** Step 1.2, Step 2.1  
**Parallel with:** None  
**Agent:** opus  
**Risk:** HIGH

**Success Criteria:**
- [ ] Class implements `IAuthPort` interface fully
- [ ] All methods wrap Better Auth API in `Effect.tryPromise`
- [ ] Methods implemented: `signInWithPassword`, `sendSignInOtp`, `signInWithOtp`, `signUp`, `signOut`, `getSession`, `refreshSession`, `verifyAccess`
- [ ] Errors mapped to domain error types appropriately
- [ ] Response data mapped to domain types
- [ ] Unit tests achieve >90% coverage
- [ ] ESLint passes with no errors

**Subtasks:**
- [ ] Create gateway class skeleton implementing IAuthPort
- [ ] Implement `signInWithPassword` with email/password flow
- [ ] Implement `sendSignInOtp` for OTP generation
- [ ] Implement `signInWithOtp` for OTP verification
- [ ] Implement `signUp` for user registration
- [ ] Implement `signOut` for session termination
- [ ] Implement `getSession` for current session retrieval
- [ ] Implement `refreshSession` for token refresh
- [ ] Implement `verifyAccess` with resource permission checking
- [ ] Add error mapping utility (Better Auth errors → domain errors)
- [ ] Write comprehensive unit tests for all methods
- [ ] Export from adapters index

**Blockers and Risks:**
- Blocker: Step 1.2 must complete (IAuthPort extended)
- Blocker: Step 2.1 must complete (Better Auth instance available)
- Risk: Session handling differs from Supabase (cookies vs JWT)
  - Mitigation: Careful mapping of cookie-based session to interface return types
- Risk: Better Auth API surface changes
  - Mitigation: Pin better-auth version; review changelog before updates
- Risk: verifyAccess implementation complexity
  - Mitigation: Reference existing gateway-auth-protection pattern

**Risk Level:** HIGH

**Estimated Duration:** 4-6 hours

**Verification:**
- **Level:** PANEL
- **Threshold:** 4.5/5.0
- **Artifact:** `packages/adapters/src/auth/gateways/better-auth/BetterAuthGateway.ts`
- **Context:** Core IAuthPort implementation bridging Better Auth SDK with Clean Architecture. Critical for entire migration success. Must wrap all API calls in Effect and maintain strict layer separation.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Clean Architecture | 0.30 | Better Auth types leak into domain | Some coupling, mostly isolated | Perfect isolation, only domain types in signatures |
  | Effect Integration | 0.25 | async/await without Effect wrapper | Effect used but errors not properly wrapped | All calls wrapped in Effect.tryPromise with proper error mapping |
  | Error Handling | 0.20 | Generic errors, no domain mapping | Some error mapping | Comprehensive mapping to domain error types |
  | Interface Compliance | 0.15 | Missing methods or wrong signatures | All methods present, minor signature issues | Full IAuthPort compliance |
  | Test Coverage | 0.10 | <50% coverage | 50-80% coverage | >90% coverage with edge cases |

---

#### Step 2.3: Update DI Layer Wiring
**Goal:** Replace SupabaseAuthGateway with BetterAuthGateway in service layer  
**Output:** Updated `packages/frameworks/src/di/layer/service.ts` with Better Auth wiring  
**Depends on:** Step 2.2  
**Parallel with:** None  
**Agent:** sonnet  
**Risk:** MEDIUM

**Success Criteria:**
- [ ] `makeServiceLayer` creates Better Auth instance using `createBetterAuth`
- [ ] `AuthPortTag` resolves to `BetterAuthGateway` instead of `SupabaseAuthGateway`
- [ ] `StoragePortTag` continues resolving to `SupabaseStorageGateway`
- [ ] Feature flag support: `USE_BETTER_AUTH` environment variable
- [ ] Both gateways can coexist during dual-run period
- [ ] TypeScript compilation passes
- [ ] Unit tests for DI layer pass

**Subtasks:**
- [ ] Review current service.ts implementation
- [ ] Add `useBetterAuth` flag to ServiceLayerConfig
- [ ] Implement conditional gateway selection logic
- [ ] Create `BetterAuthGateway` injection path
- [ ] Preserve `SupabaseStorageGateway` for storage
- [ ] Update Layer composition to merge auth and storage
- [ ] Write DI layer unit tests with feature flag scenarios
- [ ] Export createBetterAuth from service.ts

**Blockers and Risks:**
- Blocker: Step 2.2 must complete (gateway implementation ready)
- Risk: Runtime errors from Layer wiring changes
  - Mitigation: Comprehensive unit tests before integration
- Risk: Storage layer accidentally changed
  - Mitigation: Explicitly preserve SupabaseStorageGateway

**Risk Level:** MEDIUM

**Estimated Duration:** 1-2 hours

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.5/5.0
- **Artifact:** `packages/frameworks/src/di/layer/service.ts`
- **Context:** DI wiring must support dual-run period with feature flag while maintaining Supabase storage. Critical for zero-downtime migration.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Feature Flag Implementation | 0.30 | No flag or hardcoded | Flag present but not configurable | USE_BETTER_AUTH env var, runtime toggle |
  | Layer Composition | 0.25 | Incorrect Layer.mergeAll usage | Layers merged but some missing | Proper merge with auth + storage layers |
  | Gateway Isolation | 0.25 | Supabase auth removed prematurely | Both present but initialization broken | Both gateways coexist, clean switch logic |
  | Storage Preservation | 0.20 | Storage changed to Better Auth | Storage preserved but imports wrong | SupabaseStorageGateway unchanged, clean imports |

---

#### Step 2.4: Mount Better Auth Routes in Backend
**Goal:** Add Better Auth route handlers and migrate GraphQL endpoint  
**Output:** Updated `apps/backend-server/src/server.ts` with `/api/auth/*` and `/api/graphql`  
**Depends on:** Step 2.1, Step 2.3  
**Parallel with:** None  
**Agent:** sonnet  
**Risk:** MEDIUM

**Success Criteria:**
- [ ] Better Auth handler mounted at `/api/auth/*` using Hono
- [ ] All HTTP methods (POST, GET) routed to auth handler
- [ ] GraphQL endpoint moved from root to `/api/graphql`
- [ ] Environment variables configured: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- [ ] Backend starts successfully with new routes
- [ ] Health check endpoint still functions
- [ ] Manual testing confirms auth endpoints respond

**Subtasks:**
- [ ] Review current server.ts route configuration
- [ ] Add Better Auth route mounting
- [ ] Relocate GraphQL yoga handler to `/api/graphql`
- [ ] Update `apps/backend-server/src/config.ts` with Better Auth env vars
- [ ] Update `apps/backend-server/src/infrastructure.ts` with client initialization
- [ ] Update `apps/backend-server/src/errors.ts` with "better_auth" phase
- [ ] Test server startup locally
- [ ] Verify `/api/auth/sign-in/email` responds
- [ ] Verify `/api/graphql` responds
- [ ] Run integration tests

**Blockers and Risks:**
- Blocker: Step 2.3 must complete (DI wiring ready)
- Blocker: Step 2.1 must complete (Better Auth instance available)
- Risk: Route conflicts with existing endpoints
  - Mitigation: Verify no existing `/api/auth/*` routes
- Risk: GraphQL clients break from endpoint move
  - Mitigation: Coordinate with frontend teams; provide migration period
- Risk: Environment variables missing in production
  - Mitigation: Document all required env vars; validate on startup

**Risk Level:** MEDIUM

**Estimated Duration:** 2-3 hours

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.5/5.0
- **Artifact:** `apps/backend-server/src/server.ts`
- **Context:** Route mounting must correctly handle all HTTP methods and maintain backward compatibility during GraphQL endpoint migration.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Route Configuration | 0.30 | Routes not mounted or wrong path | Mounted but some methods missing | All methods (GET, POST) work at /api/auth/* |
  | GraphQL Migration | 0.25 | GraphQL broken or old path still used | Moved but clients break | /api/graphql working, old path deprecated gracefully |
  | Error Handling | 0.20 | No error boundaries | Basic error handling | auth.handler errors caught and logged properly |
  | Environment Integration | 0.15 | Hardcoded values | Some env vars | BETTER_AUTH_SECRET, BETTER_AUTH_URL validated |
  | Server Startup | 0.10 | Server crashes on start | Starts but warnings | Clean startup, health check passes |

---

#### Step 2.5: Create Integration Tests
**Goal:** Comprehensive test coverage for all authentication flows  
**Output:** Test files in `packages/adapters/src/auth/gateways/better-auth/__tests__/`  
**Depends on:** Step 2.2, Step 2.4  
**Parallel with:** Steps 3.1, 3.2  
**Agent:** sonnet  
**Risk:** MEDIUM

**Success Criteria:**
- [ ] Unit tests for each IAuthPort method (>90% coverage)
- [ ] Integration tests for complete auth flows:
  - Sign up → Sign in → Get session → Sign out
  - Send OTP → Sign in with OTP
  - Password reset flow
  - Session refresh
  - Session validation
- [ ] Error case coverage: invalid credentials, expired sessions, rate limiting
- [ ] Mock layer for bypassing auth in other tests
- [ ] All tests passing in CI

**Subtasks:**
- [ ] Create test directory structure
- [ ] Implement `BetterAuthGateway` unit tests with mocked Better Auth
- [ ] Set up test database with Better Auth schema
- [ ] Create integration test for sign-up flow
- [ ] Create integration test for sign-in flow
- [ ] Create integration test for OTP flow
- [ ] Create integration test for session lifecycle
- [ ] Create integration test for error scenarios
- [ ] Create mock auth layer for other package tests
- [ ] Update CI configuration to run auth tests

**Blockers and Risks:**
- Blocker: Step 2.2 must complete (gateway implementation ready)
- Blocker: Step 2.4 should be complete (backend routes available)
- Risk: Test database setup complexity
  - Mitigation: Use existing test database patterns from project
- Risk: Better Auth test utilities insufficient
  - Mitigation: May need custom test helpers for session management

**Risk Level:** MEDIUM

**Estimated Duration:** 4-6 hours

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.5/5.0
- **Artifact:** `packages/adapters/src/auth/gateways/better-auth/__tests__/`
- **Context:** Comprehensive test coverage required for all auth flows. Tests must verify both success paths and error scenarios.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Test Coverage | 0.30 | <50% coverage | 50-80% coverage | >90% line coverage, all methods tested |
  | Flow Completeness | 0.25 | Partial flows tested | Main flows tested | All flows: signup→login→session→logout, OTP flows |
  | Error Scenarios | 0.20 | No error tests | Some error cases | Invalid credentials, expired sessions, rate limits all covered |
  | Mock Layer Quality | 0.15 | No mock available | Mock exists but limited | Full mock layer for other package tests to use |
  | CI Integration | 0.10 | Tests not in CI | In CI but flaky | CI runs, database setup automated, stable |

---

### Phase 3: User Stories (Client-Side)

#### Step 3.1: Implement Mobile Auth Store with SecureStore
**Goal:** React Native auth store using SecureStore for cookie-based session  
**Output:** `packages/frameworks/src/stores/auth/better-auth.ts` and mobile provider  
**Depends on:** Step 2.2, Step 2.4  
**Parallel with:** Step 2.5  
**Agent:** opus  
**Risk:** HIGH

**Success Criteria:**
- [ ] Auth store created using `expo-secure-store` for session persistence
- [ ] Cookie jar pattern implemented for Better Auth compatibility
- [ ] Methods: `getSession`, `setSession`, `clearSession`, `refreshSession`
- [ ] Session automatically persisted to SecureStore on change
- [ ] Session loaded from SecureStore on app start
- [ ] Integration with Better Auth client for token refresh
- [ ] TypeScript types exported
- [ ] Unit tests for store operations

**Subtasks:**
- [ ] Review existing Supabase auth store implementation
- [ ] Create `better-auth.ts` store file
- [ ] Implement SecureStore session persistence
- [ ] Implement cookie jar pattern (store/extract cookies)
- [ ] Implement session retrieval method
- [ ] Implement session storage method
- [ ] Implement session refresh with Better Auth
- [ ] Implement session clearing on sign out
- [ ] Create `BetterAuthProvider` component
- [ ] Hook up to `apps/native/src/app/_layout.tsx`
- [ ] Write store unit tests
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator

**Blockers and Risks:**
- Blocker: Step 2.2 should be complete (understanding gateway interface)
- Blocker: Step 2.4 recommended (backend ready for testing)
- Risk: Cookie handling in React Native differs from web
  - Mitigation: Research better-auth/expo package; use cookie jar pattern
- Risk: SecureStore size limitations (2KB per entry)
  - Mitigation: Store only essential session token, not full session object
- Risk: Background/foreground session sync issues
  - Mitigation: Test app lifecycle scenarios thoroughly

**Risk Level:** HIGH

**Estimated Duration:** 6-8 hours

**Verification:**
- **Level:** PANEL
- **Threshold:** 4.5/5.0
- **Artifact:** `packages/frameworks/src/stores/auth/better-auth.ts`
- **Context:** Mobile session management is complex due to platform differences. Must correctly implement cookie jar pattern with SecureStore for iOS/Android while handling app lifecycle events.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | SecureStore Integration | 0.30 | Not using SecureStore | Using SecureStore but key management weak | Proper Keychain/Keystore usage, secure key naming |
  | Cookie Jar Pattern | 0.25 | No cookie handling | Basic cookie storage | Full cookie jar with extract/restore for Better Auth |
  | Session Lifecycle | 0.20 | No refresh/cleanup | Partial handling | Auto-refresh, proper cleanup on logout, background sync |
  | Platform Parity | 0.15 | iOS/Android divergent | Mostly same but edge cases differ | Identical behavior on both platforms |
  | Type Safety | 0.10 | No types or any used | Some types | Full TypeScript coverage, exported interfaces |

---

#### Step 3.2: Update Frontend Providers and Hooks
**Goal:** Migrate React Native and web apps to Better Auth providers  
**Output:** Updated `apps/native/src/app/_layout.tsx` and web auth hooks  
**Depends on:** Step 3.1  
**Parallel with:** None  
**Agent:** sonnet  
**Risk:** MEDIUM

**Success Criteria:**
- [ ] `SupabaseProvider` replaced with `BetterAuthProvider` in native app
- [ ] `useSupabase` hook replaced with `useBetterAuth` hook
- [ ] `apps/native/src/stores/auth/authStore.ts` updated to use Better Auth
- [ ] `apps/native/src/stores/auth/index.ts` exports updated
- [ ] All auth-related hooks (`useLoginForm.ts`, etc.) updated
- [ ] No Supabase auth imports remain in native app
- [ ] Login screen functionality preserved
- [ ] TypeScript compilation passes

**Subtasks:**
- [ ] Create `apps/native/src/providers/BetterAuthProvider.tsx`
- [ ] Create `apps/native/src/hooks/useBetterAuth.ts`
- [ ] Update `apps/native/src/app/_layout.tsx` to use new provider
- [ ] Update `apps/native/src/stores/auth/authStore.ts`
- [ ] Update `apps/native/src/stores/auth/index.ts`
- [ ] Update `apps/native/src/app/auth/login.tsx`
- [ ] Update `apps/native/src/hooks/files/useFileUpload.ts` (session access)
- [ ] Update `apps/native/src/services/background/backgroundLocationTask.ts`
- [ ] Run native app locally and test login flow
- [ ] Update web app providers (if applicable)

**Blockers and Risks:**
- Blocker: Step 3.1 must complete (mobile auth store ready)
- Risk: UI breaks from provider swap
  - Mitigation: Maintain same hook API surface where possible
- Risk: Native app deployment complexity
  - Mitigation: Test thoroughly in dev before staging deployment

**Risk Level:** MEDIUM

**Estimated Duration:** 4-6 hours

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.5/5.0
- **Artifact:** `apps/native/src/providers/BetterAuthProvider.tsx`, `apps/native/src/hooks/useBetterAuth.ts`
- **Context:** Provider migration must maintain API compatibility while switching underlying auth implementation. All auth-related hooks and stores must be updated.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Provider Migration | 0.30 | SupabaseProvider still used | Both providers coexist | Clean swap, BetterAuthProvider fully functional |
  | Hook API Compatibility | 0.25 | Breaking API changes | API similar but some methods missing | Drop-in replacement, same hook signatures |
  | Import Cleanup | 0.20 | Supabase auth imports remain | Most cleaned but some in comments | Zero Supabase auth imports in native app |
  | Store Integration | 0.15 | Auth store not using Better Auth | Store updated but types wrong | Store fully integrated, TypeScript clean |
  | E2E Functionality | 0.10 | Login flow broken | Login works but edge cases fail | Full auth flow: login→session access→logout working |

---

### Phase 4: Polish (Migration & Cleanup)

#### Step 4.4: Documentation Updates
**Goal:** Complete migration documentation for developers and ops  
**Output:** Updated docs in `.specs/docs/` and inline code documentation  
**Depends on:** Step 2.1 (can start early)  
**Parallel with:** None  
**Agent:** haiku  
**Risk:** LOW

**Success Criteria:**
- [ ] Architecture decision record (ADR) for Better Auth migration
- [ ] Developer guide: Local setup with Better Auth
- [ ] Migration runbook: Production deployment steps
- [ ] Troubleshooting guide: Common issues and fixes
- [ ] API documentation: New/changed endpoints
- [ ] Inline code comments for complex logic
- [ ] README updates for affected packages
- [ ] Diagrams updated to reflect new architecture

**Subtasks:**
- [ ] Write ADR documenting migration rationale and decisions
- [ ] Update `.specs/docs/auth.md` with Better Auth info
- [ ] Create `.specs/docs/better-auth-setup.md` developer guide
- [ ] Create `.specs/docs/migration-runbook.md` for production
- [ ] Document environment variables
- [ ] Update architecture diagrams
- [ ] Review and update inline comments
- [ ] Update package READMEs

**Blockers and Risks:**
- Risk: Documentation becomes outdated quickly
  - Mitigation: Document as implementation progresses; finalize in this step

**Risk Level:** LOW

**Estimated Duration:** 4-6 hours

**Verification:**
- **Level:** NONE
- **Rationale:** Documentation updates follow standard review process. Quality ensured through editorial review rather than automated judgment.

---

#### Step 4.5: Post-Migration Cleanup
**Goal:** Remove Supabase Auth dependencies and deprecated code  
**Output:** Clean codebase with only Better Auth for authentication  
**Depends on:** Step 4.1 (requires 100% user migration confirmed)  
**Parallel with:** None  
**Agent:** sonnet  
**Risk:** MEDIUM

**Success Criteria:**
- [ ] `SupabaseAuthGateway` file removed
- [ ] Supabase auth-related dependencies removed from package.json (keep storage)
- [ ] Supabase auth store files removed (keep storage/realtime)
- [ ] Feature flag `USE_BETTER_AUTH` removed (always true)
- [ ] No dead code or unused imports remain
- [ ] All tests pass after cleanup
- [ ] Bundle size reduced (if applicable)
- [ ] No regression in functionality

**Subtasks:**
- [ ] Identify all Supabase Auth files (not storage/realtime)
- [ ] Remove `SupabaseAuthGateway.ts` after 100% migration confirmed
- [ ] Remove `packages/frameworks/src/stores/auth/supabase.ts`
- [ ] Clean up Supabase auth imports from DI layer
- [ ] Remove `USE_BETTER_AUTH` feature flag logic
- [ ] Update package.json dependencies
- [ ] Run full test suite
- [ ] Run linting
- [ ] Verify build succeeds

**Blockers and Risks:**
- Blocker: 100% user migration confirmed (Step 4.1)
- Blocker: Dual-run period complete (no Supabase Auth traffic)
- Risk: Accidental removal of storage/realtime code
  - Mitigation: Careful file review; only remove auth-specific files
- Risk: Breaking change for any remaining Supabase Auth users
  - Mitigation: Confirm migration completion before cleanup

**Risk Level:** MEDIUM

**Estimated Duration:** 2-4 hours

**Verification:**
- **Level:** SINGLE
- **Threshold:** 4.5/5.0
- **Artifact:** Cleanup PR and post-cleanup test results
- **Context:** Post-migration cleanup must safely remove Supabase Auth code while preserving storage and realtime functionality. Verification ensures nothing critical is accidentally removed.
- **Rubric:**
  | Criterion | Weight | 1 (Poor) | 3 (Good) | 5 (Excellent) |
  |-----------|--------|----------|----------|---------------|
  | Correct File Removal | 0.35 | Wrong files removed | Correct files but some auth code missed | Only auth-specific files removed, storage/realtime preserved |
  | Dependency Cleanup | 0.25 | All Supabase deps removed | Auth deps removed but orphaned | Only Supabase auth deps removed, storage deps kept |
  | Feature Flag Removal | 0.20 | Flag still present | Flag removed but hardcoded default | USE_BETTER_AUTH flag fully removed, always Better Auth |
  | Test Pass Rate | 0.20 | Tests failing | Some tests failing | All tests pass, no regressions |

---

## Parallelization

This section provides explicit dependency mapping, parallel execution groups, agent assignments, and execution directives for sub-agent dispatch.

### Dependency Mapping

Each step includes explicit dependencies and parallel execution directives:

| Step | Task | Depends On | Parallel With | Agent | Risk |
|------|------|------------|---------------|-------|------|
| 1.1 | Domain Error Types | None | Step 1.3 | haiku | LOW |
| 1.2 | IAuthPort Extension | Step 1.1 | None | haiku | LOW |
| 1.3 | Database Schema | None | Step 1.1 | haiku | MEDIUM |
| 2.1 | Better Auth Factory | Step 1.3 | None | opus | MEDIUM |
| 2.2 | BetterAuthGateway | Step 1.2, 2.1 | None | opus | HIGH |
| 2.3 | DI Layer Wiring | Step 2.2 | None | sonnet | MEDIUM |
| 2.4 | Backend Routes | Step 2.1, 2.3 | None | sonnet | MEDIUM |
| 2.5 | Integration Tests | Step 2.2, 2.4 | Step 3.1 | sonnet | MEDIUM |
| 3.1 | Mobile Auth Store | Step 2.2, 2.4 | Step 2.5 | opus | HIGH |
| 3.2 | Frontend Providers | Step 3.1 | None | sonnet | MEDIUM |
| 4.4 | Documentation | Step 2.1 | None | haiku | LOW |
| 4.5 | Cleanup | Step 3.2 | None | sonnet | MEDIUM |

### Parallel Execution Groups

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PARALLEL GROUPS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BATCH 1: Foundation (Hours 0-3)                                            │
│  ┌─────────────────┐  ┌─────────────────┐                                     │
│  │  Step 1.1       │  │  Step 1.3       │  ← Agent: haiku                    │
│  │  Domain Errors  │  │  Schema         │     Risk: LOW/MEDIUM               │
│  │  (1-2h)         │  │  (2-3h)         │                                    │
│  └────────┬────────┘  └─────────────────┘                                     │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                                                         │
│  │  Step 1.2       │  ← Agent: haiku                                         │
│  │  IAuthPort      │     Risk: LOW                                           │
│  │  (1h)           │                                                         │
│  └─────────────────┘                                                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CRITICAL PATH: Core Implementation (Hours 3-15)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Step    │─▶│  Step    │─▶│  Step    │─▶│  Step    │─▶│  Step    │        │
│  │  2.1     │  │  2.2     │  │  2.3     │  │  2.4     │  │  3.1     │        │
│  │  Factory │  │  Gateway │  │  DI      │  │  Routes  │  │  Mobile  │        │
│  │  (2-3h)  │  │  (4-6h)  │  │  (1-2h)  │  │  (2-3h)  │  │  (6-8h)  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│     Agent: opus    Agent: opus   Agent: sonnet  Agent: sonnet  Agent: opus │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BATCH 4: Testing (Starts Hour 10, Parallel with 3.x)                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Step 2.5 - Integration Tests                                            ││
│  │  (4-6h) ← Agent: sonnet                                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  BATCH 5: Polish (Starts Hour 28)                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Step 4.4 - Documentation                                              ││
│  │  (4-6h) ← Agent: haiku                                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  BATCH 6: Cleanup (After Step 3.2)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Step 4.5 - Post-Migration Cleanup                                       ││
│  │  (2-4h) ← Agent: sonnet                                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Assignment Guidelines

**opus** (Complex architectural work, design decisions, critical paths):
- HIGH risk steps
- Complexity > Large
- Critical path dependencies
- Framework configuration
- Effect-based error handling implementation
- **Assigned:** Steps 2.1, 2.2, 3.1

**sonnet** (Standard implementation, testing):
- MEDIUM risk steps
- Medium-Large complexity
- Integration work
- Testing implementation
- Clear requirements with established patterns
- **Assigned:** Steps 2.3, 2.4, 2.5, 3.2, 4.5

**haiku** (Simple tasks, boilerplate, documentation):
- LOW risk steps
- Small complexity
- Boilerplate code following patterns
- Documentation and verification
- Simple configuration
- **Assigned:** Steps 1.1, 1.2, 1.3, 4.4

### Execution Directives

**Batch 1 - Foundation (Parallel Start):**
- Start Step 1.1 and Step 1.3 immediately in parallel
- Step 1.2 waits for Step 1.1 completion

**Critical Path - Sequential:**
- Steps 2.1, 2.2, 2.3, 2.4 must execute sequentially (each is input to next)
- Steps 3.1, 3.2 must execute sequentially

**Batch 4 - Testing (Parallel with Client):**
- Step 2.5 starts after Step 2.2 and 2.4 complete
- Executes in parallel with Steps 3.1 and 3.2

**Batch 5 - Polish (Parallel):**
- Step 4.4 starts after Step 3.2 completes
- Step 4.4 can actually start after Step 2.1 for early documentation

---

### Critical Path

The critical path represents steps that **must** be completed in sequence and block subsequent phases:

```
Step 1.1 (Domain Errors) 
    ↓ ~1-2h
Step 1.2 (IAuthPort Extension)
    ↓ ~1h
Step 2.1 (Better Auth Factory)
    ↓ ~2-3h
Step 2.2 (BetterAuthGateway)
    ↓ ~4-6h
Step 2.3 (DI Wiring)
    ↓ ~1-2h
Step 2.4 (Backend Routes)
    ↓ ~2-3h
Step 3.1 (Mobile Auth Store)
    ↓ ~6-8h
Step 3.2 (Frontend Providers)
    ↓ ~4-6h
Step 4.5 (Cleanup)
    ~2-4h
```

**Total Critical Path Duration:** ~25-35 hours

**Note:** Steps not on the critical path can execute in parallel:
- Step 1.3 (Schema) parallel with 1.1, 1.2
- Step 2.5 (Tests) parallel with 3.x client work
- Step 4.4 can run parallel after Step 3.2

---

### Implementation Summary Table

| Step | Phase | Goal | Risk | Est. Duration | Agent | Parallel Group | Dependencies |
|------|-------|------|------|---------------|-------|----------------|--------------|
| 1.1 | Setup | Domain error types | LOW | 1-2h | haiku | Batch 1 | None |
| 1.2 | Setup | IAuthPort extension | LOW | 1h | haiku | Batch 1 | Step 1.1 |
| 1.3 | Setup | Database schema | MEDIUM | 2-3h | haiku | Batch 1 | None |
| 2.1 | Core | Better Auth factory | MEDIUM | 2-3h | opus | Critical Path | Step 1.3 |
| 2.2 | Core | BetterAuthGateway | HIGH | 4-6h | opus | Critical Path | Step 1.2, 2.1 |
| 2.3 | Core | DI wiring | MEDIUM | 1-2h | sonnet | Critical Path | Step 2.2 |
| 2.4 | Core | Backend routes | MEDIUM | 2-3h | sonnet | Critical Path | Step 2.1, 2.3 |
| 2.5 | Core | Integration tests | MEDIUM | 4-6h | sonnet | Batch 4 | Step 2.2, 2.4 |
| 3.1 | User Stories | Mobile auth store | HIGH | 6-8h | opus | Critical Path | Step 2.2, 2.4 |
| 3.2 | User Stories | Frontend providers | MEDIUM | 4-6h | sonnet | Critical Path | Step 3.1 |
| 4.4 | Polish | Documentation | LOW | 4-6h | haiku | Batch 5 | Step 2.1 |
| 4.5 | Polish | Post-migration cleanup | MEDIUM | 2-4h | sonnet | Deferred | Step 3.2 |

**Summary:**
- **Total Steps:** 12
- **High Risk:** 2 steps (2.2, 3.1)
- **Critical Path Steps:** 9
- **Parallelizable Steps:** 3
- **Agent Types:** opus (3 steps), sonnet (6 steps), haiku (3 steps)
- **Estimated Total:** 25-35 hours (parallel) / 40+ hours (sequential)

---

### Definition of Done (Process Milestones)

The task is considered complete when:

1. **Phase 1 Complete (Setup):**
   - [ ] All domain error types implemented and tested
   - [ ] IAuthPort interface extended with new methods
   - [ ] Better Auth database schema created and migrated
   - [ ] ESLint and TypeScript pass for all Phase 1 files

2. **Phase 2 Complete (Core):**
   - [ ] Better Auth configuration factory functional
   - [ ] BetterAuthGateway implements all IAuthPort methods
   - [ ] DI layer wiring supports feature flag
   - [ ] Backend routes respond correctly
   - [ ] Integration tests pass (>90% coverage)
   - [ ] Acceptance Criteria 1, 7 pass

3. **Phase 3 Complete (User Stories):**
   - [ ] Mobile auth store with SecureStore functional
   - [ ] Frontend providers migrated
   - [ ] End-to-end login/signup flows tested
   - [ ] Acceptance Criteria 2, 3, 5, 6 pass

4. **Phase 4 Complete (Polish):**
   - [ ] Documentation complete
   - [ ] Supabase Auth cleanup complete
   - [ ] All acceptance criteria pass
   - [ ] Code reviewed and approved
   - [ ] Staging deployment successful

**Exit Criteria:**
- No Better Auth imports in Domain or Use-Cases layers
- All tests passing in CI
- Documentation complete

---

### Verification Summary Table

| Step | Phase | Risk | Level | Threshold | Artifact Path |
|------|-------|------|-------|-----------|---------------|
| 1.1 | Setup | LOW | NONE | N/A | `packages/domain/src/shared/errors/auth-errors.ts` |
| 1.2 | Setup | LOW | SINGLE | 4.0/5.0 | `packages/domain/src/shared/services/index.ts` |
| 1.3 | Setup | MEDIUM | SINGLE | 4.0/5.0 | `packages/frameworks/src/better-auth/schema.ts` |
| 2.1 | Core | MEDIUM | SINGLE | 4.5/5.0 | `packages/frameworks/src/better-auth/index.ts` |
| 2.2 | Core | HIGH | PANEL | 4.5/5.0 | `packages/adapters/src/auth/gateways/better-auth/BetterAuthGateway.ts` |
| 2.3 | Core | MEDIUM | SINGLE | 4.5/5.0 | `packages/frameworks/src/di/layer/service.ts` |
| 2.4 | Core | MEDIUM | SINGLE | 4.5/5.0 | `apps/backend-server/src/server.ts` |
| 2.5 | Core | MEDIUM | SINGLE | 4.5/5.0 | `packages/adapters/src/auth/gateways/better-auth/__tests__/` |
| 3.1 | User Stories | HIGH | PANEL | 4.5/5.0 | `packages/frameworks/src/stores/auth/better-auth.ts` |
| 3.2 | User Stories | MEDIUM | SINGLE | 4.5/5.0 | `apps/native/src/providers/BetterAuthProvider.tsx` |
| 4.4 | Polish | LOW | NONE | N/A | `.specs/docs/` |
| 4.5 | Polish | MEDIUM | SINGLE | 4.5/5.0 | Cleanup PR |

**Verification Statistics:**
- **Total Steps:** 12
- **PANEL Level (HIGH risk):** 2 steps (2.2, 3.1)
- **SINGLE Level (MEDIUM risk):** 8 steps
- **NONE Level (LOW risk):** 2 steps (1.1, 4.4)
- **Average Threshold:** 4.4/5.0 (weighted by criticality)

---

## Sub-agent Execution

This task MUST be executed using the following sub-agent dispatch strategy:

### Dispatch Rules

1. **Batch 1 Dispatch (Hour 0):**
   - Dispatch Step 1.1 to `haiku` agent
   - Dispatch Step 1.3 to `haiku` agent
   - These execute in parallel

2. **Sequential Dispatch (When dependencies complete):**
   - When Step 1.1 completes: Dispatch Step 1.2 to `haiku`
   - When Step 1.2 AND Step 1.3 complete: Dispatch Step 2.1 to `opus`
   - When Step 2.1 completes: Dispatch Step 2.2 to `opus`
   - When Step 2.2 completes: Dispatch Step 2.3 to `sonnet`
   - When Step 2.3 AND Step 2.1 complete: Dispatch Step 2.4 to `sonnet`

3. **Parallel Dispatch (Hour 10+):**
   - When Step 2.2 AND Step 2.4 complete: Dispatch Step 2.5 to `sonnet` AND Step 3.1 to `opus`
   - These execute in parallel

4. **Client-Side Dispatch (Hour 22+):**
   - When Step 3.1 completes: Dispatch Step 3.2 to `sonnet`
   - When Step 2.1 completes: Dispatch Step 4.4 to `haiku` (docs can start early)

5. **Polish Dispatch (Hour 28+):**
   - When Step 3.2 completes: Dispatch Step 4.4 to `haiku`

6. **Cleanup Dispatch (After Step 3.2):**
   - When Step 3.2 complete: Dispatch Step 4.5 to `sonnet`

### Handoff Requirements

Each sub-agent MUST provide:
1. **Output Files:** All specified output files created/modified
2. **Test Results:** Unit test output showing passing tests
3. **Lint Status:** ESLint and TypeScript compilation pass confirmation
4. **Summary:** Brief summary of changes made
5. **Blockers:** Any issues that prevent next step from starting

### Quality Gates

Before dispatching next step, verify:
- Previous step output files exist
- Tests pass (if applicable)
- No ESLint errors
- TypeScript compilation succeeds
- No breaking changes to public interfaces

### Rollback Coordination

If any step fails:
1. Halt all parallel work in affected batch
2. Re-dispatch failed step with clarification
3. Re-verify outputs before proceeding to dependent steps
4. Update parallelization diagram with actual vs planned timing

---

**Task Status:** Ready for sub-agent execution  
**Last Updated:** 2026-04-18  
**Parallelization Strategy:** See `.specs/scratchpad/parallelize.md`
