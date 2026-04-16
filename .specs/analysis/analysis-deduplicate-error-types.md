# Structured Analysis: Deduplicate Error Types and Migrate Gateways

## Executive Summary

**Task:** Deduplicate error types across the codebase and migrate gateways to use a base error interface and standardized DTOs.

**Scope:** packages/domain, packages/use-cases, packages/adapters

**Key Finding:** 40+ nearly identical RepositoryError types exist in use-case interactors, each wrapping the same DatabaseError pattern with only the operation name differing.

---

## 1. Error Type Inventory

### 1.1 Base Error Types (Domain Layer)

**File:** `packages/domain/src/system/errors/unified-errors.ts`

| Error Type                  | Tag                         | Fields                        | Usage                         |
| --------------------------- | --------------------------- | ----------------------------- | ----------------------------- |
| DomainError                 | DomainError                 | message                       | Base domain error             |
| ValidationError             | ValidationError             | field?, message               | Validation failures           |
| FieldValidationError        | FieldValidationError        | field, message                | Field-level validation        |
| SchemaValidationError       | SchemaValidationError       | message                       | Schema validation             |
| ConstraintViolationError    | ConstraintViolationError    | message                       | Constraint failures           |
| InvariantError              | InvariantError              | message                       | Business invariant violations |
| NotFoundError               | NotFoundError               | entity?, id?, message         | Generic not found             |
| EntityNotFoundError         | EntityNotFoundError         | entity, id                    | Entity-specific not found     |
| ResourceNotFoundError       | ResourceNotFoundError       | resource, id                  | Resource not found            |
| StateTransitionError        | StateTransitionError        | from, to, entityType, message | Invalid state transitions     |
| InvalidStateError           | InvalidStateError           | state, message                | Invalid entity state          |
| UnauthorizedError           | UnauthorizedError           | message                       | Auth failures                 |
| ForbiddenError              | ForbiddenError              | message                       | Permission denied             |
| AuthenticationError         | AuthenticationError         | message                       | Authentication failures       |
| ConflictError               | ConflictError               | message                       | Resource conflicts            |
| DuplicateError              | DuplicateError              | entity, field, value          | Duplicate entries             |
| ConcurrentModificationError | ConcurrentModificationError | message                       | Concurrent edit conflicts     |
| QuotaExceededError          | QuotaExceededError          | quota, limit                  | Quota limits                  |
| DatabaseError               | DatabaseError               | operation, message, cause?    | DB operation failures         |
| NetworkError                | NetworkError                | cause?                        | Network failures              |
| ServiceUnavailableError     | ServiceUnavailableError     | service                       | Service unavailable           |
| ResourceUnavailableError    | ResourceUnavailableError    | resource                      | Resource unavailable          |
| ConfigurationError          | ConfigurationError          | message                       | Config errors                 |
| UnexpectedError             | UnexpectedError             | cause?                        | Unexpected failures           |
| AppError                    | AppError                    | message                       | Application errors            |

**Total:** 24 error types defined in unified-errors.ts

### 1.2 Gateway Error Interfaces (Domain Layer)

**File:** `packages/domain/src/ports/gateway-error.ts`

| Interface            | Extends      | Fields                                   | Status           |
| -------------------- | ------------ | ---------------------------------------- | ---------------- |
| GatewayError         | -            | \_tag, message                           | Currently unused |
| DatabaseGatewayError | GatewayError | \_tag="DatabaseError", operation, cause? | Currently unused |

**Issue:** These interfaces exist but implementations use DatabaseError from unified-errors.ts instead.

### 1.3 Use Case Layer Error Types

**File:** `packages/use-cases/src/system/errors/use-case-error.ts`

| Error Type   | Tag          | Fields                     | Usage                |
| ------------ | ------------ | -------------------------- | -------------------- |
| UseCaseError | UseCaseError | operation, message, cause? | Orchestration errors |

### 1.4 Adapter Layer Error Types (Inconsistency Issue)

**File:** `packages/adapters/src/system/errors/adapter-errors.ts` (375 lines)

**CRITICAL FINDING:** Adapter errors use MIXED patterns - some use `Data.TaggedError`, others use plain `Error` classes.

