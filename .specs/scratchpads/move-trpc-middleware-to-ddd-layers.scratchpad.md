# Scratchpad: Move tRPC middleware to DDD layers

## Task Context

Moving tRPC middleware and context to higher DDD layers - Phase 0-4 breakdown

## Phase 0: Setup (Baselines, Environments)

### Step 0.1: Establish Baseline Metrics

**Goal:** Capture current state before refactoring
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

**Estimated Effort:** 2-3 hours

### Step 0.2: Create Test Environment

**Goal:** Ensure test infrastructure supports new patterns
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

**Estimated Effort:** 2 hours

---

## Phase 1: Foundational (Core Abstractions, DI Wiring)

### Step 1.1: Create Domain Layer Auth Types

**Goal:** Implement AuthContext Value Object and UserRole enum
**Outputs:**

- `packages/domain/src/value-objects/AuthContext.ts`
- `packages/domain/src/enums/UserRole.ts`

**Subtasks:**

1. Define `UserRole` enum (ADMIN, MODERATOR, USER)
2. Create `UserId` branded type if not exists
3. Implement `AuthContext` class with:
   - userId: UserId
   - email: Email (reuse existing)
   - role: UserRole
   - sessionToken?: string
4. Add factory method with Either<ValidationError, AuthContext>
5. Write unit tests

**Success Criteria:**

- `AuthContext.create()` returns Either
- Branded types prevent mixing with other IDs
- Tests pass: 100% domain coverage

**Estimated Effort:** 3-4 hours
**Blockers:** None

### Step 1.2: Define Use Case Ports

**Goal:** Create port interfaces for cross-cutting concerns
**Outputs:**

- `packages/use-cases/src/ports/AuthPort.ts`
- `packages/use-cases/src/ports/TelemetryPort.ts`

**Subtasks:**

1. `AuthPort` interface:
   - `validateToken(token: string): Promise<Either<AuthError, AuthContext>>`
   - `refreshSession(sessionId: string): Promise<Either<AuthError, AuthContext>>`
2. `TelemetryPort` interface:
   - `log(event: TelemetryEvent): Promise<void>`
   - Define `TelemetryEvent` DTO
3. Add domain errors: `AuthError`, `InvalidTokenError`, `SessionExpiredError`

**Success Criteria:**

- Ports have no framework dependencies
- Errors use Either pattern
- TypeScript strict mode passes

**Estimated Effort:** 2-3 hours
**Blockers:** Requires Step 1.1 (AuthContext)

### Step 1.3: Update DI Module Infrastructure

**Goal:** Register new dependencies in awilix-modular
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

**Estimated Effort:** 2-3 hours
**Blockers:** Requires Step 1.2 (ports defined)

---

## Phase 2: User Stories (Ports, Use Cases, Adapters)

### Step 2.1: Implement Authentication Use Case

**Goal:** Extract token validation logic from middleware
**Outputs:**

- `packages/use-cases/src/interactors/AuthenticateUser.ts`
- `packages/use-cases/src/interactors/__tests__/AuthenticateUser.test.ts`

**Subtasks:**

1. Create `AuthenticateUserUseCase` class:
   - Constructor takes `AuthPort`
   - `execute(token: string): Promise<Either<AuthError, AuthContext>>`
2. Implement logic:
   - Validate token via port
   - Return AuthContext on success
   - Return AuthError on failure
3. Write unit tests:
   - Success path returns AuthContext
   - Invalid token returns left
   - Expired session returns left

**Success Criteria:**

- Use case is framework-agnostic
- Tests use mocked AuthPort (no Supabase/tRPC)
- Either type properly propagated

**Estimated Effort:** 4-5 hours
**Blockers:** Requires Step 1.2 (AuthPort), Step 1.3 (DI)
**Risks:** Token validation logic might be scattered - need to consolidate from `protectedProcedure`

### Step 2.2: Implement Authorization Use Cases

**Goal:** Move role-based checks to use case layer
**Outputs:**

- `packages/use-cases/src/interactors/AuthorizeAdmin.ts`
- `packages/use-cases/src/interactors/AuthorizeModerator.ts`
- Unit tests for both

**Subtasks:**

