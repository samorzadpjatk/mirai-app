# TypeScript Error Fixes for GraphQL Migration

> **Reusable patterns for fixing common TypeScript errors during GraphQL client migration (urql), package restructuring, and Effect framework adoption.**

---

## Quick Reference

| Error Code | Common Cause                  | Fix Pattern                                               |
| ---------- | ----------------------------- | --------------------------------------------------------- |
| `TS2307`   | Cannot find module            | Path mapping, exports configuration, or missing index.ts  |
| `TS2339`   | Property does not exist       | API change (urql response structure), missing type export |
| `TS7006`   | Implicit 'any' parameter      | Add explicit type annotation                              |
| `TS2322`   | Type not assignable           | Effect error type mismatch, Schema date/string mismatch   |
| `TS2304`   | Cannot find name              | Missing import or type export                             |
| `TS2305`   | Module has no exported member | Missing export or renamed export                          |
| `TS18048`  | Possibly 'undefined'          | Add null check or non-null assertion                      |

---

## 1. Module Resolution Errors (TS2307)

### 1.1 Package Export Configuration

When restructuring packages, ensure `package.json` exports are correctly configured:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./urql": {
      "types": "./dist/src/generated/urql.d.ts",
      "import": "./dist/src/generated/urql.js"
    }
  }
}
```

**Pattern:** Always provide both `types` and `import` for generated files.

### 1.2 Workspace Path Aliases

For monorepo workspace imports, ensure `tsconfig.json` paths are configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@mirai-app/graphql-client": ["./packages/graphql-client/src/index.ts"],
      "@mirai-app/graphql-client/urql": [
        "./packages/graphql-client/src/generated/urql.ts"
      ]
    }
  }
}
```

### 1.3 Missing Index Files

When you see `Cannot find module '../ui/Input'`, create barrel exports:

```typescript
// packages/ui/src/index.ts
export { Input } from "./components/Input";
export { Button } from "./components/Button";
// ... etc
```

---

## 2. urql API Migration (TS2339)

### 2.1 useQuery Response Structure

**OLD (TanStack Query pattern):**

```typescript
const { data, isLoading, error, refetch, isFetching } = useQuery({...});
```

**NEW (urql pattern):**

```typescript
const [{ data, fetching, error }, replay] = useQuery({ query: Document });

// Key differences:
// - `isLoading` → `fetching`
// - `isFetching` → not directly available, use `fetching` combined with `stale`
// - `refetch` → `replay()`
// - Response is a tuple: [result, replay]
```

**Migration Pattern:**

```typescript
// Before
const { data, isLoading, isError, error, refetch, isFetching } = useQuery({...});

// After
const [{ data, fetching, error }, replay] = useQuery({
  query: GetMyNotificationsDocument,
  variables: { page, perPage }
});

const isLoading = fetching && !data;
const isError = !!error;
const refetch = replay;
```

### 2.2 useMutation Response Structure

**OLD pattern:**

```typescript
const mutation = useMutation(Document);
// mutation.fetching, mutation.error
```

**NEW pattern:**

```typescript
const [result, execute] = useMutation(Document);
// result.fetching, result.error, result.data
// execute(variables) returns Promise
```

**Migration Pattern:**

```typescript
// Before
const [, createSchedule] = useMutation(CreateScheduleDocument);
const { fetching } = createSchedule; // TS2339: Property 'fetching' does not exist

// After
const [createResult, createSchedule] = useMutation(CreateScheduleDocument);
const { fetching } = createResult; // Correct access
```

### 2.3 Client.invalidate() Not Available

urql's `Client` doesn't have `invalidate()` method like TanStack Query:

**Migration Pattern:**

```typescript
// Before (TanStack Query)
const client = useQueryClient();
client.invalidateQueries({ queryKey: ["trips"] });

// After (urql)
import { useClient } from "urql";
import { pipe, subscribe } from "wonka";

const client = useClient();

// Option 1: Re-execute specific query
const [{}, reexecuteQuery] = useQuery({ query: TripsDocument });
reexecuteQuery({ requestPolicy: "network-only" });

// Option 2: Clear cache manually
client.reexecuteOperation({
  key: "your-operation-key",
  query: TripsDocument,
  kind: "query",
});
```