**Correct (Data.TaggedError):**
| Error Type | Tag | Fields | Code |
| ------------------------- | ------------------------- | --------------------------- | ------------------- |
| ServiceError | ServiceError | operation, message, cause? | "SERVICE_ERROR" |
| DatabaseConnectionError | DatabaseConnectionError | message, cause? | "CONNECTION_ERROR" |
| DatabaseTransactionError | DatabaseTransactionError | operation, message, cause? | "TRANSACTION_ERROR" |

**INCORRECT (Plain Error classes - need migration):**
| Error Type | \_tag | Fields | Code |
| ------------------------- | ------------------------- | ----------------------------------------- | ------------------- |
| ExternalAPIError | "ExternalAPIError" | service, endpoint, statusCode?, message | "API_ERROR" |
| ExternalAPITimeoutError | "ExternalAPITimeoutError" | service, endpoint, timeoutMs | "API_TIMEOUT" |
| StorageError | "StorageError" | operation, path, message, cause? | "STORAGE_ERROR" |
| StorageFileNotFoundError | "StorageFileNotFoundError"| path | "FILE_NOT_FOUND" |
| MappingError | "MappingError" | source, target, field?, message | "MAPPING_ERROR" |
| ConfigurationError | "ConfigurationError" | key, message | "CONFIG_ERROR" |

**Note:** `DatabaseError` is re-exported from `@mirai-app/domain` for consistency.

### 1.5 RepositoryError Duplicates (High Priority)

**Location:** Scattered across use-case interactors

| Error Type                           | Count | Location Example                                                      |
| ------------------------------------ | ----- | --------------------------------------------------------------------- |
| \*RepositoryError variants           | ~40   | Various interactor files                                              |
| ActivityRepositoryError              | 1     | activity/interactors/\*.ts                                            |
| ChallengeRepositoryError             | 1     | challenge/interactors/create.ts                                       |
| ChallengeDeleteRepositoryError       | 1     | challenge/interactors/delete.ts                                       |
| ChallengeUpdateRepositoryError       | 1     | challenge/interactors/update.ts                                       |
| ChallengeVoteRepositoryError         | 1     | challenge/interactors/vote/create.ts                                  |
| ChallengeVoteUpdateRepositoryError   | 1     | challenge/interactors/vote/update.ts                                  |
| ChallengeVoteDeleteRepositoryError   | 1     | challenge/interactors/vote/delete.ts                                  |
| ChallengeVoteGetRepositoryError      | 1     | challenge/interactors/vote/get-by-id.ts                               |
| CreateEventRepositoryError           | 1     | event/interactors/create.ts                                           |
| DeleteActivityRepositoryError        | 1     | activity/interactors/delete.ts                                        |
| DeleteSubmissionRepositoryError      | 1     | challenge/interactors/submission/delete.ts                            |
| EventRepositoryError                 | 1     | event/interactors/get.ts                                              |
| GetMyVotesRepositoryError            | 1     | challenge/interactors/vote/get-my.ts                                  |
| GetSubmissionRepositoryError         | 1     | challenge/interactors/submission/get.ts                               |
| GetVotesByChallengeRepositoryError   | 1     | challenge/interactors/vote/get-by-challenge.ts                        |
| GetVotingProgressRepositoryError     | 2     | challenge/interactors/voting-progress.ts, vote/get-judged-progress.ts |
| HideActivityRepositoryError          | 1     | activity/interactors/hide.ts                                          |
| ListEventsRepositoryError            | 1     | event/interactors/list.ts                                             |
| ListSubmissionsRepositoryError       | 1     | challenge/interactors/submission/list-by-challenge.ts                 |
| NotificationRepositoryError          | 1     | notification/interactors/create.ts                                    |
| PurchaseRepositoryError              | 1     | purchase/interactors/get-history.ts                                   |
| RewardRepositoryError                | 5     | reward/interactors/\*.ts (aliased in index.ts)                        |
| SetRewardHiddenRepositoryError       | 1     | reward/interactors/set-hidden.ts                                      |
| SubmissionRepositoryError            | 1     | challenge/interactors/submission/create.ts                            |
| UnhideActivityRepositoryError        | 1     | activity/interactors/unhide.ts                                        |
| UpdateActivityRepositoryError        | 1     | activity/interactors/update.ts                                        |
| UpdateSharingSettingsRepositoryError | 1     | location/interactors/sharing/update-settings.ts                       |
| UpdateSubmissionRepositoryError      | 1     | challenge/interactors/submission/update.ts                            |
| VoteRepositoryError                  | 1     | challenge/interactors/vote/submit.ts                                  |
| BatchVoteRepositoryError             | 1     | challenge/interactors/vote/submit-batch.ts                            |

