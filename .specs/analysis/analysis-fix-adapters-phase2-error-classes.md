# Analysis: Fix Adapters Package Error Classes and DI Modules (Phase 2)

**Task:** Fix adapters package error classes and DI modules (Phase 2)  
**Analysis Date:** 2026-04-11  
**Scope:** packages/adapters TypeScript error fixes

---

## Executive Summary

The adapters package contains **4 confirmed TS4114 errors** (property overrides without `override` modifier) in the adapter-errors.ts file. Additionally, the error classes in `api/errors.ts` and `auth/authServer.ts` should declare the `override` modifier for their `name` property assignments to prevent future TypeScript strict mode issues.

The DI module exports appear properly typed but may need `export type` declarations for interfaces to satisfy `isolatedModules` requirements.

---

## Error Class Analysis

### 1. packages/adapters/src/api/errors.ts

**File Location:** `packages/adapters/src/api/errors.ts`

**Classes Found:**

#### ApiError (lines 14-27)

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name; // Line 21
    // ...
  }
}
```

**Issue:** Line 21 assigns to `this.name` but the class doesn't declare `override readonly name: string` property.

**Fix Required:**

```typescript
export class ApiError extends Error {
  override readonly name: string; // ADD THIS

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    // ...
  }
}
```

**Subclasses:** `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `BadRequestError` all extend `ApiError` and inherit the fix.

---

### 2. packages/adapters/src/controllers/auth/authServer.ts

**File Location:** `packages/adapters/src/controllers/auth/authServer.ts`

**Classes Found:**

#### AuthenticationError (lines 97-102)

```typescript
export class AuthenticationError extends Error {
  constructor(message = "Not Authenticated") {
    super(message);
    this.name = "AuthenticationError"; // Line 100
  }
}
```

**Issue:** Line 100 assigns to `this.name` without declaring `override readonly name: string`.

**Fix Required:**

```typescript
export class AuthenticationError extends Error {
  override readonly name: string; // ADD THIS

  constructor(message = "Not Authenticated") {
    super(message);
    this.name = "AuthenticationError";
  }
}
```

#### AuthorizationError (lines 104-109)

```typescript
export class AuthorizationError extends Error {
  constructor(message = "Missing Required Permissions") {
    super(message);
    this.name = "AuthorizationError"; // Line 107
  }
}
```

**Issue:** Line 107 assigns to `this.name` without declaring `override readonly name: string`.

**Fix Required:**

```typescript
export class AuthorizationError extends Error {
  override readonly name: string; // ADD THIS

  constructor(message = "Missing Required Permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}
```

---

### 3. packages/adapters/src/errors/adapter-errors.ts

**File Location:** `packages/adapters/src/errors/adapter-errors.ts`

**Confirmed TS4114 Errors (from `bun tsc --noEmit`):**

| Line | Error Class              | Property | Current Status                                       |
| ---- | ------------------------ | -------- | ---------------------------------------------------- |
| 59   | DatabaseError            | message  | Already has `override readonly` but TS reports error |
| 85   | DatabaseConnectionError  | message  | Already has `override readonly` but TS reports error |
| 112  | DatabaseTransactionError | message  | Already has `override readonly` but TS reports error |
| 220  | StorageError             | message  | Already has `override readonly` but TS reports error |

**Investigation Notes:**

Looking at the file content, these error classes already have `override readonly message: string` declared. However, TypeScript is reporting TS4114 errors at these locations. This suggests:

1. The line numbers in the error output may be off by 1 (TypeScript reports 1-based, file shows 0-based or vice versa)
2. OR the file on disk differs from what was read
3. OR there are additional properties needing override

**Classes with `override readonly message` already declared:**

- DatabaseError (line 58)
- DatabaseConnectionError (line 84)
- DatabaseTransactionError (line 111)
- ExternalAPIError (line 146)
- StorageError (line 219)
- MappingError (line 284)
- ConfigurationError (line 324)

**Classes that may need `override readonly name`:**
Since these classes set `this.name` implicitly via `super()` but don't declare the property, they might need the explicit declaration for strict mode:

- ExternalAPITimeoutError (line 179-194)
- StorageFileNotFoundError (line 249-258)

However, since they don't explicitly assign to `this.name`, they may not trigger TS4114.

**Recommendation:** Run `bun tsc --noEmit` after each fix to identify the exact remaining errors.

---

## Complete Error Class Inventory

| #   | File                     | Class                    | Extends  | Needs `override name` | Has `override message`       |
| --- | ------------------------ | ------------------------ | -------- | --------------------- | ---------------------------- |
| 1   | api/errors.ts            | ApiError                 | Error    | YES                   | N/A (uses constructor param) |
| 2   | api/errors.ts            | UnauthorizedError        | ApiError | Inherited             | N/A                          |
| 3   | api/errors.ts            | ForbiddenError           | ApiError | Inherited             | N/A                          |
| 4   | api/errors.ts            | NotFoundError            | ApiError | Inherited             | N/A                          |
| 5   | api/errors.ts            | BadRequestError          | ApiError | Inherited             | N/A                          |
| 6   | auth/authServer.ts       | AuthenticationError      | Error    | YES                   | N/A                          |
| 7   | auth/authServer.ts       | AuthorizationError       | Error    | YES                   | N/A                          |
| 8   | errors/adapter-errors.ts | DatabaseError            | Error    | Check                 | YES                          |
| 9   | errors/adapter-errors.ts | DatabaseConnectionError  | Error    | Check                 | YES                          |
| 10  | errors/adapter-errors.ts | DatabaseTransactionError | Error    | Check                 | YES                          |
| 11  | errors/adapter-errors.ts | ExternalAPIError         | Error    | Check                 | YES                          |
| 12  | errors/adapter-errors.ts | ExternalAPITimeoutError  | Error    | Check                 | NO                           |
| 13  | errors/adapter-errors.ts | StorageError             | Error    | Check                 | YES                          |
| 14  | errors/adapter-errors.ts | StorageFileNotFoundError | Error    | Check                 | NO                           |
| 15  | errors/adapter-errors.ts | MappingError             | Error    | Check                 | YES                          |
| 16  | errors/adapter-errors.ts | ConfigurationError       | Error    | Check                 | YES                          |

