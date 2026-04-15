# TypeScript Error Analysis: GraphQL Migration Impact

> **Analysis Date:** 2026-04-15  
> **Total Errors Analyzed:** ~997 errors across monorepo  
> **Trigger:** GraphQL migration and package restructuring

---

## Executive Summary

The TypeScript errors stem from a **GraphQL migration** that introduced breaking changes across the monorepo. The error distribution reveals a **circular dependency** between `use-cases` and `adapters` packages, and widespread **Effect type mismatches** in the repository layer.

### Key Finding: Circular Dependency

```
WARNING: Circular package dependency detected:
@mirai-app/use-cases ↔ @mirai-app/adapters
```

This circular dependency amplifies error propagation, causing errors in adapters to cascade into frameworks and use-cases.

---

## Error Distribution by Package

| Package             | Error Count | Risk Level | Primary Error Categories                                                   |
| ------------------- | ----------- | ---------- | -------------------------------------------------------------------------- |
| use-cases           | ~676        | **HIGH**   | Type assignability (TS2322), Missing exports, Branded ID mismatches        |
| adapters            | ~254        | **HIGH**   | Effect error type mismatches, Method overrides (TS2416), Schema validators |
| frameworks          | ~294        | **MEDIUM** | Inherited from adapters, Supabase client issues                            |
| ui                  | ~107        | **LOW**    | Tamagui theme values, Storybook type issues                                |
| graphql-client      | ~40         | **MEDIUM** | Missing GraphQL operations, URQL type mismatches                           |
| domain              | ~6          | **LOW**    | Branded ID issues                                                          |
| apps/native         | ~150+       | **HIGH**   | Missing styles module, GraphQL client API changes                          |
| apps/backend-server | ~200+       | **HIGH**   | Pothos type mismatches, Auth context issues                                |
| apps/web            | ~300+       | **MEDIUM** | Missing UI component imports, GraphQL integration                          |

---

## Error Categories Analysis

### 1. TS2322 - Type Not Assignable (579 occurrences)

**Root Cause:** Branded type system and Effect error type hierarchies

**Key Patterns:**

- `string` not assignable to `UserId` (branded type: `{ readonly __brand: "UserId" }`)
- `DatabaseError` not assignable to domain error types
- Effect error type widening in repository implementations

**Affected Files:**

```
packages/use-cases/src/interactors/*.test.ts
packages/adapters/src/gateways/drizzle/*.ts
apps/backend-server/src/graphql/resolvers/*.ts
```

### 2. TS2307 - Cannot Find Module (454 occurrences)

**Root Cause:** Missing exports and broken import paths post-migration

**Key Patterns:**

- `~/styles` module not found in apps/native
- `@mirai-app/ui` missing exports: `Image`, `LoadingSpinner`, `ErrorMessage`
- `@mirai-app/graphql-client` missing operation documents

**Affected Files:**

```
apps/native/src/app/**/*.tsx
apps/web/src/components/**/*.tsx
packages/ui/src/components/index.ts
```

### 3. TS2339 - Property Does Not Exist (374 occurrences)

**Root Cause:** Repository interface changes and GraphQL client API changes

**Key Patterns:**

- `data`, `isLoading`, `error` missing on `UseQueryResponse` (URQL API change)
- `invalidate` method missing on GraphQL `Client`
- `trips` property missing on `User` type (schema change)
- `drizzleDb` export missing from `@mirai-app/frameworks/drizzle`

**Affected Files:**

```
apps/native/src/app/(tabs)/**/*.tsx
apps/backend-server/src/graphql/context.ts
apps/web/src/components/admin/**/*.tsx
```

### 4. TS7006 - Parameter Implicitly Has 'any' Type (335 occurrences)

**Root Cause:** Lambda parameter types not inferred, missing type annotations

**Key Patterns:**

- Array callback parameters: `.map(item => ...)`
- GraphQL response data structures
- Event handler parameters in forms

**Affected Files:**

```
apps/native/src/app/(tabs)/trips/**/*.tsx
apps/web/src/components/admin/challenges/*.tsx
packages/use-cases/src/interactors/*.test.ts
```

---

## Package Dependency Graph

```
                    ┌─────────────────┐
                    │      apps       │
                    │  native/web/    │
                    │ backend-server  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌───────────┐
    │    ui     │    │graphql-   │    │frameworks │
    │           │    │  client   │    │           │
    └───────────┘    └───────────┘    └─────┬─────┘
                                              │
                         ┌────────────────────┘
                         │
                         ▼
                  ┌───────────┐
                  │  adapters │◄─────────────────┐
                  │           │                  │
                  └─────┬─────┘                  │
                        │                        │
                        ▼                        │
                  ┌───────────┐                  │
                  │use-cases  │──────────────────┘
                  │           │   (circular)
                  └─────┬─────┘
                        │
                        ▼
                  ┌───────────┐
                  │   domain  │
                  │           │
                  └───────────┘
```

