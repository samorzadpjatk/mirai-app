# TypeScript Error Fixes

## Error Class Override Patterns

When extending the base `Error` class in TypeScript with strict mode enabled, properties that override base class members must use the `override` modifier.

### Common Error Class Pattern

```typescript
export class CustomError extends Error {
  readonly _tag = "CustomError" as const;
  readonly code = "CUSTOM_ERROR" as const;
  override readonly message: string;  // ← override required
  override readonly name: string;     // ← override required
  readonly cause?: unknown;

  constructor(props: { message: string; cause?: unknown }) {
    super(props.message);
    this.message = props.message;
    this.name = this.constructor.name;
  }
}
```

### Properties Requiring `override`

When extending `Error`, these properties typically need `override`:

| Property | Type | Notes |
|----------|------|-------|
| `message` | `string` | Always needs override if redeclared |
| `name` | `string` | Always needs override if set in constructor |
| `stack` | `string` | Rarely needs explicit override |

### Subclassing Custom Errors

When extending a custom error class:

```typescript
export class SpecificError extends CustomError {
  // Inherits _tag, code from parent
  // Re-declare message with override if needed
  override readonly message: string;
  
  constructor(message: string) {
    super({ message, code: "SPECIFIC" });
    this.message = message;
  }
}
```

### Quick Fix Checklist

- [ ] Does the error class extend `Error` or a subclass?
- [ ] Are properties (`message`, `name`) redeclared in the class?
- [ ] If yes, add `override` modifier
- [ ] Run `tsc --noEmit` to verify no errors

## DI Module Export Patterns

### TypeScript Module Exports

When using awilix-modular, ensure proper type exports:

```typescript
// Export the module definition type
export interface ModuleDef {
  name: "ModuleName";
  providers: { /* ... */ };
  exports: string[];
}

// Export the module
export const Module: StaticModule<ModuleDef> = createStaticModule({ /* ... */ });

// Re-export for consumers
export { SomeClass } from "./path";
export type { SomeInterface } from "./path";  // ← Use `export type` for types
```

### Export Declaration Best Practices

1. **Use `export type` for type-only exports** - helps with isolatedModules
2. **Re-export classes at module end** - convenience for consumers
3. **Export interface definitions** - enables type-safe consumption

## TypeScript Strict Mode Reference

### Relevant Compiler Options

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "isolatedModules": true
  }
}
```

### Error Message Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `TS4114` | Property overrides without `override` | Add `override` modifier |
| `TS1205` | Type-only export in non-type context | Use `export type` |
| `TS4023` | Missing type export | Add explicit type export |