1. `AuthorizeAdminUseCase`:
   - `execute(authContext: AuthContext): Either<PermissionDenied, Authorized>`
   - Check `authContext.role === UserRole.ADMIN`
2. `AuthorizeModeratorUseCase`:
   - Check `role === MODERATOR || role === ADMIN`
3. Both return Either with domain errors
4. Write unit tests:
   - Admin role passes
   - Moderator role passes/fails appropriately
   - User role fails with PermissionDenied

**Success Criteria:**

- No async needed (pure domain logic)
- Either pattern for all errors
- 100% test coverage

**Estimated Effort:** 3-4 hours
**Blockers:** Requires Step 1.1 (UserRole, AuthContext)
**Risks:** Authorization logic might be embedded in multiple middleware - verify all locations

### Step 2.3: Implement Telemetry Use Case

**Goal:** Extract mobileAppMiddleware logging
**Outputs:**

- `packages/use-cases/src/interactors/LogTelemetry.ts`
- Unit tests

**Subtasks:**

1. Create `TelemetryEvent` DTO:
   - userAgent: string
   - appVersion?: string
   - platform?: string
   - timestamp: Date
   - userId?: UserId
2. `LogTelemetryUseCase`:
   - `execute(event: TelemetryEvent): Promise<void>`
   - Calls `TelemetryPort.log(event)`
3. Write tests with mocked TelemetryPort

**Success Criteria:**

- Use case delegates to port
- No Prisma/Direct DB access in use case
- Async/await pattern

**Estimated Effort:** 2-3 hours
**Blockers:** Requires Step 1.2 (TelemetryPort)

### Step 2.4: Implement Supabase Auth Adapter

**Goal:** Create framework-specific AuthPort implementation
**Outputs:**

- `packages/adapters/src/gateways/SupabaseAuthAdapter.ts`
- `packages/adapters/src/gateways/__tests__/SupabaseAuthAdapter.test.ts`

**Subtasks:**

1. Create adapter class implementing `AuthPort`
2. Inject `SupabaseClient` via DI
3. Implement `validateToken`:
   - Call `supabase.auth.getUser(token)`
   - Map Supabase response to AuthContext
   - Handle errors with Either.left
4. Integration test with real Supabase (or mock for unit)

**Success Criteria:**

- Adapter wraps Supabase dependency
- Returns Either types
- No business logic (just mapping)

**Estimated Effort:** 3-4 hours
**Blockers:** Requires Step 1.2 (AuthPort), Step 2.1 (understand use case needs)
**Risks:** Supabase auth API surface area - may need additional methods

### Step 2.5: Implement Prisma Telemetry Adapter

**Goal:** Create TelemetryPort implementation
**Outputs:**

- `packages/adapters/src/gateways/PrismaTelemetryAdapter.ts`
- Tests

**Subtasks:**

1. Inject `PrismaClient` via DI
2. Implement `log(event: TelemetryEvent)`:
   - Write to userAgent table (or appropriate table)
   - Handle Prisma errors
3. Write integration tests with test database

**Success Criteria:**

- Persists telemetry data
- Error handling for DB failures
- No use case logic in adapter

**Estimated Effort:** 2-3 hours
**Blockers:** Requires Step 1.2 (TelemetryPort)

### Step 2.6: Refactor tRPC Middleware to Thin Wrappers

**Goal:** Replace inline auth logic with use case delegation
**Outputs:**

- Updated `packages/adapters/src/api/trpc.ts`

**Subtasks:**

1. Refactor `protectedProcedure`:
   - Extract token from context/request
   - Resolve `authenticateUserUseCase` from DI
   - Call use case, handle Either result
   - Set `ctx.authContext` on success
2. Refactor `adminProcedure`:
   - Get authContext from ctx
   - Resolve `authorizeAdminUseCase`
   - Validate role, handle Either
3. Refactor `moderatorProcedure` similarly
4. Refactor `mobileAppMiddleware`:
   - Resolve `logTelemetryUseCase`
   - Call with extracted headers
5. Ensure backward-compatible `TRPCContext` shape

**Success Criteria:**

- Middleware contains zero business logic
- All decisions delegated to use cases
- Existing router files need no changes
- All existing tests pass

