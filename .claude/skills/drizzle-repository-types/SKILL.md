# Drizzle ORM Repository Type Patterns

## Overview

This skill provides patterns and guidance for resolving complex Drizzle ORM type issues in repository implementations.

## Common Type Error Patterns

### 1. Select Query Type Mismatches

**Error Pattern:**
```
Type 'Omit<PgSelectBase<...>>' is missing properties: config, joinsNotNullableMap, tableName, isPartialSelect
```

**Solution:**
Drizzle's query builder uses method chaining that transforms types. When you add `.limit()` or `.offset()`, the return type changes. Use `as const` assertions or type the final result.

```typescript
// ❌ Wrong - query type changes with each chained method
let query = this.db.select().from(this.table);
if (options?.limit) query = query.limit(options.limit) as typeof query;

// ✅ Correct - extract data after await
const records = await this.db
  .select()
  .from(this.table)
  .where(eq(this.table.tripId, tripId))
  .limit(options.limit ?? 100);
```

### 2. Insert/Update Type Constraints

**Error Pattern:**
```
Type 'Partial<{...}>' does not satisfy the constraint 'PgTable<TableConfig>'
```

**Solution:**
The generic type parameters for `BaseDrizzleRepository` must use the actual table type, not a partial of the shape.

```typescript
// ❌ Wrong - using Partial<Shape>
class Repo extends BaseDrizzleRepository<Entity, SelectType, Partial<Shape>, ...>

// ✅ Correct - use proper Insert type from schema
import { type EntityInsert } from "@mirai-app/frameworks/drizzle/schema";
class Repo extends BaseDrizzleRepository<Entity, EntitySelect, EntityInsert, typeof table>
```

### 3. Override Modifier Required

**Error Pattern:**
```
This member must have an 'override' modifier because it overrides a member in the base class
```

**Solution:**
Add the `override` keyword to methods that override base class implementations.

```typescript
// ❌ Wrong
async findAll(options?: { limit?: number }): Promise<Entity[]> { }

// ✅ Correct
override async findAll(options?: { limit?: number }): Promise<Entity[]> { }
```

### 4. Method Signature Mismatches

**Error Pattern:**
```
Property 'findByX' in type 'ConcreteRepo' is not assignable to the same property in base type 'Interface'
```

**Solution:**
Ensure return types match exactly. Use `Promise<Entity | null>` for nullable returns, not `Promise<Entity | undefined>`.

```typescript
// Interface
interface Repository {
  findById(id: string): Promise<Entity | null>;
}

// ✅ Correct implementation
class DrizzleRepo implements Repository {
  async findById(id: string): Promise<Entity | null> {
    const record = records[0];
    return record ? this.mapper.toDomain(record) : null;
  }
}
```

### 5. Missing Export Errors

**Error Pattern:**
```
Module has no exported member named 'X'. Did you mean 'Y'?
```

**Solution:**
Check that the domain/use-cases packages actually export the types. May need to update barrel exports (index.ts).

### 6. Union Type Property Access

**Error Pattern:**
```
Property 'X' does not exist on type 'A | B | C'
```

**Solution:**
Use type guards or discriminated unions with `_tag` field.

```typescript
if (error._tag === "SpecificError") {
  // Now error.specificProperty is accessible
}
```

## Resources

### Drizzle ORM Documentation
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)
- [Query API](https://orm.drizzle.team/docs/rqb)
- [Migrations](https://orm.drizzle.team/docs/migrations)

### Type Utilities
- Use `typeof table` for table type references
- Use `PgTable<TableConfig>` as base constraint
- Use `PgSelectBase`, `PgInsertBase`, `PgUpdateBase` for query return types

## Best Practices

1. **Always use schema-generated types** - Import `EntitySelect`, `EntityInsert` from schema
2. **Map to domain objects** - Use mappers to convert Drizzle records to domain entities
3. **Handle nullable returns** - Use `Promise<Entity | null>` consistently
4. **Use query builder properly** - Build query, then await for results
5. **Override base methods** - Add `override` modifier when overriding `BaseDrizzleRepository` methods
6. **Type parameters matter** - Generic types must match the table schema exactly

## Common Fixes Checklist

- [ ] Add `override` modifier to overridden methods
- [ ] Fix generic type parameters (Select, Insert, Table)
- [ ] Ensure proper return types (null vs undefined)
- [ ] Update barrel exports if types missing
- [ ] Fix query builder chaining (await before mapping)
- [ ] Add type guards for union type access