### Integration Points

| Integration   | From           | To             | Issue                                |
| ------------- | -------------- | -------------- | ------------------------------------ |
| Repositories  | adapters       | use-cases      | Effect error types mismatched        |
| Controllers   | adapters       | frameworks     | Schema validators incompatible       |
| GraphQL       | backend-server | graphql-client | Missing operations, type mismatches  |
| UI Components | ui             | apps           | Missing exports, Tamagui type issues |
| Styles        | native         | ~/styles       | Module resolution broken             |

---

## Risk Assessment

### HIGH RISK

#### 1. packages/use-cases - Test Infrastructure (146 errors in repository-mocks.ts)

**Impact:** Tests cannot compile, blocking CI/CD  
**Root Cause:** Repository interface expanded but mocks not updated  
**Missing Methods:**

- `findParticipantByUserIdAndTripId`
- `findParticipantsByGroupId`
- `assignUserToGroup`
- `removeUserFromGroup`
- `findAll`

#### 2. packages/adapters - Effect Type Hierarchy

**Impact:** Runtime type errors possible  
**Root Cause:** Error type narrowing not preserved through Effect chain  
**Example:**

```typescript
// DatabaseError | ConfigurationError not assignable to DomainError
Effect<
  { resumableUrl: string },
  ServiceUnavailableError | ConfigurationError,
  never
>;
// Expected:
Effect<{ resumableUrl: string }, DomainError, never>;
```

#### 3. apps/backend-server - GraphQL Resolvers

**Impact:** GraphQL API broken  
**Root Cause:** Pothos type registration mismatched with schema  
**Issues:**

- Type names as strings not assignable to `TypeParam`
- Resolver return types don't match expected `AsyncIterable`
- `args.input` typed as `unknown` instead of specific input type

#### 4. apps/native - GraphQL Client Migration

**Impact:** Mobile app non-functional  
**Root Cause:** URQL API changes not propagated  
**Issues:**

- `useQuery` returns `UseQueryResponse` not `{ data, isLoading, error }`
- `client.invalidate()` method missing
- Missing GraphQL operations: `GetGroupJoinRequestDocument`, `LeaveGroupDocument`

### MEDIUM RISK

#### 1. packages/frameworks - Supabase Integration

**Impact:** Notification sender broken  
**Issue:** `SupabaseClient` type not exported

#### 2. apps/web - Admin Dashboard

**Impact:** Admin features broken  
**Issues:**

- Missing UI component imports
- GraphQL query hook changes
- Activity type enum mismatches

### LOW RISK

#### 1. packages/ui - Theme Values

**Impact:** Visual inconsistencies  
**Issue:** Tamagui theme value strings need `$` prefix

#### 2. packages/domain - Branded IDs

**Impact:** Type safety reduced  
**Issue:** String literals not converted to branded types

---

## Similar Patterns in Codebase

### Pattern 1: Repository Interface Drift

**Location:** Multiple files  
**Pattern:** Repository interface expanded with new methods, existing implementations and mocks not updated

**Files Affected:**

```
packages/use-cases/src/test/repository-mocks.ts
packages/use-cases/src/interactors/*.test.ts
packages/adapters/src/gateways/drizzle/*.ts
```

### Pattern 2: Effect Error Type Widening

**Location:** Adapter gateways  
**Pattern:** `Effect.tryPromise` catches errors as `DatabaseError` but interface expects specific domain error

**Example:**

```typescript
// Current (broken):
Effect.tryPromise({
  try: () => db.query(),
  catch: (e) => new DatabaseError({ cause: e }),
});
// Expected error type: DomainError
// Actual error type: DatabaseError
```

### Pattern 3: Branded ID Type Mismatches

**Location:** Tests, resolvers  
**Pattern:** String literals passed where branded types required

**Example:**

```typescript
// Broken:
const userId = "user-123"; // string
// Should be:
const userId = createUserId("user-123"); // UserId branded type
```

### Pattern 4: GraphQL Client API Change

**Location:** Frontend apps  
**Pattern:** URQL's `useQuery` changed return type structure

**Example:**

```typescript
// Old API (broken):
const { data, isLoading, error } = useQuery(...)
// New API:
const [result] = useQuery(...)
// result.data, result.fetching, result.error
```

### Pattern 5: Schema Validator Date Types

**Location:** Adapter validators  
**Pattern:** Schema validators using `DateFromString` but types expect `Date`

**Example:**

```typescript
// Schema encodes Date as string:
createdAt: DateFromString; // Encoded: string, Type: Date
// But validator expects:
createdAt: Date; // Type mismatch
```

---

## Affected File Inventory