---

## DI Module Export Analysis

### 1. packages/adapters/src/modules/UseCaseModule.ts

**Current Exports:**

- `ProviderConfig` interface - exported
- `UseCaseModuleDeps` interface - exported
- Token constants - exported
- `UseCaseModule` - exported as const
- Convenience re-exports at bottom

**Potential Issues:**

- Line 411: `export interface UseCaseModuleDeps` - Should this be `export type` for isolatedModules?
- Line 447: `interface UseCaseModuleDef` - Not exported, but used in type annotation

**Recommendation:** No changes needed unless `isolatedModules` errors appear. The current export pattern follows standard TypeScript module practices.

### 2. packages/adapters/src/modules/ControllerModule.ts

**Current Exports:**

- `ControllerModuleDeps` interface - exported (line 75)
- `ControllerModuleDef` interface - exported (line 121)
- Token constants - exported
- `ControllerModule` - exported as const
- Convenience re-exports at bottom (lines 238-255)

**Potential Issues:**

- Line 45: Import from `@supabase/supabase-js` - This package might not be available (error seen in tsc output)

### 3. packages/adapters/src/modules/RepositoryModule.ts

**Current Exports:**

- `RepositoryModuleDeps` interface - exported (line 187)
- `RepositoryModuleDef` interface - exported (line 252)
- Token constants - exported
- `RepositoryModule` - exported as const
- Convenience re-exports at bottom (lines 380-398)

**Status:** Properly structured, no apparent issues.

---

## Integration Points

### Error Class Usage

1. **ApiError and subclasses** - Used in:
   - API response handling
   - TRPC error conversion
   - HTTP status code mapping

2. **AuthenticationError/AuthorizationError** - Used in:
   - AuthServer class methods
   - Controller authentication helpers
   - tRPC context creation

3. **AdapterErrors** - Used in:
   - Repository implementations
   - External API adapters
   - Storage operations

### DI Module Usage

1. **UseCaseModule** - Imported by:
   - AppModule (frameworks/di)
   - Test containers

2. **ControllerModule** - Imported by:
   - AppModule
   - Router definitions

3. **RepositoryModule** - Imported by:
   - AppModule
   - UseCaseModule

---

## Recommended Fix Priority

### Phase 1: Error Class Property Fixes (HIGH Priority)

1. **api/errors.ts - ApiError** (line 14)
   - Add `override readonly name: string;` property

2. **auth/authServer.ts - AuthenticationError** (line 97)
   - Add `override readonly name: string;` property

3. **auth/authServer.ts - AuthorizationError** (line 104)
   - Add `override readonly name: string;` property

4. **errors/adapter-errors.ts**
   - Verify TS4114 errors on message properties
   - Add `override readonly name: string` where missing (if any)

### Phase 2: DI Module Export Verification (MEDIUM Priority)

1. Verify no TS1205 or TS4023 errors when importing from other packages
2. Check if `export type` needed for interfaces

### Phase 3: Verification (HIGH Priority)

1. Run `bun tsc --noEmit` in packages/adapters
2. Run `bun test` in adapters package
3. Verify dependent packages compile

---

## File Modification Summary

| File                     | Lines   | Changes                                                      |
| ------------------------ | ------- | ------------------------------------------------------------ |
| api/errors.ts            | 14-15   | Add `override readonly name: string;`                        |
| auth/authServer.ts       | 97-98   | Add `override readonly name: string;` to AuthenticationError |
| auth/authServer.ts       | 104-105 | Add `override readonly name: string;` to AuthorizationError  |
| errors/adapter-errors.ts | 54-67   | Verify override modifiers (already present)                  |
| errors/adapter-errors.ts | 81-92   | Verify override modifiers (already present)                  |
| errors/adapter-errors.ts | 107-120 | Verify override modifiers (already present)                  |
| errors/adapter-errors.ts | 214-236 | Verify override modifiers (already present)                  |

---

## Risk Assessment

| Risk                       | Likelihood | Impact | Mitigation                                           |
| -------------------------- | ---------- | ------ | ---------------------------------------------------- |
| Missing error classes      | Low        | Medium | Grep search already performed, found all 16 classes  |
| Breaking subclass behavior | Low        | Low    | Only adding type declarations, no runtime changes    |
| DI export cascade issues   | Low        | Low    | Add `export type` only if errors appear              |
| Test dependencies          | Low        | Low    | No test logic depends on these specific declarations |

---

## Verification Steps

After implementing fixes:

```bash
# 1. TypeScript compilation check
cd packages/adapters && bun tsc --noEmit

# 2. Unit tests
bun test

# 3. Integration check (root level)
cd ../.. && bun tsc --noEmit
```

Expected result: Zero TS4114 errors, all tests pass.

---

## Scratchpad Reference

Working notes and detailed file content analysis available in:
`.specs/scratchpad/analysis-phase2b-1684ed8b000a.md`

---

_Analysis generated for task: fix-adapters-phase2-error-classes_
