---
title: Migrate remaining controller container.resolve() calls to Effect DI
depends_on: []
---

## Initial User Prompt

Complete the migration by removing all remaining `context.container.resolve()` calls from GraphQL resolvers and updating skill documentation with new Effect patterns.

## Description

There are still many `context.container.resolve()` calls in the GraphQL resolvers that need to be migrated to pure Effect DI. Additionally, skill documentation shows outdated patterns.

**Files with remaining `context.container.resolve()`:**

| File                                                     | Count | Services Used                                                        |
| -------------------------------------------------------- | ----- | -------------------------------------------------------------------- |
| `packages/frameworks/src/graphql/resolvers/User.ts`      | 6     | GetUserUseCase, CreateUserUseCase, UpdateUserUseCase, userRepository |
| `packages/frameworks/src/graphql/resolvers/Trip.ts`      | 3     | GetTripUseCase, CreateTripUseCase, UpdateTripUseCase                 |
| `packages/frameworks/src/graphql/resolvers/Challenge.ts` | 2     | GetChallengeUseCase, CreateChallengeUseCase                          |
| `packages/frameworks/src/graphql/resolvers/Location.ts`  | 5     | LocationRepository                                                   |
| `packages/frameworks/src/graphql/resolvers/Group.ts`     | 6     | groupRepository, effectRepo                                          |

**Total**: 22 `container.resolve()` calls across 5 resolver files

**Skill files to update:**

- `.claude/skills/graphql-schema-extensions/SKILL.md` - 3 references to `context.container.resolve()`
- `.claude/skills/graphql-subscriptions-urql/SKILL.md` - 3 references to `context.container.resolve()`

**Target Pattern**:

```typescript
// Before (awilix container):
const useCase = context.container.resolve<GetUserUseCase>("getUserUseCase");
const result = await useCase.execute({ userId: args.id });

// After (Effect Context.Tag):
const program = Effect.gen(function* () {
  const useCase = yield* GetUserUseCaseTag;
  const result = yield* useCase.execute({ userId: args.id });
  return result;
}).pipe(Effect.provide(context.appLayer));
const result = await Effect.runPromise(program);
```

## Acceptance Criteria

### Functional Requirements

- [ ] **FR1**: All `context.container.resolve()` calls removed from resolver files
  - Given: Resolver files listed above
  - When: Migration is complete
  - Then: No container.resolve calls remain in the 5 resolver files

- [ ] **FR2**: All use cases accessed via `yield* ContextTag` pattern
  - Given: Use case dependencies in resolvers
  - When: Code is executed
  - Then: Use cases are accessed through Context.Tag yielding within Effect.gen

- [ ] **FR3**: All repositories accessed via `yield* RepositoryTag` pattern
  - Given: Repository dependencies in resolvers
  - When: Code is executed
  - Then: Repositories are accessed through Context.Tag yielding within Effect.gen

- [ ] **FR4**: TypeScript type checking passes on all modified files
  - Given: Modified resolver files
  - When: Running TypeScript compiler
  - Then: No type errors in migrated files

- [ ] **FR5**: Skill documentation updated with new Effect patterns
  - Given: Skill files
  - When: Documentation is reviewed
  - Then: Shows Effect Context.Tag pattern instead of container.resolve

### Non-Functional Requirements

- [ ] **NFR1**: No significant performance regression
- [ ] **NFR2**: Pattern consistency across all migrated files
- [ ] **NFR3**: Backward compatibility maintained where needed

### Definition of Done

- [ ] All acceptance criteria pass (FR1-FR5, NFR1-NFR3)
- [ ] Zero `context.container.resolve()` calls in target resolver files
- [ ] All skill documentation updated
- [ ] TypeScript compilation passes
- [ ] PR reviewed and approved

## Implementation Process

### Phase 1: Create Use Case Tags

**Goal**: Define Context.Tags for all use cases that need to be migrated
**Success Criteria**:

- [ ] GetUserUseCaseTag exists
- [ ] CreateUserUseCaseTag exists
- [ ] UpdateUserUseCaseTag exists
- [ ] GetTripUseCaseTag exists
- [ ] CreateTripUseCaseTag exists
- [ ] UpdateTripUseCaseTag exists
- [ ] GetChallengeUseCaseTag exists
- [ ] CreateChallengeUseCaseTag exists

