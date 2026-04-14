---
title: Implement missing GraphQL features to fix all NOTEs in apps/native
---

## Initial User Prompt

"Fix all NOTEs on apps/native"

## Description

### What

This task implements four missing GraphQL features required by the native mobile app (apps/native). These features were identified through NOTE comments in the codebase indicating incomplete or missing functionality.

The four features to implement are:

1. **Group Member Assignment/Removal Mutations** – Enable adding and removing members from groups via GraphQL mutations
2. **Direct Challenge Query** – Allow querying a challenge directly by its ID instead of requiring a submission lookup
3. **Email Verification Field on User Type** – Expose email verification status on the User GraphQL type
4. **Challenges Pagination (Cursor-Based)** – Implement cursor-based pagination for challenges queries to support efficient data loading

### Why

These features are essential for core user flows in the native app:

- **Group management** is a primary feature for trip organization. Users need to manage group memberships to coordinate trips effectively.
- **Direct challenge access** improves user experience by allowing users to browse and view challenge details before creating a submission, supporting discovery workflows.
- **Email verification visibility** is critical for user onboarding, security, and trust. Users need to know if their email is verified to access certain features.
- **Pagination** ensures the app remains performant as the number of challenges grows, providing a scalable data loading pattern.

**Technical Context:**

- Backend uses Pothos GraphQL builder with Effect-based use cases following Clean Architecture
- Frontend uses urql client with React Native
- TripParticipant entity already handles group assignments
- Existing controllers (GroupController, ChallengeController, UserController) need extensions

## Architecture Overview

### Research Foundation

This architecture is based on:

- **Research:** [GraphQL Schema Extensions Research](../../scratchpad/research-notes-native-graphql.md) – patterns from Pothos builder, urql client, and Relay cursor spec
- **Codebase Analysis:** [Notes Native Codebase Analysis](../../scratchpad/codebase-analysis-notes-native.md) – 5 NOTE locations, dependencies, and existing patterns

### Solution Strategy

Implement four missing GraphQL features using a **backend-first approach** to ensure type safety and contract stability:

1. **Group Member Mutations** – Full-stack implementation (types → resolvers → controllers → use cases → frontend)
2. **Email Verification Field** – Backend field addition with Supabase Auth integration
3. **Direct Challenge Query** – Frontend-only refactor (query already exists in schema)
4. **Challenges Pagination** – Frontend-only refactor (query already exists with offset pagination)

### Key Architectural Decisions

#### Decision 1: Backend-First Implementation Order

**Reasoning:** GraphQL schema is the API contract. Frontend changes depend on generated types from the schema.
**Sequence:** Types → Resolvers → Controllers → Use Cases → Frontend Hooks

#### Decision 2: Offset Pagination for Challenges (Phase 1)

**Reasoning:** The `challengesByTrip` query already exists with offset-based pagination. Converting to cursor-based adds complexity without immediate benefit.
**Trade-off:** Cursor-based pagination is more scalable for mobile, but offset meets current AC5 requirements with minimal risk.
**Future:** Cursor-based can be added as non-breaking enhancement later.

#### Decision 3: Effect-Based Use Cases Following Existing Patterns

**Reasoning:** All existing use cases use `Effect.gen` + `Context.Tag` pattern for dependency injection and error handling.
**Pattern Reference:** `CreateGroup.ts`, `GetTripById.ts` in `packages/use-cases/src/interactors/`

#### Decision 4: Supabase Auth Integration for Email Verification

**Reasoning:** Email verification status is stored in Supabase Auth (`email_confirmed_at`), not the application database.
**Implementation:** User type resolver fetches from Auth API using `user.authUserId`.

### Expected Changes

#### Files to Create

| File                                                             | Purpose                                          |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| `packages/use-cases/src/interactors/AssignUserToGroup.ts`        | Effect use case for adding members to groups     |
| `packages/use-cases/src/interactors/RemoveUserFromGroup.ts`      | Effect use case for removing members from groups |
| `packages/use-cases/src/interactors/AssignUserToGroup.test.ts`   | Unit tests for assign use case                   |
| `packages/use-cases/src/interactors/RemoveUserFromGroup.test.ts` | Unit tests for remove use case                   |

#### Files to Modify (Backend)

| File                                                 | Changes                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `apps/backend-server/src/graphql/types/User.ts`      | Add `emailVerified: DateTime` field with Supabase Auth resolver                                                          |
| `apps/backend-server/src/graphql/types/group.ts`     | Add `AssignUserToGroupInput`, `RemoveUserFromGroupInput`, `AssignUserToGroupPayload`, `RemoveUserFromGroupPayload` types |
| `apps/backend-server/src/graphql/resolvers/group.ts` | Add `assignUserToGroup` and `removeUserFromGroup` mutations                                                              |
| `packages/adapters/src/controllers/group.ts`         | Add `assignUser()` and `removeUser()` controller methods                                                                 |
| `packages/adapters/src/controllers/user.ts`          | Add `emailVerified` to user output                                                                                       |
| `packages/use-cases/src/interactors/index.ts`        | Export new use cases                                                                                                     |
| `packages/use-cases/src/index.ts`                    | Re-export new use cases                                                                                                  |