**Estimated Effort:** 6-8 hours
**Blockers:** Requires Step 2.1, 2.2, 2.3 (use cases), Step 2.4, 2.5 (adapters)
**Risks:**

- **HIGH:** Breaking existing context shape could affect 156+ routes
- **HIGH:** Error propagation to tRPC - need proper error mapping

---

## Phase 3: Migration (Router Updates, Backward Compatibility)

### Step 3.1: Verify Router Compatibility

**Goal:** Ensure all existing routes work unchanged
**Outputs:**

- Compatibility report
- Migration test results

**Subtasks:**

1. List all 19 router files
2. Run existing integration tests
3. Check for direct context property access beyond auth
4. Document any required context deprecations

**Success Criteria:**

- All existing tests pass without modification
- No changes needed in `packages/adapters/src/api/routers/`
- Context shape preserved

**Estimated Effort:** 3-4 hours
**Blockers:** Requires Step 2.6 (middleware refactored)

### Step 3.2: Update Controller Auth Helpers

**Goal:** Refactor authServer.ts to use new use cases
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

**Estimated Effort:** 2-3 hours
**Blockers:** Requires Step 2.1, 2.2 (auth use cases)

### Step 3.3: Create Migration Guide

**Goal:** Document changes for developers
**Outputs:**

- Migration guide in `.specs/tasks/in-progress/`

**Subtasks:**

1. Document old vs new patterns
2. Provide example refactors for common scenarios
3. Add troubleshooting section

**Success Criteria:**

- Clear before/after examples
- Common pitfalls documented

**Estimated Effort:** 2 hours

---

## Phase 4: Polish (Cleanup, Final Verification)

### Step 4.1: Comprehensive Testing

**Goal:** Full test coverage for new components
**Outputs:**

- Unit tests: all new use cases
- Integration tests: router + middleware
- dependency-cruiser validation

**Subtasks:**

1. Write missing unit tests for any gaps
2. Run `bun test --coverage` - target 80%
3. Run `bunx dependency-cruiser --validate .dependency-cruiser.mjs .`
4. Verify no domain/use-case imports from @trpc/server

**Success Criteria:**

- Coverage meets threshold
- No architectural violations
- All tests pass

**Estimated Effort:** 4-6 hours
**Blockers:** All previous steps complete

### Step 4.2: Documentation Updates

**Goal:** Update CLAUDE.md with new patterns
**Outputs:**

- Updated CLAUDE.md (if needed)
- Code comments for DI wiring

**Subtasks:**

1. Check if auth pattern examples exist in CLAUDE.md
2. Add authentication/authorization pattern section
3. Document new ports and use cases

**Success Criteria:**

- Future developers can follow patterns
- DI setup documented

**Estimated Effort:** 2-3 hours

### Step 4.3: Final Review and Cleanup

**Goal:** Remove deprecated code, polish
**Outputs:**

- Clean codebase
- Deprecation markers on old patterns

**Subtasks:**

1. Add `@deprecated` JSDoc to old auth functions
2. Remove dead code if safe
3. Final lint check: `bunx eslint .`
4. Format: `bunx prettier --write`

**Success Criteria:**

- No lint errors
- Clean imports (no unused)
- Deprecation warnings help migration

**Estimated Effort:** 2 hours

---

## Risk Analysis

### High Priority Risks

| Risk                                             | Probability | Impact   | Mitigation                                                                                                                                                       |
| ------------------------------------------------ | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breaking existing routes with context change     | High        | Critical | Maintain backward-compatible TRPCContext shape during migration; add deprecation notices instead of immediate removal; extensive integration testing in Step 3.1 |
| Token validation scattered in multiple locations | Medium      | Medium   | Thorough code search in Step 0.1; create inventory; consolidate all auth logic into use case                                                                     |
| Supabase auth edge cases                         | Medium      | Medium   | Integration tests with real Supabase in test environment; document all token validation scenarios                                                                |
| Error propagation to tRPC format changes         | Medium      | High     | Ensure Either errors map to existing tRPC error format; test error responses match current behavior                                                              |

### Medium Priority Risks

