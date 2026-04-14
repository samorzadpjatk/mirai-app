# TypeScript Mapper Alignment

> Reusable patterns for aligning mapper function outputs with controller DTO expectations in CEK Five Pillars architecture.

---

## Overview

This skill provides patterns for fixing TypeScript type mismatches between:

- **Use case outputs** (source of truth)
- **Controller DTO expectations** (API contracts)
- **Mapper function return types** (conversion layer)

### Common Mismatch Patterns

| Pattern                                | Example                                  | Solution                   |
| -------------------------------------- | ---------------------------------------- | -------------------------- |
| Branded ID → String                    | `SubmissionId` → `string`                | `.toString()` conversion   |
| `T \| null \| undefined` → `T \| null` | `name?: string` → `name: string \| null` | `value ?? null`            |
| Enum → String literal                  | `Status.ACTIVE` → `"ACTIVE"`             | Direct assignment          |
| Nested object mismatch                 | Extra/missing properties                 | Explicit sub-DTO mapping   |
| Error type → string                    | `ValidationError` → `string`             | `error.message` extraction |

---

## Pattern 1: Explicit Return Type Annotation

Always annotate mapper return types to catch mismatches at definition site.

### ❌ Anti-Pattern: Inferred Types

```typescript
function mapToDTO(entity: Entity) {
  return { id: entity.id, name: entity.name };
  // Return type inferred - mismatches caught at usage!
}
```

### ✅ Pattern: Explicit Types

```typescript
import type { EntityDTO } from "@mirai-app/use-cases";

function mapToDTO(entity: Entity): EntityDTO {
  return { id: entity.id, name: entity.name };
  // Type error caught HERE, not at controller
}
```

---

## Pattern 2: Branded ID Conversion

Domain uses branded types for type safety; DTOs use strings for serialization.

### Type Definition

```typescript
// packages/domain/src/value-objects/SubmissionId.ts
export type SubmissionId = string & { readonly _brand: "SubmissionId" };

export const SubmissionId = {
  create(value: string): SubmissionId {
    return value as SubmissionId;
  },
  toString(id: SubmissionId): string {
    return id as string;
  },
};
```

### Conversion Pattern

```typescript
import { SubmissionId } from "@mirai-app/domain";
import type { GetSubmissionOutput } from "@mirai-app/use-cases";

function toDTO(entity: {
  id: SubmissionId;
  challengeId: string;
}): GetSubmissionOutput {
  return {
    id: SubmissionId.toString(entity.id), // ✅ Explicit conversion
    challengeId: entity.challengeId,
    // ...
  };
}
```

### Batch Conversion for Arrays

```typescript
function toDTOList(entities: Entity[]): EntityDTO[] {
  return entities.map((e) => toDTO(e)); // Map preserves types
}
```

---

## Pattern 3: Null/Undefined Normalization

DTOs should use `T | null` (serializable), not `T | undefined` (lost in JSON).

### Normalization Utility

```typescript
function normalizeToNull<T>(value: T | null | undefined): T | null {
  return value ?? null;
}
```

### Inline Normalization

```typescript
interface EntityDTO {
  name: string | null;
  description: string | null;
}

function toDTO(entity: {
  name?: string | null;
  description?: string | null;
}): EntityDTO {
  return {
    name: entity.name ?? null, // ✅ undefined → null
    description: entity.description ?? null,
  };
}
```

### Database Record Handling

```typescript
// Drizzle records may have optional fields
function fromDrizzle(record: {
  id: string;
  name: string | null; // Drizzle: nullable column
  bio?: string | null; // Drizzle: optional column
}): EntityDTO {
  return {
    id: record.id,
    name: record.name, // Already string | null
    bio: record.bio ?? null, // Handle optional → null
  };
}
```

---

## Pattern 4: Nested Object Mapping

Map nested structures with explicit sub-DTO types for type safety.

### Sub-DTO Definition

```typescript
// packages/use-cases/src/interactors/GetSubmission.ts
export interface GetSubmissionOutput {
  id: string;
  group: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
}
```