**Pattern Analysis:**
All RepositoryError types follow identical structure:

```typescript
export class XxxRepositoryError extends Data.TaggedError("XxxRepositoryError")<{
  operation: string;
  message: string;
  cause: unknown;
}>() {}
```

**Duplication Impact:** High - 40+ error types that differ only in name and tag.

---

## 2. Gateway Inventory

### 2.1 Gateway Port Files (Use Cases Layer)

**Total:** 18 gateway port interfaces

| Gateway                     | File                                   | Uses DatabaseError | Methods Count |
| --------------------------- | -------------------------------------- | ------------------ | ------------- |
| UserGateway                 | user/ports/gateway.ts                  | Yes                | 8             |
| TripGateway                 | trip/ports/gateway.ts                  | Yes                | ~10           |
| GroupGateway                | group/ports/gateway.ts                 | Yes                | ~12           |
| ChallengeGateway            | challenge/ports/gateway.ts             | Yes                | ~15           |
| ChallengeSubmissionGateway  | challenge/ports/submission/gateway.ts  | Yes                | 10            |
| ChallengeVoteGateway        | challenge/ports/vote/gateway.ts        | Yes                | 10            |
| LocationGateway             | location/ports/gateway.ts              | Yes                | 15+           |
| ActivityFeedGateway         | activity/ports/gateway.ts              | Yes                | 12            |
| SponsorGateway              | sponsor/ports/gateway.ts               | Yes                | 8             |
| EventGateway                | event/ports/gateway.ts                 | Yes                | 11            |
| SubmissionReportGateway     | report/ports/gateway.ts                | Yes                | 6             |
| NotificationGateway         | notification/ports/gateway.ts          | Yes                | 10            |
| NotificationDeliveryGateway | notification/ports/delivery/gateway.ts | Yes                | 8             |
| NotificationScheduleGateway | notification/ports/schedule/gateway.ts | Yes                | 15+           |
| NotificationSenderGateway   | notification/ports/sender/gateway.ts   | Yes                | 5             |
| CoinTransactionGateway      | coin/ports/gateway.ts                  | Yes                | 8             |
| RewardGateway               | reward/ports/gateway.ts                | Yes                | 12            |

### 2.2 Gateway Implementations (Adapters Layer)

**Drizzle Implementations:** 16 files

| Gateway                            | File                                      | Extends BaseDrizzleGateway | Uses DatabaseError |
| ---------------------------------- | ----------------------------------------- | -------------------------- | ------------------ |
| DrizzleUserGateway                 | user/gateways/drizzle/gateway.ts          | Yes                        | Yes                |
| DrizzleTripGateway                 | trip/gateways/drizzle/gateway.ts          | Yes                        | Yes                |
| DrizzleGroupGateway                | group/gateways/drizzle/gateway.ts         | Yes                        | Yes                |
| DrizzleChallengeGateway            | challenge/gateways/drizzle/gateway.ts     | Yes                        | Yes                |
| DrizzleChallengeSubmissionGateway  | challenge/gateways/drizzle/submission.ts  | Yes                        | Yes                |
| DrizzleChallengeVoteGateway        | challenge/gateways/drizzle/vote.ts        | Yes                        | Yes                |
| DrizzleLocationGateway             | location/gateways/drizzle/gateway.ts      | Yes                        | Yes                |
| DrizzleActivityFeedGateway         | activity/gateways/drizzle/gateway.ts      | Yes                        | Yes                |
| DrizzleSponsorGateway              | sponsor/gateways/drizzle/gateway.ts       | Yes                        | Yes                |
| DrizzleEventGateway                | event/gateways/drizzle/gateway.ts         | Yes                        | Yes                |
| DrizzleSubmissionGateway           | submission/gateways/drizzle/gateway.ts    | Yes                        | Yes                |
| DrizzleNotificationGateway         | notification/gateways/drizzle/gateway.ts  | Yes                        | Yes                |
| DrizzleNotificationDeliveryGateway | notification/gateways/drizzle/delivery.ts | Yes                        | Yes                |
| DrizzleNotificationScheduleGateway | notification/gateways/drizzle/schedule.ts | Yes                        | Yes                |
| DrizzleCoinTransactionGateway      | coin/gateways/drizzle/gateway.ts          | Yes                        | Yes                |
| DrizzleRewardGateway               | reward/gateways/drizzle/gateway.ts        | Yes                        | Yes                |