### 2.4 GraphQLClient Type Errors

When `GraphQLClient` or `GraphQLClientImpl` types are missing properties:

```typescript
// Define proper interface
interface GraphQLClient {
  user?: User | null;
  // Add other properties as needed
}

// Or use type assertion for internal implementation
const client = useContext(GraphQLContext) as GraphQLClientImpl;
```

---

## 3. Schema Validation Date/String Mismatches (TS2322)

### 3.1 Date Encoding/Decoding

When using Effect Schema or similar validation, dates often cause type mismatches:

```typescript
// Problem: Encoded type expects string, Schema expects Date
const Schema = S.Struct({
  startDate: S.Date, // Decoded type: Date, Encoded type: string
});

// Solution: Use DateFromString transformation
import { DateFromString } from "@mirai-app/shared";

const Schema = S.Struct({
  startDate: DateFromString, // Properly handles string ↔ Date conversion
});
```

**Common Pattern for Date Fields:**

```typescript
// For optional dates with null
endDate: S.optional(S.Union(S.Null, DateFromString)),

// For required dates
startDate: DateFromString,

// For dates in nested objects
challengeActivity: S.Struct({
  endTime: S.optional(S.Union(S.Null, DateFromString)),
}),
```

### 3.2 Array Filter Composition

When composing array filters causes type issues:

```typescript
// Problem: Type inference fails with chained filters
const AdminParticipantIds = S.Array(S.String).pipe(S.filter(isUUID));

// Solution: Explicit type annotation or separate composition
const AdminParticipantIds: S.Schema<
  readonly string[],
  readonly string[],
  never
> = S.Array(S.String).pipe(S.filter(isUUID));
```

---

## 4. Effect Framework Type Patterns (TS2322)

### 4.1 Error Type Mismatch

When Effect error types don't align:

```typescript
// Problem: Different error types in union
Effect<T, ServiceUnavailableError | ConfigurationError, never>;
// Not assignable to:
Effect<T, DomainError, never>;

// Solution 1: Use common base error type
class DomainError extends Data.TaggedError("DomainError")<{
  message: string;
}>() {}
class ServiceUnavailableError extends Data.TaggedError(
  "ServiceUnavailableError",
)<{
  cause: unknown;
}> {}

// All should extend/implement base error interface

// Solution 2: Use Effect.catchTag to narrow
return effect.pipe(
  Effect.catchTag("ServiceUnavailableError", (error) =>
    Effect.fail(new DomainError({ message: error.message })),
  ),
);
```

### 4.2 Context.Tag Pattern

For dependency injection with Effect:

```typescript
// Define the service interface
interface SupabaseClientService {
  readonly client: SupabaseClient;
}

// Create the tag
const SupabaseClientTag = Context.Tag<SupabaseClientService>(
  "SupabaseClientService",
);

// Use in Effect.gen
const program = Effect.gen(function* () {
  const { client } = yield* SupabaseClientTag;
  // ... use client
});
```

### 4.3 Missing Import in Type Export Files

When exporting types from a barrel file:

```typescript
// packages/frameworks/src/supabase/index.ts
import { Context } from "effect";
import { createSupabaseClient } from "./client";

// MUST import the type to use it
import type { SupabaseClient } from "./types";

export type {
  SupabaseClientOptions,
  SupabaseClient, // Re-export from types.ts
  SupabaseSession,
  // ...
} from "./types";

// Can now use in Context.Tag
export const SupabaseClientTag = Context.Tag<SupabaseClient>("SupabaseClient");
```

---

## 5. Pothos GraphQL Type Patterns

### 5.1 Builder Type Configuration