### packages/use-cases (676 errors)

| File                                                | Error Count | Key Issues                          |
| --------------------------------------------------- | ----------- | ----------------------------------- |
| `src/test/repository-mocks.ts`                      | 146         | Missing repository methods in mocks |
| `src/interactors/GetCoinQuickStats.test.ts`         | 39          | Repository mock mismatches          |
| `src/interactors/GetCoinAdditionalInsights.test.ts` | 35          | Branded ID issues                   |
| `src/interactors/AssignUserToGroup.test.ts`         | 10          | Effect type mismatches              |
| `src/interactors/CreateGroup.test.ts`               | 5           | Repository interface drift          |
| `src/interactors/*.ts` (multiple)                   | ~400        | Error type hierarchies, branded IDs |

### packages/adapters (254 errors)

| File                                            | Error Count | Key Issues                    |
| ----------------------------------------------- | ----------- | ----------------------------- |
| `src/utils/effect-executor.ts`                  | 50          | Effect error type widening    |
| `src/gateways/drizzle/event.ts`                 | 27          | Method override mismatches    |
| `src/gateways/drizzle/notification-schedule.ts` | 19          | Repository interface issues   |
| `src/controllers/storage.ts`                    | 12          | Error type mismatches         |
| `src/controllers/validators/*.ts`               | ~30         | Date/string schema mismatches |

### packages/frameworks (294 errors)

| File                             | Error Count | Key Issues                    |
| -------------------------------- | ----------- | ----------------------------- |
| `src/supabase/index.ts`          | 1           | `SupabaseClient` type missing |
| (Errors inherited from adapters) | ~290        | Circular dependency cascade   |

### packages/ui (107 errors)

| File                                  | Error Count | Key Issues                      |
| ------------------------------------- | ----------- | ------------------------------- |
| `src/components/*.stories.tsx`        | ~50         | Tamagui theme value types       |
| `src/components/__tests__/*.test.tsx` | ~30         | Component type exports          |
| `src/components/index.ts`             | 1           | Missing `SheetNamespace` export |

### apps/backend-server (200+ errors)

| File                                    | Error Count | Key Issues                      |
| --------------------------------------- | ----------- | ------------------------------- |
| `src/graphql/resolvers/activityFeed.ts` | ~150        | Pothos type registration        |
| `src/graphql/context.ts`                | 5           | `drizzleDb` export, branded IDs |
| `src/graphql/builder.ts`                | 2           | Auth failure type guards        |

### apps/native (150+ errors)

| File                                     | Error Count | Key Issues                             |
| ---------------------------------------- | ----------- | -------------------------------------- |
| `src/app/(tabs)/trips/groups/[id].tsx`   | 25          | GraphQL operations missing             |
| `src/app/(tabs)/notifications/index.tsx` | 10          | URQL API changes                       |
| `src/app/**/*.tsx`                       | ~100        | `~/styles` module, `invalidate` method |

### apps/web (300+ errors)

| File                                  | Error Count | Key Issues                  |
| ------------------------------------- | ----------- | --------------------------- |
| `src/components/admin/**/*.tsx`       | ~150        | UI imports, GraphQL types   |
| `src/components/__tests__/*.test.tsx` | ~50         | bun:test types, DOM testing |
| `src/**/*.tsx`                        | ~100        | Missing GraphQL operations  |

---

## Recommended Fix Strategy

### Phase 1: Break Circular Dependency (HIGH PRIORITY)

1. Move shared types to `packages/domain`
2. Create `packages/ports` for repository interfaces
3. Update imports in `use-cases` and `adapters`

### Phase 2: Repository Interface Alignment

1. Update `repository-mocks.ts` with all missing methods
2. Fix Effect error type hierarchies in gateways
3. Add branded ID constructors to test fixtures

### Phase 3: GraphQL Type Registration

1. Register Pothos types with proper type refs
2. Fix resolver return type annotations
3. Update GraphQL client operations

### Phase 4: Frontend Integration

1. Fix URQL hook usage patterns
2. Update missing UI component exports
3. Resolve Tamagui theme type issues

---

## Appendix: Error Code Reference

| Code   | Count | Description                  |
| ------ | ----- | ---------------------------- |
| TS2322 | 579   | Type not assignable          |
| TS2307 | 454   | Cannot find module           |
| TS2339 | 374   | Property does not exist      |
| TS7006 | 335   | Parameter implicitly 'any'   |
| TS2345 | ~300  | Argument type not assignable |
| TS2416 | 196   | Method override mismatch     |
| TS2741 | 82    | Missing properties           |
| TS2532 | 67    | Object possibly undefined    |
| TS2769 | ~20   | No overload matches          |
| TS2820 | 61    | Type not assignable to union |

---

_Analysis generated for fix-typescript-errors-graphql-migration task_