#### Files to Modify (Frontend)

| File                                                      | Changes                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/native/src/hooks/groups/useGroupEditor.ts`          | Replace stub implementations with actual GraphQL mutations                     |
| `apps/native/src/hooks/challenges/useChallengeDetails.ts` | Switch from submission lookup to `GetChallengeDocument` query                  |
| `apps/native/src/hooks/challenges/useChallenges.ts`       | Switch from `trip.challenges` to `GetChallengesByTripDocument` with pagination |
| `apps/native/src/app/_layout.tsx`                         | Update user mapping to use `user.emailVerified` field                          |

### Component Interactions

#### Flow 1: Group Member Assignment (Full Stack)

```
useGroupEditor.ts (native app)
  ↓ imports from @mirai-app/graphql-client
@mirai-app/graphql-client (generated types)
  ↓ calls GraphQL mutation
GraphQL Resolver (resolvers/group.ts)
  ↓ resolves from DI container
GroupController (adapters/controllers/group.ts)
  ↓ runs Effect workflow
Use Case (use-cases/src/interactors/AssignUserToGroup.ts)
  ↓ uses
TripParticipant Entity (domain/src/entities/TripParticipant.ts)
  ↓ persisted via
GroupRepository (adapters/gateways/group.ts)
```

#### Flow 2: Email Verification Field (Backend)

```
User Query (resolvers/user.ts)
  ↓ User type field resolver
User Type (types/User.ts)
  ↓ calls
Auth Service (context.container.resolve)
  ↓ fetches from