### Explicit Nested Mapping

```typescript
function toDTO(submission: SubmissionEntity): GetSubmissionOutput {
  return {
    id: submission.id.toString(),
    // ✅ Map only required properties
    group: submission.group
      ? {
          id: submission.group.id,
          name: submission.group.name,
          image: submission.group.image,
        }
      : null,
    reviewedBy: submission.reviewedBy
      ? {
          id: submission.reviewedBy.id,
          firstName: submission.reviewedBy.firstName,
          lastName: submission.reviewedBy.lastName,
          email: submission.reviewedBy.email,
        }
      : null,
  };
}
```

### Avoid Spread Operator

```typescript
// ❌ Bad - spreads all properties
return {
  ...submission,
  group: submission.group,
};

// ✅ Good - explicit property selection
return {
  id: submission.id.toString(),
  name: submission.name,
  group: submission.group ? mapGroup(submission.group) : null,
};
```

---

## Pattern 5: Error Type Mapping

Controllers expect string errors for API responses; use cases return typed errors.

### Error Interface Pattern

```typescript
// packages/domain/src/errors/DomainError.ts
export interface DomainError {
  readonly _tag: string;
  readonly message: string;
}

export class ValidationError extends Error implements DomainError {
  readonly _tag = "ValidationError";
}

export class StateTransitionError extends Error implements DomainError {
  readonly _tag = "StateTransitionError";
}
```

### Error to String Mapping

```typescript
function mapErrorToString(error: DomainError): string {
  return error.message;
}

// For union types
function mapErrorUnionToString(
  error: ValidationError | StateTransitionError,
): string {
  return error.message;
}
```

### Controller Usage

```typescript
import type { Result } from "@mirai-app/domain";

async function handleRequest(): Promise<
  { success: true; data: EntityDTO } | { success: false; error: string }
> {
  const result: Result<EntityDTO, ValidationError> =
    await useCase.execute(input);

  if (result.kind === "err") {
    return {
      success: false,
      error: mapErrorToString(result.error), // ✅ Extract message
    };
  }

  return { success: true, data: result.value };
}
```

---

## Pattern 6: Enum Alignment

Ensure enum values align between layers.

### Domain Enum

```typescript
// packages/domain/src/entities/Challenge.ts
export enum ChallengeStatus {
  HIDDEN = "HIDDEN",
  VISIBLE = "VISIBLE",
  ACTIVE = "ACTIVE",
  VOTING_PHASE = "VOTING_PHASE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
```

### Controller Schema Alignment

```typescript
import { z } from "zod";
import { ChallengeStatus } from "@mirai-app/domain";

// ✅ Use enum values directly in schema
const schemas = {
  updateStatus: z.object({
    challengeId: z.string(),
    newStatus: z.enum([
      ChallengeStatus.HIDDEN,
      ChallengeStatus.VISIBLE,
      ChallengeStatus.ACTIVE,
      ChallengeStatus.VOTING_PHASE,
      ChallengeStatus.COMPLETED,
      ChallengeStatus.CANCELLED,
    ]),
  }),
};
```

### Type-Safe Enum Conversion

```typescript
// If converting from string to enum
function parseStatus(status: string): ChallengeStatus {
  if (Object.values(ChallengeStatus).includes(status as ChallengeStatus)) {
    return status as ChallengeStatus;
  }
  return ChallengeStatus.HIDDEN; // Default
}
```

---

## Pattern 7: Type Testing with Satisfies

Use `satisfies` for compile-time type verification.

### Mapper Type Test

```typescript
import type { GetUserOutput } from "@mirai-app/use-cases";

function toDTO(user: User): GetUserOutput {
  return {
    id: user.id,
    authUserId: user.authUserId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.getFullName(),
    role: user.role,
    hasAvatar: user.hasAvatar,
    createdAt: user.createdAt,
    lastSeenOn: user.lastSeenOn,
  } satisfies GetUserOutput; // ✅ Compile-time verification
}
```

### DTO Shape Test

