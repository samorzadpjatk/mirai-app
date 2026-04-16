---
title: Reorganize Pothos schemas in frameworks package with domain modules
type: refactor
---

## Initial User Prompt

Prepare Pothos schemas to use for apps based on packages - one unified schema organized by domain with modular structure including queries, mutations, and subscriptions

## Description

Organize Pothos GraphQL schemas in `packages/frameworks/src/graphql/types/` into domain-based modules. Each domain (user, event, sponsor, notification, coinTransaction) gets its own directory with:

- `types.ts` - Object types using Relay plugin (nodeInterface), DataLoader plugin (loadable)
- `queries.ts` - Query resolvers using controllers from adapters
- `mutations.ts` - Mutation resolvers with Scope Auth plugin for authorization
- `subscriptions.ts` - Real-time subscriptions using graphql-ws
- `index.ts` - Module exports and side-effect registration
- `types.test.ts` - Co-located tests for the domain module

Schema is assembled centrally in `packages/frameworks/src/graphql/schema.ts` and exported as a single unified GraphQL schema. Apps never consume the schema directly - they only use urql hooks generated from the schema via codegen.

Key plugins integrated:

- @pothos/plugin-relay - Node interface, global IDs, pagination
- @pothos/plugin-dataloader - N+1 prevention, batch loading
- @pothos/plugin-scope-auth - Field-level authorization

Includes proper error handling mapping domain errors to GraphQL, co-located tests for each domain, and CI/CD integration for schema generation.

**Skill Reference**: `.claude/skills/pothos-schema-modules/SKILL.md`
**Codebase Analysis**: `.specs/analysis/analysis-reorganize-pothos-schemas.md`

## Acceptance Criteria

- [ ] Each domain moved from flat files to modular directory structure (user/, event/, sponsor/, notification/, coinTransaction/)
- [ ] All three Pothos plugins properly utilized in type definitions (Relay node interface, loadable fields, auth scopes)
- [ ] Schema assembly point created at `packages/frameworks/src/graphql/schema.ts` exporting unified schema
- [ ] Schema generation script outputs SDL to `packages/graphql-client/src/generated/graphql/schema.graphql`
- [ ] Error handling utilities integrated with resolver patterns (mapDomainErrorToGraphQL)
- [ ] Test files created for each domain module (types.test.ts in each domain directory)
- [ ] Documentation updated with new patterns in AGENTS.md
- [ ] No breaking changes to generated GraphQL schema (verified via SDL comparison)
- [ ] All existing tests pass (`bun test` passes)
- [ ] New module structure documented in AGENTS.md

## Architecture Overview

### Solution Strategy

This refactor migrates from a flat file structure to a domain-driven modular structure without changing the public GraphQL schema. The key insight is leveraging Pothos's side-effect registration pattern - types register themselves when their modules are imported.

Key decisions:

1. **Domain-based organization**: Each business domain (user, event, sponsor, etc.) gets its own directory with co-located types, queries, mutations, and subscriptions
2. **Central schema assembly**: A single `schema.ts` file imports all domain modules and exports the unified schema
3. **Preserve existing patterns**: Keep current controller access, cursor encoding, and error handling patterns
4. **Backward compatibility**: Generated GraphQL SDL must match exactly (verified via diff)

### Directory Structure

