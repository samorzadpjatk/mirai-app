# Step 4.1: Remove zod Usage - Migration Status

## Summary

This document tracks the progress of migrating from zod to Effect Schema in the adapters package controllers.

## Completed ✓

### Validator Files Created (17 total)

All validator files have been created in `packages/adapters/src/controllers/validators/`:

1. ✓ `user-validators.ts` - User validation schemas
2. ✓ `group-validators.ts` - Group validation schemas
3. ✓ `storage-validators.ts` - Storage validation schemas
4. ✓ `coin-validators.ts` - Coin validation schemas
5. ✓ `trip-validators.ts` - Trip validation schemas
6. ✓ `sponsor-validators.ts` - Sponsor validation schemas
7. ✓ `submission-report-validators.ts` - Submission report validation schemas
8. ✓ `activity-feed-validators.ts` - Activity feed validation schemas
9. ✓ `challenge-vote-validators.ts` - Challenge vote validation schemas
10. ✓ `coin-transaction-validators.ts` - Coin transaction validation schemas
11. ✓ `notification-delivery-validators.ts` - Notification delivery validation schemas
12. ✓ `notification-validators.ts` - Notification validation schemas
13. ✓ `reward-validators.ts` - Reward validation schemas
14. ✓ `challenge-submission-validators.ts` - Challenge submission validation schemas
15. ✓ `challenge-validators.ts` - Challenge validation schemas (with time regex)
16. ✓ `location-validators.ts` - Location validation schemas (with cross-field validation)
17. ✓ `notification-schedule-validators.ts` - Notification schedule validation schemas

### Controllers Migrated (4 of 17)

1. ✓ `user.ts` - Migrated to use user-validators.ts
2. ✓ `group.ts` - Migrated to use group-validators.ts
3. ✓ `storage.ts` - Migrated to use storage-validators.ts
4. ✓ `coin.ts` - Migrated to use coin-validators.ts

## Remaining Work (13 controllers)

The following controllers still need to be migrated:

### Simple Migrations (Basic patterns)

- [ ] `trip.ts` - Replace zod with trip-validators
- [ ] `sponsor.ts` - Replace zod with sponsor-validators
- [ ] `submission-report.ts` - Replace zod with submission-report-validators
- [ ] `coin-transaction.ts` - Replace zod with coin-transaction-validators
- [ ] `notification-delivery.ts` - Replace zod with notification-delivery-validators

### Medium Complexity (Arrays, nested objects, enums)

- [ ] `activity-feed.ts` - Replace zod with activity-feed-validators
- [ ] `challenge-vote.ts` - Replace zod with challenge-vote-validators
- [ ] `notification.ts` - Replace zod with notification-validators
- [ ] `reward.ts` - Replace zod with reward-validators (uses nativeEnum)
- [ ] `challenge-submission.ts` - Replace zod with challenge-submission-validators

### Complex Migrations (Regex, cross-field validation, date coercion)

- [ ] `challenge.ts` - Uses time regex patterns (HH:MM)
- [ ] `location.ts` - Uses cross-field refine() validation
- [ ] `notification-schedule.ts` - Uses date coercion and nativeEnum

## Migration Pattern

For each remaining controller:

1. **Remove zod import**:

   ```typescript
   // REMOVE:
   import { z } from "zod";
   ```

2. **Add validator imports**:

   ```typescript
   // ADD:
   import {
     validateGetByIdInput,
     validateCreateInput,
     // ... other validators
   } from "./validators/{controller}-validators";
   ```

3. **Replace schemas object**:

   ```typescript
   // REMOVE:
   const schemas = {
     getById: z.object({...}),
     // ...
   };

   // ADD: Export validators for external use
   export {
     validateGetByIdInput,
     validateCreateInput,
     // ...
   };
   ```

4. **Replace safeParse calls**:

   ```typescript
   // CHANGE:
   const parsed = schemas.getById.safeParse(input);

   // TO:
   const parsed = validateGetByIdInput(input);
   ```

5. **Update error messages access**:

   ```typescript
   // CHANGE:
   error: "Invalid input: " + parsed.error.message;

   // TO:
   error: "Invalid input: " + parsed.error.message;
   // (Same - the validators return zod-compatible result shape)
   ```

## Final Steps

After all controllers are migrated:

1. Remove `zod` from `packages/adapters/package.json` dependencies
2. Run `grep -r 'from "zod"' packages/adapters/src/` to verify zero imports
3. Run type checking: `bun run typecheck`
4. Run tests to ensure validation behavior is preserved

## Key Patterns in Effect Schema Validators

### Basic Types

- `z.string()` → `Schema.String`
- `z.number()` → `Schema.Number`
- `z.boolean()` → `Schema.Boolean`

### Constraints

- `z.string().min(1)` → `Schema.String.pipe(Schema.minLength(1))`
- `z.number().int()` → `Schema.Number.pipe(Schema.int())`
- `z.number().min(0).max(100)` → `Schema.Number.pipe(Schema.greaterThanOrEqualTo(0), Schema.lessThanOrEqualTo(100))`

### Optionality

- `z.string().optional()` → `Schema.optional(Schema.String)`
- `z.string().nullable()` → `Schema.Union(Schema.Null, Schema.String)`
- `z.string().nullish()` → `Schema.optional(Schema.Union(Schema.Null, Schema.String))`
- `z.string().default("value")` → `Schema.optionalWith(Schema.String, { default: () => "value" })`

### Enums

- `z.enum(["A", "B"])` → `Schema.Literal("A", "B")`
- `z.nativeEnum(MyEnum)` → `Schema.Enums(MyEnum)`

### Arrays

- `z.array(z.string())` → `Schema.Array(Schema.String)`
- `z.array(z.string()).min(1)` → `Schema.Array(Schema.String).pipe(Schema.minLength(1))`

### Complex Validation

- `z.string().uuid()` → `Schema.String.pipe(Schema.pattern(UUID_REGEX))`
- `z.string().url()` → `Schema.String.pipe(Schema.pattern(URL_REGEX))`
- `z.string().regex(/pattern/)` → `Schema.String.pipe(Schema.pattern(/pattern/))`
- `z.coerce.date()` → `Schema.DateFromString`

### Custom Validation (refine)

- `z.object({}).refine(fn, message)` → `Schema.Struct({}).pipe(Schema.filter(fn))`
