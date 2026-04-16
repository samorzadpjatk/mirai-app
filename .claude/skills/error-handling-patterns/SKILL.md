# Error Handling Patterns for Mirai App

Error handling conventions for TypeScript/Effect applications using Clean Architecture.

## Overview

This codebase uses Effect's `Data.TaggedError` pattern for type-safe error handling across four layers: Domain, Use Cases, Adapters, and Frameworks.

### Core Principles

1. **Never throw exceptions** - Always return `Effect.fail()` with tagged errors
2. **Type-safe error matching** - Use `Effect.catchTag()` for error recovery
3. **Consistent structure** - All errors implement base interface with `_tag`, `message`, `code`
4. **Layer-specific errors** - Each layer defines its own error types
5. **DTO conversion at boundaries** - Convert errors to serializable DTOs at API boundaries

## Base Error Interface

### GatewayError Interface

All gateway errors implement this contract:

```typescript
// packages/domain/src/ports/gateway-error.ts
export interface GatewayError {
  /** Tag identifier for error type (matches _tag) */
  readonly _tag: string;
  /** Human-readable error message */
  readonly message: string;
}

export interface DatabaseGatewayError extends GatewayError {
  readonly _tag: "DatabaseError";
  /** The database operation that failed */
  readonly operation: string;
  /** Optional underlying error cause */
  readonly cause?: unknown;
}
```

### Data.TaggedError Implementation

```typescript
import { Data } from "effect";

// Domain layer - pure errors, no dependencies
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  message: string;
  cause?: unknown;
}> {}

// Use in gateways
Effect.tryPromise({
  try: () => db.query.users.findFirst({ where: eq(users.id, id) }),
  catch: (error) =>
    new DatabaseError({
      operation: "findById",
      message: "Failed to find user",
      cause: error,
    }),
});
```

## Error Hierarchy

### Domain Layer Errors

Consolidated error types for business logic:

```typescript
// Core domain errors (from unified-errors.ts)
export class DomainError extends Data.TaggedError("DomainError")<{
  message: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field?: string;
  message: string;
}> {
  // Factory methods for common validation scenarios
  static required(field: string): ValidationError { ... }
  static minLength(field: string, min: number): ValidationError { ... }
  static maxLength(field: string, max: number): ValidationError { ... }
}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity?: string;
  id?: string;
  message: string;
}> {}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  message: string;
}> {}

export class AuthenticationError extends Data.TaggedError("AuthenticationError")<{
  message: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  message: string;
}> {}
```

### Use Case Layer Errors

```typescript
// packages/use-cases/src/system/errors/use-case-error.ts
export class UseCaseError extends Data.TaggedError("UseCaseError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "USE_CASE_ERROR" as const;
}
```

### Adapter Layer Errors

```typescript
// packages/adapters/src/system/errors/adapter-errors.ts
export class ServiceError extends Data.TaggedError("ServiceError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "SERVICE_ERROR" as const;
}

// Re-export domain DatabaseError for consistency
export { DatabaseError } from "@mirai-app/domain";
```

## DTO Patterns for Error Responses

### ErrorDTO Interface

Serializable error structure for API responses:

```typescript
// packages/frameworks/src/errors/dto.ts
export interface ErrorDTO {
  /** Error code for client handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Operation that failed (optional) */
  operation?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** ISO timestamp */
  timestamp: string;
  /** Request path for GraphQL (optional) */
  path?: string[];
}

// Factory function
export const createErrorDTO = (
  error: { _tag: string; message: string; operation?: string; code?: string },
  requestId?: string,
): ErrorDTO => ({
  code: error.code ?? error._tag.toUpperCase(),
  message: error.message,
  operation: error.operation,
  timestamp: new Date().toISOString(),
  ...(requestId && { details: { requestId } }),
});
```

### Error Conversion at Boundaries