**Subtasks**:

1. Identify all use cases used in resolvers
2. Check if Tags already exist in use-cases package
3. Create missing Tags in appropriate locations
4. Export Tags from use-cases index
5. Wire Tags into AppLayer composition

**Estimated Effort**: Medium
**Priority**: Critical (blocks all other steps)
**Risk**: Medium

### Phase 2: Migrate Resolvers (Parallelizable)

After Phase 1 completes, the following can be executed in parallel:

#### Step 2.1: Migrate User.ts Resolvers

**File**: `packages/frameworks/src/graphql/resolvers/User.ts`  
**References**: 6 (use cases and repository)
**Success Criteria**:

- [ ] All 6 container.resolve calls converted to Context.Tags
- [ ] GetUserUseCaseTag used for getUserUseCase
- [ ] CreateUserUseCaseTag used for createUserUseCase
- [ ] UpdateUserUseCaseTag used for updateUserUseCase
- [ ] UserRepositoryTag used for userRepository
- [ ] Type checking passes

**Subtasks**:

1. Add imports for Effect and use case Tags
2. Migrate `user` query resolver
3. Migrate `me` query resolver
4. Migrate `users` query resolver
5. Migrate user mutations

**Estimated Effort**: Medium
**Priority**: High
**Risk**: Low

#### Step 2.2: Migrate Trip.ts Resolvers

**File**: `packages/frameworks/src/graphql/resolvers/Trip.ts`  
**References**: 3 (use cases)
**Success Criteria**:

- [ ] All 3 container.resolve calls converted to Context.Tags
- [ ] TripUseCaseTag used (or individual use case Tags)
- [ ] Type checking passes

**Subtasks**:

1. Add imports for Effect and use case Tags
2. Migrate trip query resolvers
3. Migrate trip mutations

**Estimated Effort**: Small
**Priority**: High
**Risk**: Low

#### Step 2.3: Migrate Challenge.ts Resolvers

**File**: `packages/frameworks/src/graphql/resolvers/Challenge.ts`  
**References**: 2 (use cases)
**Success Criteria**:

- [ ] All 2 container.resolve calls converted to Context.Tags
- [ ] Challenge use case Tags used
- [ ] Type checking passes

**Subtasks**:

1. Add imports for Effect and use case Tags
2. Migrate challenge query resolver
3. Migrate challenge mutation

**Estimated Effort**: Small
**Priority**: Medium
**Risk**: Low

#### Step 2.4: Migrate Location.ts Resolvers

**File**: `packages/frameworks/src/graphql/resolvers/Location.ts`  
**References**: 5 (LocationRepository)
**Success Criteria**:

- [ ] All 5 container.resolve calls converted to LocationRepositoryTag
- [ ] Type checking passes

**Subtasks**:

1. Add imports for Effect and LocationRepositoryTag
2. Migrate all 5 repository accesses

**Estimated Effort**: Small
**Priority**: Medium
**Risk**: Low

#### Step 2.5: Migrate Group.ts Resolvers

**File**: `packages/frameworks/src/graphql/resolvers/Group.ts`  
**References**: 6 (groupRepository, effectRepo)
**Success Criteria**:

- [ ] All 6 container.resolve calls converted to Context.Tags
- [ ] GroupRepositoryTag used for groupRepository
- [ ] EffectRepoTag created if needed for effectRepo
- [ ] Type checking passes

**Subtasks**:

1. Identify what effectRepo is and if it needs a Tag
2. Add imports for Effect and repository Tags
3. Migrate groupRepository accesses
4. Migrate effectRepo accesses

**Estimated Effort**: Medium
**Priority**: Medium
**Risk**: Medium (effectRepo needs investigation)

### Phase 3: Update Skill Documentation

**Goal**: Update skill documentation with new Effect patterns
**Success Criteria**:

- [ ] graphql-schema-extensions/SKILL.md updated
- [ ] graphql-subscriptions-urql/SKILL.md updated
- [ ] Both skills show Effect Context.Tag pattern
- [ ] Examples are syntactically correct