**In-Memory Implementations:** 16 files (matching drizzle)

| Gateway             | File                               | Extends InMemoryGateway |
| ------------------- | ---------------------------------- | ----------------------- |
| InMemoryUserGateway | user/gateways/in-memory/gateway.ts | Yes                     |
| InMemoryTripGateway | trip/gateways/in-memory/gateway.ts | Yes                     |
| ... and 14 more     | ...                                | ...                     |

**Base Classes:**

- `packages/adapters/src/system/shared/gateways/drizzle-base.ts` - BaseDrizzleGateway
- `packages/adapters/src/system/shared/gateways/in-memory-base.ts` - InMemoryGateway

---

## 3. DTO Inventory

### 3.1 DTO Files

**Total:** 13 DTO definition files

| DTO File             | Domain       | Exports                                                           |
| -------------------- | ------------ | ----------------------------------------------------------------- |
| user/dto.ts          | User         | UserDTO, UserPaginatedResult                                      |
| trip/dto.ts          | Trip         | TripDTO, TripPaginatedResult, TripSummaryDTO                      |
| group/dto.ts         | Group        | GroupDTO, GroupPaginatedResult                                    |
| challenge/dto.ts     | Challenge    | ChallengeDTO, ChallengeSubmissionDTO, ChallengeVoteDTO, etc.      |
| activity/dto.ts      | Activity     | ActivityFeedDTO, ActivityItemDTO, etc.                            |
| notification/dto.ts  | Notification | NotificationDTO, NotificationDeliveryDTO, NotificationScheduleDTO |
| location/dto.ts      | Location     | LocationDTO, LocationSharingSettingsDTO, etc.                     |
| event/dto.ts         | Event        | EventDTO, EventPaginatedResult                                    |
| reward/dto.ts        | Reward       | RewardDTO, RewardPaginatedResult                                  |
| sponsor/dto.ts       | Sponsor      | SponsorDTO, SponsorPaginatedResult                                |
| report/dto.ts        | Report       | SubmissionReportDTO                                               |
| coin/dto.ts          | Coin         | CoinTransactionDTO                                                |
| system/shared/dto.ts | System       | PaginatedResult<T>, PaginationOptions                             |

---

## 4. Files to Modify/Create/Delete

### 4.1 Files to Modify (High Priority)

| File                                                   | Changes                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| packages/domain/src/ports/gateway-error.ts             | Update GatewayError interface, make it the base for all gateway errors               |
| packages/domain/src/system/errors/unified-errors.ts    | Add GatewayError base type if not present, ensure DatabaseError extends GatewayError |
| packages/use-cases/src/system/errors/use-case-error.ts | Ensure extends base GatewayError pattern                                             |
| packages/use-cases/src/index.ts                        | Update exports - remove individual RepositoryError re-exports, use base type         |

### 4.2 Files to Modify (Medium Priority) - Interactor Error Definitions

**Challenge Domain Interactors (~15 files):**

- packages/use-cases/src/challenge/interactors/submission/delete.ts
- packages/use-cases/src/challenge/interactors/submission/update.ts
- packages/use-cases/src/challenge/interactors/submission/create.ts
- packages/use-cases/src/challenge/interactors/submission/get.ts
- packages/use-cases/src/challenge/interactors/submission/list-by-challenge.ts
- packages/use-cases/src/challenge/interactors/vote/create.ts
- packages/use-cases/src/challenge/interactors/vote/update.ts
- packages/use-cases/src/challenge/interactors/vote/delete.ts
- packages/use-cases/src/challenge/interactors/vote/submit.ts
- packages/use-cases/src/challenge/interactors/vote/submit-batch.ts
- packages/use-cases/src/challenge/interactors/vote/get-by-id.ts
- packages/use-cases/src/challenge/interactors/vote/get-my.ts
- packages/use-cases/src/challenge/interactors/vote/get-by-challenge.ts
- packages/use-cases/src/challenge/interactors/vote/get-judged-progress.ts
- packages/use-cases/src/challenge/interactors/create.ts
- packages/use-cases/src/challenge/interactors/update.ts
- packages/use-cases/src/challenge/interactors/delete.ts
- packages/use-cases/src/challenge/interactors/get.ts
- packages/use-cases/src/challenge/interactors/voting-progress.ts

