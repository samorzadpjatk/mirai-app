# TypeScript Error Fixes

## Error Class Override Patterns

When extending the base `Error` class in TypeScript with strict mode enabled, properties that override base class members must use the `override` modifier.

### Common Error Class Pattern

```typescript
export class CustomError extends Error {
  readonly _tag = "CustomError" as const;
  readonly code = "CUSTOM_ERROR" as const;
  override readonly message: string; // ← override required
  override readonly name: string; // ← override required
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

| Property  | Type     | Notes                                       |
| --------- | -------- | ------------------------------------------- |
| `message` | `string` | Always needs override if redeclared         |
| `name`    | `string` | Always needs override if set in constructor |
| `stack`   | `string` | Rarely needs explicit override              |

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
  providers: {
    /* ... */
  };
  exports: string[];
}

// Export the module
export const Module: StaticModule<ModuleDef> = createStaticModule({
  /* ... */
});

// Re-export for consumers
export { SomeClass } from "./path";
export type { SomeInterface } from "./path"; // ← Use `export type` for types
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

| Error    | Cause                                 | Fix                      |
| -------- | ------------------------------------- | ------------------------ |
| `TS4114` | Property overrides without `override` | Add `override` modifier  |
| `TS1205` | Type-only export in non-type context  | Use `export type`        |
| `TS4023` | Missing type export                   | Add explicit type export |

---

## Extended Guide: TypeScript Error Classes and DI Module Fixes

### Overview

This extended guide covers:

- The `override` modifier in depth
- Error class patterns for custom exceptions
- awilix-modular DI module configurations
- TypeScript strict mode compliance

### The `override` Modifier (TypeScript 4.3+)

The `override` keyword explicitly marks class members that override a base class member.

**Benefits:**

- **Clarity**: Makes intent explicit
- **Safety**: Prevents accidental "trampling" when adding new methods
- **Refactoring protection**: Errors if base class member is renamed

**With `noImplicitOverride` enabled:**

```typescript
class Album {
  setup() {}
}

class MLAlbum extends Album {
  override setup() {} // ✓ Required with noImplicitOverride
}

class SharedAlbum extends Album {
  setup() {} // ✗ ERROR: Must have 'override' modifier
}
```

### Complete Error Class Pattern

```typescript
export class ValidationError extends Error {
  // 'name' exists on Error.prototype - needs override
  override readonly name = "ValidationError";

  // Custom properties - no override needed
  readonly _tag = "ValidationError" as const;
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.field = field;

    // Required for proper prototype chain (ES2015+)
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

### Error Hierarchy Pattern

```typescript
// Base adapter error
export abstract class AdapterError extends Error {
  abstract override readonly name: string;
  abstract readonly _tag: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}

// Concrete implementations
export class RepositoryError extends AdapterError {
  override readonly name = "RepositoryError";
  readonly _tag = "RepositoryError" as const;

  constructor(
    message: string,
    readonly entityType: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}
```

### awilix-modular DI Module Patterns

**Static Module with Proper Typing:**

```typescript
import { createStaticModule, StaticModule } from "awilix-modular";
import { Lifetime, asClass } from "awilix";

const moduleDefinition = {
  name: "FeatureModule",
  providers: {
    featureController: asClass(FeatureController).scoped(),
    featureService: {
      factory: (cradle) => new FeatureService(cradle.repository),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["featureController", "featureService"] as const,
};

export const FeatureModule: StaticModule<typeof moduleDefinition> =
  createStaticModule(moduleDefinition);
```

**Module with Imports:**

```typescript
export const ServiceModule = createStaticModule({
  name: "ServiceModule",
  imports: [RepositoryModule], // Import dependencies
  providers: {
    userService: {
      factory: (cradle) => new UserService(cradle.userRepository),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["userService"] as const,
});
```

### TypeScript Strict Mode Configuration

**Recommended `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "noImplicitOverride": true,
    "strictPropertyInitialization": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  }
}
```

### Migration Checklist

When fixing adapters package error classes:

- [ ] Add `override` to `name` property in all Error subclasses
- [ ] Add `Object.setPrototypeOf(this, ClassName.prototype)` in constructors
- [ ] Review DI modules for proper `asClass`/`asFunction` usage
- [ ] Ensure module exports use `as const` assertion
- [ ] Verify `noImplicitOverride: true` passes
- [ ] Run tests to ensure `instanceof` checks work

### References

1. [TypeScript 4.3 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-3.html)
2. [TypeScript TSConfig - noImplicitOverride](https://www.typescriptlang.org/tsconfig#noImplicitOverride)
3. [TypeScript Handbook - Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
4. [MDN - Error Class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
5. [TypeScript FAQ - Extending Built-ins](https://github.com/microsoft/TypeScript/wiki/FAQ)

---

**Version:** 1.1.0
**Last Updated:** 2026-04-11
**TypeScript Version:** 5.x
