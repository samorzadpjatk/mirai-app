# Codebase Impact Analysis: Fix Adapters Phase 6 Test Types

**Analysis ID:** analysis-fix-adapters-phase6-tests
**Task:** Fix adapters package test file types (Phase 6)
**Date:** 2026-04-11

## Summary

This analysis identifies TypeScript type errors in the adapters package test files related to Result type handling and error narrowing. Approximately 40 errors need to be fixed across 12 test files.

## Affected Files

### Primary Files with Errors (3 files)

| File | Error Count | Location |
|------|-------------|----------|
| `InMemoryAdapters.contract.test.ts` | ~13 | `src/gateways/__tests__/` |
| `InMemoryAuthAdapter.test.ts` | ~6 | `src/gateways/__tests__/` |
| `PortImplementations.contract.test.ts` | ~1 | `src/gateways/__tests__/` |

### Other Test Files (9 files)
No TypeScript errors detected in remaining test files:
- `authServer.test.ts`
- `coin.test.ts`
- `EventEmitterPubSub.test.ts`
- `coin-transaction.test.ts`
- `SupabaseAuthAdapter.test.ts`
- `ConnectionManager.integration.test.ts`
- `EventBus.contract.test.ts`
- `NotificationDeliveryService.integration.test.ts`
- `TokenExtractor.test.ts`

## Error Pattern Analysis

### Pattern 1: Error Property Access Without Type Narrowing

**Error Type:** `TS2339: Property 'X' does not exist on type 'UnionErrorType'`

**Example:**
```typescript
// File: InMemoryAdapters.contract.test.ts:78-79
if (isErr(result)) {
  expect(result.error.sessionId).toBe(session.sessionId);  // Error!
  expect(result.error.expiredAt).toBeInstanceOf(Date);     // Error!
}
```

**Error Union:** `AuthError | InvalidTokenError | SessionExpiredError`

**Root Cause:** TypeScript cannot determine which specific error type in the union has the `sessionId` property.

**Fix Pattern:**
```typescript
if (isErr(result)) {
  if (result.error._tag === "SessionExpiredError") {
    expect(result.error.sessionId).toBe(session.sessionId);
    expect(result.error.expiredAt).toBeInstanceOf(Date);
  }
}
```

### Pattern 2: Result Value Access Without Guard

**Error Type:** `TS2339: Property 'value' does not exist on type Result<T,E>`

**Example:**
```typescript
// File: InMemoryAuthAdapter.test.ts:689
expect(result.value.userId).toBe(...);  // Error!
```

**Root Cause:** Accessing `.value` without first checking `isOk(result)`.

**Fix Pattern:**
```typescript
if (isOk(result)) {
  expect(result.value.userId).toBe(...);
}
```

### Pattern 3: Object Possibly Undefined

**Error Type:** `TS2532: Object is possibly 'undefined'`

**Example:**
```typescript
// File: InMemoryAdapters.contract.test.ts:324-325
expect(result.value[0].id).toBe(...);  // Error!
```

**Root Cause:** Array access without length check or optional chaining.

**Fix Pattern:**
```typescript
if (isOk(result) && result.value.length > 0) {
  expect(result.value[0].id).toBe(...);
}
```

## Detailed Error Inventory

### InMemoryAdapters.contract.test.ts

| Line | Error | Error Union Type | Property |
|------|-------|------------------|----------|
| 78 | TS2339 | `AuthError \| InvalidTokenError \| SessionExpiredError` | `sessionId` |
| 79 | TS2339 | `AuthError \| InvalidTokenError \| SessionExpiredError` | `expiredAt` |
| 172 | TS2339 | `AuthError \| SessionExpiredError` | `sessionId` |
| 186 | TS2339 | `AuthError \| SessionExpiredError` | `expiredAt` |
| 259 | TS2339 | `RealtimeError \| SubscriptionError` | `channel` |
| 324 | TS2532 | - | Object possibly undefined |
| 325 | TS2532 | - | Object possibly undefined |
| 588 | TS2339 | `StorageError \| UploadError \| BucketNotFoundError` | `bucket` |
| 589 | TS2339 | `StorageError \| UploadError \| BucketNotFoundError` | `path` |
| 663 | TS2339 | `StorageError \| FileNotFoundError` | `bucket` |
| 664 | TS2339 | `StorageError \| FileNotFoundError` | `path` |

### InMemoryAuthAdapter.test.ts

| Line | Error | Error Union Type | Property |
|------|-------|------------------|----------|
| 126 | TS2339 | `AuthError \| InvalidTokenError \| SessionExpiredError` | `token` |
| 167 | TS2339 | `AuthError \| InvalidTokenError \| SessionExpiredError` | `sessionId` |
| 244 | TS2339 | `AuthError \| SessionExpiredError` | `sessionId` |
| 262 | TS2339 | `AuthError \| SessionExpiredError` | `sessionId` |
| 689 | TS2339 | `Result<AuthContext, ...>` | `value` |

### PortImplementations.contract.test.ts

| Line | Error | Description |
|------|-------|-------------|
| 343 | TS2322 | `InMemoryStorageAdapter` not assignable to `StoragePort` - return type mismatch in `download()` method |

## Integration Points

### Domain Package Dependencies
- **File:** `packages/domain/src/utils/result.ts`
- **Exports:** `Result<T,E>`, `isSuccess`, `isError`, `ok`, `err`, `isOk`, `isErr`
- **Usage:** All test files import `isOk` and `isErr` for Result guards

### Use-Cases Package Dependencies
- **Error Types:** From `@mirai-app/use-cases/ports/*`
  - `AuthPort`: `AuthError`, `InvalidTokenError`, `SessionExpiredError`
  - `RealtimePort`: `RealtimeError`, `SubscriptionError`
  - `StoragePort`: `StorageError`, `FileNotFoundError`, `UploadError`, `BucketNotFoundError`
- **Pattern:** All errors use `_tag` discriminant field for narrowing

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Test behavior change | Low | Only adding type narrowing, no assertion changes |
| Compilation break | Low | Fixes will enable compilation, not break it |
| Missing error cases | Medium | Review all `_tag` branches for completeness |

## Implementation Notes

### Recommended Pattern Template

```typescript
// For error property access:
if (isErr(result)) {
  if (result.error._tag === "SpecificError") {
    expect(result.error.specificProperty).toBe(expected);
  }
}

// For Result value access:
if (isOk(result)) {
  expect(result.value.property).toBe(expected);
}

// For array access:
if (isOk(result) && result.value.length > 0) {
  expect(result.value[0].property).toBe(expected);
}
```

### File Order for Implementation
1. **InMemoryAdapters.contract.test.ts** - Most errors, establishes pattern
2. **InMemoryAuthAdapter.test.ts** - Similar patterns, different context
3. **PortImplementations.contract.test.ts** - Return type fix only

## Verification Strategy

1. Run `bun tsc --noEmit -p packages/adapters/tsconfig.json` - verify 0 errors
2. Run `bun test packages/adapters/src/gateways/__tests__/` - verify all tests pass
3. Confirm no changes to test logic, only type narrowing