**Activity Domain Interactors (~5 files):**

- packages/use-cases/src/activity/interactors/create.ts
- packages/use-cases/src/activity/interactors/get-by-id.ts
- packages/use-cases/src/activity/interactors/update.ts
- packages/use-cases/src/activity/interactors/hide.ts
- packages/use-cases/src/activity/interactors/unhide.ts
- packages/use-cases/src/activity/interactors/delete.ts

**Event Domain Interactors (~3 files):**

- packages/use-cases/src/event/interactors/create.ts
- packages/use-cases/src/event/interactors/get.ts
- packages/use-cases/src/event/interactors/list.ts

**Notification Domain Interactors (~10 files):**

- packages/use-cases/src/notification/interactors/create.ts
- packages/use-cases/src/notification/interactors/get.ts
- packages/use-cases/src/notification/interactors/update.ts
- packages/use-cases/src/notification/interactors/delete.ts
- packages/use-cases/src/notification/interactors/schedule/\*.ts (10 files)
- packages/use-cases/src/notification/interactors/delivery/\*.ts (5 files)
- packages/use-cases/src/notification/interactors/sender/\*.ts (5 files)

**Total Interactor Files with Local RepositoryErrors:** ~50 files

### 4.3 Files to Modify (Low Priority) - Gateway Ports

All 18 gateway port files need review to ensure they use the standardized error type:

1. packages/use-cases/src/user/ports/gateway.ts
2. packages/use-cases/src/trip/ports/gateway.ts
3. packages/use-cases/src/group/ports/gateway.ts
4. packages/use-cases/src/challenge/ports/gateway.ts
5. packages/use-cases/src/challenge/ports/submission/gateway.ts
6. packages/use-cases/src/challenge/ports/vote/gateway.ts
7. packages/use-cases/src/location/ports/gateway.ts
8. packages/use-cases/src/activity/ports/gateway.ts
9. packages/use-cases/src/sponsor/ports/gateway.ts
10. packages/use-cases/src/event/ports/gateway.ts
11. packages/use-cases/src/report/ports/gateway.ts
12. packages/use-cases/src/notification/ports/gateway.ts
13. packages/use-cases/src/notification/ports/delivery/gateway.ts
14. packages/use-cases/src/notification/ports/schedule/gateway.ts
15. packages/use-cases/src/notification/ports/sender/gateway.ts
16. packages/use-cases/src/coin/ports/gateway.ts
17. packages/use-cases/src/reward/ports/gateway.ts

### 4.4 Files to Create

| File                                                        | Purpose                                     |
| ----------------------------------------------------------- | ------------------------------------------- |
| packages/domain/src/ports/gateway-error.ts (update)         | Enhance GatewayError with operation context |
| packages/use-cases/src/system/errors/gateway-error.ts (new) | Re-export and extend for use cases layer    |
| packages/adapters/src/system/errors/gateway-error.ts (new)  | Adapter-specific gateway error handling     |

### 4.5 Files to Delete

None - existing files will be refactored, not deleted.

---

## 5. Risk Assessment

### 5.1 High Risk Areas

| Risk                                              | Impact                       | Mitigation                                                         |
| ------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| Breaking changes to error handling in interactors | High - affects all use cases | Phase migration, maintain backward compatibility with type aliases |
| GraphQL error mapping breakage                    | High - affects API responses | Update error handlers to recognize new unified error types         |
| Test failures due to error type changes           | Medium - ~100+ test files    | Update test assertions to use base error type checking             |

### 5.2 Medium Risk Areas

| Risk                                | Impact | Mitigation                                           |
| ----------------------------------- | ------ | ---------------------------------------------------- |
| Controller error handling updates   | Medium | Controllers already use generic error handling       |
| Type narrowing with Effect.catchTag | Medium | Ensure unified errors have unique tags for narrowing |

### 5.3 Low Risk Areas

| Risk                           | Impact | Mitigation                                         |
| ------------------------------ | ------ | -------------------------------------------------- |
| Gateway implementation changes | Low    | Gateways already use DatabaseError                 |
| DTO structure changes          | Low    | DTOs are interfaces, not affected by error changes |