```
packages/frameworks/src/graphql/
├── builder.ts              # Pothos builder with all plugins configured
├── schema.ts               # Central assembly point - imports all domains
├── index.ts                # Public API exports
├── context.ts              # GraphQL context (Effect Layer, auth, request info)
├── errors.ts               # Error handling utilities
├── auth.ts                 # Scope auth definitions
├── scalars.ts              # Custom GraphQL scalars
├── relay.ts                # Relay pagination utilities
├── loaders.ts              # DataLoader utilities
├── server.ts               # Yoga server setup
├── utils/
│   └── connections.ts      # Cursor/pagination helpers
└── types/
    ├── index.ts            # Barrel export for all domains
    ├── user/
    │   ├── types.ts        # User, UserConnection types
    │   ├── queries.ts      # users, usersByRole queries
    │   ├── mutations.ts    # Future: updateUser, createUser
    │   ├── subscriptions.ts# Future: userUpdated
    │   ├── index.ts        # Exports + side-effect imports
    │   └── types.test.ts   # Domain-specific tests
    ├── event/
    │   ├── types.ts        # Event, EventConnection types
    │   ├── queries.ts      # eventsByTrip, upcomingEventsByTrip, ongoingEventsByTrip, pastEventsByTrip
    │   ├── mutations.ts    # Future: createEvent, updateEvent
    │   ├── subscriptions.ts# Future: eventUpdated
    │   ├── index.ts
    │   └── types.test.ts
    ├── sponsor/
    │   ├── types.ts        # Sponsor, TripSponsor, connection types
    │   ├── queries.ts      # sponsors, sponsorsByTrip
    │   ├── mutations.ts    # Future: linkSponsor, unlinkSponsor
    │   ├── subscriptions.ts# Future: sponsorLinked
    │   ├── index.ts
    │   └── types.test.ts
    ├── notification/
    │   ├── types.ts        # Notification, connection types
    │   ├── queries.ts      # notificationsByUser, unreadNotificationsByUser
    │   ├── mutations.ts    # Future: markNotificationRead
    │   ├── subscriptions.ts# Future: newNotification
    │   ├── index.ts
    │   └── types.test.ts
    └── coinTransaction/
        ├── types.ts        # CoinTransaction, embedded types, connections
        ├── queries.ts      # coinTransactions
        ├── mutations.ts    # Future: createTransaction
        ├── subscriptions.ts# Future: transactionCreated
        ├── index.ts
        └── types.test.ts
```

### Component Breakdown

1. **Domain Modules** (5 modules - user, event, sponsor, notification, coinTransaction):
   - Each contains: types.ts, queries.ts, mutations.ts (placeholder), subscriptions.ts (placeholder), index.ts, types.test.ts
   - Responsible for registering types with Pothos builder via side-effect imports

2. **Schema Assembly** (`schema.ts`):
   - Imports all domain module indices (triggers side-effect registration)
   - Exports unified schema via `builder.toSchema()`
   - Single source of truth for schema generation

3. **Codegen Integration** (`packages/graphql-client/codegen.ts`):
   - Reads SDL from `src/generated/graphql/schema.graphql`
   - Generates urql hooks to `src/generated/urql.ts`
   - Apps import hooks, never schema directly

4. **Error Handling** (existing `errors.ts`):
   - `mapDomainErrorToGraphQL()` maps domain errors to GraphQL format
   - Preserved unchanged in resolvers

### Integration Points

| Consumer                | Current Usage              | Post-Refactor                                         |
| ----------------------- | -------------------------- | ----------------------------------------------------- |
| apps/backend-server     | Imports types individually | Imports `schema` from `@mirai-app/frameworks/graphql` |
| packages/graphql-client | Reads generated SDL        | Same - SDL generation from schema.ts                  |
| Tests                   | Import specific types      | Import from domain module index                       |

### Expected Changes Summary

**New Files (25 files):**

- `packages/frameworks/src/graphql/schema.ts`
- `packages/frameworks/src/graphql/types/index.ts`
- 5 domain directories × 5 files each = 25 files
  - types.ts, queries.ts, mutations.ts, subscriptions.ts, index.ts
- 5 test files: `types.test.ts` per domain

**Deleted Files (5 files):**

- `packages/frameworks/src/graphql/types/user.ts`
- `packages/frameworks/src/graphql/types/event.ts`
- `packages/frameworks/src/graphql/types/sponsor.ts`
- `packages/frameworks/src/graphql/types/types/notification.ts`
- `packages/frameworks/src/graphql/types/coinTransaction.ts`

**Modified Files (2 files):**

