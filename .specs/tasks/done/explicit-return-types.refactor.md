---
title: Implement Explicit Return Type Annotations Convention
type: refactor
priority: medium
depends_on: []
created: 2026-04-17
---

# Implement Explicit Return Type Annotations Convention

## Description

The codebase currently uses verbose, repetitive explicit return type annotations on all class methods (e.g., `Effect.Effect<Group | null, DatabaseError, never>`). This approach locks error types to single concrete types, preventing natural union composition and creating ongoing maintenance burden when error types evolve.

This refactor establishes an **inference-first** convention for return type annotations. The key innovation is using an abstract error interface (`IPortError`) in port definitions, enabling concrete error implementations to compose naturally via union types in gateway implementations. Interface definitions remain explicit (contracts must be clear), while implementations use TypeScript inference (reducing boilerplate while maintaining type safety through interface satisfaction).

**Key Principles:**

1. **Abstract error interfaces** (`IPortError`) allow concrete error implementations to compose naturally
2. **Inference for implementations** — classes implementing interfaces use type inference
3. **Explicit for contracts** — interface definitions remain explicit
4. **ESLint guards** — automated checks catch unsafe inference (`any`, `unknown`)

This change improves developer productivity by reducing boilerplate, enhances maintainability by making error type changes non-breaking, and preserves full type safety through interface contracts and ESLint enforcement.

**Scope:**

- **Included**: Creating `IPortError` interface, updating error classes, ESLint configuration, all domains migration (User, Group, Trip, Challenge, Reward, Activity, Location, Sponsor, Coin, Notification, Submission, Storage), Either testing patterns, documentation updates
- **Excluded**: Big-bang rewrites, bypassing type checking

// SCOPE EXPANSION: All domains included per user request

**User Scenarios:**

1. **Primary Flow**: Developer implements new gateway using inference-first convention with IPortError interface and Either testing patterns
2. **Alternative Flow**: Developer migrates existing gateway by removing explicit return types while preserving interface contract
3. **Error Handling**: ESLint catches unsafe inference, TypeScript validates interface satisfaction, tests verify with type-safe Either patterns

## Acceptance Criteria

### Functional Requirements

- [ ] **IPortError Interface Created**: Interface exists in `packages/domain/src/shared/errors/ports.ts` with `_tag: string` and `message: string` properties
  - Given: Task is started
  - When: Interface is defined
  - Then: It exports `IPortError` with required properties

- [ ] **Error Classes Implement IPortError**: All existing port error classes implement the `IPortError` interface
  - Given: `IPortError` interface exists
  - When: Concrete error classes are defined
  - Then: All error classes have `implements IPortError`

- [ ] **ESLint Configuration Updated**: ESLint allows inference for interface implementations
  - Given: Error classes are updated
  - When: ESLint config is modified with `allowOverrideWithoutType: true`
  - Then: Adapters and use-cases packages allow inferred return types

- [ ] **All Domains Migrated**: All domain gateways use inferred return types
  - Given: ESLint is configured
  - When: All gateway methods across all domains are updated
  - Then: No explicit return type annotations on gateway methods (inference used)

- [ ] **Tests Use Either Patterns**: All domain tests use `Effect.either` with `Either.isLeft/isRight`
  - Given: All domains are migrated
  - When: Tests are updated
  - Then: Tests use `Effect.either` and `Either.isLeft`/`Either.isRight` for error handling

- [ ] **Documentation Updated**: AGENTS.md and CLAUDE.md reflect new convention
  - Given: All technical changes complete
  - When: Documentation is reviewed
  - Then: Clear examples of inference-first pattern with IPortError

### Non-Functional Requirements

- [ ] **TypeScript Compilation**: Zero compilation errors after migration
  - Given: All changes are made
  - When: `bun run typecheck` executes
  - Then: No TypeScript errors reported

- [ ] **Test Pass Rate**: 100% of tests pass after migration
  - Given: Migration is complete
  - When: `bun test` executes
  - Then: All tests pass

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] Code reviewed and approved
- [ ] Documentation updated with clear examples
- [ ] No decrease in type coverage or safety

## Notes

See `.specs/plans/explicit-return-types.design.md` for full design document with detailed migration strategy, code examples, and testing patterns.

Migration phases (reference):

1. Setup (1-2 days): Create interface, update errors, configure ESLint
2. Domain Migration (2-3 weeks): Migrate all domains (User, Group, Trip, Challenge, Reward, Activity, Location, Sponsor, Coin, Notification, Submission, Storage)
3. Documentation (2-3 days): Update AGENTS.md and CLAUDE.md
4. Enforcement: Enable strict lint rules

## Implementation

### Architecture Overview

#### Solution Strategy

**Core Approach:** Establish an inference-first convention for return type annotations using an abstract error interface pattern.

**Key Decisions:**

1. **Abstract Error Interface (`IPortError`):** Creates a base interface with `_tag: string` and `message: string` that all error classes implement. This enables concrete error types to compose naturally via union types in implementations (e.g., `DatabaseError | NotFoundError | ValidationError`).

2. **Inference-First for Implementations:** Classes implementing interfaces use TypeScript type inference instead of explicit annotations. The interface contract serves as the source of truth; TypeScript validates implementation satisfaction structurally.

3. **Explicit Contracts for Interfaces:** Port interfaces maintain explicit return type annotations using the abstract `IPortError` type. This ensures clear API contracts while allowing implementations flexibility.

4. **ESLint Configuration Strategy:** Two-tier approach: (a) Base config requires explicit types for all exported functions, (b) Override for adapters/use-cases packages allows inference with `allowOverrideWithoutType: true`.

5. **Testing Pattern Updates:** Migrate from `_tag` string checking to `Effect.either` with `Either.isLeft/isRight` guards and `instanceof` for type-safe error verification.

**Trade-offs:**

- **Pros:** Reduced boilerplate, natural error union composition, easier maintenance when error types evolve, preserved type safety through interface contracts.
- **Cons:** Requires one-time interface update, adds minimal abstraction layer (`IPortError`), developers need awareness of when to use explicit vs inferred types.

#### Component Overview

This is a cross-cutting refactoring affecting all Clean Architecture layers:

- **Domain Layer:** New `IPortError` interface; port interfaces updated to use `IPortError` instead of concrete error types; error classes implement `IPortError`.
- **Use-Cases Layer:** Port definitions (Context.Tags) updated to reference interfaces using `IPortError`; interactors naturally benefit from inference.
- **Adapters Layer:** All gateway implementations remove explicit return type annotations; error unions form naturally from implementation logic.
- **Configuration:** ESLint rules updated to allow inference for interface implementations while maintaining strictness elsewhere.

#### Data Flow

No runtime data flow changes - this is a compile-time type system refactoring only.

**Type Flow:**

1. Interface defines contract: `findById(): Effect<User | null, IPortError, never>`
2. Implementation satisfies contract: `findById() { ... }` infers to `Effect<User | null, DatabaseError | NotFoundError, never>`
3. Use-case consumes: `yield* userPort.findById(id)` receives properly typed results
4. Test verifies: `Effect.either` + `Either.isLeft/isRight` + `instanceof` for assertions

#### Integration Points

| Integration          | Change                                                                 | Validation                                              |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| Domain → Use-Cases   | Port interfaces change error type from `DatabaseError` to `IPortError` | TypeScript validates; all ports updated together        |
| Use-Cases → Adapters | Gateway implementations remove explicit annotations                    | Interface satisfaction validated by TypeScript compiler |
| Error Classes        | All implement `IPortError` interface                                   | Single file change: `domain-errors.ts`                  |
| ESLint Config        | New override rules for adapters/use-cases                              | Phased rollout; fix errors incrementally                |
| Tests                | Either patterns replace `_tag` checking                                | Update existing tests; create new gateway tests         |

#### Expected Changes

**Files to Create (1):**

- `packages/domain/src/shared/errors/ports.ts` - `IPortError` interface

**Files to Modify (Full Scope - All Domains):**

**Domain Layer (11 port files):**

- `packages/domain/src/shared/errors/domain-errors.ts` - Add `implements IPortError`
- `packages/domain/src/user/ports/UserPort.ts` - Change error type to `IPortError`
- `packages/domain/src/group/ports/GroupPort.ts` - Change error type to `IPortError`
- `packages/domain/src/group/ports/GroupJoinRequestPort.ts` - Change error type to `IPortError`
- `packages/domain/src/trip/ports/TripPort.ts` - Change error type to `IPortError`
- `packages/domain/src/challenge/ports/ChallengePort.ts` - Change error type to `IPortError`
- `packages/domain/src/reward/ports/RewardPort.ts` - Change error type to `IPortError`
- `packages/domain/src/reward/ports/RewardPurchasePort.ts` - Change error type to `IPortError`
- `packages/domain/src/location/ports/LocationPort.ts` - Change error type to `IPortError`
- `packages/domain/src/activity/ports/ActivityFeedPort.ts` - Change error type to `IPortError`
- `packages/domain/src/sponsor/ports/SponsorPort.ts` - Change error type to `IPortError`

**Use-Cases Layer (22 port files):**

- All domain port Tags updated to reference interfaces with `IPortError`
- User, Group, Trip, Challenge, ChallengeSubmission, ChallengeVote, ActivityFeed, ActivityReaction, Reward, RewardPurchase, Location, LocationSharing, Sponsor, TripSponsor, Coin, Notification, SubmissionReport, Storage ports

**Adapter Layer (47 gateway files):**

- **User (4):** UserDrizzleGateway, InMemoryUserGateway, TripParticipantDrizzleGateway, InMemoryTripParticipantGateway
- **Group (4):** GroupDrizzleGateway, InMemoryGroupGateway, GroupJoinRequestDrizzleGateway, InMemoryGroupJoinRequestGateway
- **Trip (2):** TripDrizzleGateway, InMemoryTripGateway
- **Challenge (6):** ChallengeDrizzleGateway, InMemoryChallengeGateway, ChallengeSubmissionDrizzleGateway, InMemoryChallengeSubmissionGateway, ChallengeVoteDrizzleGateway, InMemoryChallengeVoteGateway
- **Activity (2):** ActivityFeedDrizzleGateway, InMemoryActivityFeedGateway, ActivityReactionDrizzleGateway, InMemoryActivityReactionGateway
- **Reward (4):** RewardDrizzleGateway, InMemoryRewardGateway, RewardPurchaseDrizzleGateway, InMemoryRewardPurchaseGateway
- **Location (4):** LocationDrizzleGateway, InMemoryLocationGateway, LocationSharingRequestDrizzleGateway, InMemoryLocationSharingRequestGateway
- **Sponsor (4):** SponsorDrizzleGateway, InMemorySponsorGateway, TripSponsorDrizzleGateway, InMemoryTripSponsorGateway
- **Coin (2):** CoinTransactionDrizzleGateway, InMemoryCoinTransactionGateway
- **Notification (6):** NotificationDrizzleGateway, InMemoryNotificationGateway, PushSubscriptionDrizzleGateway, InMemoryPushSubscriptionGateway, NotificationDeliveryDrizzleGateway, InMemoryNotificationDeliveryGateway, NotificationScheduleDrizzleGateway, InMemoryNotificationScheduleGateway
- **Submission (2):** SubmissionReportDrizzleGateway, InMemorySubmissionReportGateway
- **Storage (3):** SupabaseStorageGateway, SupabaseStorageAdapter, InMemoryStorageGateway
- **Service (2):** SupabaseAuthGateway, SupabaseRealtimeGateway

**Configuration (3 files):**

- `eslint.config.base.js` - Add `explicit-function-return-type` rule
- `packages/adapters/eslint.config.js` - Add override with `allowOverrideWithoutType: true`
- `packages/use-cases/eslint.config.js` - Add override with `allowOverrideWithoutType: true`

**Tests (8+ files):**

- All domain test files - Update to Either patterns

**Total: ~80 files across all domains**

#### Risk Analysis

| Risk                                    | Likelihood | Impact | Mitigation                                                        |
| --------------------------------------- | ---------- | ------ | ----------------------------------------------------------------- |
| Interface contract breakage             | Low        | High   | Update all User domain ports together; TypeScript validates       |
| Unsafe type inference (`any`/`unknown`) | Low        | Medium | ESLint configuration prevents unsafe inference                    |
| Developer confusion about conventions   | Medium     | Low    | Clear documentation in AGENTS.md; code review checklist           |
| Test breakage with new patterns         | Medium     | Medium | Pilot domain first; comprehensive test updates included           |
| Partial migration state                 | Low        | High   | Migrate all domains in this task; clear domain-by-domain tracking |
| In-memory/drizzle gateway parity        | Low        | High   | Migrate both implementations together in pilot                    |

**Rollback Strategy:** If issues arise, revert changes domain-by-domain; keep `IPortError` interface (no harm). Do not roll back ESLint changes (additive/safe).

## Implementation Process

### Phase 1: Setup (Days 1-2)

#### Step 1: Create IPortError Interface

**Agent:** sdd:developer  
**Parallel with:** Step 3 (ESLint base rules)  
**Blocked by:** None  
**Triggers:** Step 2

**Goal:** Define the base interface that all port errors will implement, enabling natural error union composition.

**Files/Outputs:**

- Create: `packages/domain/src/shared/errors/ports.ts`