---

## 6. Integration Points

### 6.1 Error Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Current Error Flow                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Gateway (Adapter)                                                │
│    └─> Effect.tryPromise                                          │
│          └─> catch: DatabaseError { operation, message, cause }    │
│                └─> Returns: Effect<T, DatabaseError, never>      │
│                                                                  │
│  Use Case Interactor                                              │
│    └─> Catches DatabaseError                                       │
│          └─> Wraps in XxxRepositoryError { operation, cause }      │
│                └─> Returns: Effect<T, XxxRepositoryError, never> │
│                                                                  │
│  Controller (Adapter)                                             │
│    └─> Runs Effect                                                 │
│          └─> catchTag handlers for each specific error type        │
│                └─> Converts to GraphQLError                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Target Error Flow (After Deduplication)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Gateway (Adapter)                                                │
│    └─> Effect.tryPromise                                          │
│          └─> catch: GatewayError { operation, entity, cause }    │
│                └─> Returns: Effect<T, GatewayError, never>         │
│                                                                  │
│  Use Case Interactor                                              │
│    └─> Uses GatewayError directly or specific domain errors        │
│          └─> DomainError, NotFoundError, ValidationError, etc.     │
│                └─> Returns: Effect<T, DomainErrors, never>         │
│                                                                  │
│  Controller (Adapter)                                             │
│    └─> Runs Effect                                                 │
│          └─> Unified error handler                                 │
│                └─> Converts to GraphQLError                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Key Integration Files

| Integration Point     | Files                                                                                       | Relationship                             |
| --------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Domain -> Use Cases   | packages/domain/src/ports/gateway-error.ts -> packages/use-cases/src/\*/ports/gateway.ts    | Port interfaces define gateway contracts |
| Use Cases -> Adapters | packages/use-cases/src/_/ports/gateway.ts -> packages/adapters/src/_/gateways/drizzle/\*.ts | Adapter implements use case ports        |
| Error Handling        | packages/domain/src/system/errors/\*.ts -> all layers                                       | Error types flow upward through layers   |
| DTOs                  | packages/use-cases/src/\*/dto.ts -> adapters, controllers                                   | DTOs pass data between layers            |

---

## 7. Migration Strategy Recommendations

### 7.1 Phase 1: Base Error Type (Foundation)

1. Update `packages/domain/src/ports/gateway-error.ts`
   - Add `entity` field to GatewayError
   - Ensure DatabaseGatewayError is properly defined
   - Re-export from domain index

2. Create unified gateway error factory
   - Single function to create gateway errors with operation context
   - Type-safe builder pattern

### 7.2 Phase 2: Interactor Refactoring

1. Replace RepositoryError variants with base type
   - Start with one domain (e.g., challenge)
   - Replace specific RepositoryErrors with GatewayError
   - Update all interactors in the domain
   - Run tests

2. Repeat for each domain

### 7.3 Phase 3: Gateway Port Updates

1. Review all gateway port files
2. Ensure consistent use of standardized error type
3. Update return type signatures

### 7.4 Phase 4: Integration Testing

1. Test error handling end-to-end
2. Verify GraphQL error responses
3. Update test assertions

---

## 8. Statistics Summary

| Category                                | Count                          |
| --------------------------------------- | ------------------------------ |
| Total TypeScript files with TaggedError | 115                            |
| Unique TaggedError patterns             | 237                            |
| RepositoryError duplicate types         | ~40                            |
| Gateway port files                      | 18                             |
| Gateway implementation files            | 32 (16 drizzle + 16 in-memory) |
| DTO definition files                    | 13                             |
| Interactor files with local errors      | ~50                            |
| Error types in unified-errors.ts        | 24                             |
| Adapter errors using plain Error        | 6 (needs migration)            |
| Files requiring modification            | ~70                            |
| Total gateways (drizzle + in-memory)    | 34                             |

---

## 9. File Paths Created

1. `.specs/scratchpad/analysis-15c50f2661cdd41b.md` - Working scratchpad notes
2. `.specs/analysis/analysis-deduplicate-error-types.md` - Structured analysis (this file)

---

_Analysis completed: 2026-04-16_
_Scope: packages/domain, packages/use-cases, packages/adapters_