Supabase Auth Admin API
```

#### Flow 3: Challenge Direct Query (Frontend Only)

**Current:** `useChallengeDetails.ts` → `GetChallengeSubmissionByChallengeAndGroupDocument` (workaround)

**New:** `useChallengeDetails.ts` → `GetChallengeDocument` (already exists in schema)

#### Flow 4: Challenges Pagination (Frontend Only)

**Current:** `useChallenges.ts` → `GetTripDocument` → `trip.challenges` (loads all)

**New:** `useChallenges.ts` → `GetChallengesByTripDocument` with pagination args (already exists)

### Implementation Priority

**Critical Path (must be done in order):**

1. Backend GraphQL types (User.emailVerified, Group input/payloads)
2. Backend resolvers (group mutations)
3. Effect use cases (AssignUserToGroup, RemoveUserFromGroup)
4. Controller methods (GroupController.assignUser, .removeUser)
5. Frontend hooks (useGroupEditor, useChallengeDetails, useChallenges)
6. \_layout.tsx update (depends on GraphQL schema regeneration)

**Independent Work:**

- Frontend-only changes (useChallengeDetails.ts, useChallenges.ts) can be done after schema is stable
- Use case unit tests can be written in parallel with implementation

## Acceptance Criteria

### AC1: Group Member Assignment Mutation

**Given** a group exists with ID `groupId`  
**And** a user exists with ID `userId` who is not a member of the group  
**When** the `addGroupMember` mutation is called with `{ groupId, userId }`  
**Then** the user is added as a member of the group  
**And** the mutation returns the updated group with the new member in the members list  
**And** the operation is idempotent (calling again does not duplicate)

### AC2: Group Member Removal Mutation

**Given** a group exists with ID `groupId`  
**And** a user with ID `userId` is currently a member of the group  
**When** the `removeGroupMember` mutation is called with `{ groupId, userId }`  
**Then** the user is removed from the group's members  
**And** the mutation returns the updated group without the removed member  
**And** attempting to remove a non-member returns an appropriate error

### AC3: Direct Challenge Query

**Given** a challenge exists with ID `challengeId`  
**When** the `challenge` query is called with `{ id: challengeId }`  
**Then** the challenge data is returned directly  
**And** the response includes all challenge fields (id, title, description, criteria, etc.)  
**And** querying a non-existent challenge returns `null` (not an error)

### AC4: Email Verification Field on User

**Given** a user exists with an email address  
**When** querying the `user` or `currentUser` fields  
**Then** the response includes a `emailVerified: Boolean` field  
**And** the field is `true` when the email has been verified  
**And** the field is `false` when the email has not been verified  
**And** the field is non-nullable in the schema

### AC5: Challenges Pagination with Cursor-Based Approach

**Given** multiple challenges exist in the system  
**When** the `challenges` query is called with `{ first: Int, after: String }` arguments  
**Then** the response includes:

- `edges` array with `node` (challenge) and `cursor`
- `pageInfo` with `hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor`  
  **And** the `after` cursor returns challenges after the specified position  
  **And** the `first` argument limits the number of results  
  **And** default pagination values are applied when arguments are omitted

## Scope

### In Scope

- **Backend Changes:**
  - GraphQL schema extensions (Pothos builder)
  - Effect-based use case implementations
  - Repository method extensions where needed
  - Controller updates (GroupController, ChallengeController, UserController)
- **Frontend Changes:**
  - GraphQL queries and mutations (urql operations)
  - TypeScript type generation updates
  - Integration with existing native app screens

### Out of Scope

- UI/UX design changes or new screen designs
- Push notification triggers for group membership changes
- Email verification email sending infrastructure (assumed to exist)
- Advanced filtering or sorting on challenges
- Subscription/real-time updates for group changes
- Admin-only group management features
- Rate limiting or additional security layers beyond existing auth

## User Scenarios

### Scenario 1: Trip Organizer Managing Group Members

> **As a** trip organizer  
> **I want to** add and remove members from my trip group  
> **So that** I can manage who participates in my trip and coordinate activities effectively

**Flow:**

1. Organizer views group details
2. Clicks "Add Member" and searches for user
3. Selects user and confirms addition
4. System adds user via `addGroupMember` mutation
5. User appears in group members list

### Scenario 2: User Browsing Challenge Details

> **As a** user exploring available challenges  
> **I want to** view challenge details directly  
> **So that** I can understand what the challenge involves before deciding to participate

**Flow:**

1. User browses challenges list
2. Clicks on a challenge card
3. App queries challenge by ID directly
4. Challenge details displayed immediately
5. User can then choose to create a submission

### Scenario 3: New User Checking Account Status

> **As a** newly registered user  
> **I want to** see if my email is verified  
> **So that** I know if I need to verify my email to access all features

**Flow:**

1. User navigates to profile/settings
2. App queries current user data including `emailVerified`
3. If `emailVerified` is false, show verification prompt
4. If `emailVerified` is true, show verified badge

### Scenario 4: User with Many Challenges

> **As a** user who has participated in many challenges  
> **I want to** browse my challenges with pagination  
> **So that** the app loads quickly and I can navigate through my history efficiently

**Flow:**

1. User opens "My Challenges" screen
2. App loads first page of challenges (e.g., 20 items)
3. User scrolls to bottom and pulls to load more
4. App fetches next page using cursor from previous response
5. New challenges appended to list seamlessly

## Dependencies

### Existing Components (to extend)

- **TripParticipant entity** – Already handles group assignments, used by group member mutations
- **GroupController** – Exists, needs new mutation resolvers
- **ChallengeController** – Exists, needs query resolver extension
- **UserController** – Exists, needs field extension
- **urql client setup** – Exists in apps/native, needs new operations

### Technical Requirements

- Pothos GraphQL builder knowledge for schema changes
- Effect framework patterns for use case implementation
- urql React patterns for frontend integration
- Cursor-based pagination understanding (Relay-style)

## Risks & Mitigations

| Risk                                    | Impact | Mitigation                                                   |
| --------------------------------------- | ------ | ------------------------------------------------------------ |
| Breaking existing queries               | High   | Add new fields/queries, don't modify existing signatures     |
| Performance degradation with pagination | Medium | Implement proper database indexing, test with large datasets |
| Group membership race conditions        | Medium | Use database transactions in Effect workflows                |

## Success Criteria

All acceptance criteria pass and:

- No NOTE comments remain in apps/native related to these features
- Backend tests cover new use cases
- Frontend integration tests verify GraphQL operations
- Performance benchmarks meet targets for paginated queries (< 200ms for 20 items)

## Implementation Process

### Phase 1: Setup & Analysis (Total: 2 hours)

#### Step 1: Baseline Verification and NOTE Discovery

- **Agent:** sonnet
- **Parallel with:** Step 2, Step 3, Step 4
- **Goal:** Establish clean baseline and identify all NOTE locations in apps/native
- **Expected Output:**
  - Documented list of all NOTE comments in apps/native
  - Confirmed passing test baseline (`bun test` green)
  - Dependency map of what each NOTE requires
- **Success Criteria:**
  - `bun test` passes with no failures
  - At least 5 NOTE locations documented per codebase analysis
  - Each NOTE mapped to AC1-AC5
- **Blockers:** None
- **Risk Level:** Low

#### Verification

**Level:** Per-Item

**Rubric:**

1. NOTE discovery list complete with file paths and line numbers (weight: 0.30)
2. Each NOTE correctly mapped to AC1-AC5 (weight: 0.25)
3. Test baseline confirmed passing with output evidence (weight: 0.25)
4. Dependency map identifies required implementation for each NOTE (weight: 0.20)

**Threshold:** 4.0/5.0

---

### Phase 2: Foundational Backend - User Email Verification (Total: 2 hours)

#### Step 2: Add emailVerified Field to User GraphQL Type

- **Agent:** sonnet
- **Parallel with:** Step 1, Step 3, Step 4
- **Goal:** Extend User type with email verification status from Supabase Auth
- **Expected Output:**
  - Modified `apps/backend-server/src/graphql/types/User.ts` with `emailVerified: DateTime` field
  - Field resolver calling Supabase Auth Admin API via context container
- **Success Criteria:**
  - GraphQL schema compiles without errors
  - User type has new field `emailVerified: DateTime` (nullable, per Supabase Auth)
  - Resolver uses `user.authUserId` to fetch from Auth API
- **Blockers:** None (can start immediately)
- **Risk Level:** Medium (external API dependency)
- **Subtasks:**
  1. Add field to User type builder
  2. Implement resolver with Supabase Auth call
  3. Handle error cases (Auth API unavailable)

#### Verification

**Level:** Panel

**Rubric:**

1. `emailVerified: DateTime` field added to User type in `apps/backend-server/src/graphql/types/User.ts` (weight: 0.25)
2. Field resolver uses `user.authUserId` to call Supabase Auth Admin API via context container (weight: 0.30)
3. Error handling implemented for Auth API failures (weight: 0.25)
4. GraphQL schema compiles without errors after changes (weight: 0.20)

**Threshold:** 4.0/5.0

---

### Phase 3: Foundational Backend - Group Member Mutations (Total: 6 hours)

#### Step 3: Create GraphQL Types for Group Member Mutations

- **Agent:** sonnet
- **Parallel with:** Step 1, Step 2, Step 4
- **Depends on:** None
- **Goal:** Add input and payload types for assign/remove mutations
- **Expected Output:**
  - Modified `apps/backend-server/src/graphql/types/group.ts` with:
    - `AssignUserToGroupInput` (groupId: ID!, userId: ID!)
    - `RemoveUserFromGroupInput` (groupId: ID!, userId: ID!)
    - `AssignUserToGroupPayload` (group: Group!)
    - `RemoveUserFromGroupPayload` (group: Group!)
- **Success Criteria:**
  - All 4 new types present in schema
  - Types follow existing Pothos builder patterns
  - Non-nullable fields where appropriate
- **Blockers:** None
- **Risk Level:** Low

#### Verification

**Level:** Per-Item

**Rubric:**

1. `AssignUserToGroupInput` type defined with `groupId: ID!` and `userId: ID!` fields (weight: 0.25)
2. `RemoveUserFromGroupInput` type defined with `groupId: ID!` and `userId: ID!` fields (weight: 0.25)
3. `AssignUserToGroupPayload` type defined with `group: Group!` field (weight: 0.25)
4. `RemoveUserFromGroupPayload` type defined with `group: Group!` field (weight: 0.25)

**Threshold:** 4.0/5.0

---

#### Step 4: Create AssignUserToGroup Effect Use Case

- **Agent:** sonnet
- **Parallel with:** Step 1, Step 2, Step 3
- **Depends on:** None
- **Goal:** Implement idempotent group member assignment use case
- **Expected Output:**
  - New file `packages/use-cases/src/interactors/AssignUserToGroup.ts`
  - New file `packages/use-cases/src/interactors/AssignUserToGroup.test.ts`
  - Effect.gen pattern with Context.Tag for GroupRepository
- **Success Criteria:**
  - Use case accepts `{ groupId: GroupId; userId: UserId }`
  - Idempotent (duplicate assignment returns success without change)
  - Returns `Effect<Group, AssignUserToGroupError, GroupRepository>`
  - All tests pass following TDD (RED-GREEN-REFACTOR)
- **Blockers:** None
- **Risk Level:** Low
- **Subtasks:**
  1. Write failing tests for assign use case
  2. Implement use case with Effect.gen
  3. Handle error cases (GroupNotFound, UserNotFound)

#### Verification

**Level:** Panel

**Rubric:**

1. Use case file `AssignUserToGroup.ts` exports function accepting `{ groupId: GroupId; userId: UserId }` (weight: 0.20)
2. Effect.gen pattern used with proper Context.Tag for GroupRepository dependency (weight: 0.25)
3. Idempotency logic implemented (duplicate assignment returns success without change) (weight: 0.20)
4. Error types defined: `GroupNotFoundError`, `UserNotFoundError` using Data.TaggedError (weight: 0.20)
5. Test file `AssignUserToGroup.test.ts` covers success and error cases following TDD (weight: 0.15)

**Threshold:** 4.0/5.0

---

#### Step 5: Create RemoveUserFromGroup Effect Use Case

- **Agent:** sonnet
- **Parallel with:** Step 1, Step 2, Step 3, Step 4
- **Goal:** Implement group member removal use case
- **Expected Output:**
  - New file `packages/use-cases/src/interactors/RemoveUserFromGroup.ts`
  - New file `packages/use-cases/src/interactors/RemoveUserFromGroup.test.ts`
  - Effect.gen pattern with Context.Tag for GroupRepository
- **Success Criteria:**
  - Use case accepts `{ groupId: GroupId; userId: UserId }`
  - Returns appropriate error when removing non-member
  - Returns `Effect<Group, RemoveUserFromGroupError, GroupRepository>`
  - All tests pass following TDD
- **Blockers:** None
- **Risk Level:** Low
- **Subtasks:**
  1. Write failing tests for remove use case
  2. Implement use case with Effect.gen
  3. Handle error cases (NotGroupMember)

#### Verification

**Level:** Panel

**Rubric:**

1. Use case file `RemoveUserFromGroup.ts` exports function accepting `{ groupId: GroupId; userId: UserId }` (weight: 0.20)
2. Effect.gen pattern used with proper Context.Tag for GroupRepository dependency (weight: 0.25)
3. Returns `NotGroupMemberError` when attempting to remove non-member (weight: 0.20)
4. Error types defined using Data.TaggedError pattern (weight: 0.20)
5. Test file `RemoveUserFromGroup.test.ts` covers success and error cases following TDD (weight: 0.15)

**Threshold:** 4.0/5.0

---

#### Step 6: Export New Use Cases

- **Agent:** haiku
- **Depends on:** Steps 4, 5
- **Parallel with:** None
- **Goal:** Make use cases available to adapters layer
- **Expected Output:**
  - Modified `packages/use-cases/src/interactors/index.ts` with exports
  - Modified `packages/use-cases/src/index.ts` with re-exports
- **Success Criteria:**
  - `AssignUserToGroup` and `RemoveUserFromGroup` exported from use-cases package
  - Imports work in adapters layer
- **Blockers:** Steps 4 and 5 completed
- **Risk Level:** Low

#### Verification

**Level:** None

**Rubric:** N/A - trivial export additions

**Threshold:** N/A

---

### Phase 4: Backend Controllers & Wiring (Total: 3 hours)

#### Step 7: Extend GroupController with Member Methods

- **Agent:** sonnet
- **Depends on:** Steps 3, 6
- **Parallel with:** None
- **Goal:** Add controller methods that wire use cases to HTTP/GraphQL layer
- **Expected Output:**
  - Modified `packages/adapters/src/controllers/group.ts`
  - `assignUser(groupId, userId)` method returning Effect
  - `removeUser(groupId, userId)` method returning Effect
- **Success Criteria:**
  - Controller methods use Effect.gen
  - Methods resolve GroupRepository from container
  - Methods call use cases and return results
  - Error handling follows existing controller patterns
- **Blockers:** Steps 3, 4, 5, 6 completed
- **Risk Level:** Medium (wiring layer, integration point)
- **Subtasks:**
  1. Add assignUser method
  2. Add removeUser method
  3. Verify container resolution works

#### Verification

**Level:** Panel

**Rubric:**

1. `assignUser(groupId, userId)` method added to `packages/adapters/src/controllers/group.ts` returning Effect (weight: 0.25)
2. `removeUser(groupId, userId)` method added to `packages/adapters/src/controllers/group.ts` returning Effect (weight: 0.25)
3. Both methods use Effect.gen with proper GroupRepository resolution from container (weight: 0.25)
4. Methods correctly wire to `AssignUserToGroup` and `RemoveUserFromGroup` use cases (weight: 0.25)

**Threshold:** 4.0/5.0

---

#### Step 8: Add Group Member Mutations to GraphQL Resolvers

- **Agent:** sonnet
- **Depends on:** Steps 3, 7
- **Parallel with:** None
- **Goal:** Implement mutation resolvers using controller methods
- **Expected Output:**
  - Modified `apps/backend-server/src/graphql/resolvers/group.ts`
  - `assignUserToGroup` mutation resolver
  - `removeUserFromGroup` mutation resolver
- **Success Criteria:**
  - Both mutations use controller from context.container
  - Input validation per types defined in Step 3
  - Mutations return proper payload types
  - AC1 and AC2 acceptance criteria satisfied
- **Blockers:** Steps 3 and 7 completed
- **Risk Level:** Medium (GraphQL contract)
- **Subtasks:**
  1. Implement assignUserToGroup resolver
  2. Implement removeUserFromGroup resolver
  3. Test via GraphQL playground

#### Verification

**Level:** Panel

**Rubric:**

1. `assignUserToGroup` mutation resolver implemented in `apps/backend-server/src/graphql/resolvers/group.ts` (weight: 0.25)
2. `removeUserFromGroup` mutation resolver implemented in same file (weight: 0.25)
3. Both resolvers use controller from context.container with proper input validation (weight: 0.25)
4. Resolvers return correct payload types (`AssignUserToGroupPayload`, `RemoveUserFromGroupPayload`) (weight: 0.25)

**Threshold:** 4.0/5.0

---

#### Step 9: Regenerate GraphQL Schema and Verify Types

- **Agent:** haiku
- **Depends on:** Steps 2, 8
- **Parallel with:** None
- **Goal:** Update generated types for frontend consumption
- **Expected Output:**
  - Generated types include new mutations and fields
  - `bun run generate:graphql` or equivalent completes successfully
  - Schema file updated with new types
- **Success Criteria:**
  - Type generation succeeds without errors
  - New types available in @mirai-app/graphql-client
  - Frontend can import generated types
- **Blockers:** Steps 2 and 8 completed
- **Risk Level:** Low

#### Verification

**Level:** None

**Rubric:** N/A - automated code generation

**Threshold:** N/A

---

### Phase 5: Frontend User Stories (Total: 5 hours)

#### Step 10: Implement useGroupEditor Hook with Mutations

- **Agent:** sonnet
- **Depends on:** Step 9
- **Parallel with:** Steps 11, 12, 13
- **Goal:** Replace stub implementations with actual GraphQL mutations
- **Expected Output:**
  - Modified `apps/native/src/hooks/groups/useGroupEditor.ts`
  - Uses generated mutation types
  - Calls `assignUserToGroup` and `removeUserFromGroup` mutations
- **Success Criteria:**
  - Hook imports mutations from @mirai-app/graphql-client
  - addMember function calls assignUserToGroup mutation
  - removeMember function calls removeUserFromGroup mutation
  - AC1 and AC2 satisfied from frontend perspective
- **Blockers:** Step 9 completed (schema generation)
- **Risk Level:** Medium (existing hook dependencies)
- **Subtasks:**
  1. Import generated mutation documents
  2. Replace stub addMember implementation
  3. Replace stub removeMember implementation
  4. Handle loading and error states

#### Verification

**Level:** Panel

**Rubric:**

1. Hook imports `AssignUserToGroupDocument` and `RemoveUserFromGroupDocument` from @mirai-app/graphql-client (weight: 0.20)
2. `addMember` function calls `assignUserToGroup` mutation with proper input variables (weight: 0.25)
3. `removeMember` function calls `removeUserFromGroup` mutation with proper input variables (weight: 0.25)
4. Loading and error states properly handled with urql's useMutation patterns (weight: 0.20)
5. AC1 and AC2 acceptance criteria satisfied from frontend perspective (weight: 0.10)

**Threshold:** 4.0/5.0

---

#### Step 11: Refactor useChallengeDetails to Use Direct Challenge Query

- **Agent:** haiku
- **Depends on:** Step 9
- **Parallel with:** Steps 10, 12, 13
- **Goal:** Switch from submission lookup to direct challenge query
- **Expected Output:**
  - Modified `apps/native/src/hooks/challenges/useChallengeDetails.ts`
  - Uses `GetChallengeDocument` instead of `GetChallengeSubmissionByChallengeAndGroupDocument`
- **Success Criteria:**
  - Hook queries challenge directly by ID
  - No longer requires submission to view challenge details
  - AC3 acceptance criteria satisfied
  - Existing functionality preserved
- **Blockers:** Step 9 completed
- **Risk Level:** Low (schema already has query, frontend-only refactor)
- **Subtasks:**
  1. Switch query document import
  2. Update query variables (challengeId only)
  3. Update data mapping if needed

#### Verification

**Level:** Per-Item

**Rubric:**

1. `GetChallengeDocument` imported from @mirai-app/graphql-client (weight: 0.30)
2. Query uses `challengeId` variable only (no submissionId required) (weight: 0.30)
3. Hook data mapping updated to use challenge fields directly (weight: 0.25)
4. AC3 acceptance criteria satisfied (direct challenge query works) (weight: 0.15)

**Threshold:** 4.0/5.0

---

#### Step 12: Add Pagination to useChallenges Hook

- **Agent:** haiku
- **Depends on:** Step 9
- **Parallel with:** Steps 10, 11, 13
- **Goal:** Implement offset-based pagination for challenges queries
- **Expected Output:**
  - Modified `apps/native/src/hooks/challenges/useChallenges.ts`
  - Uses `GetChallengesByTripDocument` with pagination args
  - Implements loadMore pattern
- **Success Criteria:**
  - Hook uses `limit` and `offset` arguments
  - Returns paginated results with hasMore indicator
  - loadMore function fetches next page
  - AC5 acceptance criteria satisfied (offset pagination acceptable per ADR)
  - Performance < 200ms for 20 items
- **Blockers:** Step 9 completed
- **Risk Level:** Medium (pagination state management)
- **Subtasks:**
  1. Switch from trip.challenges to GetChallengesByTripDocument
  2. Add pagination state (limit, offset)
  3. Implement loadMore functionality
  4. Add hasMore calculation

#### Verification

**Level:** Panel

**Rubric:**

1. `GetChallengesByTripDocument` imported with `limit` and `offset` variables (weight: 0.20)
2. Pagination state managed (limit, offset, hasMore) (weight: 0.25)
3. `loadMore` function fetches next page by incrementing offset (weight: 0.20)
4. `hasMore` calculated based on returned data length (weight: 0.20)
5. AC5 acceptance criteria satisfied with performance < 200ms for 20 items (weight: 0.15)

**Threshold:** 4.0/5.0

---

#### Step 13: Update \_layout.tsx with emailVerified Field

- **Agent:** haiku
- **Depends on:** Steps 2, 9
- **Parallel with:** Steps 10, 11, 12
- **Goal:** Use new emailVerified field in user mapping
- **Expected Output:**
  - Modified `apps/native/src/app/_layout.tsx`
  - Maps `user.emailVerified` field from GraphQL
- **Success Criteria:**
  - Layout queries include emailVerified field
  - User context/mapping includes emailVerified
  - AC4 acceptance criteria satisfied
- **Blockers:** Steps 2 and 9 completed
- **Risk Level:** Low

#### Verification

**Level:** Per-Item

**Rubric:**

1. User query in `_layout.tsx` includes `emailVerified` field selection (weight: 0.35)
2. User context/mapping correctly maps `emailVerified` from GraphQL response (weight: 0.35)
3. AC4 acceptance criteria satisfied (email verification field available) (weight: 0.30)

**Threshold:** 4.0/5.0

---

### Phase 6: Polish & Verification (Total: 3 hours)

#### Step 14: Verify All Acceptance Criteria

- **Agent:** sonnet
- **Depends on:** Steps 10, 11, 12, 13
- **Parallel with:** None
- **Goal:** Systematic verification of AC1-AC5
- **Expected Output:**
  - AC1: Group member assignment works end-to-end
  - AC2: Group member removal works end-to-end
  - AC3: Direct challenge query works
  - AC4: Email verification field returns correct values
  - AC5: Pagination returns correct page structure
- **Success Criteria:**
  - All 5 acceptance criteria pass manual verification
  - GraphQL playground tests confirm each AC
- **Blockers:** Steps 10, 11, 12, 13 completed
- **Risk Level:** Low
- **Subtasks:**
  1. Test AC1 via GraphQL mutation
  2. Test AC2 via GraphQL mutation
  3. Test AC3 via query
  4. Test AC4 via user query
  5. Test AC5 via paginated query

#### Verification

**Level:** Panel

**Rubric:**

1. AC1 verified: Group member assignment mutation works end-to-end via GraphQL playground (weight: 0.20)
2. AC2 verified: Group member removal mutation works end-to-end via GraphQL playground (weight: 0.20)
3. AC3 verified: Direct challenge query returns challenge by ID correctly (weight: 0.20)
4. AC4 verified: Email verification field returns correct boolean values (weight: 0.20)
5. AC5 verified: Paginated challenges query returns correct page structure (weight: 0.20)

**Threshold:** 4.0/5.0

---

#### Step 15: Cleanup NOTE Comments and Final Verification

- **Agent:** haiku
- **Depends on:** Step 14
- **Parallel with:** None
- **Goal:** Remove all NOTE comments related to these features
- **Expected Output:**
  - Zero NOTE comments remaining in apps/native for these features
  - `bun test` passes (all tests green)
  - Performance benchmarks met
- **Success Criteria:**
  - All NOTEs from Step 1 resolved
  - Test suite passes: `bun test` green
  - Pagination query < 200ms for 20 items
  - No regressions in existing functionality
- **Blockers:** Step 14 completed
- **Risk Level:** Low

#### Verification

**Level:** Per-Item

**Rubric:**

1. Zero NOTE comments related to AC1-AC5 remain in apps/native (weight: 0.30)
2. Test suite passes: `bun test` green with no failures (weight: 0.30)
3. Pagination query performance verified < 200ms for 20 items (weight: 0.25)
4. No regressions in existing functionality (weight: 0.15)

**Threshold:** 4.0/5.0

---

## Verification Summary

| Step | Title                                                      | Level    | Threshold |
| ---- | ---------------------------------------------------------- | -------- | --------- |
| 1    | Baseline Verification and NOTE Discovery                   | Per-Item | 4.0/5.0   |
| 2    | Add emailVerified Field to User GraphQL Type               | Panel    | 4.0/5.0   |
| 3    | Create GraphQL Types for Group Member Mutations            | Per-Item | 4.0/5.0   |
| 4    | Create AssignUserToGroup Effect Use Case                   | Panel    | 4.0/5.0   |
| 5    | Create RemoveUserFromGroup Effect Use Case                 | Panel    | 4.0/5.0   |
| 6    | Export New Use Cases                                       | None     | N/A       |
| 7    | Extend GroupController with Member Methods                 | Panel    | 4.0/5.0   |
| 8    | Add Group Member Mutations to GraphQL Resolvers            | Panel    | 4.0/5.0   |
| 9    | Regenerate GraphQL Schema and Verify Types                 | None     | N/A       |
| 10   | Implement useGroupEditor Hook with Mutations               | Panel    | 4.0/5.0   |
| 11   | Refactor useChallengeDetails to Use Direct Challenge Query | Per-Item | 4.0/5.0   |
| 12   | Add Pagination to useChallenges Hook                       | Panel    | 4.0/5.0   |
| 13   | Update \_layout.tsx with emailVerified Field               | Per-Item | 4.0/5.0   |
| 14   | Verify All Acceptance Criteria                             | Panel    | 4.0/5.0   |
| 15   | Cleanup NOTE Comments and Final Verification               | Per-Item | 4.0/5.0   |

**Level Breakdown:**

- **Panel:** 8 steps (2, 4, 5, 7, 8, 10, 12, 14)
- **Per-Item:** 5 steps (1, 3, 11, 13, 15)
- **None:** 2 steps (6, 9)

**Standard Threshold:** 4.0/5.0 for all verified steps

---

## Parallelization Summary

### Execution Wave Diagram

```
WAVE 1 (5 parallel agents):          WAVE 2 (1 agent):
┌─────────────────────────────────────┐   ┌─────────┐
│ Step 1  │ Step 2  │ Step 3  │ Step 4  │   │ Step 6  │
│ (sonnet)│ (sonnet)│ (sonnet)│(sonnet)│   │ (haiku) │
├─────────┴─────────┴─────────┴─────────┤   └────┬────┘
│          Step 5 (sonnet)              │        │
└───────────────────────────────────────┘        │
                                                 │