```typescript
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: {
    ID: { Input: string; Output: string };
    DateTime: { Input: Date; Output: Date };
  };
  AuthScopes: {
    public: boolean;
    authenticated: boolean;
    admin: boolean;
    moderator: boolean;
  };
}>({
  plugins: [ScopeAuthPlugin],
  scopeAuthOptions: {
    unauthorizedError: (parent, args, context, info, directive) =>
      new Error("Not authorized"),
  },
});
```

### 5.2 Type Registration Pattern

```typescript
// Register object type
const UserType = builder.objectType("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email", { nullable: true }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (user) => user.createdAt,
    }),
  }),
});

// Register with auth scopes
builder.queryType({
  fields: (t) => ({
    me: t.field({
      type: UserType,
      authScopes: { authenticated: true },
      resolve: async (_, __, ctx) => {
        // Resolver implementation
      },
    }),
  }),
});
```

---

## 6. Test File Type Fixes

### 6.1 bun:test Type Resolution

For test files using `bun:test`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["bun"]
  }
}
```

Or in test files:

```typescript
/// <reference types="bun" />
import { describe, it, expect } from "bun:test";
```

### 6.2 HTMLElement Type Narrowing

When TypeScript complains about `HTMLElement | undefined`:

```typescript
// Before
const element = screen.getByText("Submit").parentElement;
expect(element).toHaveClass("button"); // TS2345: HTMLElement | undefined

// After
const element = screen.getByText("Submit").parentElement;
expect(element).toBeDefined();
expect(element!).toHaveClass("button"); // Non-null assertion

// Or with type guard
if (!element) throw new Error("Element not found");
expect(element).toHaveClass("button");
```

---

## 7. Quick Fix Checklist

### For Module Errors (TS2307)

- [ ] Check `package.json` exports configuration
- [ ] Verify workspace path aliases in tsconfig.json
- [ ] Ensure barrel exports (index.ts) exist
- [ ] Check for circular dependencies

### For Property Errors (TS2339)

- [ ] Identify API changes (urql response structure)
- [ ] Check if property was renamed in new version
- [ ] Verify type exports are complete
- [ ] Use IDE to inspect actual type

### For Type Assignment Errors (TS2322)

- [ ] Check date/string encoding mismatches
- [ ] Verify Effect error type unions
- [ ] Ensure schema transformations are correct
- [ ] Check contravariance/covariance issues

### For Implicit Any (TS7006)

- [ ] Add explicit parameter types
- [ ] Use `satisfies` keyword for object literals
- [ ] Enable `strict: true` in tsconfig

---

## 8. Migration Patterns Summary

### urql Migration Checklist

1. **Install dependencies:**

   ```bash
   bun add urql @urql/core wonka graphql
   ```

2. **Update imports:**

   ```typescript
   // Before
   import { useQuery, useMutation } from "@tanstack/react-query";

   // After
   import { useQuery, useMutation, useClient } from "urql";
   ```

3. **Transform query usage:**

   ```typescript
   // Before
   const { data, isLoading } = useQuery({
     queryKey: ["user"],
     queryFn: () => fetchUser(),
   });

   // After
   const [{ data, fetching }] = useQuery({
     query: GetUserDocument,
   });
   const isLoading = fetching && !data;
   ```

4. **Transform mutation usage:**

   ```typescript
   // Before
   const mutation = useMutation({
     mutationFn: (vars) => mutateUser(vars),
   });

   // After
   const [result, mutate] = useMutation(MutateUserDocument);
   ```

5. **Handle cache invalidation:**
   ```typescript
   // Use requestPolicy: 'network-only' for refetch
   const [{}, reexecute] = useQuery({
     query: Document,
     requestPolicy: "cache-and-network",
   });
   ```

---

## Resources

- [urql Documentation](https://formidable.com/open-source/urql/docs/)
- [Effect Documentation](https://effect.website/docs/introduction)
- [Pothos Documentation](https://pothos-graphql.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)

---

**Last Updated:** 2026-04-15  
**Version:** 1.0.0
