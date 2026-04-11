# Codebase Impact Analysis: Fix adapters package error classes and DI modules (Phase 2)

**Task:** Fix adapters package error classes and DI modules (Phase 2)  
**Analysis Date:** 2026-04-11  
**Analyst:** sdd:plan workflow  

---

## Summary

This analysis identifies approximately 15 TypeScript compilation errors in the adapters package related to missing `override` modifiers on error class properties and potential DI module export issues.

## Files Affected

### Error Class Files (9 error classes need fixes)

| File Path | Error Classes | Issues |
|-----------|---------------|--------|
| `packages/adapters/src/errors/adapter-errors.ts` | 9 error classes | Some missing `override` on `message` property |
| `packages/adapters/src/api/errors.ts` | 1 base + 4 subclasses | `ApiError` needs `override` on `name` property |
| `packages/adapters/src/controllers/auth/authServer.ts` | 2 error classes | Both need `override` on `name` property |

### DI Module Files (to verify)

| File Path | Exports | Notes |
|-----------|---------|-------|
| `packages/adapters/src/modules/UseCaseModule.ts` | Providers, tokens, factory functions | Check type exports |
| `packages/adapters/src/modules/ControllerModule.ts` | Controllers, services | Check type exports |
| `packages/adapters/src/modules/RepositoryModule.ts` | 17 repositories | Check type exports |

## Detailed Findings

### 1. Error Classes Requiring `override` Modifier

#### packages/adapters/src/api/errors.ts

```typescript
// Line 14-26: ApiError
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;  // ← NEEDS: override readonly name: string
    // ...
  }
}

// Lines 32-63: Subclasses
// UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError
// May inherit name issue from ApiError
```

**Fix:** Add `override readonly name: string` declaration in constructor or as property.

#### packages/adapters/src/controllers/auth/authServer.ts

```typescript
// Lines 97-102: AuthenticationError
export class AuthenticationError extends Error {
  constructor(message = "Not Authenticated") {
    super(message);
    this.name = "AuthenticationError";  // ← NEEDS: override name property
  }
}

// Lines 104-109: AuthorizationError
export class AuthorizationError extends Error {
  constructor(message = "Missing Required Permissions") {
    super(message);
    this.name = "AuthorizationError";  // ← NEEDS: override name property
  }
}
```

**Fix:** Add `override readonly name: string` property to both classes.

#### packages/adapters/src/errors/adapter-errors.ts

Most error classes already have `override readonly message`. Need to verify these:

- `ExternalAPITimeoutError` (lines 179-194): Only has `timeoutMs` property in constructor, relies on super message
- `StorageFileNotFoundError` (lines 249-258): Only has `path` property, relies on super message

Both are likely fine since they don't redeclare `message` property.

### 2. DI Module Export Analysis

All three modules follow the same pattern:

```typescript
export const Module: StaticModule<ModuleDef> = createStaticModule({ ... });

// Re-exports at end
export { ClassName } from "../path";
```

**Potential issues to verify:**
- Are interface types properly exported with `export type`?
- Are module definition types exported?
- Are token consts properly typed for external use?

## Integration Points

### Consumers of Error Classes

- **Controllers** use error classes for throwing typed errors
- **Error middleware** catches and handles these errors
- **Tests** assert against specific error types

### Consumers of DI Modules

- **App container** imports and combines all modules
- **Tests** use modules to build test containers
- **Framework layer** resolves services from modules

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking changes to error handling | Low | Only adding type annotations |
| Runtime behavior change | None | `override` is compile-time only |
| Type export compatibility | Low | Add `export type` where needed |

## Recommended Implementation Steps

1. **Phase 1: Error Class Fixes**
   - Add `override readonly name: string` to ApiError, AuthenticationError, AuthorizationError
   - Verify other error classes have proper override modifiers

2. **Phase 2: DI Module Verification**
   - Check type exports in all three module files
   - Add `export type` for interface definitions if missing
   - Verify token const types are exported

3. **Phase 3: Verification**
   - Run `tsc --noEmit` in adapters package
   - Run tests to ensure no regressions
   - Check dependent packages compile successfully

## Estimation

- **Error class fixes**: ~5 files, straightforward property additions
- **DI module exports**: ~3 files, verify and add type exports
- **Total**: Small maintenance task, ~15 type errors to fix