**Success Criteria:**

- File exists at `packages/domain/src/shared/errors/ports.ts`
- Interface exports `IPortError` with required properties:
  - `readonly _tag: string`
  - `readonly message: string`
- TypeScript compilation passes: `bun tsc --noEmit` (project-wide)

**Subtasks:**

1. Create file with IPortError interface
2. Add JSDoc comments explaining the interface purpose
3. Run TypeScript check to ensure no errors

**Blockers:** None

**Risks:**

- **Risk:** File location may conflict with existing error exports
  - **Mitigation:** Check `packages/domain/src/shared/errors/index.ts` for existing exports
- **Risk:** Naming conflict with existing port-related types
  - **Mitigation:** Verify no existing `IPortError` type in codebase

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Completeness (weight: 0.35)
   - Are all required properties present (\_tag: string, message: string)?
   - Are properties correctly typed as readonly?
   - 1=Missing critical properties, 2=Some issues, 3=Adequate, 4=Complete, 5=Perfect contract

2. Type Safety (weight: 0.25)
   - Does interface enable proper error composition?
   - Are types compatible with Data.TaggedError pattern?
   - 1=Type issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Excellent type design

3. Export Structure (weight: 0.20)
   - Is file correctly exported from index.ts?
   - No circular import issues with domain-errors.ts?
   - 1=Export issues, 2=Partial, 3=Adequate, 4=Good, 5=Perfect structure

4. Documentation Quality (weight: 0.20)
   - Are JSDoc comments present explaining purpose?
   - Is usage pattern clear from documentation?
   - 1=No docs, 2=Basic, 3=Adequate, 4=Good, 5=Excellent documentation

**Threshold**: 4.0/5.0

---

#### Step 2: Update Error Classes to Implement IPortError

**Agent:** sdd:developer  
**Parallel with:** Step 3 (ESLint base rules)  
**Blocked by:** Step 1  
**Triggers:** Step 4 (with Step 3)

**Goal:** Make all existing domain error classes implement the `IPortError` interface.

**Files/Outputs:**

- Modify: `packages/domain/src/shared/errors/domain-errors.ts` (add `implements IPortError` to ~11 error classes)

**Success Criteria:**

- All error classes have `implements IPortError`:
  - `DatabaseError implements IPortError`
  - `ApplicationError implements IPortError`
  - `ValidationError implements IPortError`
  - `InvalidIdError implements IPortError`
  - `EntityNotFoundError implements IPortError`
  - `EntityAlreadyExistsError implements IPortError`
  - `UnauthorizedError implements IPortError`
  - `InvalidStateTransitionError implements IPortError`
  - `InsufficientResourcesError implements IPortError`
  - `TimeConstraintError implements IPortError`
  - `DuplicateActionError implements IPortError`
- Each class provides `readonly message` property
- `bun tsc --noEmit` passes
- `bun test` passes (100%)

**Subtasks:**

1. Import `IPortError` from `./ports`
2. Add `implements IPortError` to each error class
3. Add `readonly message` property to each class (use appropriate default message)
4. Run tests to verify backward compatibility

**Blockers:** Step 1

**Risks:**

- **Risk:** Circular import if ports.ts imports from domain-errors.ts
  - **Mitigation:** Ensure unidirectional dependency (domain-errors.ts imports from ports.ts only)
- **Risk:** Missing message properties causing TypeScript errors
  - **Mitigation:** Add message property to each class with descriptive default

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Implementation Correctness (weight: 0.30)
   - Do all 11 error classes implement IPortError?
   - Are implements clauses correctly placed?
   - 1=Multiple missing, 2=Some missing, 3=Most present, 4=All present, 5=All present with proper syntax

2. Message Property Presence (weight: 0.25)
   - Does each class provide readonly message property?
   - Are messages descriptive and appropriate?
   - 1=Many missing, 2=Some missing, 3=Most present, 4=All present, 5=All present with quality messages

3. Import Structure (weight: 0.25)
   - Is IPortError imported correctly from ./ports?
   - No circular imports introduced?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. Backward Compatibility (weight: 0.20)
   - Do existing tests still pass?
   - No breaking changes to error class behavior?
   - 1=Broken tests, 2=Some issues, 3=Adequate, 4=Good, 5=Fully compatible

**Threshold**: 4.0/5.0

---

#### Step 3: Configure ESLint Base Rules

**Agent:** sdd:developer  
**Parallel with:** Steps 1-2  
**Blocked by:** None  
**Triggers:** Step 4

**Goal:** Add `explicit-function-return-type` rule to base configuration to catch unsafe inference.

**Files/Outputs:**

- Modify: `eslint.config.base.js`

**Success Criteria:**

- Rule `@typescript-eslint/explicit-function-return-type` is added to base config
- Configuration includes:
  - `allowExpressions: true`
  - `allowTypedFunctionExpressions: true`
  - `allowHigherOrderFunctions: true`
- `bun lint` runs without errors on existing code (baseline)

**Subtasks:**

1. Add rule to base config
2. Run lint on entire codebase to establish baseline
3. Document any baseline violations that need addressing

**Blockers:** None (can run parallel with Steps 1-2)

**Risks:**

- **Risk:** Many existing violations in non-gateway files
  - **Mitigation:** Set to "warn" initially, address gradually or use overrides
- **Risk:** Conflict with existing ESLint configurations
  - **Mitigation:** Review all eslint.config.js files for conflicting rules

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Rule Configuration Correctness (weight: 0.30)
   - Is @typescript-eslint/explicit-function-return-type rule present?
   - Are options correctly set (allowExpressions, allowTypedFunctionExpressions, allowHigherOrderFunctions)?
   - 1=Missing/wrong rule, 2=Partial config, 3=Adequate, 4=Good, 5=Perfect configuration

2. Baseline Validation (weight: 0.30)
   - Does bun lint pass on existing code?
   - Are baseline violations documented?
   - 1=Lint broken, 2=Many undocumented issues, 3=Adequate, 4=Good, 5=Clean baseline

3. Conflict Resolution (weight: 0.25)
   - No conflicts with existing ESLint configs?
   - All package configs properly extend base?
   - 1=Conflicts present, 2=Minor issues, 3=Adequate, 4=Good, 5=No conflicts

4. Scope Appropriateness (weight: 0.15)
   - Rule applies to correct file patterns?
   - Not overly broad or narrow?
   - 1=Wrong scope, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect scope

**Threshold**: 4.5/5.0

---

#### Step 4: Configure Package ESLint Overrides

**Agent:** sdd:developer  
**Parallel with:** None  
**Blocked by:** Steps 2, 3  
**Triggers:** Steps 6-7

**Goal:** Allow inference for interface implementations in adapters and use-cases packages.

**Files/Outputs:**

- Modify: `packages/adapters/eslint.config.js`
- Modify: `packages/use-cases/eslint.config.js`

**Success Criteria:**

- Both configs have override with `allowOverrideWithoutType: true`
- Adapters config removes lenient rules (if present) and uses standard base config
- Override specifically targets `packages/adapters/src/**/*.ts` and `packages/use-cases/src/**/*.ts`
- `bun lint` passes in both packages

**Subtasks:**

1. Update adapters config with override for explicit-function-return-type
2. Update use-cases config with override for explicit-function-return-type
3. If adapters has lenient config, migrate to standard base config
4. Run `bun lint` in both packages to verify

**Blockers:** Step 3

**Risks:**

- **Risk:** Adapters currently has lenient rules that mask issues
  - **Mitigation:** Document current violations, address critical ones before migration
- **Risk:** Override scope too broad or too narrow
  - **Mitigation:** Use specific glob patterns: `packages/adapters/src/**/*.ts`

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Override Configuration Correctness (weight: 0.35)
   - Is allowOverrideWithoutType: true present in both configs?
   - Are override patterns specific and correct?
   - 1=Missing in both, 2=One present, 3=Both present with issues, 4=Both correct, 5=Perfect config

2. Scope Accuracy (weight: 0.30)
   - Do overrides target correct packages (adapters, use-cases)?
   - Are glob patterns specific enough?
   - 1=Wrong scope, 2=Minor issues, 3=Adequate, 4=Good, 5=Precise scope

3. Lint Pass (weight: 0.20)
   - Does bun lint pass in both packages?
   - No new lint errors introduced?
   - 1=Lint fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean pass

4. Migration Path (weight: 0.15)
   - If adapters had lenient rules, is migration to standard config documented?
   - Critical violations addressed?
   - 1=Not addressed, 2=Partial, 3=Adequate, 4=Good, 5=Fully migrated

**Threshold**: 4.0/5.0

---

### Phase 2: Domain Migration (Days 3-18)

**Note:** Each domain follows the same 4-step pattern: (1) Update Domain Port, (2) Update Use-Cases Port Tags, (3) Migrate Drizzle Gateway, (4) Migrate In-Memory Gateway. Domains with sub-features (Challenge, Reward, Activity, Location, Notification, Sponsor) include additional sub-feature gateways.

#### Step 5: Update IUserPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 11, 15, 18, 24, 28, 32, 36, 40, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 6-7 (User Port Tags), Steps 8-10 (User Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/user/ports/UserPort.ts`

**Success Criteria:**

