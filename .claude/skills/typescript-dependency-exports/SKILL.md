# Skill: TypeScript Dependency and Export Fixes

## Goal

Fix TypeScript compilation errors caused by missing package exports and dependency issues in a monorepo context. This skill provides a systematic approach to resolving "Module has no exported member" and related type errors.

## When to Use

- TypeScript errors: `Module '"X"' has no exported member 'Y'`
- Missing type exports from package index files
- Type mismatches between packages in a monorepo
- Dependency resolution issues in Clean Architecture layers

## Workflow

### Step 1: Identify Missing Exports

Run TypeScript compiler to get full error list:
```bash
cd packages/<affected-package>
npx tsc --noEmit 2>&1 | grep "error TS2305\|error TS2307"
```

Common error patterns:
- `TS2305: Module '"X"' has no exported member 'Y'` - Missing export
- `TS2307: Cannot find module 'X' or its corresponding type declarations` - Missing dependency
- `TS2322: Type 'X' is not assignable to type 'Y'` - Type mismatch

### Step 2: Locate Source Types

Find where the missing type is defined:
```bash
grep -r "export.*TypeName" packages/<source-package>/src/
```

Check if type is in domain/entities or domain/enums:
- Domain entities: `packages/domain/src/entities/`
- Domain enums: `packages/domain/src/enums/`

### Step 3: Add Re-exports (Clean Architecture Pattern)

In a layered architecture, types flow outward:
```
Domain → Use Cases → Adapters → Frameworks
```

If adapters needs a domain type, it should be re-exported through use-cases:

**File: packages/use-cases/src/index.ts**
```typescript
// Re-export domain types needed by adapters
export { UserRole } from "@mirai-app/domain";
export { SomeOtherType } from "@mirai-app/domain";
```

**Pattern for type-only exports:**
```typescript
export type { SomeType } from "@mirai-app/domain";
```

**Pattern for value exports (enums, classes):**
```typescript
export { SomeEnum } from "@mirai-app/domain";
```

### Step 4: Fix Type Mismatches

When DTOs don't match expected types:

1. **Check use-case output type:**
   ```typescript
   // In use-cases
   export type GetSomethingOutput = {
     field1: string;
     field2: string | null;
   }
   ```

2. **Align controller DTO:**
   ```typescript
   // In adapters controller
   const output: GetSomethingOutput = {
     field1: data.field1,
     field2: data.field2 ?? null, // Handle undefined
   };
   ```

3. **Common fixes:**
   - `string | null | undefined` → `string | null` (remove undefined)
   - Add missing optional fields: `description?: string | null`
   - Fix property names to match exactly

### Step 5: Verify No Circular Dependencies

Run dependency-cruiser:
```bash
npx dependency-cruiser --validate .dependency-cruiser.mjs packages/
```

Ensure:
- No new circular dependencies introduced
- Dependency direction follows Clean Architecture (inward only)

### Step 6: Validate Fixes

Run type check:
```bash
cd packages/<package>
npx tsc --noEmit
```

Expected result: `0 errors`

## Common Patterns

### Pattern 1: Re-exporting Domain Enums

**When**: Adapters need to reference domain enums (e.g., UserRole)

**Solution**:
```typescript
// packages/use-cases/src/index.ts
export { UserRole } from "@mirai-app/domain";
```

### Pattern 2: Fixing Optional vs Required Fields

**When**: Type mismatch due to optional fields

**Solution**:
```typescript
// Before (error)
const dto: ExpectedType = {
  field: data.field, // Type 'string | undefined' not assignable to 'string | null'
};

// After (fixed)
const dto: ExpectedType = {
  field: data.field ?? null, // Handle undefined
};
```

### Pattern 3: Type-only Exports

**When**: Exporting types that don't exist at runtime

**Solution**:
```typescript
export type { SomeInterface } from "@mirai-app/domain";
// NOT: export { SomeInterface } - this fails for types
```

## Troubleshooting

### Issue: Export added but still getting error

**Check**:
1. Is the package rebuilt? `npm run build` in source package
2. Is it a type-only export? Use `export type` syntax
3. Is the path correct? Check the actual file location

### Issue: Circular dependency introduced

**Check**:
- Don't import from outer layers (adapters importing from frameworks)
- Use dependency-cruiser to visualize: `npx dependency-cruiser --output-type dot packages/ | dot -T svg > deps.svg`

### Issue: Type still not assignable after fixes

**Check**:
- Run `npx tsc --noEmit --traceResolution` to see module resolution
- Check for duplicate type definitions
- Verify the exported type matches the expected shape exactly

## References

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Clean Architecture Dependencies](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
