# Skill: Clean Architecture Naming Conventions

## Description

Guidelines for organizing Clean Architecture adapter layer code by grouping framework-specific implementations in folders rather than using framework names in filenames.

## When to Use

Use this skill when:

- Refactoring adapter layer to follow Clean Architecture principles
- Organizing framework-specific code (Drizzle, Prisma, Supabase, etc.)
- Moving test implementations to appropriate layers
- Standardizing file naming conventions in TypeScript projects

## Principles

### 1. Technology-in-Folders Pattern

Group implementations by technology in folders, not by prefixing filenames:

```
❌ BAD:
gateways/
├── DrizzleUserRepository.ts
├── DrizzleGroupRepository.ts
├── PrismaUserRepository.ts
└── InMemoryUserRepository.ts

✅ GOOD:
gateways/
├── drizzle/
│   ├── user.ts           # DrizzleUserRepository class
│   ├── group.ts          # DrizzleGroupRepository class
│   └── index.ts
├── prisma/
│   ├── user.ts           # PrismaUserRepository class
│   └── index.ts
└── in-memory/
    ├── user.ts           # InMemoryUserRepository class
    └── index.ts
```

### 2. Filename Conventions

- Use **kebab-case** for all source files
- Describe the **concern/entity**, not the implementation
- Class names remain descriptive (e.g., `DrizzleUserRepository`)

```
❌ BAD:
- UserDrizzleMapper.ts
- DrizzleUserRepository.ts
- user-controller.ts

✅ GOOD:
- user.ts (contains UserDrizzleMapper)
- user.ts (contains DrizzleUserRepository)
- user.ts (contains UserController)
```

### 3. Clean Architecture Layer Placement

**In-memory repositories belong in the adapter layer**, not test-utils:

```
❌ BAD:
test-utils/
├── InMemoryUserRepository.ts    # Wrong layer!
└── mocks.ts

✅ GOOD:
gateways/
└── in-memory/
    ├── user.ts                    # Correct: implements repository port
    └── mocks.ts                   # Test helpers can stay
```

In-memory repositories implement the same ports as production repositories, making them adapter implementations.

## Implementation Steps

### Phase 1: Move In-Memory Repositories

1. Create `gateways/in-memory/` folder
2. Move each `InMemory*Repository.ts` from `test-utils/`
3. Rename to kebab-case (e.g., `InMemoryUserRepository.ts` → `user.ts`)
4. Update `gateways/in-memory/index.ts` exports
5. Add temporary re-exports in `test-utils/index.ts` for backwards compatibility

### Phase 2: Rename Drizzle Files

1. Rename each `Drizzle*Repository.ts` to kebab-case
2. Keep class names unchanged
3. Update `gateways/drizzle/index.ts` exports

### Phase 3: Rename Mappers

1. Rename each `*DrizzleMapper.ts` to kebab-case
2. Update `mappers/drizzle/index.ts` exports

### Phase 4: Rename Controllers

1. Rename each `*-controller.ts` to remove suffix
2. Update any controller index files

### Phase 5: Rename Services

1. Rename each `Drizzle*.ts` service file
2. Update `services/index.ts` exports

### Phase 6: Cleanup

1. Remove `test-utils/` folder after verifying no references
2. Update main `adapters/src/index.ts` exports
3. Run full test suite
4. Run dependency cruiser validation

## Verification Checklist

- [ ] All framework names removed from filenames
- [ ] All files use kebab-case naming
- [ ] In-memory repositories in `gateways/in-memory/`
- [ ] All imports updated
- [ ] `test-utils/` folder removed
- [ ] All tests pass
- [ ] Dependency cruiser validation passes
- [ ] No breaking changes to public API

## Common Pitfalls

1. **Forgetting index files** - Every folder needs an index.ts with proper exports
2. **Missing import updates** - Use grep to find all imports of moved files
3. **Class name confusion** - File names change, but class names stay the same
4. **Breaking tests** - Maintain temporary re-exports during transition
5. **DI registration** - Update module files that reference file paths

## Benefits

1. **Cleaner architecture** - Technology in folders, concern in filenames
2. **Easier navigation** - Find all Drizzle code in `drizzle/`
3. **Consistent naming** - Kebab-case everywhere
4. **Clear separation** - Production vs test implementations obvious
5. **Maintainability** - Add new framework by adding folder, not naming convention

## Related

- Clean Architecture dependency rule: Frameworks → Adapters → Use Cases → Domain
- Adapter pattern: Implement domain ports with framework-specific code
- See: `.specs/plans/clean-architecture-naming.design.md` for full migration plan