- All method signatures in `IUserPort` use `IPortError` instead of `DatabaseError`
- Example: `findById(id: UserId): Effect.Effect<User | null, IPortError, never>`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify 7 methods updated (findById, findByEmail, findByProvider, create, update, delete, list)

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change begins here; compilation will fail until gateway steps complete
  - **Mitigation:** Complete domain port updates before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface (interfaces must stay explicit)
  - **Mitigation:** Review diff carefully; interfaces keep explicit types, only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all 7 methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface (only on implementations)?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 6: Update UserPort Context.Tag (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** Step 7 (TripParticipantPort Tag)  
**Blocked by:** Step 5  
**Triggers:** Steps 8-10 (User Gateway Migrations)

**Goal:** Update use-cases port definition to reference updated `IUserPort` interface.

**Files/Outputs:**

- Modify: `packages/use-cases/src/user/ports/UserPort.ts`

**Success Criteria:**

- `UserPortTag` references updated `IUserPort` from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify import of `IUserPort` from `@mirai-app/domain`
2. Ensure Context.Tag definition uses correct interface reference
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 5 (must be done together)

**Risks:**

- **Risk:** Context.Tag may have explicit type annotation that needs updating
  - **Mitigation:** Tag class extends Context.Tag with interface type; verify no changes needed

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Does UserPortTag reference updated IUserPort from domain?
   - Is the interface import path correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Is Context.Tag definition structurally correct?
   - No explicit return type issues in Tag definition?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definition

3. Import Accuracy (weight: 0.20)
   - Is IUserPort imported from @mirai-app/domain?
   - Type-only import used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 7: Update TripParticipantPort Context.Tag (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** Step 6 (UserPort Tag)  
**Blocked by:** Step 5  
**Triggers:** Steps 8-10 (User Gateway Migrations)

**Goal:** Same as Step 6 for TripParticipant port.

**Files/Outputs:**

- Modify: `packages/use-cases/src/user/ports/TripParticipantPort.ts`

**Success Criteria:**

- `TripParticipantPortTag` references updated interface from domain
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify import from `@mirai-app/domain`
2. Ensure Context.Tag definition is correct

**Blockers:** Step 5

**Risks:**

- **Risk:** TripParticipant gateway may have different interface location
  - **Mitigation:** Verify interface is in `packages/domain/src/user/ports/`

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Does TripParticipantPortTag reference updated interface from domain?
   - Is the interface import path correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Is Context.Tag definition structurally correct?
   - No explicit return type issues in Tag definition?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definition

3. Import Accuracy (weight: 0.20)
   - Is interface imported from @mirai-app/domain?
   - Type-only import used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

### Phase 2B: User Domain Gateways (Parallel Batch)

**Note:** Steps 8-10 migrate User domain gateways in parallel after port interface updates.

#### Step 8: Update UserDrizzleGateway (Inference Migration)

**Agent:** sdd:developer  
**Parallel with:** Steps 9-10 (User gateway batch) + All other domain gateways (Steps 14, 17, 21-23, 26-27, 30-31, 34-35, 38-39, 42, 45, 48, 51)  
**Blocked by:** Steps 5-7 (User port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations; let TypeScript infer from interface.

**Files/Outputs:**

- Modify: `packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts`

**Success Criteria:**

- All 7 method implementations have explicit return type annotations removed
- Class still `implements IUserPort`
- Hover over methods shows inferred union types (e.g., `Effect<User | null, DatabaseError | NotFoundError, never>`)
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Remove `: Effect.Effect<...>` return type from each method
2. Keep method signatures otherwise intact (parameter types, names)
3. Verify error unions form naturally from yield\* statements
4. Test hover information in IDE for type inference
5. Run tests

**Blockers:** Steps 5-7 (interface must be updated first)

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Methods no longer satisfy interface contract
  - **Mitigation:** TypeScript will error; ensure interface is correctly updated
- **Risk:** Complex methods may have inference issues
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all 7 methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Does class still implement IUserPort correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 9: Update InMemoryUserGateway (Inference Migration)

**Agent:** sdd:developer  
**Parallel with:** Steps 8, 10 (User gateway batch) + All other domain gateways  
**Blocked by:** Steps 5-7 (User port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Same as Step 8 for in-memory implementation.

**Files/Outputs:**

- Modify: `packages/adapters/src/user/gateways/in-memory/InMemoryUserGateway.ts`

**Success Criteria:**

- All method implementations have explicit return type annotations removed
- In-memory and drizzle gateways maintain signature parity
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Remove explicit return types from all methods
2. Verify parity with drizzle gateway (same methods, similar error unions)
3. Run tests

**Blockers:** Steps 5-7

**Risks:**

- **Risk:** In-memory gateway may use different error types than drizzle
  - **Mitigation:** Acceptable; error unions will differ naturally (in-memory uses different errors)
- **Risk:** In-memory gateway may be incomplete (missing methods)
  - **Mitigation:** Document gaps; add missing methods or skip in this task

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit return types removed from all methods?
   - Parity with drizzle gateway maintained?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Parity with Drizzle Gateway (weight: 0.25)
   - Do in-memory and drizzle gateways have same method signatures?
   - Are error unions appropriate for in-memory context?
   - 1=Major parity issues, 2=Some issues, 3=Adequate, 4=Good, 5=Perfect parity

3. Type Inference Correctness (weight: 0.25)
   - Does hover show appropriate inferred types?
   - No any/unknown inference?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

4. Test Pass (weight: 0.20)
   - Do all in-memory gateway tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 10: Update TripParticipant Gateways

**Agent:** sdd:developer  
**Parallel with:** Steps 8-9 (User gateway batch) + All other domain gateways  
**Blocked by:** Steps 5-7 (User port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Migrate TripParticipantDrizzleGateway and InMemoryTripParticipantGateway.

**Files/Outputs:**

- Modify: `packages/adapters/src/user/gateways/drizzle/TripParticipantDrizzleGateway.ts`
- Modify: `packages/adapters/src/user/gateways/in-memory/InMemoryTripParticipantGateway.ts`

**Success Criteria:**

- Both gateways have explicit return types removed
- Both implement their respective interfaces
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update drizzle gateway (remove explicit return types)
2. Update in-memory gateway (remove explicit return types)
3. Run tests

**Blockers:** Step 5

**Risks:**

- **Risk:** TripParticipant gateway may have different interface location
  - **Mitigation:** Verify interface is in `packages/domain/src/user/ports/`

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Drizzle Gateway Migration (weight: 0.30)
   - Are explicit return types removed from TripParticipantDrizzleGateway?
   - Does it implement interface correctly?
   - 1=Not migrated, 2=Partial, 3=Adequate, 4=Good, 5=Perfect migration

2. In-Memory Gateway Migration (weight: 0.30)
   - Are explicit return types removed from InMemoryTripParticipantGateway?
   - Does it implement interface correctly?
   - 1=Not migrated, 2=Partial, 3=Adequate, 4=Good, 5=Perfect migration

3. Type Inference (weight: 0.20)
   - Do both gateways show correct inferred types?
   - Error unions form naturally?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

4. Test Pass (weight: 0.20)
   - Do TripParticipant gateway tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2C: Group Domain (Steps 11-14)

#### Step 11: Update IGroupPort and IGroupJoinRequestPort Interfaces (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 15, 18, 24, 28, 32, 36, 40, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 12-14 (Group Port Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/group/ports/GroupPort.ts`
- Modify: `packages/domain/src/group/ports/GroupJoinRequestPort.ts`

**Success Criteria:**

- All method signatures in `IGroupPort` and `IGroupJoinRequestPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures in GroupPort.ts
3. Replace `DatabaseError` with `IPortError` in all method signatures in GroupJoinRequestPort.ts
4. Verify both interfaces compile without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete both interface updates before gateway migrations
- **Risk:** Accidentally removing explicit return types from interfaces
  - **Mitigation:** Interfaces must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods in both interfaces updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interfaces?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 12: Update GroupPort Context.Tag (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** Step 13 (GroupJoinRequestPort Tag)  
**Blocked by:** Step 11  
**Triggers:** Step 14 (Group Gateway Migrations)

**Goal:** Update use-cases port definition to reference updated `IGroupPort` interface.

**Files/Outputs:**

- Modify: `packages/use-cases/src/group/ports/GroupPort.ts`

**Success Criteria:**

- `GroupPortTag` references updated `IGroupPort` from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify import of `IGroupPort` from `@mirai-app/domain`
2. Ensure Context.Tag definition uses correct interface reference
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 11

**Risks:**

- **Risk:** Context.Tag may have explicit type annotation that needs updating
  - **Mitigation:** Tag class extends Context.Tag with interface type; verify no changes needed

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Does GroupPortTag reference updated IGroupPort from domain?
   - Is the interface import path correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Is Context.Tag definition structurally correct?
   - No explicit return type issues in Tag definition?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definition

3. Import Accuracy (weight: 0.20)
   - Is IGroupPort imported from @mirai-app/domain?
   - Type-only import used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 13: Update GroupJoinRequestPort Context.Tag (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** Step 12 (GroupPort Tag)  
**Blocked by:** Step 11  
**Triggers:** Step 14 (Group Gateway Migrations)

**Goal:** Same as Step 12 for GroupJoinRequest port.

**Files/Outputs:**

- Modify: `packages/use-cases/src/group/ports/GroupJoinRequestPort.ts`

**Success Criteria:**

- `GroupJoinRequestPortTag` references updated interface from domain
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify import from `@mirai-app/domain`
2. Ensure Context.Tag definition is correct

**Blockers:** Step 11

**Risks:**

- **Risk:** GroupJoinRequest port may have different interface location
  - **Mitigation:** Verify interface is in `packages/domain/src/group/ports/`

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Does GroupJoinRequestPortTag reference updated interface from domain?
   - Is the interface import path correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Is Context.Tag definition structurally correct?
   - No explicit return type issues in Tag definition?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definition

3. Import Accuracy (weight: 0.20)
   - Is interface imported from @mirai-app/domain?
   - Type-only import used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 14: Migrate Group Gateways (Parallel Batch)

**Agent:** sdd:developer  
**Parallel execution:** All 4 gateways in parallel + All other domain gateways  
**Blocked by:** Steps 11-13 (Group port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from all Group domain gateways; let TypeScript infer from interface.

**Files/Outputs:**

- Modify: `packages/adapters/src/group/gateways/drizzle/GroupDrizzleGateway.ts`
- Modify: `packages/adapters/src/group/gateways/in-memory/InMemoryGroupGateway.ts`
- Modify: `packages/adapters/src/group/gateways/drizzle/GroupJoinRequestDrizzleGateway.ts`
- Modify: `packages/adapters/src/group/gateways/in-memory/InMemoryGroupJoinRequestGateway.ts`

**Success Criteria:**

- All 4 gateways have explicit return type annotations removed from all methods
- All gateways still `implement IGroupPort` or `IGroupJoinRequestPort`
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update GroupDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryGroupGateway - remove explicit return types from all methods
3. Update GroupJoinRequestDrizzleGateway - remove explicit return types from all methods
4. Update InMemoryGroupJoinRequestGateway - remove explicit return types from all methods
5. Run tests to verify all gateway tests pass

**Blockers:** Steps 11-13 (interfaces must be updated first)

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Methods no longer satisfy interface contract
  - **Mitigation:** TypeScript will error; ensure interface is correctly updated
- **Risk:** In-memory gateway may have different error types than drizzle
  - **Mitigation:** Acceptable; error unions will differ naturally

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2D: Trip Domain (Steps 15-17)

#### Step 15: Update ITripPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 18, 24, 28, 32, 36, 40, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 16-17 (Trip Port Tag and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/trip/ports/TripPort.ts`

**Success Criteria:**

- All method signatures in `ITripPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 16: Update TripPort Context.Tag (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 15  
**Triggers:** Step 17 (Trip Gateway Migrations)

**Goal:** Update use-cases port definition to reference updated `ITripPort` interface.

**Files/Outputs:**

- Modify: `packages/use-cases/src/trip/ports/TripPort.ts`

**Success Criteria:**

- `TripPortTag` references updated `ITripPort` from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify import of `ITripPort` from `@mirai-app/domain`
2. Ensure Context.Tag definition uses correct interface reference
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 15

**Risks:**

- **Risk:** Context.Tag may have explicit type annotation that needs updating
  - **Mitigation:** Tag class extends Context.Tag with interface type; verify no changes needed

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Does TripPortTag reference updated ITripPort from domain?
   - Is the interface import path correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Is Context.Tag definition structurally correct?
   - No explicit return type issues in Tag definition?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definition

3. Import Accuracy (weight: 0.20)
   - Is ITripPort imported from @mirai-app/domain?
   - Type-only import used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 17: Migrate Trip Gateways (Parallel Batch)

**Agent:** sdd:developer  
**Parallel execution:** Both gateways in parallel + All other domain gateways  
**Blocked by:** Steps 15-16 (Trip port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from all Trip domain gateways; let TypeScript infer from interface.

**Files/Outputs:**

- Modify: `packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.ts`
- Modify: `packages/adapters/src/trip/gateways/in-memory/InMemoryTripGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still `implement ITripPort`
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update TripDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryTripGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Steps 15-16 (interfaces must be updated first)

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Methods no longer satisfy interface contract
  - **Mitigation:** TypeScript will error; ensure interface is correctly updated

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interface correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2E: Challenge Domain (Steps 18-23)

#### Step 18: Update IChallengePort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 20, 24, 28, 32, 36, 40, 43, 46, 49 (Challenge ports parallel with each other + all domain ports)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 19, 21-23 (Challenge Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/challenge/ports/ChallengePort.ts`

**Success Criteria:**

- All method signatures in `IChallengePort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 19: Update ChallengePort and Sub-Feature Ports (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 18  
**Triggers:** Steps 21-23 (Challenge Gateway Migrations)

**Goal:** Update use-cases port definitions to reference updated domain interfaces.

**Files/Outputs:**

- Modify: `packages/use-cases/src/challenge/ports/ChallengePort.ts`
- Modify: `packages/use-cases/src/challenge-submission/ports/ChallengeSubmissionPort.ts`
- Modify: `packages/use-cases/src/challenge-vote/ports/ChallengeVotePort.ts`

**Success Criteria:**

- `ChallengePortTag`, `ChallengeSubmissionPortTag`, `ChallengeVotePortTag` reference updated interfaces from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify imports of interfaces from `@mirai-app/domain`
2. Ensure Context.Tag definitions use correct interface references
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 18

**Risks:**

- **Risk:** Sub-feature ports (Submission, Vote) may be in different locations
  - **Mitigation:** Verify paths in `packages/use-cases/src/challenge-submission/` and `packages/use-cases/src/challenge-vote/`

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Do all three port tags reference updated interfaces from domain?
   - Are the interface import paths correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Are Context.Tag definitions structurally correct?
   - No explicit return type issues in Tag definitions?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definitions

3. Import Accuracy (weight: 0.20)
   - Are interfaces imported from @mirai-app/domain?
   - Type-only imports used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 20: Update ChallengeSubmissionPort and ChallengeVotePort Domain Interfaces

**Agent:** sdd:software-architect  
**Parallel with:** Step 18 (IChallengePort)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 19, 21-23 (Challenge Tags and Gateways)

**Goal:** Change error types in ChallengeSubmission and ChallengeVote port interfaces to `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/challenge-submission/ports/ChallengeSubmissionPort.ts` (if exists)
- Modify: `packages/domain/src/challenge-vote/ports/ChallengeVotePort.ts` (if exists)

**Success Criteria:**

- All method signatures in both interfaces use `IPortError` instead of `DatabaseError`
- Both interfaces remain explicit (do not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from appropriate relative path
2. Replace `DatabaseError` with `IPortError` in all method signatures in ChallengeSubmissionPort.ts
3. Replace `DatabaseError` with `IPortError` in all method signatures in ChallengeVotePort.ts
4. Verify both interfaces compile without errors

**Blockers:** Step 18

**Risks:**

- **Risk:** ChallengeSubmission or ChallengeVote ports may not exist as separate files
  - **Mitigation:** Check actual file structure; if interfaces don't exist separately, skip this step
- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface updates before gateway migrations

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods in both interfaces updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interfaces?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path in each file?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 21: Migrate Challenge Gateways

**Agent:** sdd:developer  
**Parallel with:** Steps 22-23 (Challenge gateway batch) + All other domain gateways  
**Blocked by:** Steps 18-20 (Challenge port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from Challenge domain gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/challenge/gateways/drizzle/ChallengeDrizzleGateway.ts`
- Modify: `packages/adapters/src/challenge/gateways/in-memory/InMemoryChallengeGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still `implement IChallengePort`
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update ChallengeDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryChallengeGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Steps 19-20 (interfaces must be updated first)

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Methods no longer satisfy interface contract
  - **Mitigation:** TypeScript will error; ensure interface is correctly updated

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interface correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 22: Migrate ChallengeSubmission Gateways

**Agent:** sdd:developer  
**Parallel with:** Steps 21, 23 (Challenge gateway batch) + All other domain gateways  
**Blocked by:** Steps 18-20 (Challenge port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from ChallengeSubmission gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/challenge-submission/gateways/drizzle/ChallengeSubmissionDrizzleGateway.ts`
- Modify: `packages/adapters/src/challenge-submission/gateways/in-memory/InMemoryChallengeSubmissionGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update ChallengeSubmissionDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryChallengeSubmissionGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Steps 19-20

**Risks:**

- **Risk:** ChallengeSubmission gateways may not exist yet
  - **Mitigation:** Check if files exist; if not, skip this step
- **Risk:** Inference issues with complex submission logic
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 23: Migrate ChallengeVote Gateways

**Agent:** sdd:developer  
**Parallel with:** Steps 21-22 (Challenge gateway batch) + All other domain gateways  
**Blocked by:** Steps 18-20 (Challenge port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from ChallengeVote gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/challenge-vote/gateways/drizzle/ChallengeVoteDrizzleGateway.ts`
- Modify: `packages/adapters/src/challenge-vote/gateways/in-memory/InMemoryChallengeVoteGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update ChallengeVoteDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryChallengeVoteGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Steps 19-20

**Risks:**

- **Risk:** ChallengeVote gateways may not exist yet
  - **Mitigation:** Check if files exist; if not, skip this step
- **Risk:** Inference issues with vote-specific logic
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2F: Reward Domain (Steps 24-27)

#### Step 24: Update IRewardPort and IRewardPurchasePort Interfaces (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 28, 32, 36, 40, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 25-27 (Reward Port Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/reward/ports/RewardPort.ts`
- Modify: `packages/domain/src/reward/ports/RewardPurchasePort.ts`

**Success Criteria:**

- All method signatures in `IRewardPort` and `IRewardPurchasePort` use `IPortError` instead of `DatabaseError`
- Both interfaces remain explicit (do not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports` in both files
2. Replace `DatabaseError` with `IPortError` in all method signatures in RewardPort.ts
3. Replace `DatabaseError` with `IPortError` in all method signatures in RewardPurchasePort.ts
4. Verify both interfaces compile without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete both interface updates before gateway migrations
- **Risk:** Accidentally removing explicit return types from interfaces
  - **Mitigation:** Interfaces must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods in both interfaces updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interfaces?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path in both files?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 25: Update RewardPort and RewardPurchasePort Context.Tags (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 24  
**Triggers:** Steps 26-27 (Reward Gateway Migrations)

**Goal:** Update use-cases port definitions to reference updated domain interfaces.

**Files/Outputs:**

- Modify: `packages/use-cases/src/reward/ports/RewardPort.ts`
- Modify: `packages/use-cases/src/reward/ports/RewardPurchasePort.ts`

**Success Criteria:**

- `RewardPortTag` and `RewardPurchasePortTag` reference updated interfaces from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify imports of `IRewardPort` and `IRewardPurchasePort` from `@mirai-app/domain`
2. Ensure Context.Tag definitions use correct interface references
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 24

**Risks:**

- **Risk:** Context.Tag may have explicit type annotations that need updating
  - **Mitigation:** Tag classes extend Context.Tag with interface types; verify no changes needed

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Do both port tags reference updated interfaces from domain?
   - Are the interface import paths correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Are Context.Tag definitions structurally correct?
   - No explicit return type issues in Tag definitions?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definitions

3. Import Accuracy (weight: 0.20)
   - Are interfaces imported from @mirai-app/domain?
   - Type-only imports used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 26: Migrate Reward Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 27 (Reward gateway batch) + All other domain gateways  
**Blocked by:** Steps 24-25 (Reward port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from Reward gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/reward/gateways/drizzle/RewardDrizzleGateway.ts`
- Modify: `packages/adapters/src/reward/gateways/in-memory/InMemoryRewardGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still `implement IRewardPort`
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update RewardDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryRewardGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 25

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Methods no longer satisfy interface contract
  - **Mitigation:** TypeScript will error; ensure interface is correctly updated

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interface correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 27: Migrate RewardPurchase Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 26 (Reward gateway batch) + All other domain gateways  
**Blocked by:** Steps 24-25 (Reward port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from RewardPurchase gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/reward/gateways/drizzle/RewardPurchaseDrizzleGateway.ts`
- Modify: `packages/adapters/src/reward/gateways/in-memory/InMemoryRewardPurchaseGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update RewardPurchaseDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryRewardPurchaseGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 25

**Risks:**

- **Risk:** RewardPurchase gateways may have complex purchase logic affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2G: Activity Domain (Steps 28-31)

#### Step 28: Update IActivityFeedPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 24, 32, 36, 40, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 29-31 (Activity Port Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/activity/ports/ActivityFeedPort.ts`

**Success Criteria:**

- All method signatures in `IActivityFeedPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 29: Update ActivityFeedPort and ActivityReactionPort Context.Tags (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 28  
**Triggers:** Steps 30-31 (Activity Gateway Migrations)

**Goal:** Update use-cases port definitions to reference updated domain interfaces.

**Files/Outputs:**

- Modify: `packages/use-cases/src/activity-feed/ports/ActivityFeedPort.ts`
- Modify: `packages/use-cases/src/activity-feed/ports/ActivityReactionPort.ts`

**Success Criteria:**

- `ActivityFeedPortTag` and `ActivityReactionPortTag` reference updated interfaces from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify imports of interfaces from `@mirai-app/domain`
2. Ensure Context.Tag definitions use correct interface references
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 28

**Risks:**

- **Risk:** ActivityReaction port may be in different location
  - **Mitigation:** Verify path in `packages/use-cases/src/activity-feed/ports/`

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Do both port tags reference updated interfaces from domain?
   - Are the interface import paths correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Are Context.Tag definitions structurally correct?
   - No explicit return type issues in Tag definitions?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definitions

3. Import Accuracy (weight: 0.20)
   - Are interfaces imported from @mirai-app/domain?
   - Type-only imports used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 30: Migrate ActivityFeed Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 31 (Activity gateway batch) + All other domain gateways  
**Blocked by:** Steps 28-29 (Activity port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from ActivityFeed gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/activity-feed/gateways/drizzle/ActivityFeedDrizzleGateway.ts`
- Modify: `packages/adapters/src/activity-feed/gateways/in-memory/InMemoryActivityFeedGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update ActivityFeedDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryActivityFeedGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 29

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** ActivityFeed may have complex query patterns affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 31: Migrate ActivityReaction Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 30 (Activity gateway batch) + All other domain gateways  
**Blocked by:** Steps 28-29 (Activity port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from ActivityReaction gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/activity-feed/gateways/drizzle/ActivityReactionDrizzleGateway.ts`
- Modify: `packages/adapters/src/activity-feed/gateways/in-memory/InMemoryActivityReactionGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update ActivityReactionDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryActivityReactionGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 29

**Risks:**

- **Risk:** ActivityReaction gateways may not exist yet
  - **Mitigation:** Check if files exist; if not, skip this step
- **Risk:** Reaction logic may have complex validation affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2H: Location Domain (Steps 32-35)

#### Step 32: Update ILocationPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 24, 28, 36, 40, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 33-35 (Location Port Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/location/ports/LocationPort.ts`

**Success Criteria:**

- All method signatures in `ILocationPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 33: Update LocationPort and LocationSharingRequestPort Context.Tags (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 32  
**Triggers:** Steps 34-35 (Location Gateway Migrations)

**Goal:** Update use-cases port definitions to reference updated domain interfaces.

**Files/Outputs:**

- Modify: `packages/use-cases/src/location/ports/LocationPort.ts`
- Modify: `packages/use-cases/src/location/ports/LocationSharingRequestPort.ts`

**Success Criteria:**

- `LocationPortTag` and `LocationSharingRequestPortTag` reference updated interfaces from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify imports of interfaces from `@mirai-app/domain`
2. Ensure Context.Tag definitions use correct interface references
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 32

**Risks:**

- **Risk:** LocationSharingRequest port may be in different location
  - **Mitigation:** Verify path in `packages/use-cases/src/location/ports/`

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Do both port tags reference updated interfaces from domain?
   - Are the interface import paths correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Are Context.Tag definitions structurally correct?
   - No explicit return type issues in Tag definitions?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definitions

3. Import Accuracy (weight: 0.20)
   - Are interfaces imported from @mirai-app/domain?
   - Type-only imports used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 34: Migrate Location Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 35 (Location gateway batch) + All other domain gateways  
**Blocked by:** Steps 32-33 (Location port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from Location gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/location/gateways/drizzle/LocationDrizzleGateway.ts`
- Modify: `packages/adapters/src/location/gateways/in-memory/InMemoryLocationGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update LocationDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryLocationGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 33

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Location may have complex geospatial query patterns affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 35: Migrate LocationSharingRequest Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 34 (Location gateway batch) + All other domain gateways  
**Blocked by:** Steps 32-33 (Location port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from LocationSharingRequest gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/location/gateways/drizzle/LocationSharingRequestDrizzleGateway.ts`
- Modify: `packages/adapters/src/location/gateways/in-memory/InMemoryLocationSharingRequestGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update LocationSharingRequestDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryLocationSharingRequestGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 33

**Risks:**

- **Risk:** LocationSharingRequest gateways may not exist yet
  - **Mitigation:** Check if files exist; if not, skip this step

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2I: Sponsor Domain (Steps 36-39)

#### Step 36: Update ISponsorPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 24, 28, 32, 40, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 37-39 (Sponsor Port Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/sponsor/ports/SponsorPort.ts`

**Success Criteria:**

- All method signatures in `ISponsorPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 37: Update SponsorPort and TripSponsorPort Context.Tags (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 36  
**Triggers:** Steps 38-39 (Sponsor Gateway Migrations)

**Goal:** Update use-cases port definitions to reference updated domain interfaces.

**Files/Outputs:**

- Modify: `packages/use-cases/src/sponsor/ports/SponsorPort.ts`
- Modify: `packages/use-cases/src/sponsor/ports/TripSponsorPort.ts`

**Success Criteria:**

- `SponsorPortTag` and `TripSponsorPortTag` reference updated interfaces from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify imports of interfaces from `@mirai-app/domain`
2. Ensure Context.Tag definitions use correct interface references
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 36

**Risks:**

- **Risk:** TripSponsor port may be in different location
  - **Mitigation:** Verify path in `packages/use-cases/src/sponsor/ports/`

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Do both port tags reference updated interfaces from domain?
   - Are the interface import paths correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Are Context.Tag definitions structurally correct?
   - No explicit return type issues in Tag definitions?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definitions

3. Import Accuracy (weight: 0.20)
   - Are interfaces imported from @mirai-app/domain?
   - Type-only imports used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 38: Migrate Sponsor Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 39 (Sponsor gateway batch) + All other domain gateways  
**Blocked by:** Steps 36-37 (Sponsor port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from Sponsor gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/sponsor/gateways/drizzle/SponsorDrizzleGateway.ts`
- Modify: `packages/adapters/src/sponsor/gateways/in-memory/InMemorySponsorGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update SponsorDrizzleGateway - remove explicit return types from all methods
2. Update InMemorySponsorGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 37

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Sponsor may have complex relationship logic affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

#### Step 39: Migrate TripSponsor Gateways

**Agent:** sdd:developer  
**Parallel with:** Step 38 (Sponsor gateway batch) + All other domain gateways  
**Blocked by:** Steps 36-37 (Sponsor port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from TripSponsor gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/sponsor/gateways/drizzle/TripSponsorDrizzleGateway.ts`
- Modify: `packages/adapters/src/sponsor/gateways/in-memory/InMemoryTripSponsorGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update TripSponsorDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryTripSponsorGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 37

**Risks:**

- **Risk:** TripSponsor gateways may not exist yet
  - **Mitigation:** Check if files exist; if not, skip this step

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2J: Coin Domain (Steps 40-42)

#### Step 40: Update ICoinTransactionPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 24, 28, 32, 36, 43, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 41-42 (Coin Port Tag and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/coin/ports/CoinTransactionPort.ts`

**Success Criteria:**

- All method signatures in `ICoinTransactionPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 41: Update CoinTransactionPort Context.Tag (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 40  
**Triggers:** Step 42 (Coin Gateway Migrations)

**Goal:** Update use-cases port definition to reference updated domain interface.

**Files/Outputs:**

- Modify: `packages/use-cases/src/coin/ports/CoinTransactionPort.ts`

**Success Criteria:**

- `CoinTransactionPortTag` references updated interface from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify import of interface from `@mirai-app/domain`
2. Ensure Context.Tag definition uses correct interface reference
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 40

**Risks:**

- **Risk:** Context.Tag may have explicit type annotation that needs updating
  - **Mitigation:** Tag class extends Context.Tag with interface type; verify no changes needed

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Does CoinTransactionPortTag reference updated interface from domain?
   - Is the interface import path correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Is Context.Tag definition structurally correct?
   - No explicit return type issues in Tag definition?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definition

3. Import Accuracy (weight: 0.20)
   - Is interface imported from @mirai-app/domain?
   - Type-only import used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 42: Migrate CoinTransaction Gateways

**Agent:** sdd:developer  
**Parallel with:** All other domain gateways (Steps 8-10, 14, 17, 21-23, 26-27, 30-31, 34-35, 38-39, 45, 48, 51)  
**Blocked by:** Steps 40-41 (Coin port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from CoinTransaction gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/coin/gateways/drizzle/CoinTransactionDrizzleGateway.ts`
- Modify: `packages/adapters/src/coin/gateways/in-memory/InMemoryCoinTransactionGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update CoinTransactionDrizzleGateway - remove explicit return types from all methods
2. Update InMemoryCoinTransactionGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 41

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Coin transaction may have complex financial logic affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2K: Notification Domain (Steps 43-45)

#### Step 43: Update INotificationPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 24, 28, 32, 36, 40, 46, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 44-45 (Notification Port Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/notification/ports/NotificationPort.ts`

**Success Criteria:**

- All method signatures in `INotificationPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 44: Update Notification Port Context.Tags (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 43  
**Triggers:** Step 45 (Notification Gateway Migrations)

**Goal:** Update use-cases port definitions to reference updated domain interfaces.

**Files/Outputs:**

- Modify: `packages/use-cases/src/notification/ports/NotificationPort.ts`
- Modify: `packages/use-cases/src/notification/ports/PushSubscriptionPort.ts`
- Modify: `packages/use-cases/src/notification/ports/NotificationDeliveryPort.ts`
- Modify: `packages/use-cases/src/notification/ports/NotificationSchedulePort.ts`

**Success Criteria:**

- All four port tags (`NotificationPortTag`, `PushSubscriptionPortTag`, `NotificationDeliveryPortTag`, `NotificationSchedulePortTag`) reference updated interfaces from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify imports of all interfaces from `@mirai-app/domain`
2. Ensure all Context.Tag definitions use correct interface references
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 43

**Risks:**

- **Risk:** Some notification sub-feature ports may be in different locations
  - **Mitigation:** Verify paths in `packages/use-cases/src/notification/ports/`
- **Risk:** Not all four ports may exist yet
  - **Mitigation:** Check which files actually exist; only update existing ones

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Do all existing port tags reference updated interfaces from domain?
   - Are the interface import paths correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Are Context.Tag definitions structurally correct?
   - No explicit return type issues in Tag definitions?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definitions

3. Import Accuracy (weight: 0.20)
   - Are interfaces imported from @mirai-app/domain?
   - Type-only imports used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 45: Migrate All Notification Gateways (Parallel Batch)

**Agent:** sdd:developer  
**Parallel execution:** All 8 gateways in parallel + All other domain gateways  
**Blocked by:** Steps 43-44 (Notification port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from all Notification domain gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/notification/gateways/drizzle/NotificationDrizzleGateway.ts`
- Modify: `packages/adapters/src/notification/gateways/in-memory/InMemoryNotificationGateway.ts`
- Modify: `packages/adapters/src/notification/gateways/drizzle/PushSubscriptionDrizzleGateway.ts`
- Modify: `packages/adapters/src/notification/gateways/in-memory/InMemoryPushSubscriptionGateway.ts`
- Modify: `packages/adapters/src/notification/gateways/drizzle/NotificationDeliveryDrizzleGateway.ts`
- Modify: `packages/adapters/src/notification/gateways/in-memory/InMemoryNotificationDeliveryGateway.ts`
- Modify: `packages/adapters/src/notification/gateways/drizzle/NotificationScheduleDrizzleGateway.ts`
- Modify: `packages/adapters/src/notification/gateways/in-memory/InMemoryNotificationScheduleGateway.ts`

**Success Criteria:**

- All 8 gateways have explicit return type annotations removed from all methods
- All gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update NotificationDrizzleGateway - remove explicit return types
2. Update InMemoryNotificationGateway - remove explicit return types
3. Update PushSubscriptionDrizzleGateway - remove explicit return types
4. Update InMemoryPushSubscriptionGateway - remove explicit return types
5. Update NotificationDeliveryDrizzleGateway - remove explicit return types
6. Update InMemoryNotificationDeliveryGateway - remove explicit return types
7. Update NotificationScheduleDrizzleGateway - remove explicit return types
8. Update InMemoryNotificationScheduleGateway - remove explicit return types
9. Run tests to verify all gateway tests pass

**Blockers:** Step 44

**Risks:**

- **Risk:** Some notification gateways may not exist yet
  - **Mitigation:** Check which files exist; only update existing ones
- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Notification logic may have complex delivery/scheduling affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods across all 8 gateways?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do all classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2L: Submission Report Domain (Steps 46-48)

#### Step 46: Update ISubmissionReportPort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 24, 28, 32, 36, 40, 43, 49 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 47-48 (Submission Port Tag and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/submission-report/ports/SubmissionReportPort.ts`

**Success Criteria:**

- All method signatures in `ISubmissionReportPort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 47: Update SubmissionReportPort Context.Tag (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 46  
**Triggers:** Step 48 (Submission Gateway Migrations)

**Goal:** Update use-cases port definition to reference updated domain interface.

**Files/Outputs:**

- Modify: `packages/use-cases/src/submission-report/ports/SubmissionReportPort.ts`

**Success Criteria:**

- `SubmissionReportPortTag` references updated interface from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify import of interface from `@mirai-app/domain`
2. Ensure Context.Tag definition uses correct interface reference
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 46

**Risks:**

- **Risk:** Context.Tag may have explicit type annotation that needs updating
  - **Mitigation:** Tag class extends Context.Tag with interface type; verify no changes needed

**Verification:**

**Verification Level**: MEDIUM (Single)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Does SubmissionReportPortTag reference updated interface from domain?
   - Is the interface import path correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Is Context.Tag definition structurally correct?
   - No explicit return type issues in Tag definition?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definition

3. Import Accuracy (weight: 0.20)
   - Is interface imported from @mirai-app/domain?
   - Type-only import used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 48: Migrate SubmissionReport Gateways

**Agent:** sdd:developer  
**Parallel with:** All other domain gateways (Steps 8-10, 14, 17, 21-23, 26-27, 30-31, 34-35, 38-39, 42, 45, 51)  
**Blocked by:** Steps 46-47 (Submission port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from SubmissionReport gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/submission-report/gateways/drizzle/SubmissionReportDrizzleGateway.ts`
- Modify: `packages/adapters/src/submission-report/gateways/in-memory/InMemorySubmissionReportGateway.ts`

**Success Criteria:**

- Both gateways have explicit return type annotations removed from all methods
- Both gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update SubmissionReportDrizzleGateway - remove explicit return types from all methods
2. Update InMemorySubmissionReportGateway - remove explicit return types from all methods
3. Run tests to verify all gateway tests pass

**Blockers:** Step 47

**Risks:**

- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** SubmissionReport gateways may not exist yet
  - **Mitigation:** Check if files exist; if not, skip this step

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 2M: Storage & Service Gateways (Steps 49-51)

#### Step 49: Update IStoragePort Interface (Domain)

**Agent:** sdd:software-architect  
**Parallel with:** Steps 5, 11, 15, 18, 24, 28, 32, 36, 40, 43, 46 (All 12 domain ports - run in parallel after Setup)  
**Blocked by:** Steps 1-4 (Setup phase complete)  
**Triggers:** Steps 50-51 (Storage Port Tags and Gateways)

**Goal:** Change error type from concrete `DatabaseError` to abstract `IPortError`.

**Files/Outputs:**

- Modify: `packages/domain/src/storage/ports/StoragePort.ts`

**Success Criteria:**

- All method signatures in `IStoragePort` use `IPortError` instead of `DatabaseError`
- Interface remains explicit (does not use inference)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Import `IPortError` from `../../shared/errors/ports`
2. Replace `DatabaseError` with `IPortError` in all method signatures
3. Verify interface compiles without errors

**Blockers:** Steps 1-4 (Setup phase complete)

**Risks:**

- **Risk:** Breaking change; compilation will fail until gateway steps complete
  - **Mitigation:** Complete interface update before gateway migrations
- **Risk:** Accidentally removing explicit return types from interface
  - **Mitigation:** Interface must stay explicit; only error type changes

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Interface Contract Migration (weight: 0.35)
   - Are all methods updated to use IPortError?
   - Is DatabaseError completely replaced with IPortError?
   - 1=Partial migration, 2=Most methods, 3=All methods with issues, 4=Complete migration, 5=Perfect contract

2. Interface Explicitness Maintained (weight: 0.30)
   - Do all methods still have explicit return type annotations?
   - Is inference NOT used on interface?
   - 1=Inference used, 2=Some issues, 3=Adequate, 4=Good, 5=Explicit throughout

3. Import Correctness (weight: 0.20)
   - Is IPortError imported from correct path?
   - No unused imports or import errors?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.15)
   - Does bun tsc --noEmit pass?
   - No type errors introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

**Threshold**: 4.5/5.0

---

#### Step 50: Update StoragePort and StoragePathResolverPort Context.Tags (Use-Cases)

**Agent:** sdd:software-architect  
**Parallel with:** None  
**Blocked by:** Step 49  
**Triggers:** Step 51 (Storage Gateway Migrations)

**Goal:** Update use-cases port definitions to reference updated domain interfaces.

**Files/Outputs:**

- Modify: `packages/use-cases/src/storage/ports/StoragePort.ts`
- Modify: `packages/use-cases/src/storage/ports/StoragePathResolverPort.ts`

**Success Criteria:**

- `StoragePortTag` and `StoragePathResolverPortTag` reference updated interfaces from domain
- No explicit return type changes needed (Context.Tag remains unchanged)
- `bun tsc --noEmit` passes

**Subtasks:**

1. Verify imports of interfaces from `@mirai-app/domain`
2. Ensure Context.Tag definitions use correct interface references
3. Check for any explicit return type annotations that need removal

**Blockers:** Step 49

**Risks:**

- **Risk:** StoragePathResolver port may be in different location
  - **Mitigation:** Verify path in `packages/use-cases/src/storage/ports/`

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Interface Reference Correctness (weight: 0.40)
   - Do both port tags reference updated interfaces from domain?
   - Are the interface import paths correct?
   - 1=Wrong reference, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect reference

2. Context.Tag Definition (weight: 0.30)
   - Are Context.Tag definitions structurally correct?
   - No explicit return type issues in Tag definitions?
   - 1=Structural issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect definitions

3. Import Accuracy (weight: 0.20)
   - Are interfaces imported from @mirai-app/domain?
   - Type-only imports used correctly?
   - 1=Import issues, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect imports

4. TypeScript Compilation (weight: 0.10)
   - Does bun tsc --noEmit pass?
   - 1=Fails, 3=Passes, 5=Passes with no warnings

**Threshold**: 4.0/5.0

---

#### Step 51: Migrate Storage and Service Gateways

**Agent:** sdd:developer  
**Parallel with:** All other domain gateways (Steps 8-10, 14, 17, 21-23, 26-27, 30-31, 34-35, 38-39, 42, 45, 48)  
**Blocked by:** Steps 49-50 (Storage port updates complete)  
**Triggers:** Phase 3 (Tests)

**Goal:** Remove explicit return type annotations from Storage and Service gateways.

**Files/Outputs:**

- Modify: `packages/adapters/src/storage/gateways/supabase/SupabaseStorageGateway.ts`
- Modify: `packages/adapters/src/storage/gateways/supabase/SupabaseStorageAdapter.ts`
- Modify: `packages/adapters/src/storage/gateways/in-memory/InMemoryStorageGateway.ts`
- Modify: `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts`
- Modify: `packages/adapters/src/realtime/gateways/supabase/SupabaseRealtimeGateway.ts`

**Success Criteria:**

- All 5 gateways have explicit return type annotations removed from all methods
- All gateways still implement their respective interfaces
- Hover over methods shows inferred union types
- `bun tsc --noEmit` passes
- `bun test` passes

**Subtasks:**

1. Update SupabaseStorageGateway - remove explicit return types from all methods
2. Update SupabaseStorageAdapter - remove explicit return types from all methods
3. Update InMemoryStorageGateway - remove explicit return types from all methods
4. Update SupabaseAuthGateway - remove explicit return types from all methods
5. Update SupabaseRealtimeGateway - remove explicit return types from all methods
6. Run tests to verify all gateway tests pass

**Blockers:** Step 50

**Risks:**

- **Risk:** Service gateways (Auth, Realtime) may not use standard port pattern
  - **Mitigation:** Check if they implement interfaces; if not, may need different approach
- **Risk:** Inference produces `any` or `unknown` (indicates unsafe code)
  - **Mitigation:** ESLint will catch this; fix underlying type issues
- **Risk:** Supabase-specific code may have complex types affecting inference
  - **Mitigation:** Address case-by-case; may need explicit types for Supabase edge cases

**Verification:**

**Verification Level**: MEDIUM (Per-Item)

**Rubric**:

1. Explicit Return Type Removal (weight: 0.30)
   - Are explicit Effect.Effect<...> return types removed from all methods across all 5 gateways?
   - Do methods still have parameter type annotations?
   - 1=Many still explicit, 2=Some remaining, 3=Most removed, 4=All removed, 5=Perfect removal

2. Type Inference Correctness (weight: 0.30)
   - Does hover show inferred union types (not any/unknown)?
   - Are error unions forming naturally from yield\* statements?
   - 1=Inference issues, 2=Some concerns, 3=Adequate, 4=Good, 5=Perfect inference

3. Interface Satisfaction (weight: 0.25)
   - Do all classes still implement their interfaces correctly?
   - Does TypeScript validate implementation satisfaction?
   - 1=Interface errors, 2=Minor issues, 3=Adequate, 4=Good, 5=Perfect satisfaction

4. Test Pass (weight: 0.15)
   - Do all existing tests pass?
   - No runtime regressions?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=Pass with coverage

**Threshold**: 4.0/5.0

---

### Phase 3: Tests (Step 52)

#### Step 52: Update All Domain Tests (Either Patterns)

**Agent:** sdd:qa-engineer  
**Parallel with:** None  
**Blocked by:** All domain gateway migrations complete (Steps 5, 8-51)  
**Triggers:** Step 53 (Documentation)

**Goal:** Migrate all domain tests to use `Effect.either` with `Either.isLeft/isRight` and `instanceof`.

**Files/Outputs:**

Modify/Create test files for all 12 domains (estimated 24-48 test files):

1. **User Domain Tests:**
   - `packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.test.ts` (create if missing)
   - `packages/adapters/src/user/gateways/in-memory/InMemoryUserGateway.test.ts` (create if missing)
   - `packages/adapters/src/user/gateways/drizzle/TripParticipantDrizzleGateway.test.ts`
   - `packages/adapters/src/user/gateways/in-memory/InMemoryTripParticipantGateway.test.ts`

2. **Group Domain Tests:**
   - `packages/adapters/src/group/gateways/drizzle/GroupDrizzleGateway.test.ts`
   - `packages/adapters/src/group/gateways/in-memory/InMemoryGroupGateway.test.ts`
   - `packages/adapters/src/group/gateways/drizzle/GroupJoinRequestDrizzleGateway.test.ts`
   - `packages/adapters/src/group/gateways/in-memory/InMemoryGroupJoinRequestGateway.test.ts`

3. **Trip Domain Tests:**
   - `packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.test.ts`
   - `packages/adapters/src/trip/gateways/in-memory/InMemoryTripGateway.test.ts`

4. **Challenge Domain Tests:**
   - `packages/adapters/src/challenge/gateways/drizzle/ChallengeDrizzleGateway.test.ts`
   - `packages/adapters/src/challenge/gateways/in-memory/InMemoryChallengeGateway.test.ts`
   - `packages/adapters/src/challenge-submission/gateways/drizzle/ChallengeSubmissionDrizzleGateway.test.ts`
   - `packages/adapters/src/challenge-submission/gateways/in-memory/InMemoryChallengeSubmissionGateway.test.ts`
   - `packages/adapters/src/challenge-vote/gateways/drizzle/ChallengeVoteDrizzleGateway.test.ts`
   - `packages/adapters/src/challenge-vote/gateways/in-memory/InMemoryChallengeVoteGateway.test.ts`

5. **Reward Domain Tests:**
   - `packages/adapters/src/reward/gateways/drizzle/RewardDrizzleGateway.test.ts`
   - `packages/adapters/src/reward/gateways/in-memory/InMemoryRewardGateway.test.ts`
   - `packages/adapters/src/reward/gateways/drizzle/RewardPurchaseDrizzleGateway.test.ts`
   - `packages/adapters/src/reward/gateways/in-memory/InMemoryRewardPurchaseGateway.test.ts`

6. **Activity Domain Tests:**
   - `packages/adapters/src/activity-feed/gateways/drizzle/ActivityFeedDrizzleGateway.test.ts`
   - `packages/adapters/src/activity-feed/gateways/in-memory/InMemoryActivityFeedGateway.test.ts`
   - `packages/adapters/src/activity-feed/gateways/drizzle/ActivityReactionDrizzleGateway.test.ts`
   - `packages/adapters/src/activity-feed/gateways/in-memory/InMemoryActivityReactionGateway.test.ts`

7. **Location Domain Tests:**
   - `packages/adapters/src/location/gateways/drizzle/LocationDrizzleGateway.test.ts`
   - `packages/adapters/src/location/gateways/in-memory/InMemoryLocationGateway.test.ts`
   - `packages/adapters/src/location/gateways/drizzle/LocationSharingRequestDrizzleGateway.test.ts`
   - `packages/adapters/src/location/gateways/in-memory/InMemoryLocationSharingRequestGateway.test.ts`

8. **Sponsor Domain Tests:**
   - `packages/adapters/src/sponsor/gateways/drizzle/SponsorDrizzleGateway.test.ts`
   - `packages/adapters/src/sponsor/gateways/in-memory/InMemorySponsorGateway.test.ts`
   - `packages/adapters/src/sponsor/gateways/drizzle/TripSponsorDrizzleGateway.test.ts`
   - `packages/adapters/src/sponsor/gateways/in-memory/InMemoryTripSponsorGateway.test.ts`

9. **Coin Domain Tests:**
   - `packages/adapters/src/coin/gateways/drizzle/CoinTransactionDrizzleGateway.test.ts`
   - `packages/adapters/src/coin/gateways/in-memory/InMemoryCoinTransactionGateway.test.ts`

10. **Notification Domain Tests:**
    - `packages/adapters/src/notification/gateways/drizzle/NotificationDrizzleGateway.test.ts`
    - `packages/adapters/src/notification/gateways/in-memory/InMemoryNotificationGateway.test.ts`
    - `packages/adapters/src/notification/gateways/drizzle/PushSubscriptionDrizzleGateway.test.ts`
    - `packages/adapters/src/notification/gateways/in-memory/InMemoryPushSubscriptionGateway.test.ts`
    - `packages/adapters/src/notification/gateways/drizzle/NotificationDeliveryDrizzleGateway.test.ts`
    - `packages/adapters/src/notification/gateways/in-memory/InMemoryNotificationDeliveryGateway.test.ts`
    - `packages/adapters/src/notification/gateways/drizzle/NotificationScheduleDrizzleGateway.test.ts`
    - `packages/adapters/src/notification/gateways/in-memory/InMemoryNotificationScheduleGateway.test.ts`

11. **Submission Report Domain Tests:**
    - `packages/adapters/src/submission-report/gateways/drizzle/SubmissionReportDrizzleGateway.test.ts`
    - `packages/adapters/src/submission-report/gateways/in-memory/InMemorySubmissionReportGateway.test.ts`

12. **Storage & Service Domain Tests:**
    - `packages/adapters/src/storage/gateways/supabase/SupabaseStorageGateway.test.ts`
    - `packages/adapters/src/storage/gateways/in-memory/InMemoryStorageGateway.test.ts`
    - `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.test.ts`
    - `packages/adapters/src/realtime/gateways/supabase/SupabaseRealtimeGateway.test.ts`

**Success Criteria:**

- All tests use `Effect.either` pattern:
  ```typescript
  const either = await Effect.runPromise(Effect.either(effect));
  expect(Either.isLeft(either)).toBe(true);
  if (Either.isLeft(either)) {
    expect(either.left).toBeInstanceOf(DatabaseError);
  }
  ```
- All tests pass: `bun test` (100%)
- No tests use old `_tag` checking pattern
- Test coverage maintained or improved
- All 12 domains have test coverage

**Subtasks:**

1. Identify existing tests for all 12 domains
2. Create missing gateway tests using Either pattern for each domain
3. Update existing tests to Either pattern for each domain
4. Run full test suite
5. Verify coverage reports for all domains

**Blockers:** Steps 8-51 (need working gateways to test)

**Risks:**

- **Risk:** No existing gateway tests for some domains
  - **Mitigation:** Create comprehensive tests for each domain as needed
- **Risk:** Tests fail after pattern migration
  - **Mitigation:** Debug individual tests; ensure Effect.either usage is correct
- **Risk:** Testing utilities may need updates for new pattern
  - **Mitigation:** Create helper functions if needed for common test patterns

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Either Pattern Usage (weight: 0.35)
   - Do tests use Effect.either for error testing across all domains?
   - Are Either.isLeft and Either.isRight used correctly?
   - 1=Old patterns still used, 2=Some migration, 3=Adequate, 4=Good, 5=Perfect pattern usage

2. instanceof Usage (weight: 0.25)
   - Do tests use instanceof for error type verification (not \_tag)?
   - Is error type checking type-safe across all domains?
   - 1=No instanceof usage, 2=Partial, 3=Adequate, 4=Good, 5=Perfect type checking

3. Test Coverage (weight: 0.25)
   - Are all gateway methods tested across all 12 domains?
   - Is coverage maintained or improved?
   - 1=Coverage dropped, 2=Some gaps, 3=Adequate, 4=Good, 5=Improved coverage

4. All Tests Pass (weight: 0.15)
   - Does bun test pass with 100%?
   - No failing tests?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=All pass with new tests

**Threshold**: 4.0/5.0

---

### Phase 3: Documentation (Step 53)

#### Step 53: Update Documentation

**Agent:** sdd:tech-lead  
**Parallel with:** None  
**Blocked by:** Step 52  
**Triggers:** Step 54 (Final Validation)

**Goal:** Update AGENTS.md and CLAUDE.md with new inference-first convention.

**Files/Outputs:**

- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `packages/domain/AGENTS.md` (if exists)
- Modify: `packages/adapters/AGENTS.md` (if exists)
- Modify: `packages/use-cases/AGENTS.md` (if exists)

**Success Criteria:**

- Documentation includes clear explanation of inference-first convention
- Code examples show:
  - IPortError interface definition
  - Error class implementing IPortError
  - Interface with explicit types using IPortError
  - Gateway with inferred return types
  - Test using Either.isLeft/isRight + instanceof
- Port naming pattern (IUserPort vs UserPortTag) documented
- ESLint configuration guidance provided
- All examples compile and work correctly

**Subtasks:**

1. Update AGENTS.md Quick Reference with new pattern
2. Update CLAUDE.md §2 (Clean Architecture) with Effect patterns
3. Update CLAUDE.md §4 (TDD) with Either testing patterns
4. Update per-package AGENTS.md files with layer-specific guidance
5. Verify all code examples are syntactically correct

**Blockers:** Step 11 (need working implementation before documenting)

**Risks:**

- **Risk:** Documentation becomes stale quickly
  - **Mitigation:** Keep examples minimal and focused on patterns
- **Risk:** Examples don't match actual implementation
  - **Mitigation:** Copy from working User domain code
- **Risk:** Conflicting guidance in multiple docs
  - **Mitigation:** Use AGENTS.md as single source of truth, reference in CLAUDE.md

**Verification:**

**Verification Level**: LOW/NONE

**Rubric**:

1. Convention Explanation Clarity (weight: 0.30)
   - Is inference-first convention clearly explained?
   - Are boundaries (explicit interfaces vs inferred implementations) clear?
   - 1=Unclear, 2=Basic, 3=Adequate, 4=Good, 5=Excellent clarity

2. Code Example Correctness (weight: 0.35)
   - Do all code examples show correct patterns?
   - Are IPortError, inference, Either patterns shown accurately?
   - 1=Incorrect examples, 2=Some issues, 3=Adequate, 4=Good, 5=Perfect examples

3. Pattern Completeness (weight: 0.20)
   - Are all 5 patterns documented (interface, error class, explicit interface, inferred gateway, test)?
   - Is port naming pattern (IUserPort vs UserPortTag) documented?
   - 1=Missing patterns, 2=Some missing, 3=Adequate, 4=Good, 5=Complete

4. ESLint Configuration Guidance (weight: 0.15)
   - Is ESLint configuration clearly documented?
   - Are allowOverrideWithoutType settings explained?
   - 1=Not documented, 2=Basic, 3=Adequate, 4=Good, 5=Excellent guidance

**Threshold**: 3.5/5.0

---

### Phase 4: Validation & Closure

#### Step 54: Final Verification

**Agent:** code-review:bug-hunter  
**Parallel with:** None  
**Blocked by:** Steps 1-53  
**Triggers:** Task Complete

**Goal:** Ensure all acceptance criteria are met before task completion.

**Files/Outputs:** None (validation only)

**Success Criteria (Acceptance Criteria Verification):**

| Criteria                           | Verification Command                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| IPortError interface created       | `test -f packages/domain/src/shared/errors/ports.ts`                                                        |
| Error classes implement IPortError | `grep -l "implements IPortError" packages/domain/src/shared/errors/domain-errors.ts`                        |
| ESLint config updated              | `grep -l "allowOverrideWithoutType" packages/adapters/eslint.config.js packages/use-cases/eslint.config.js` |
| All domains migrated               | All domain port files use `IPortError` && all gateway files have no explicit return types                   |
| Tests use Either patterns          | `grep -l "Either.isLeft\|Either.isRight" packages/adapters/src/**/*.test.ts`                                |
| Documentation updated              | `grep -l "inference-first\|IPortError" AGENTS.md CLAUDE.md`                                                 |
| TypeScript compilation             | `bun tsc --noEmit` (zero errors)                                                                            |
| Test pass rate                     | `bun test` (100% pass)                                                                                      |

**Subtasks:**

1. Run TypeScript check: `bun tsc --noEmit`
2. Run full test suite: `bun test`
3. Run lint: `bun lint`
4. Verify all acceptance criteria checkboxes
5. Review for any remaining explicit return types in migrated files

**Blockers:** Steps 1-12

**Risks:**

- **Risk:** Last-minute issues discovered
  - **Mitigation:** Keep buffer time; address in task or file follow-up

**Verification:**

**Verification Level**: HIGH (Panel)

**Rubric**:

1. Acceptance Criteria Coverage (weight: 0.35)
   - Are all 8 acceptance criteria verified?
   - Is verification evidence provided for each criterion?
   - 1=Many missing, 2=Some missing, 3=Adequate, 4=Good, 5=Complete coverage

2. TypeScript Compilation (weight: 0.25)
   - Does bun tsc --noEmit pass with zero errors?
   - No type regressions introduced?
   - 1=Compilation fails, 2=Some errors, 3=Adequate, 4=Good, 5=Clean compilation

3. Test Pass Rate (weight: 0.25)
   - Does bun test pass with 100%?
   - All tests including new Either pattern tests?
   - 1=Tests fail, 2=Some failures, 3=Most pass, 4=All pass, 5=All pass with coverage

4. Lint Pass (weight: 0.15)
   - Does bun lint pass?
   - No ESLint violations in migrated code?
   - 1=Lint fails, 2=Many violations, 3=Adequate, 4=Good, 5=Clean lint

**Threshold**: 4.5/5.0

---

## Verification Summary

| Step  | Phase        | Verification Level | Threshold | Primary Focus                             |
| ----- | ------------ | ------------------ | --------- | ----------------------------------------- |
| 1     | Setup        | HIGH (Panel)       | 4.0/5.0   | IPortError interface contract             |
| 2     | Setup        | MEDIUM (Per-Item)  | 4.0/5.0   | Error class implementations               |
| 3     | Setup        | HIGH (Panel)       | 4.5/5.0   | ESLint base rule configuration            |
| 4     | Setup        | MEDIUM (Single)    | 4.0/5.0   | Package-specific overrides                |
| 5-7   | User         | HIGH (Panel)       | 4.5/5.0   | User domain interface migration           |
| 8-10  | User         | MEDIUM (Per-Item)  | 4.0/5.0   | User gateway inference migration          |
| 11-14 | Group        | MEDIUM (Per-Item)  | 4.0/5.0   | Group domain migration                    |
| 15-17 | Trip         | MEDIUM (Per-Item)  | 4.0/5.0   | Trip domain migration                     |
| 18-23 | Challenge    | MEDIUM (Per-Item)  | 4.0/5.0   | Challenge + Submission + Vote             |
| 24-27 | Reward       | MEDIUM (Per-Item)  | 4.0/5.0   | Reward + Purchase migration               |
| 28-31 | Activity     | MEDIUM (Per-Item)  | 4.0/5.0   | ActivityFeed + Reaction                   |
| 32-35 | Location     | MEDIUM (Per-Item)  | 4.0/5.0   | Location + Sharing                        |
| 36-39 | Sponsor      | MEDIUM (Per-Item)  | 4.0/5.0   | Sponsor + TripSponsor                     |
| 40-42 | Coin         | MEDIUM (Per-Item)  | 4.0/5.0   | Coin transaction migration                |
| 43-45 | Notification | MEDIUM (Per-Item)  | 4.0/5.0   | Notification + Push + Delivery + Schedule |
| 46-48 | Submission   | MEDIUM (Per-Item)  | 4.0/5.0   | SubmissionReport migration                |
| 49-51 | Storage      | MEDIUM (Per-Item)  | 4.0/5.0   | Storage + Auth + Realtime                 |
| 52    | Tests        | HIGH (Panel)       | 4.0/5.0   | All domain tests use Either patterns      |
| 53    | Docs         | LOW/NONE           | 3.5/5.0   | Documentation completeness                |
| 54    | Validate     | HIGH (Panel)       | 4.5/5.0   | Final acceptance criteria verification    |

---

## Dependency Graph

```
[Phase 1: Setup]
Step 1 ─→ Step 2 ─┐
Step 3 ─→ Step 4 ─┤
                  ↓
[Phase 2: Domain Migration - All domains in parallel after Setup]
├─ User (Steps 5-10)
├─ Group (Steps 11-14)
├─ Trip (Steps 15-17)
├─ Challenge (Steps 18-23)
├─ Reward (Steps 24-27)
├─ Activity (Steps 28-31)
├─ Location (Steps 32-35)
├─ Sponsor (Steps 36-39)
├─ Coin (Steps 40-42)
├─ Notification (Steps 43-45)
├─ Submission (Steps 46-48)
└─ Storage (Steps 49-51)
                  ↓
[Phase 3: Tests]
              Step 52
                  ↓
[Phase 4: Documentation]
              Step 53
                  ↓
[Phase 5: Validation]
              Step 54
```

**Critical Path:** 1 → 2 → 4 → (All Domain Port Updates) → (All Domain Gateways) → 52 → 53 → 54

---

## Parallelization Plan

### Agent Assignments

| Step Range | Agent                  | Rationale                     |
| ---------- | ---------------------- | ----------------------------- |
| 1-4        | sdd:developer          | Infrastructure setup          |
| 5-7        | sdd:software-architect | User domain interface design  |
| 8-10       | sdd:developer          | User gateway implementation   |
| 11-14      | sdd:software-architect | Group domain                  |
| 15-17      | sdd:software-architect | Trip domain                   |
| 18-23      | sdd:software-architect | Challenge domain (complex)    |
| 24-27      | sdd:software-architect | Reward domain                 |
| 28-31      | sdd:developer          | Activity domain               |
| 32-35      | sdd:developer          | Location domain               |
| 36-39      | sdd:developer          | Sponsor domain                |
| 40-42      | sdd:developer          | Coin domain                   |
| 43-45      | sdd:developer          | Notification domain (complex) |
| 46-48      | sdd:developer          | Submission domain             |
| 49-51      | sdd:developer          | Storage + Service gateways    |
| 52         | sdd:qa-engineer        | Test pattern updates          |
| 53         | sdd:tech-lead          | Documentation coordination    |
| 54         | code-review:bug-hunter | Final verification            |

### Parallel Groups

```
Group A: Setup (Sequential)
├── Step 1 (create IPortError)
├── Step 2 (update error classes)
├── Step 3 (ESLint base) [parallel with 1-2]
└── Step 4 (ESLint overrides)

Group B: Domain Migrations (All parallel after Group A)
├── Subgroup B1: User (Steps 5-10)
├── Subgroup B2: Group (Steps 11-14)
├── Subgroup B3: Trip (Steps 15-17)
├── Subgroup B4: Challenge (Steps 18-23)
├── Subgroup B5: Reward (Steps 24-27)
├── Subgroup B6: Activity (Steps 28-31)
├── Subgroup B7: Location (Steps 32-35)
├── Subgroup B8: Sponsor (Steps 36-39)
├── Subgroup B9: Coin (Steps 40-42)
├── Subgroup B10: Notification (Steps 43-45)
├── Subgroup B11: Submission (Steps 46-48)
└── Subgroup B12: Storage (Steps 49-51)

Group C: Tests (Sequential)
└── Step 52 (update all domain tests)

Group D: Documentation (Sequential)
└── Step 53 (update AGENTS.md and CLAUDE.md)

Group E: Validation (Sequential)
└── Step 54 (final verification)
```

### Visual Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: SETUP                                 │
│                    (Sequential with one parallel)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Step 1 ──→ Step 2 ──→ Step 4                                          │
│     ↑          ↑                                                        │
│  Step 3 (parallel with 1-2)                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  PHASE 2: DOMAIN MIGRATION (All Parallel)              │
│         (All 12 domains run in parallel after setup complete)           │
├─────────────────────────────────────────────────────────────────────────┤
│  User (5-10)    Group (11-14)   Trip (15-17)   Challenge (18-23)        │
│  Reward (24-27)  Activity (28-31)  Location (32-35)  Sponsor (36-39)   │
│  Coin (40-42)   Notification (43-45)  Submission (46-48)  Storage (49-51)│
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  PHASE 3: TESTS (Sequential after all domains)           │
├─────────────────────────────────────────────────────────────────────────┤
│                        Step 52 (Update all tests)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  PHASE 4: DOCUMENTATION (Sequential)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                        Step 53 (Update docs)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  PHASE 5: VALIDATION (Sequential)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                        Step 54 (Final verification)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-agent Execution Directive

### Execution Order

Execute phases in order. Within each phase, respect dependencies and parallel markers.

#### Phase 1: Setup (Sequential with one parallel pair)

```
Start: Step 1, Step 3 (parallel)
After Step 1 completes: Start Step 2
After Steps 2, 3 complete: Start Step 4
After Steps 1-4 complete: Start Steps 6-7 (parallel)
Gate: All of Phase 1 complete before Phase 2
```

#### Phase 2: Domain Migration (Days 3-6) - ALL 12 DOMAINS IN PARALLEL

```
Trigger: Phase 1 complete (Steps 1-4, 6-7 done)
Execute all 12 domain subgroups in PARALLEL:

Subgroup: User (Steps 5-10)
  - Step 5: Update IUserPort interface
  - Steps 6-7 (parallel): Update UserPort, TripParticipantPort Tags
  - Steps 8-10 (parallel): Migrate User, TripParticipant gateways

Subgroup: Group (Steps 11-14)
  - Step 11: Update IGroupPort, IGroupJoinRequestPort interfaces
  - Steps 12-13 (parallel): Update GroupPort, GroupJoinRequestPort Tags
  - Step 14 (parallel): Migrate all Group gateways

Subgroup: Trip (Steps 15-17)
  - Step 15: Update ITripPort interface
  - Step 16: Update TripPort Tag
  - Step 17 (parallel): Migrate all Trip gateways

Subgroup: Challenge (Steps 18-23)
  - Steps 18, 20 (parallel): Update Challenge, Submission, Vote interfaces
  - Step 19: Update all Challenge port Tags
  - Steps 21-23 (parallel): Migrate Challenge, Submission, Vote gateways

Subgroup: Reward (Steps 24-27)
  - Step 24: Update Reward, RewardPurchase interfaces
  - Step 25: Update Reward, RewardPurchase Tags
  - Steps 26-27 (parallel): Migrate Reward, RewardPurchase gateways

Subgroup: Activity (Steps 28-31)
  - Step 28: Update ActivityFeed interface
  - Step 29: Update ActivityFeed, ActivityReaction Tags
  - Steps 30-31 (parallel): Migrate ActivityFeed, ActivityReaction gateways

Subgroup: Location (Steps 32-35)
  - Step 32: Update Location interface
  - Step 33: Update Location, LocationSharing Tags
  - Steps 34-35 (parallel): Migrate Location, LocationSharing gateways

Subgroup: Sponsor (Steps 36-39)
  - Step 36: Update Sponsor interface
  - Step 37: Update Sponsor, TripSponsor Tags
  - Steps 38-39 (parallel): Migrate Sponsor, TripSponsor gateways

Subgroup: Coin (Steps 40-42)
  - Step 40: Update CoinTransaction interface
  - Step 41: Update CoinTransaction Tag
  - Step 42 (parallel): Migrate CoinTransaction gateways

Subgroup: Notification (Steps 43-45)
  - Step 43: Update Notification interface
  - Step 44: Update all Notification Tags
  - Step 45 (parallel): Migrate all 8 Notification gateways

Subgroup: Submission (Steps 46-48)
  - Step 46: Update SubmissionReport interface
  - Step 47: Update SubmissionReport Tag
  - Step 48 (parallel): Migrate SubmissionReport gateways

Subgroup: Storage (Steps 49-51)
  - Step 49: Update Storage interface
  - Step 50: Update Storage, StoragePathResolver Tags
  - Step 51 (parallel): Migrate Storage, Auth, Realtime gateways

Gate: All domain subgroups complete before Phase 3
```

**Parallel execution command for all 12 domains:**

```
/sadd:do-in-parallel
Tasks:
1. User Domain: Execute Steps 5, 8-10 (Port 5 → Tags 6-7 parallel → Gateways 8-10 parallel)
2. Group Domain: Execute Steps 11-14 (Port 11 → Tags 12-13 parallel → Gateways 14 parallel)
3. Trip Domain: Execute Steps 15-17 (Port 15 → Tag 16 → Gateways 17 parallel)
4. Challenge Domain: Execute Steps 18-23 (Ports 18,20 parallel → Tag 19 → Gateways 21-23 parallel)
5. Reward Domain: Execute Steps 24-27 (Port 24 → Tag 25 → Gateways 26-27 parallel)
6. Activity Domain: Execute Steps 28-31 (Port 28 → Tag 29 → Gateways 30-31 parallel)
7. Location Domain: Execute Steps 32-35 (Port 32 → Tag 33 → Gateways 34-35 parallel)
8. Sponsor Domain: Execute Steps 36-39 (Port 36 → Tag 37 → Gateways 38-39 parallel)
9. Coin Domain: Execute Steps 40-42 (Port 40 → Tag 41 → Gateways 42 parallel)
10. Notification Domain: Execute Steps 43-45 (Port 43 → Tag 44 → Gateways 45 parallel)
11. Submission Domain: Execute Steps 46-48 (Port 46 → Tag 47 → Gateways 48 parallel)
12. Storage Domain: Execute Steps 49-51 (Port 49 → Tag 50 → Gateways 51 parallel)
```

#### Phase 3: Tests (After all domains complete)

```
Start: Step 52 (after Phase 2 complete)
Gate: All tests updated before Phase 4
```

#### Phase 4: Documentation (After tests)

```
Start: Step 53 (after Phase 3)
Gate: Documentation complete before Phase 5
```

#### Phase 5: Validation (Final)

```
Start: Step 54 (after Phase 4)
Gate: Phase 5 complete = Task complete
```

### Coordination Rules

1. **Phase Gates:** Do not proceed to next phase until all steps in current phase complete
2. **Critical Path:** All domain port interfaces (Steps 5, 11, 15, 18, 24, 28, 32, 36, 40, 43, 46, 49) must complete before their respective gateway batches
3. **Parallel Safety:** All 12 domains are independent; no coordination needed between different domains during migration
4. **Quality Gates:** Run `bun tsc --noEmit` and `bun test` after each phase
5. **Domain Completion:** Each domain must complete both its interface updates AND gateway migrations before being considered done

### Completion Criteria by Phase

| Phase | Completion Check                               | Command                        |
| ----- | ---------------------------------------------- | ------------------------------ |
| 1     | ESLint configured, errors implement IPortError | `bun tsc --noEmit && bun lint` |
| 2     | All 12 domains migrated (80+ files)            | `bun tsc --noEmit`             |
| 3     | All domain tests use Either patterns           | `bun test`                     |
| 4     | Documentation updated                          | Verify AGENTS.md and CLAUDE.md |
| 5     | All acceptance criteria met                    | See Step 54 checklist          |

---

## Comprehensive Verification Checklist

### Domain-by-Domain Return Type Verification

Use this checklist to verify explicit return type removal across all ~80 files. Check off each domain as verification completes.

#### Phase 1: Setup Verification

- [ ] **Step 1 (IPortError Interface)**
  - [ ] File exists at `packages/domain/src/shared/errors/ports.ts`
  - [ ] Interface exports `IPortError` with `readonly _tag: string` and `readonly message: string`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Step 2 (Error Classes)**
  - [ ] All 11 error classes implement `IPortError`:
    - [ ] `DatabaseError implements IPortError`
    - [ ] `ApplicationError implements IPortError`
    - [ ] `ValidationError implements IPortError`
    - [ ] `InvalidIdError implements IPortError`
    - [ ] `EntityNotFoundError implements IPortError`
    - [ ] `EntityAlreadyExistsError implements IPortError`
    - [ ] `UnauthorizedError implements IPortError`
    - [ ] `InvalidStateTransitionError implements IPortError`
    - [ ] `InsufficientResourcesError implements IPortError`
    - [ ] `TimeConstraintError implements IPortError`
    - [ ] `DuplicateActionError implements IPortError`
  - [ ] Each class provides `readonly message` property
  - [ ] `bun test` passes (100%)

- [ ] **Step 3 (ESLint Base Rules)**
  - [ ] `eslint.config.base.js` has `@typescript-eslint/explicit-function-return-type` rule
  - [ ] Rule includes `allowExpressions: true`, `allowTypedFunctionExpressions: true`, `allowHigherOrderFunctions: true`
  - [ ] `bun lint` runs without errors on baseline

- [ ] **Step 4 (ESLint Overrides)**
  - [ ] `packages/adapters/eslint.config.js` has override with `allowOverrideWithoutType: true`
  - [ ] `packages/use-cases/eslint.config.js` has override with `allowOverrideWithoutType: true`
  - [ ] `bun lint` passes in both packages

---

#### Phase 2: Domain Port Interface Verification

Verify all 12 domain port interfaces use `IPortError` instead of `DatabaseError`:

- [ ] **User Domain (Step 5)**
  - [ ] `IUserPort` in `packages/domain/src/user/ports/UserPort.ts` uses `IPortError`
  - [ ] All 7 methods updated (findById, findByEmail, findByProvider, create, update, delete, list)
  - [ ] `TripParticipantPort` in `packages/domain/src/user/ports/TripParticipantPort.ts` uses `IPortError` (if exists)
  - [ ] `bun tsc --noEmit` passes

- [ ] **Group Domain (Step 11)**
  - [ ] `IGroupPort` in `packages/domain/src/group/ports/GroupPort.ts` uses `IPortError`
  - [ ] `IGroupJoinRequestPort` in `packages/domain/src/group/ports/GroupJoinRequestPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Trip Domain (Step 15)**
  - [ ] `ITripPort` in `packages/domain/src/trip/ports/TripPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Challenge Domain (Steps 18, 20)**
  - [ ] `IChallengePort` in `packages/domain/src/challenge/ports/ChallengePort.ts` uses `IPortError`
  - [ ] `IChallengeSubmissionPort` in `packages/domain/src/challenge-submission/ports/ChallengeSubmissionPort.ts` uses `IPortError` (if exists)
  - [ ] `IChallengeVotePort` in `packages/domain/src/challenge-vote/ports/ChallengeVotePort.ts` uses `IPortError` (if exists)
  - [ ] `bun tsc --noEmit` passes

- [ ] **Reward Domain (Step 24)**
  - [ ] `IRewardPort` in `packages/domain/src/reward/ports/RewardPort.ts` uses `IPortError`
  - [ ] `IRewardPurchasePort` in `packages/domain/src/reward/ports/RewardPurchasePort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Activity Domain (Step 28)**
  - [ ] `IActivityFeedPort` in `packages/domain/src/activity/ports/ActivityFeedPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Location Domain (Step 32)**
  - [ ] `ILocationPort` in `packages/domain/src/location/ports/LocationPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Sponsor Domain (Step 36)**
  - [ ] `ISponsorPort` in `packages/domain/src/sponsor/ports/SponsorPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Coin Domain (Step 40)**
  - [ ] `ICoinTransactionPort` in `packages/domain/src/coin/ports/CoinTransactionPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Notification Domain (Step 43)**
  - [ ] `INotificationPort` in `packages/domain/src/notification/ports/NotificationPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Submission Report Domain (Step 46)**
  - [ ] `ISubmissionReportPort` in `packages/domain/src/submission-report/ports/SubmissionReportPort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

- [ ] **Storage Domain (Step 49)**
  - [ ] `IStoragePort` in `packages/domain/src/storage/ports/StoragePort.ts` uses `IPortError`
  - [ ] `bun tsc --noEmit` passes

---

#### Phase 3: Gateway Implementation Verification

Verify all gateway implementations have NO explicit return type annotations. Each method should use inference.

Use this command to check a file:

```bash
grep -n "Effect.Effect<" packages/adapters/src/<domain>/gateways/<type>/<GatewayFile>.ts
```

Should return no matches (or only matches in comments).

**User Domain (Steps 8-10):**

- [ ] `UserDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryUserGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `TripParticipantDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryTripParticipantGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] All gateways still `implement IUserPort` or `ITripParticipantPort`
- [ ] `bun test` passes for User domain

**Group Domain (Step 14):**

- [ ] `GroupDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryGroupGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `GroupJoinRequestDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryGroupJoinRequestGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] All gateways still `implement IGroupPort` or `IGroupJoinRequestPort`
- [ ] `bun test` passes for Group domain

**Trip Domain (Step 17):**

- [ ] `TripDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryTripGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] All gateways still `implement ITripPort`
- [ ] `bun test` passes for Trip domain

**Challenge Domain (Steps 21-23):**

- [ ] `ChallengeDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryChallengeGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `ChallengeSubmissionDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryChallengeSubmissionGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `ChallengeVoteDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryChallengeVoteGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Challenge domain

**Reward Domain (Steps 26-27):**

- [ ] `RewardDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryRewardGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `RewardPurchaseDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryRewardPurchaseGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Reward domain

**Activity Domain (Steps 30-31):**

- [ ] `ActivityFeedDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryActivityFeedGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `ActivityReactionDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryActivityReactionGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Activity domain

**Location Domain (Steps 34-35):**

- [ ] `LocationDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryLocationGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `LocationSharingRequestDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryLocationSharingRequestGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Location domain

**Sponsor Domain (Steps 38-39):**

- [ ] `SponsorDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemorySponsorGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `TripSponsorDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryTripSponsorGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Sponsor domain

**Coin Domain (Step 42):**

- [ ] `CoinTransactionDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryCoinTransactionGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Coin domain

**Notification Domain (Step 45):**

- [ ] `NotificationDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryNotificationGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `PushSubscriptionDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryPushSubscriptionGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `NotificationDeliveryDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryNotificationDeliveryGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `NotificationScheduleDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemoryNotificationScheduleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Notification domain

**Submission Report Domain (Step 48):**

- [ ] `SubmissionReportDrizzleGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] `InMemorySubmissionReportGateway.ts` - no explicit `: Effect.Effect<...>` return types (if exists)
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Submission Report domain

**Storage & Service Domain (Step 51):**

- [ ] `SupabaseStorageGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `SupabaseStorageAdapter.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `InMemoryStorageGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `SupabaseAuthGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] `SupabaseRealtimeGateway.ts` - no explicit `: Effect.Effect<...>` return types
- [ ] All gateways still implement their respective interfaces
- [ ] `bun test` passes for Storage & Service domain

---

#### Phase 4: Type Inference Quality Verification

For each gateway, verify inference produces correct types (not `any` or `unknown`):

**Quick Verification Command:**

```bash
# Check TypeScript can infer types without errors
bun tsc --noEmit

# If you want to see actual inferred types (requires IDE or tsc with --verbose)
# Hover over a method in IDE to see: Effect<ReturnType, ErrorUnion, never>
```

**Expected Inference Pattern:**

- Before: `findById(id: string): Effect.Effect<User | null, DatabaseError, never>`
- After inference: `Effect<User | null, DatabaseError | NotFoundError, never>` (union forms naturally)

**Verification for All Domains:**

- [ ] **User Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Group Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Trip Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Challenge Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Reward Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Activity Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Location Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Sponsor Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Coin Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Notification Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Submission Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`
- [ ] **Storage Domain**: Hover over gateway methods shows inferred union types, not `any`/`unknown`

---

#### Phase 5: Testing Verification

- [ ] **Step 52 (All Domain Tests)**
  - [ ] All 12 domains have test coverage using `Effect.either` pattern
  - [ ] No tests use old `_tag` string checking pattern
  - [ ] Tests use `Either.isLeft(either)` and `Either.isRight(either)` for error/success checking
  - [ ] Tests use `instanceof` for error type verification (e.g., `expect(either.left).toBeInstanceOf(DatabaseError)`)
  - [ ] `bun test` passes with 100% success rate
  - [ ] Test coverage maintained or improved

---

#### Phase 6: Final Compilation & Lint Verification

- [ ] **TypeScript Compilation**

  ```bash
  bun tsc --noEmit
  ```

  - [ ] Zero TypeScript errors across all packages
  - [ ] No type regressions introduced

- [ ] **ESLint Verification**

  ```bash
  bun lint
  ```

  - [ ] No ESLint errors in migrated code
  - [ ] `allowOverrideWithoutType` correctly allows inference in adapters/use-cases
  - [ ] Base config still enforces explicit types where needed

- [ ] **Test Suite**

  ```bash
  bun test
  ```

  - [ ] 100% test pass rate
  - [ ] No failing tests

---

#### Summary Commands for Quick Verification

```bash
# 1. Verify IPortError exists and error classes implement it
grep -l "implements IPortError" packages/domain/src/shared/errors/domain-errors.ts
test -f packages/domain/src/shared/errors/ports.ts && echo "IPortError file exists"

# 2. Verify all domain ports use IPortError
grep -r "IPortError" packages/domain/src/*/ports/*.ts | wc -l

# 3. Check for remaining explicit return types in gateways (should return nothing for migrated files)
grep -r "Effect.Effect<" packages/adapters/src/*/gateways/*/*.ts || echo "No explicit return types found"

# 4. Run all verification commands
bun tsc --noEmit && bun lint && bun test && echo "All verification passed!"
```

---

## Rollback Strategy

If issues arise during migration:

1. **Domain-Level Rollback:** Revert specific domain changes while keeping others (domains are independent)
2. **Infrastructure Safety:** Keep Steps 1-4 changes - they are safe and backward compatible
3. **ESLint Config:** Do not roll back ESLint config - additive only
4. **Emergency Rollback:** If critical issues found, revert all domain changes but keep infrastructure
5. **Document and Retry:** Document issues and retry with fixes

**Note:** With 12 domains migrating in parallel, issues in one domain don't block others. Rollback can be domain-specific.

---

## References

### Created Resources

- **Reusable Skill:** `.claude/skills/typescript-effect-return-types/SKILL.md` — Complete guidelines for inference-first return type annotations with Effect framework
- **Research Scratchpad:** `.specs/scratchpad/explicit-return-types-research.md` — Research findings, current state analysis, and implementation plan

### Design Documentation

- **Design Document:** `.specs/plans/explicit-return-types.design.md` — Full migration strategy with detailed code examples and testing patterns

### External References

- [TypeScript ESLint - explicit-function-return-type](https://typescript-eslint.io/rules/explicit-function-return-type/) — ESLint rule documentation
- [Effect Either Data Type](https://effect.website/docs/data-types/either/) — Effect Either documentation for testing patterns
- [Effect Error Management](https://effect.website/docs/error-management/expected-errors/) — Effect error handling best practices
- [Effect Data.TaggedError](https://effect.website/docs/data/data/#taggederror) — TaggedError documentation