```typescript
// In GraphQL resolver
function errorToGraphQL(error: unknown, context: GraphQLContext): GraphQLError {
  if (isDomainError(error) || isAdapterError(error)) {
    const dto = createErrorDTO(error, context.requestId);
    const code = mapErrorTagToCode(error._tag);

    return new GraphQLError(dto.message, {
      extensions: {
        code,
        ...dto,
      },
    });
  }

  // Fallback for unexpected errors
  return new GraphQLError("Internal server error", {
    extensions: { code: "INTERNAL_SERVER_ERROR", requestId: context.requestId },
  });
}
```

## Gateway Error Handling

### Base Gateway Pattern

```typescript
// packages/adapters/src/system/shared/gateways/drizzle-base.ts
export abstract class BaseDrizzleGateway<
  TDomain,
  TDrizzle,
  TInsert,
  TTable extends PgTable,
> {
  protected constructor(
    protected db: DrizzleDb,
    protected config: DrizzleGatewayConfig<TDomain, TDrizzle, TInsert, TTable>,
  ) {}

  // All methods return Effect with DatabaseError
  findById(id: string): Effect.Effect<TDomain | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // ... query logic
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: `Failed in ${this.getTableName()}`,
          cause: error,
        }),
    });
  }

  private getTableName(): string {
    return this.config.table.name ?? "unknown";
  }
}
```

### Specific Gateway Implementation

```typescript
// packages/adapters/src/user/gateways/drizzle/gateway.ts
export class DrizzleUserGateway
  extends BaseDrizzleGateway<UserDTO, UserSelect, UserInsert, typeof users>
  implements UserGateway
{
  constructor(db: DrizzleDb) {
    super(db, { table: users, mapper: UserDrizzleMapper.instance });
  }

  // Custom methods follow same pattern
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<UserDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // ... query
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByAuthUserId",
          message: "Failed to find user by authUserId",
          cause: error,
        }),
    });
  }
}
```

## Error Deduplication Strategy

### Consolidation Rules

| Before (Multiple)                                            | After (Consolidated)                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| NotFoundError, EntityNotFoundError, ResourceNotFoundError    | **NotFoundError** with `entity` and `id` fields            |
| ValidationError, FieldValidationError, SchemaValidationError | **ValidationError** with optional `field`                  |
| UnauthorizedError, AuthenticationError                       | **AuthenticationError**                                    |
| ConflictError, DuplicateError                                | **ConflictError** with optional `entity`, `field`, `value` |
| StateTransitionError, InvalidStateError                      | **StateError** with `from`, `to`, `entityType`             |

### Migration Template

```typescript
// Before: Multiple similar errors
export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{
  entity: string;
  id: string;
}> {}

export class ResourceNotFoundError extends Data.TaggedError(
  "ResourceNotFoundError",
)<{
  resource: string;
  id: string;
}> {}

// After: Single consolidated error
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity?: string;
  id?: string;
  message: string;
}> {}

// Type guard for backward compatibility
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}
```

## Type Guards and Unions

### Type Guards

```typescript
// Type guards enable runtime checking
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// Exhaustive matching with union type
export type DomainErrors =
  | DomainError
  | ValidationError
  | NotFoundError
  | ConflictError
  | AuthenticationError
  | ForbiddenError
  | DatabaseError;
```

### Error Recovery Pattern

```typescript
// In use case or adapter
Effect.gen(function* () {
  const result = yield* someOperation.pipe(
    Effect.catchTag(
      "NotFoundError",
      (error) => Effect.succeed(null), // Return null instead of failing
    ),
    Effect.catchTag("DatabaseError", (error) => {
      // Log and transform
      yield * EffectLogger.error("Database operation failed", error);
      return Effect.fail(
        new UseCaseError({
          operation: "fetchData",
          message: "Failed to retrieve data",
          cause: error,
        }),
      );
    }),
  );
  return result;
});
```

## Common Pitfalls and Solutions

### Pitfall 1: Inconsistent Error Patterns

**Problem:** Mixing `Data.TaggedError` with plain `Error` classes

```typescript
// Bad: Plain Error class in Effect context
export class ExternalAPIError extends Error {
  // Don't do this
  readonly _tag = "ExternalAPIError";
}
```

**Solution:** Always use `Data.TaggedError`