WAVE 3 (3 agents):                               ↓
┌─────────────────────────────────┐        ┌─────────────┐
│ Step 7  │ Step 8  │ Step 9      │        │             │
│ (sonnet)│ (sonnet)│  (haiku)    │        │             │
└────┬────┴────┬────┴─────────────┘        │             │
     │         │                           │   Step 9    │
     └─────────┴──────────────────────────→└─────────────┘
                                                      │
WAVE 4 (4 parallel agents):                            ↓
┌──────────────────────────────────────────────────────────┐
│ Step 10  │ Step 11  │ Step 12  │ Step 13                    │
│ (sonnet) │ (haiku)  │ (haiku)  │ (haiku)                    │
└────┬─────┴────┬─────┴────┬─────┴────┬───────────────────────┘
     │          │          │          │
     └──────────┴────┬─────┴──────────┘
                     │
WAVE 5 (2 agents):   ↓
┌────────────────────────────────────────┐
│ Step 14          │ Step 15               │
│ (sonnet)         │ (haiku)               │
└──────────────────┴───────────────────────┘
```

### Critical Path

**Longest dependency chain (8 steps):**

```
Step 4 → Step 6 → Step 7 → Step 8 → Step 9 → Step 10 → Step 14 → Step 15
(Use   (Export (Controller (Resolver (Schema  (useGroup  (Verify   (Cleanup
 Case)  Cases)  Methods)   Mutations) Regen)   Editor)     ACs)      NOTEs)