```typescript
// Test that DTO matches expected shape
type DTOShape = {
  id: string;
  name: string;
};

const testDTO = {
  id: "123",
  name: "Test",
} satisfies DTOShape;
```

---

## Pattern 8: Generic Mapper Interface

Define a reusable mapper contract for consistency.

### Base Interface

```typescript
// packages/adapters/src/mappers/base/EntityMapper.ts
export interface EntityMapper<DomainEntity, DTO, InsertType, UpdateType> {
  toDTO(entity: DomainEntity): DTO;
  toDomain(dto: DTO): DomainEntity;
  toInsert(entity: DomainEntity): InsertType;
  toUpdate(entity: DomainEntity): UpdateType;
}
```

### Specialized Interfaces

```typescript
// For Drizzle ORM
export interface DrizzleEntityMapper<DomainEntity, SelectType, InsertType> {
  toDomain(record: SelectType): DomainEntity;
  toDrizzleInsert(entity: DomainEntity): InsertType;
  toDrizzleUpdate(entity: DomainEntity): Partial<InsertType>;
}
```

### Implementation Example

```typescript
export class UserDrizzleMapper implements DrizzleEntityMapper<
  User,
  UserSelect,
  UserInsert
> {
  toDomain(record: UserSelect): User {
    // Implementation
  }

  toDrizzleInsert(user: User): UserInsert {
    // Implementation
  }

  toDrizzleUpdate(user: User): Partial<UserInsert> {
    // Implementation
  }
}
```

---

## Integration with CEK Five Pillars

### SDD (Spec-Driven Development)

- Define DTO contracts in specifications
- Use Case output types are source of truth
- Controller types derive from use case outputs

```typescript
// Spec defines: GetUserOutput
export interface GetUserOutput {
  id: string;
  fullName: string;
}

// Use case implements spec
export class GetUserUseCase {
  execute(input: GetUserInput): Promise<Result<GetUserOutput, string>> {
    // Implementation
  }
}
```

### TDD (Test-Driven Development)

- Write type tests using `satisfies`
- Type errors = test failures
- Run `bun tsc --noEmit` as type test suite

### DDD (Domain-Driven Design)

- Domain uses branded types
- Mappers convert to primitives for DTOs
- DTOs live in use-cases layer (application boundary)

### SADD (Subagent-Driven Development)

- Parallelize by entity type
- Each subagent fixes one entity's mappers
- Quality gate: Zero type errors per entity

### Kaizen (Continuous Improvement)

- Prefer explicit over implicit
- Normalize at boundaries
- Document type contracts

---

## Quick Reference: Fix Checklist

When fixing a type mismatch:

- [ ] Identify expected type (controller/DTO)
- [ ] Identify actual type (use case output)
- [ ] Determine mismatch pattern (ID, null, nested, error, enum)
- [ ] Apply appropriate pattern from this skill
- [ ] Add explicit return type annotation
- [ ] Verify with `bun tsc --noEmit`
- [ ] Run tests to ensure no runtime changes

---

## Example: Complete Fix

### Before (Type Error)

```typescript
// Controller
async getById(): Promise<{ data: { id: string } }> {
  const result = await useCase.execute({ id });
  return { data: result.value };  // ❌ Error: SubmissionId not assignable to string
}

// Use case
export interface GetSubmissionOutput {
  id: SubmissionId;  // Branded type
}
```

### After (Fixed)

```typescript
// Use case - convert to string for DTO
export interface GetSubmissionOutput {
  id: string;  // String for serialization
}

// Use case implementation
private toOutput(submission: Submission): GetSubmissionOutput {
  return {
    id: submission.id.toString(),  // ✅ Explicit conversion
  };
}

// Controller - now compatible
async getById(): Promise<{ data: { id: string } }> {
  const result = await useCase.execute({ id });
  return { data: result.value };  // ✅ No error
}
```

---

**Version:** 1.0.0
**Last Updated:** 2026-04-11
**Compatible with:** CEK Five Pillars v1.1.0