**Subtasks**:

1. Update Query Field Pattern in graphql-schema-extensions
2. Update Mutation Field Pattern in graphql-schema-extensions
3. Update Subscription patterns in graphql-subscriptions-urql
4. Verify all examples compile

**Estimated Effort**: Small
**Priority**: High
**Risk**: Low

### Phase 4: Verification

**Goal**: Ensure all migrations complete and tests pass
**Success Criteria**:

- [ ] Zero container.resolve calls in all target files
- [ ] TypeScript compilation passes
- [ ] All tests pass
- [ ] Skill documentation verified

**Subtasks**:

1. Run `grep -r "context.container.resolve"` - expect zero matches in resolvers
2. Run TypeScript compiler check
3. Run test suite
4. Verify skill documentation accuracy

**Estimated Effort**: Small
**Priority**: Critical
**Risk**: Low

## Dependency Graph

```
Phase 1: Create Use Case Tags
├── Phase 2.1: User.ts (parallel)
├── Phase 2.2: Trip.ts (parallel)
├── Phase 2.3: Challenge.ts (parallel)
├── Phase 2.4: Location.ts (parallel)
├── Phase 2.5: Group.ts (parallel)
└── Phase 3: Update Skills (parallel with 2.x)
    └── Phase 4: Verification
```

## Risk Register

| Risk ID | Description                      | Probability | Impact | Mitigation                  | Priority |
| ------- | -------------------------------- | ----------- | ------ | --------------------------- | -------- |
| R1      | Use case Tags don't exist yet    | High        | High   | Create Tags in Phase 1      | Critical |
| R2      | EffectRepo pattern unclear       | Medium      | Medium | Investigate Group.ts usage  | Medium   |
| R3      | Skill examples break             | Low         | Low    | Verify syntax after updates | Low      |
| R4      | Use case signatures incompatible | Low         | High   | Test each migration         | High     |

## Verification

### Verification Summary Table

| Step                    | Level    | Criticality | Threshold | Type          |
| ----------------------- | -------- | ----------- | --------- | ------------- |
| Phase 1: Create Tags    | Required | Critical    | 4.0/5.0   | Single-check  |
| Phase 2.1: User.ts      | Required | High        | 4.0/5.0   | Per-file      |
| Phase 2.2: Trip.ts      | Required | High        | 4.0/5.0   | Single-check  |
| Phase 2.3: Challenge.ts | Required | Medium      | 3.5/5.0   | Single-check  |
| Phase 2.4: Location.ts  | Required | Medium      | 3.5/5.0   | Single-check  |
| Phase 2.5: Group.ts     | Required | Medium      | 3.5/5.0   | Single-check  |
| Phase 3: Skills         | Required | High        | 4.0/5.0   | Documentation |
| Phase 4: Verification   | Required | Critical    | 4.0/5.0   | Full-panel    |

### Overall Threshold

**Target Quality**: 4.0/5.0 per phase
**Minimum Acceptable**: 3.5/5.0 for medium-criticality steps
**No phases below**: 3.0/5.0

## Implementation Summary Table

| Phase          | Files | Steps           | Effort | Risk   | Priority |
| -------------- | ----- | --------------- | ------ | ------ | -------- |
| 1: Tags        | N/A   | Tag creation    | Medium | Medium | Critical |
| 2.1: User      | 1     | 6 references    | Medium | Low    | High     |
| 2.2: Trip      | 1     | 3 references    | Small  | Low    | High     |
| 2.3: Challenge | 1     | 2 references    | Small  | Low    | Medium   |
| 2.4: Location  | 1     | 5 references    | Small  | Low    | Medium   |
| 2.5: Group     | 1     | 6 references    | Medium | Medium | Medium   |
| 3: Skills      | 2     | Pattern updates | Small  | Low    | High     |
| 4: Verify      | 5+2   | Full test suite | Small  | Low    | Critical |

**Total**: 8 phases, 22 references in resolvers, 2 skill files

## Notes

- **Parallelization**: Phase 2.1-2.5 can run in parallel after Phase 1 completes
- **Phase 3** can run in parallel with Phase 2
- **Phase 4** must run last to verify everything