```typescript
// Good: TaggedError for Effect compatibility
export class ExternalAPIError extends Data.TaggedError("ExternalAPIError")<{
  service: string;
  endpoint: string;
  statusCode?: number;
  message: string;
}> {}
```

### Pitfall 2: Missing Error Codes

**Problem:** Errors lack consistent `code` property for client handling

**Solution:** Add `code` as readonly constant

```typescript
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  message: string;
  cause?: unknown;
}> {
  readonly code = "DATABASE_ERROR" as const;
}
```

### Pitfall 3: Error Cause Leaking to Client

**Problem:** Internal error details exposed in API responses

**Solution:** Filter `cause` in DTO conversion

```typescript
export const createErrorDTO = (error: GatewayError): ErrorDTO => ({
  code: error.code,
  message: error.message,
  operation: error.operation,
  // Don't include cause - it's for internal debugging only
  timestamp: new Date().toISOString(),
});
```

### Pitfall 4: Duplicate Error Definitions

**Problem:** Same error concept defined in multiple layers

**Solution:** Define in domain, re-export or extend in other layers

```typescript
// Domain layer
export { DatabaseError } from "./unified-errors";

// Adapter layer - re-export for convenience
export { DatabaseError } from "@mirai-app/domain";
```

### Pitfall 5: Not Using Base Interface

**Problem:** Gateway errors don't implement `GatewayError` interface

**Solution:** Ensure all gateway errors implement the base interface

```typescript
// Verify: DatabaseError implements DatabaseGatewayError
const check: DatabaseGatewayError = new DatabaseError({
  operation: "test",
  message: "test",
}); // Should compile without error
```

## Testing Error Handling

### Unit Test Pattern

```typescript
import { describe, it, expect } from "bun:test";
import { Effect } from "effect";

describe("[UNIT] Error Handling", () => {
  it("fails with expected error type", async () => {
    const effect = Effect.fail(
      new NotFoundError({
        entity: "User",
        id: "123",
        message: "User not found",
      }),
    );

    const result = await Effect.runPromise(Effect.either(effect));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("NotFoundError");
    }
  });

  it("recovers from specific error", async () => {
    const effect = someFailingEffect.pipe(
      Effect.catchTag("NotFoundError", () => Effect.succeed(defaultValue)),
    );

    const result = await Effect.runPromise(effect);
    expect(result).toEqual(defaultValue);
  });
});
```

## Research Findings: Current Codebase State

Based on analysis of the Mirai App codebase (274+ error definitions across 4 layers):

### Identified Duplications

| Error Concept | Duplicate Implementations                                                                      | Consolidation Target                                          |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Not Found     | `NotFoundError`, `EntityNotFoundError`, `ResourceNotFoundError`, 50+ per-use-case variants     | Single `NotFoundError` with `entity`/`entityId` context       |
| Validation    | `ValidationError`, `FieldValidationError`, `SchemaValidationError`, per-use-case variants      | `ValidationError` with optional `field`/`constraint` context  |
| Database      | `DatabaseError`, `DatabaseConnectionError`, `DatabaseTransactionError`, 30+ `*RepositoryError` | `DatabaseError` with `retryable` flag and `operation` context |
| Unauthorized  | `UnauthorizedError`, `ForbiddenError`, `AuthenticationError`, 20+ per-use-case variants        | `AuthenticationError` and `AuthorizationError`                |
| Conflict      | `ConflictError`, `DuplicateError`                                                              | `ConflictError` with `entity`/`field`/`value` context         |

### Anti-Pattern Found: Per-Use-Case Error Explosion

```typescript
// Anti-pattern found in codebase:
export class SubmissionDeleteNotFoundError extends Data.TaggedError(...) {}
export class SubmissionUpdateNotFoundError extends Data.TaggedError(...) {}
export class ChallengeNotFoundError extends Data.TaggedError(...) {}
// 50+ similar errors - all represent "entity not found"

// Solution using context-rich errors:
new NotFoundError({
  entity: "Submission",
  entityId: "123",
  operation: "deleteSubmission",
  message: "Submission not found"
})
```

