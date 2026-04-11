# Skill: Testing with Result Types

## Overview

This skill provides patterns and best practices for writing tests that work with `Result<T,E>` types and discriminated union error types.

## Result Type Basics

The `Result<T,E>` type from `@mirai-app/domain` is defined as:
```typescript
type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };
```

### Key Helper Functions

- `isOk(result)` / `isSuccess(result)` - Check if result is success
- `isErr(result)` / `isError(result)` - Check if result is error
- `unwrap(result)` - Get value or throw
- `unwrapOr(result, default)` - Get value or return default
- `match(result, onSuccess, onError)` - Pattern match on result

## Testing Result Types

### Pattern 1: Testing Success Cases

```typescript
import { isOk } from "@mirai-app/domain";

const result = await someOperation();

expect(isOk(result)).toBe(true);
if (isOk(result)) {
  expect(result.value.property).toBe(expected);
}
```

### Pattern 2: Testing Error Cases with Narrowing

Errors are discriminated unions using `_tag` field. Always narrow before accessing error-specific properties.

```typescript
import { isErr } from "@mirai-app/domain";

const result = await someOperation();

expect(isErr(result)).toBe(true);
if (isErr(result)) {
  // Narrow by _tag before accessing specific properties
  if (result.error._tag === "SpecificError") {
    expect(result.error.specificProperty).toBe(expected);
  }
}
```

### Pattern 3: Common Error Types by Port

#### AuthPort Errors
```typescript
import { AuthError, InvalidTokenError, SessionExpiredError } from "@mirai-app/use-cases/ports/AuthPort";

// Error type has _tag discriminant
if (result.error._tag === "SessionExpiredError") {
  expect(result.error.sessionId).toBe(expected);
  expect(result.error.expiredAt).toBeInstanceOf(Date);
}

if (result.error._tag === "InvalidTokenError") {
  expect(result.error.token).toBe(expected);
  expect(result.error.code).toBe("INVALID_TOKEN");
}
```

#### RealtimePort Errors
```typescript
import { RealtimeError, SubscriptionError } from "@mirai-app/use-cases/ports/RealtimePort";

if (result.error._tag === "SubscriptionError") {
  expect(result.error.channel).toBe(expected);
}
```

#### StoragePort Errors
```typescript
import { StorageError, FileNotFoundError, UploadError, BucketNotFoundError } from "@mirai-app/use-cases/ports/StoragePort";

if (result.error._tag === "BucketNotFoundError" || result.error._tag === "UploadError") {
  expect(result.error.bucket).toBe(expected);
  expect(result.error.path).toBe(expected);
}

if (result.error._tag === "FileNotFoundError") {
  expect(result.error.bucket).toBe(expected);
  expect(result.error.path).toBe(expected);
}
```

### Pattern 4: Testing Array Results

```typescript
const result = await listOperation();

expect(isOk(result)).toBe(true);
if (isOk(result)) {
  // Check length before accessing array elements
  expect(result.value.length).toBeGreaterThan(0);
  if (result.value.length > 0) {
    expect(result.value[0].id).toBe(expected);
  }
}
```

### Pattern 5: Multiple Error Type Checks

```typescript
if (isErr(result)) {
  // Can check multiple error types
  expect(
    result.error._tag === "InvalidTokenError" ||
    result.error._tag === "SessionExpiredError"
  ).toBe(true);
  
  // Or use instanceof as fallback
  expect(
    result.error instanceof InvalidTokenError ||
    result.error instanceof SessionExpiredError
  ).toBe(true);
}
```

## Common Mistakes to Avoid

### ❌ Don't: Access Error Properties Without Narrowing

```typescript
// WRONG - TypeScript error!
if (isErr(result)) {
  expect(result.error.sessionId).toBe(...); // Error: sessionId doesn't exist on union
}
```

### ✅ Do: Narrow by _tag First

```typescript
// CORRECT
if (isErr(result)) {
  if (result.error._tag === "SessionExpiredError") {
    expect(result.error.sessionId).toBe(...); // Works!
  }
}
```

### ❌ Don't: Access Result Value Without Guard

```typescript
// WRONG - TypeScript error!
expect(result.value.property).toBe(...); // Error: value doesn't exist on error variant
```

### ✅ Do: Use isOk() Guard

```typescript
// CORRECT
if (isOk(result)) {
  expect(result.value.property).toBe(...); // Works!
}
```

## Testing Checklist

- [ ] Import `isOk` and `isErr` from `@mirai-app/domain`
- [ ] Use `if (isOk(result))` before accessing `.value`
- [ ] Use `if (isErr(result))` before accessing `.error`
- [ ] Narrow error by `_tag` before accessing error-specific properties
- [ ] Check array length before accessing array elements
- [ ] Verify both success and error cases in contract tests

## Related Skills

- `domain:result-types` - Core Result type patterns
- `sdd:test-driven-development` - TDD practices