| Risk                                     | Probability | Impact | Mitigation                                                                        |
| ---------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------- |
| DI scope issues with request-scoped auth | Medium      | Medium | Test scoped container creation; verify ordering (auth before dependent use cases) |
| Performance regression from extra layers | Low         | Medium | Benchmark before/after; use cases are thin wrappers, overhead should be minimal   |
| Test flakiness with async auth           | Low         | Low    | Proper async/await in tests; no Promise.all without proper handling               |

---

## Critical Path

```
Step 1.1 (Domain types)
    → Step 1.2 (Ports)
        → Step 1.3 (DI)
            → Step 2.1 (Auth Use Case)
                → Step 2.4 (Supabase Adapter)
                    → Step 2.6 (Middleware)
                        → Step 3.1 (Compatibility)
                            → Step 4.1 (Final verification)
```

**Critical path length:** 9 steps
**Estimated critical path duration:** ~35 hours

---

## Implementation Summary Table

| Phase | Step | Goal                    | Effort | Dependencies | Risk Level |
| ----- | ---- | ----------------------- | ------ | ------------ | ---------- |
| 0     | 0.1  | Baseline metrics        | 2-3h   | None         | Low        |
| 0     | 0.2  | Test environment        | 2h     | None         | Low        |
| 1     | 1.1  | Domain auth types       | 3-4h   | None         | Low        |
| 1     | 1.2  | Use case ports          | 2-3h   | 1.1          | Low        |
| 1     | 1.3  | DI modules              | 2-3h   | 1.2          | Medium     |
| 2     | 2.1  | Auth use case           | 4-5h   | 1.2, 1.3     | Medium     |
| 2     | 2.2  | Authorization use cases | 3-4h   | 1.1          | Medium     |
| 2     | 2.3  | Telemetry use case      | 2-3h   | 1.2          | Low        |
| 2     | 2.4  | Supabase adapter        | 3-4h   | 1.2, 2.1     | Medium     |
| 2     | 2.5  | Prisma adapter          | 2-3h   | 1.2          | Low        |
| 2     | 2.6  | Middleware refactor     | 6-8h   | 2.1-2.5      | High       |
| 3     | 3.1  | Router compatibility    | 3-4h   | 2.6          | High       |
| 3     | 3.2  | Controller updates      | 2-3h   | 2.1, 2.2     | Medium     |
| 3     | 3.3  | Migration guide         | 2h     | All phase 2  | Low        |
| 4     | 4.1  | Testing & validation    | 4-6h   | All          | Medium     |
| 4     | 4.2  | Documentation           | 2-3h   | All          | Low        |
| 4     | 4.3  | Cleanup                 | 2h     | All          | Low        |

**Totals:**

- Total Steps: 17
- Total Subtasks: ~45
- Total Estimated Effort: 45-60 hours
- High Risk Steps: 2 (Step 2.6, Step 3.1)
- Critical Path Steps: 9

---

## Definition of Done (Refined)

### Technical Completion

- [ ] All 7 new core files created
- [ ] All 2+ modified files updated
- [ ] 19 router files unchanged (verified compatible)
- [ ] Zero business logic in tRPC middleware
- [ ] dependency-cruiser validates no domain/use-case tRPC imports

### Quality Gates

- [ ] Unit test coverage ≥80% for new use cases
- [ ] Integration tests pass for all protected routes
- [ ] Baseline metrics show no coverage regression
- [ ] No lint errors, no TypeScript errors

### Documentation

- [ ] Migration guide complete
- [ ] CLAUDE.md updated with auth patterns
- [ ] Code comments for DI wiring
- [ ] Deprecation notices on old functions

### Verification

- [ ] All acceptance criteria pass (7 criteria)
- [ ] Manual testing of protected/admin/moderator routes
- [ ] Telemetry logging verified
- [ ] Performance benchmark (no regression >10%)

---

## Notes & Open Questions

1. **Supabase auth implementation details:** Need to verify exact Supabase API methods for token validation
2. **Telemetry table schema:** Verify exact table structure for userAgent logging
3. **Effect removal:** CLAUDE.md mentions Either only - but I saw Effect references in Architecture Overview. Verify current state.
4. **Request-scoped DI:** Verify `createRequestScope()` implementation supports auth context injection
5. **Error mapping:** Ensure Either errors map to existing tRPC error responses to avoid client-breaking changes

---

_Created: 2026-04-09_
_Status: Ready for task file integration_