### Recommended DTO Enhancement

```typescript
// Enhanced ErrorDTO with retryability
export interface ErrorDTO {
  readonly code: string;
  readonly message: string;
  readonly operation: string;
  readonly entity?: string;
  readonly entityId?: string;
  readonly field?: string;
  readonly retryable: boolean;
  readonly timestamp: string;
  readonly metadata?: Record<string, unknown>;
}

// Conversion from domain error
export function toErrorDTO(error: ApplicationError): ErrorDTO {
  return {
    code: error.code,
    message: error.message,
    operation: error.context?.operation ?? "unknown",
    entity: error.context?.entity,
    entityId: error.context?.entityId,
    field: error.context?.field,
    retryable: error.context?.retryable ?? false,
    timestamp:
      error.context?.timestamp?.toISOString() ?? new Date().toISOString(),
    metadata: error.context?.metadata,
  };
}
```

## Migration Checklist

When deduplicating errors and migrating gateways:

### Phase 1: Consolidate Base Errors

- [ ] Audit all error types with `grep "class.*Error.*extends.*Data.TaggedError"`
- [ ] Group by semantic meaning (NotFound, Validation, Database, etc.)
- [ ] Update `packages/domain/src/system/errors/unified-errors.ts`
  - [ ] Merge `NotFoundError`, `EntityNotFoundError`, `ResourceNotFoundError`
  - [ ] Merge `ValidationError`, `FieldValidationError`, `SchemaValidationError`
  - [ ] Add factory methods (`NotFoundError.create()`, `ValidationError.required()`)
- [ ] Update type guards in `unified-errors.ts`

### Phase 2: Gateway Migration

- [ ] Update `packages/domain/src/ports/gateway-error.ts`
  - [ ] Add `code` property to `GatewayError` interface
  - [ ] Add optional `ErrorContext` interface
- [ ] Update `packages/adapters/src/system/errors/adapter-errors.ts`
  - [ ] Migrate `ExternalAPIError` to use `Data.TaggedError` (currently extends `Error`)
  - [ ] Add `code` property to all errors
  - [ ] Add `toDTO()` methods
- [ ] Update `packages/adapters/src/system/shared/gateways/drizzle-base.ts`
  - [ ] Ensure all methods use consistent `DatabaseError` with operation context

### Phase 3: Use-Case Cleanup

- [ ] For each interactor in `packages/use-cases/src/*`:
  - [ ] Replace per-use-case errors with context-rich consolidated errors
  - [ ] Update error creation to include `operation` context
  - [ ] Verify `Effect.catchTag` usage matches consolidated tag names
- [ ] Update `packages/use-cases/src/system/errors/use-case-error.ts`
  - [ ] Consider adding `context` field for operation tracking

### Phase 4: Framework Integration

- [ ] Update `packages/frameworks/src/graphql/errors.ts`
  - [ ] Replace hardcoded \_tag strings with imported error types
  - [ ] Use `toErrorDTO()` for consistent error formatting
  - [ ] Add retryability hints to GraphQL extensions
- [ ] Test error responses in API

### Phase 5: Validation

- [ ] Run `bun test` - all tests should pass
- [ ] Verify error codes in GraphQL responses
- [ ] Check error handling in mobile app
- [ ] Document new error structure for frontend team

## Summary

1. **Use `Data.TaggedError`** for all error classes - no plain `Error` extensions
2. **Implement `GatewayError` interface** consistently - add `code` property
3. **Add rich context** - `entity`, `entityId`, `operation`, `retryable` fields
4. **Consolidate similar errors** - use context to differentiate instead of new classes
5. **Create DTOs at boundaries** - serialize errors without internal `cause`
6. **Use type guards** for runtime error checking
7. **Standardize error codes** - use registry pattern for consistency

## References

- Effect-TS Data.TaggedError: https://effect.website/docs/data
- TypeScript Discriminated Unions: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html
- Clean Architecture: Ports & Adapters error handling patterns
- Research notes: `.specs/scratchpad/research-0f640e49de66a92f.md`
