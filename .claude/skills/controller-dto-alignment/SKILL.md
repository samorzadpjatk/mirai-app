# Controller DTO Alignment

## Overview

This skill provides patterns for aligning controller DTOs with use-case outputs in a Clean Architecture TypeScript project. It covers common type mismatch scenarios and their solutions.

## Common Patterns

### Pattern 1: Output Type Mismatch

**Problem**: Use-case returns `GetSubmissionOutput` but controller expects a different shape.

**Solution**: Use the use-case output type directly or create a mapper.

```typescript
// Instead of redefining the type, use the use-case output
import type { GetSubmissionOutput } from "@mirai-app/use-cases";

// Option 1: Use type directly
async getSubmission(input: GetSubmissionInput): Promise<GetSubmissionOutput> {
  const result = await this.useCase.execute(input);
  if (result.kind === "ok") {
    return result.value; // Already typed as GetSubmissionOutput
  }
  // handle error
}

// Option 2: Map if transformation needed
async getSubmission(input: GetSubmissionInput): Promise<ControllerOutput> {
  const result = await this.useCase.execute(input);
  if (result.kind === "ok") {
    return mapToControllerOutput(result.value);
  }
  // handle error
}
```

### Pattern 2: Nullable Field Alignment

**Problem**: Controller expects `string | null` but use-case returns `string | null | undefined`.

**Solution**: Normalize undefined to null at the boundary.

```typescript
// Controller boundary normalization
function normalizeNullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

// Usage
return {
  field: normalizeNullable(useCaseOutput.field),
};
```

### Pattern 3: Result Type Handling

**Problem**: Domain returns `Result<T, E>` but controller needs to handle both success and error cases.

**Solution**: Use pattern matching on Result type.

```typescript
import type { Result } from "@mirai-app/domain";

async execute(input: Input): Promise<Output> {
  const result: Result<Entity, Error> = await this.useCase.execute(input);
  
  if (result.kind === "ok") {
    return { kind: "success", data: result.value };
  } else {
    return { kind: "error", error: formatError(result.error) };
  }
}
```

### Pattern 4: Filter/Pagination Options

**Problem**: Controller filter types don't match use-case filter types.

**Solution**: Ensure filter interfaces are shared or properly mapped.

```typescript
// Shared filter interface
interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Use the same interface in both use-case and controller
```

## Error Type Alignment

### Error to String Conversion

When returning errors from controllers (e.g., for tRPC), convert Error objects to strings:

```typescript
function formatError(error: ValidationError | StateTransitionError): string {
  return error.message;
}
```

### Result Pattern with Error Handling

```typescript
if (result.kind === "err") {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: formatError(result.error),
  });
}
```

## Best Practices

1. **Don't redefine types**: Import and use use-case output types directly when possible
2. **Use mappers for transformation**: When controller needs a different shape, create explicit mapper functions
3. **Normalize at boundaries**: Handle null/undefined conversion at the controller boundary
4. **Keep DTOs in sync**: When updating use-case outputs, update corresponding controller types
5. **Type imports**: Use `import type` for type-only imports to avoid circular dependencies

## References

- Clean Architecture: Controller layer depends on Use Case layer
- DTO patterns: https://martinfowler.com/eaaCatalog/dataTransferObject.html
- TypeScript strict mode: Enable for catching type mismatches early