```

**Alternative critical path via Step 5:**

```
Step 5 → Step 6 → Step 7 → Step 8 → Step 9 → Step 10 → Step 14 → Step 15
(Remove (Export (Controller (Resolver (Schema  (useGroup  (Verify   (Cleanup
 User)   Cases)  Methods)   Mutations) Regen)   Editor)     ACs)      NOTEs)
```

**Critical path time:** ~9 hours (vs 21 sequential) = **57% reduction**

### Maximum Parallel Agents Needed

| Wave | Parallel Agents | Step IDs       |
| ---- | --------------- | -------------- |
| 1    | **5**           | 1, 2, 3, 4, 5  |
| 2    | 1               | 6              |
| 3    | 3               | 7, 8, 9        |
| 4    | **4**           | 10, 11, 12, 13 |
| 5    | 2               | 14, 15         |

**Maximum concurrent agents required: 5**

### Agent Allocation Summary

| Agent Type | Steps Assigned          | Count  |
| ---------- | ----------------------- | ------ |
| sonnet     | 1, 2, 3, 4, 5, 7, 8, 10 | 8      |
| haiku      | 6, 9, 11, 12, 13, 15    | 6      |
| **Total**  |                         | **14** |

### Parallelization Strategy

1. **Wave 1** (Immediate start): Steps 1-5 all independent (AssignUserToGroup and RemoveUserFromGroup are parallel use cases)
2. **Wave 2** (Export completion): Step 6 depends on 4,5
3. **Wave 3** (Backend wiring): Step 7 depends on 3,6; Step 8 depends on 3,7; Step 9 depends on 2,8
4. **Wave 4** (Frontend - max parallelism): Steps 10-13 all parallel after schema regen
5. **Wave 5** (Verification): Step 14 after all frontend; Step 15 after 14

### Sub-Agent Execution Directive

When executing steps in parallel, sub-agents MUST:

- Work independently without blocking on other agents
- Only declare completion when success criteria are fully met
- Report blockers immediately if a true dependency is not satisfied
- Use the scratchpad for coordination if shared resources are involved

### Risk Mitigation

- **Frontend steps (10-13)** are completely independent (different files)
- **Backend types (2, 3)** are domain-separated (User vs Group)
- **Use cases (4, 5)** are sequential to avoid interface conflicts
- **Schema regen (9)** blocks all frontend work - prioritize completion

---

### Total Estimated Time: **14 hours** (parallelized)

| Phase                | Steps        | Sequential | Parallelized |
| -------------------- | ------------ | ---------- | ------------ |
| Phase 1: Setup       | 1            | 2h         | 2h           |
| Phase 2+3: Backend   | 2-6          | 8h         | 4h           |
| Phase 4: Controllers | 7-9          | 3h         | 2h           |
| Phase 5: Frontend    | 10-13        | 5h         | 3h           |
| Phase 6: Polish      | 14-15        | 3h         | 2h           |
| **Total**            | **15 steps** | **21h**    | **~14h**     |

**Time saved: ~7 hours (33% reduction)**

### Definition of Done

1. **All 5 Acceptance Criteria Pass:**
   - [ ] AC1: Group member assignment mutation works
   - [ ] AC2: Group member removal mutation works
   - [ ] AC3: Direct challenge query works
   - [ ] AC4: Email verification field on User works
   - [ ] AC5: Challenges pagination works

2. **All Files Modified per Expected Changes:**
   - [ ] 4 new use case files created (with tests)
   - [ ] 7 backend files modified (types, resolvers, controllers, exports)
   - [ ] 4 frontend files modified (hooks, layout)

3. **Quality Gates:**
   - [ ] `bun test` passes (baseline green maintained)
   - [ ] All NOTE comments in apps/native resolved
   - [ ] Performance: Paginated queries < 200ms for 20 items
   - [ ] No breaking changes to existing queries

4. **Documentation:**
   - [ ] Implementation Process completed as specified
   - [ ] All new use cases have unit tests
   - [ ] GraphQL schema documented (via generation)

---

**Decomposition created:** 2026-04-15  
**Version:** 1.0