- `packages/frameworks/src/graphql/index.ts` - Add schema exports
- `packages/frameworks/src/graphql/schema-output.ts` - Update to use new entry point

## Implementation Process

### Phase 1: Setup & Foundation

#### Step 1: Create Domain Directory Structure

**Goal**: Create all domain module directories
**Output**: 5 domain directories exist

**Subtasks**:

- Create `packages/frameworks/src/graphql/types/user/`
- Create `packages/frameworks/src/graphql/types/event/`
- Create `packages/frameworks/src/graphql/types/sponsor/`
- Create `packages/frameworks/src/graphql/types/notification/`
- Create `packages/frameworks/src/graphql/types/coinTransaction/`

**Success Criteria**:

- All 5 directories exist at correct paths
- No errors from `bun tsc --noEmit`

**Verification**:

- Level: Per-Item
- Check each directory exists

---

#### Step 2: Create Schema Assembly Point

**Goal**: Create central schema.ts file
**Output**: `packages/frameworks/src/graphql/schema.ts` exists

**Subtasks**:

- Create `schema.ts` with builder import and empty domain imports
- Export `schema` and `default schema`
- Add schema export to `packages/frameworks/src/graphql/index.ts`

**Dependencies**: Step 1 (directories exist)

**Success Criteria**:

- `schema.ts` compiles without errors
- `builder.toSchema()` returns valid schema (empty but valid)

**Verification**:

- Level: Single
- Rubric: File exists, TypeScript compiles, exports correct types

---

#### Step 3: Create Domain Module Placeholder Files

**Goal**: Create all placeholder files for domain modules
**Output**: All 25 domain files created

**Subtasks** (per domain):

- Create `{domain}/types.ts` with TODO comment and minimal structure
- Create `{domain}/queries.ts` with TODO comment
- Create `{domain}/mutations.ts` with TODO comment
- Create `{domain}/subscriptions.ts` with TODO comment
- Create `{domain}/index.ts` with TODO comment

**Parallel With**: Step 2 (no dependencies)

**Success Criteria**:

- All 25 files exist
- All files compile without errors
- Imports in index.ts resolve correctly

**Verification**:

- Level: Per-Item
- Check each file exists and compiles

---

### Phase 2: Domain Migration (user domain)

#### Step 4: Migrate User Domain - Types

**Goal**: Move user type definitions to modular structure
**Output**: `packages/frameworks/src/graphql/types/user/types.ts` complete

**Subtasks**:

- Copy UserType from `types/user.ts` to `types/user/types.ts`
- Copy UserEdgeType to new file
- Copy UserConnectionType to new file
- Copy encodeUserCursor helper function
- Copy buildUserConnection helper function
- Add proper imports (builder, DTO types, utilities)

**Dependencies**: Step 3 (placeholders exist)

**Success Criteria**:

- UserType, UserEdgeType, UserConnectionType defined in new file
- All types use builder.node() pattern with nodeInterface
- File compiles without errors
- Exports all type constants

**Risk**: Breaking type registration - must maintain exact same builder calls
**Mitigation**: Copy-paste with minimal changes, verify schema output matches

**Verification**:

- Level: Panel
- Rubric:
  1. All types exported (weight: 0.30)
  2. builder.node() pattern used correctly (weight: 0.30)
  3. No TypeScript errors (weight: 0.20)
  4. Schema output matches original (weight: 0.20)

---

#### Step 5: Migrate User Domain - Queries

**Goal**: Move user query definitions to modular structure
**Output**: `packages/frameworks/src/graphql/types/user/queries.ts` complete

**Subtasks**:

- Extract `users` and `usersByRole` queries from `types/user.ts`
- Move to `types/user/queries.ts`
- Export as `userQueries` (or use side-effect pattern)
- Update imports to reference new UserConnectionType location

**Dependencies**: Step 4 (types defined)

**Success Criteria**:

- Both queries defined in new file
- Controller access pattern preserved
- Cursor encoding/decoding works correctly
- File compiles without errors

**Verification**:

- Level: Single
- Rubric: Queries defined, resolver logic correct, imports resolve

---

#### Step 6: Complete User Domain Module

**Goal**: Create user domain index.ts and verify integration
**Output**: `packages/frameworks/src/graphql/types/user/index.ts` complete

**Subtasks**:

- Create index.ts with all exports
- Add side-effect imports for types.ts and queries.ts
- Create placeholder mutations.ts with TODO
- Create placeholder subscriptions.ts with TODO
- Update schema.ts to import user module
- Create types.test.ts with basic tests

**Dependencies**: Step 5 (queries defined)

**Success Criteria**:

- Importing user module registers types with builder
- Schema can be generated after user module import
- Test file compiles
- Original `types/user.ts` can be deleted after verification

**Verification**:

- Level: Single
- Rubric: Module integration works, types register correctly

---

### Phase 3: Domain Migration (remaining domains in parallel)

#### Step 7: Migrate Event Domain

**Goal**: Complete event domain module
**Output**: `packages/frameworks/src/graphql/types/event/` complete

**Subtasks**:

- Create types.ts with EventType, EventEdgeType, EventConnectionType
- Create queries.ts with 4 queries (eventsByTrip, upcomingEventsByTrip, ongoingEventsByTrip, pastEventsByTrip)
- Create index.ts with exports and side-effects
- Create placeholder mutations.ts, subscriptions.ts
- Create types.test.ts
- Update schema.ts to import event module

**Parallel With**: Steps 8, 9, 10 (can run simultaneously with other domain migrations)

**Dependencies**: Step 6 (user module pattern established)

**Success Criteria**:

- Event types register correctly
- All 4 queries work as before
- File compiles without errors

**Verification**:

- Level: Single
- Rubric: Types complete, queries functional, no breaking changes

---

#### Step 8: Migrate Sponsor Domain

**Goal**: Complete sponsor domain module
**Output**: `packages/frameworks/src/graphql/types/sponsor/` complete

**Subtasks**:

- Create types.ts with SponsorType, TripSponsorType, SponsorEdgeType, TripSponsorEdgeType, SponsorConnectionType, TripSponsorConnectionType
- Create queries.ts with 2 queries (sponsors, sponsorsByTrip)
- Create index.ts with exports and side-effects
- Create placeholder mutations.ts, subscriptions.ts
- Create types.test.ts
- Update schema.ts to import sponsor module

**Parallel With**: Steps 7, 9, 10

**Dependencies**: Step 6 (user module pattern established)

**Success Criteria**:

- Sponsor and TripSponsor types register correctly
- Both queries work as before
- Cross-type reference (TripSponsor.sponsor field) works

**Risk**: TripSponsorType has field referencing SponsorType - cross-domain dependency
**Mitigation**: Ensure both types available at registration time

**Verification**:

- Level: Single
- Rubric: Types complete, cross-references work, queries functional

---

#### Step 9: Migrate Notification Domain

**Goal**: Complete notification domain module
**Output**: `packages/frameworks/src/graphql/types/notification/` complete

**Subtasks**:

- Create types.ts with NotificationType, NotificationEdgeType, NotificationConnectionType
- Create queries.ts with 2 queries (notificationsByUser, unreadNotificationsByUser)
- Create index.ts with exports and side-effects
- Create placeholder mutations.ts, subscriptions.ts
- Create types.test.ts
- Update schema.ts to import notification module

**Parallel With**: Steps 7, 8, 10

**Dependencies**: Step 6 (user module pattern established)

**Success Criteria**:

- Notification types register correctly
- Both queries work as before

**Verification**:

- Level: Single
- Rubric: Types complete, queries functional

---

#### Step 10: Migrate CoinTransaction Domain

**Goal**: Complete coinTransaction domain module
**Output**: `packages/frameworks/src/graphql/types/coinTransaction/` complete

**Subtasks**:

- Create types.ts with CoinTransactionType, embedded types (CoinTransactionGroup, CoinTransactionAdmin), connection types
- Create queries.ts with coinTransactions query
- Create index.ts with exports and side-effects
- Create placeholder mutations.ts, subscriptions.ts
- Create types.test.ts
- Update schema.ts to import coinTransaction module

**Parallel With**: Steps 7, 8, 9

**Dependencies**: Step 6 (user module pattern established)

**Success Criteria**:

- CoinTransaction types register correctly
- Query works as before
- Embedded types (Group, Admin) work correctly

**Verification**:

- Level: Single
- Rubric: Types complete, embedded types work, query functional

---

### Phase 4: Cleanup & Integration

#### Step 11: Create Domain Types Index

**Goal**: Create barrel export for all domain modules
**Output**: `packages/frameworks/src/graphql/types/index.ts` complete

**Subtasks**:

- Export all domain module indices
- Re-export types for consumers who need direct access
- Ensure all side-effects triggered

**Dependencies**: Steps 7-10 (all domains migrated)

**Success Criteria**:

- All domain types accessible via `types/index.ts`
- No duplicate exports
- Compilation succeeds

**Verification**:

- Level: Single
- Rubric: All exports present, no conflicts, compiles

---

#### Step 12: Delete Old Flat Files

**Goal**: Remove legacy flat type files
**Output**: Old files deleted, imports updated

**Subtasks**:

- Delete `packages/frameworks/src/graphql/types/user.ts`
- Delete `packages/frameworks/src/graphql/types/event.ts`
- Delete `packages/frameworks/src/graphql/types/sponsor.ts`
- Delete `packages/frameworks/src/graphql/types/notification.ts`
- Delete `packages/frameworks/src/graphql/types/coinTransaction.ts`
- Search for any imports of old files and update

**Dependencies**: Step 11 (barrel exports ready)

**Success Criteria**:

- All 5 old files deleted
- No broken imports
- `bun test` passes

**Risk**: Hidden imports in test files or other packages
**Mitigation**: Global search for imports of deleted files before deletion

**Verification**:

- Level: Single
- Rubric: Files deleted, no broken references, tests pass

---

#### Step 13: Verify Schema Generation

**Goal**: Ensure SDL output matches pre-refactor
**Output**: Schema generation works, SDL matches

**Subtasks**:

- Run schema generation script
- Compare output with pre-refactor backup (or verify no breaking changes)
- Update `packages/graphql-client/codegen.ts` if needed
- Generate urql client
- Verify generated client compiles

**Dependencies**: Step 12 (old files removed)

**Success Criteria**:

- Schema SDL generated successfully
- No breaking changes (all type/field names identical)
- urql client generation succeeds
- Client package compiles

**Verification**:

- Level: Panel
- Rubric:
  1. SDL generates without errors (weight: 0.40)
  2. No breaking changes detected (weight: 0.40)
  3. Client generation succeeds (weight: 0.20)

---

### Phase 5: Documentation & Polish

#### Step 14: Update Documentation

**Goal**: Update AGENTS.md with new patterns
**Output**: Documentation reflects modular structure

**Subtasks**:

- Update `packages/frameworks/AGENTS.md` with new import patterns
- Add section on domain module structure
- Document side-effect registration pattern
- Add examples of creating new domain modules

**Dependencies**: Step 13 (schema verified)

**Success Criteria**:

- AGENTS.md has GraphQL section
- Examples show new modular patterns
- Clear guidance for future domain additions

**Verification**:

- Level: Single
- Rubric: Documentation complete, examples correct, accurate

---

#### Step 15: Final Verification

**Goal**: Complete end-to-end verification
**Output**: All tests pass, schema valid

**Subtasks**:

- Run `bun test` - all tests pass
- Run `bun tsc --noEmit` - no TypeScript errors
- Verify schema SDL matches original
- Check all acceptance criteria met

**Dependencies**: Step 14 (documentation complete)

**Success Criteria**:

- All 10 acceptance criteria met
- CI/CD would pass
- Schema is backward compatible

**Verification**:

- Level: Panel
- Rubric:
  1. All unit tests pass (weight: 0.25)
  2. TypeScript compilation clean (weight: 0.25)
  3. Schema SDL matches (weight: 0.25)
  4. All acceptance criteria met (weight: 0.25)

---

## Parallelization

### Parallel Groups

**Group A (Foundation) - Sequential**:

1. Step 1: Create directories
2. Step 2: Create schema.ts
3. Step 3: Create placeholders

**Group B (User Pattern) - Sequential after Group A**: 4. Step 4: User types 5. Step 5: User queries 6. Step 6: User index.ts + tests

**Group C (Domain Migration) - Parallel after Group B**: 7. Step 7: Event domain (parallel) 8. Step 8: Sponsor domain (parallel) 9. Step 9: Notification domain (parallel) 10. Step 10: CoinTransaction domain (parallel)

**Group D (Cleanup) - Sequential after Group C**: 11. Step 11: Create types/index.ts 12. Step 12: Delete old files 13. Step 13: Verify schema generation

**Group E (Documentation) - Sequential after Group D**: 14. Step 14: Update documentation 15. Step 15: Final verification

### Dependency Diagram

```
Group A (Steps 1-3)
       |
       v
Group B (Steps 4-6) - User Pattern
       |
       +----------------+----------------+----------------+
       |                |                |                |
       v                v                v                v
Group C: Event   Group C: Sponsor  Group C: Notify  Group C: Coins
(Step 7)          (Step 8)          (Step 9)         (Step 10)
       |                |                |                |
       +----------------+----------------+----------------+
       |
       v
Group D (Steps 11-13)
       |
       v
Group E (Steps 14-15)
```

### Agent Assignments

| Step  | Agent                | Reasoning                                       |
| ----- | -------------------- | ----------------------------------------------- |
| 1-3   | sonnet               | Straightforward file creation                   |
| 4-6   | opus                 | Establish patterns, needs careful type handling |
| 7-10  | sonnet (x4 parallel) | Follow established pattern                      |
| 11-13 | sonnet               | Cleanup and integration                         |
| 14-15 | sonnet               | Documentation and verification                  |

## Verification Summary

| Step | Level    | Threshold | Key Checks                       |
| ---- | -------- | --------- | -------------------------------- |
| 1    | Per-Item | 1.0/1.0   | 5 directories exist              |
| 2    | Single   | 4.0/5.0   | schema.ts compiles               |
| 3    | Per-Item | 1.0/1.0   | 25 files exist                   |
| 4    | Panel    | 4.0/5.0   | Types match, no breaking changes |
| 5    | Single   | 4.0/5.0   | Queries functional               |
| 6    | Single   | 4.0/5.0   | Module integration               |
| 7    | Single   | 4.0/5.0   | Event domain complete            |
| 8    | Single   | 4.0/5.0   | Sponsor domain complete          |
| 9    | Single   | 4.0/5.0   | Notification domain complete     |
| 10   | Single   | 4.0/5.0   | CoinTransaction domain complete  |
| 11   | Single   | 4.0/5.0   | Exports complete                 |
| 12   | Single   | 4.0/5.0   | No broken references             |
| 13   | Panel    | 4.0/5.0   | SDL matches, no breaking changes |
| 14   | Single   | 4.0/5.0   | Documentation accurate           |
| 15   | Panel    | 4.0/5.0   | All criteria met                 |

## Definition of Done

1. All 5 domain modules exist with proper structure
2. Central schema.ts assembles unified schema
3. All 10 acceptance criteria met
4. No breaking changes to GraphQL schema
5. All tests pass
6. Documentation updated
7. Code review completed (if applicable)

## Notes

- **Breaking Change Risk**: Minimal - this is a pure refactor with no public API changes
- **Rollback Plan**: Keep git commits granular; can revert individual domain migrations
- **Testing Strategy**: Each domain gets co-located tests; integration tests verify schema assembly
- **Performance Impact**: None expected - same code, different organization
