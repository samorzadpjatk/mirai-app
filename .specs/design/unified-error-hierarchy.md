# Unified Error Hierarchy Design

## Current State Analysis

The codebase currently has **3 competing error systems**:

1. **domain-errors.ts** - Class-based (extends DomainError)
2. **effect-errors.ts** - Effect.Data.TaggedError based
3. **DomainErrors.ts** - Factory pattern (AppError object)

### Problems Identified

- **124 error classes** with many duplicates (DatabaseError appears 6x)
- **Inconsistent patterns** across packages
- **Multiple imports** for the same error type
- **Confusion** about which pattern to use

## Proposed Solution: Single Unified Hierarchy

Based on AGENTS.md guidelines:

- Domain uses `Result<T,E>` (pure, no async)
- No exceptions in domain - return errors
- Effect should be used only at adapter boundaries

### Core Principle

**Use class-based errors extending a base DomainError** for all layers. Effect integration happens only at adapter layer when needed.

## Unified Error Hierarchy (15 Classes)

```
DomainError (base)
├── ValidationError
│   ├── FieldValidationError
│   ├── SchemaValidationError
│   └── ConstraintViolationError
├── NotFoundError
│   ├── EntityNotFoundError
│   └── ResourceNotFoundError
├── StateError
│   ├── StateTransitionError
│   └── InvalidStateError
├── AuthorizationError
│   ├── UnauthorizedError
│   ├── ForbiddenError
│   └── AuthenticationError
├── ConflictError
│   ├── DuplicateError
│   └── ConcurrentModificationError
├── ExternalError
│   ├── DatabaseError
│   ├── NetworkError
│   └── ServiceUnavailableError
└── SystemError
    ├── ConfigurationError
    └── UnexpectedError
```

## Implementation Plan

### Phase 1: Create Unified Base (Week 1)

1. Create `packages/domain/src/errors/index.ts`
2. Define base `DomainError` class with \_tag discriminator
3. Create all 15 error classes with consistent interface

### Phase 2: Migrate Domain Errors (Week 2)

1. Replace imports in packages/domain
2. Update all entity validations
3. Update all value objects

### Phase 3: Migrate Use Cases (Week 3)

1. Replace imports in packages/use-cases
2. Update interactor error handling
3. Update port interfaces

### Phase 4: Migrate Adapters (Week 4)

1. Replace imports in packages/adapters
2. Update gateway error mapping
3. Update controller error translation

### Phase 5: Clean Up (Week 5)

1. Delete old error files:
   - domain-errors.ts
   - effect-errors.ts
   - DomainErrors.ts
2. Verify no duplicate error classes remain
3. Update documentation

## Benefits

- **Single source of truth** for all errors
- **Consistent pattern** across all layers
- **~90% reduction** in error class count (124 → 15)
- **Simpler imports** - one import path
- **Better tree-shaking** - unified module
- **Clear hierarchy** - easy to understand relationships

## Migration Commands

```bash
# Find all error imports
grep -r "from.*errors" packages --include="*.ts" | grep -v node_modules

# Find all error class instantiations
grep -r "new.*Error(" packages --include="*.ts" | wc -l

# Verify no old imports remain after migration
grep -r "domain-errors\|effect-errors\|DomainErrors" packages --include="*.ts"
```

## Acceptance Criteria

- [ ] All 124 error classes consolidated to 15
- [ ] Single error import path: `@mirai-app/domain/errors`
- [ ] Old error files deleted
- [ ] All tests pass
- [ ] No regression in error handling behavior
- [ ] Documentation updated
