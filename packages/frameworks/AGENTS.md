# Framework Layer — Quick Reference

> **DI wiring, Layer composition, and framework configuration for the Mirai App monorepo**
>
> This document complements **CLAUDE.md §10.4** with practical patterns for the Frameworks layer.

---

## Universal Rules

- **TDD first:** Write the failing test before implementation
- **GraphQL workflow:** Never edit generated GraphQL clients, types, or operations. Only edit Pothos schema files, then sync schema, then regenerate client

---

## Layer Composition (Effect)

The Frameworks layer composes Effect Layers for dependency injection in `packages/frameworks/src/di/`.

### Module Structure

```
packages/frameworks/src/di/
├── index.ts                 # Main exports
└── layer/
    ├── app.ts              # Complete app layer (repositories + services)
    ├── repository.ts       # All domain repository Layers
    ├── service.ts          # Supabase service Layers
    ├── service-tags.ts     # Context.Tags for services
    ├── infrastructure.ts   # Database/logger configuration
    ├── test.ts            # Test utilities and mock layers
    └── storage-path-resolver.ts
```

### Creating Layers

**Complete App Layer:**

```typescript
import { makeAppLayer } from "@mirai-app/frameworks/di";
import { UserPortTag } from "@mirai-app/use-cases/user/ports/UserPort";
import { Effect } from "effect";

const appLayer = makeAppLayer({ db, supabase });

const program = Effect.gen(function* () {
  const userRepo = yield* UserPortTag;
  return yield* userRepo.findById("123");
}).pipe(Effect.provide(appLayer));
```

**Individual Repository Layer:**

```typescript
import { makeUserRepositoryLayer } from "@mirai-app/frameworks/di";

const userLayer = makeUserRepositoryLayer({ db });
```

**Service Layer (Supabase):**

```typescript
import { makeServiceLayer, AuthPortTag } from "@mirai-app/frameworks/di";

const serviceLayer = makeServiceLayer({ supabase });

const program = Effect.gen(function* () {
  const auth = yield* AuthPortTag;
  return yield* auth.getSession();
}).pipe(Effect.provide(serviceLayer));
```

### Test Utilities

```typescript
import { createTestLayer, runWithTestLayer } from "@mirai-app/frameworks/di";

const testLayer = createTestLayer();

const result = await runWithTestLayer(
  testLayer,
  Effect.gen(function* () {
    const repo = yield* UserPortTag;
    return yield* repo.findById("123");
  }),
);
```

### Key Principles

1. **Type inference over explicit annotations** - Let TypeScript infer Layer types
2. **No `as unknown as` casts** - Use proper gateway implementations
3. **Check existing implementations** - Before creating placeholders, verify if gateways exist in adapters
4. **Layer composition** - Use `Layer.mergeAll()` for combining multiple layers
5. **Service separation** - Repository layers (db) and service layers (supabase) are independent

**Key rule:** Frameworks layer wires infrastructure, never contains business logic.

---

## Controller Factory Pattern

Controllers are instantiated with Effect Layers. **Access controllers via `ctx.controllers`.**

```ts
// packages/frameworks/src/context.ts
import { createControllers } from "@mirai-app/adapters";

export interface GraphQLContext {
  controllers: Controllers;
  appLayer: Layer.Layer<unknown>;
  request: Request;
  authContext?: AuthContext;
  runtime: GraphQLRuntime;
}

// Create controllers with the appLayer
const controllers = createControllers({ appLayer, supabase });
```

---

## Scope Strategy

| Scope     | Use for                          | Lifetime         |
| --------- | -------------------------------- | ---------------- |
| SINGLETON | Repositories, stateless services | One per app      |
| SCOPED    | Controllers, use cases           | One per request  |
| TRANSIENT | Utilities, factories             | New each resolve |

---

## DI Wiring Examples

### Controller Access (resolvers)

```ts
// In GraphQL resolver: access controller from context
export const userResolvers = {
  Query: {
    user: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      const controller = ctx.controllers.userController;
      const result = await controller.getById({ id: args.id });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  },
};
```

### Test Context Setup

```ts
// In tests: create test context with mocked controllers
import { createTestContext } from "@mirai-app/frameworks/testing";

const ctx = createTestContext({
  controllers: {
    userController: new MockUserController(),
  },
});
```

---

## GraphQL Domain Module Structure

The GraphQL layer uses a modular, domain-driven structure with Pothos. Each business domain has its own directory with co-located types, queries, mutations, and subscriptions.

**Reference**: See `.claude/skills/pothos-schema-modules/SKILL.md` for detailed patterns.

### Directory Structure

```
packages/frameworks/src/graphql/
├── builder.ts              # Pothos builder with plugins configured
├── schema.ts               # Central assembly point - imports all domains
├── context.ts              # GraphQL context with controllers
├── errors.ts               # Error handling utilities
├── auth.ts                 # Scope auth definitions
├── types/
│   ├── index.ts            # Barrel export for all domains
│   ├── user/
│   │   ├── types.ts        # Object types with Relay interface
│   │   ├── queries.ts      # Query resolvers
│   │   ├── mutations.ts    # Mutation resolvers
│   │   ├── subscriptions.ts # Real-time subscriptions
│   │   ├── index.ts        # Exports and side-effect registration
│   │   └── types.test.ts   # Co-located tests
│   ├── event/
│   │   └── ...             # Same structure
│   └── ...                 # Other domains
```

### Side-Effect Registration Pattern

Types register themselves with Pothos when their modules are imported. This is the key pattern for modular schema assembly.

**In domain module index.ts:**

```typescript
// packages/frameworks/src/graphql/types/user/index.ts

// Export public API
export { UserType, UserConnectionType } from "./types";
export { userQueries } from "./queries";
export { userMutations } from "./mutations";

// Side-effect: Register types with builder on import
import "./types";
import "./queries";
import "./mutations";
```

**In central schema.ts:**

```typescript
// packages/frameworks/src/graphql/schema.ts
import { builder } from "./builder";

// Import domain modules (triggers side-effect registration)
import "./types/user";
import "./types/event";
import "./types/sponsor";
import "./types/notification";
import "./types/coinTransaction";

// Build and export unified schema
export const schema = builder.toSchema();
export default schema;
```

### Import Patterns

**For schema generation (from schema.ts):**

```typescript
// Import all domains via side-effect
import "./types/user";
import "./types/event";
```

**For direct type access (from resolvers in other domains):**

```typescript
// Import from domain module index
import { UserType, UserConnectionType } from "../user";
import { EventType } from "../event";
```

**For consumers (apps, tests):**

```typescript
// Import schema for server setup
import { schema } from "@mirai-app/frameworks/graphql";

// Never import schema directly into UI code
// Apps only use urql hooks generated from schema
```

### Creating a New Domain Module

Follow these steps to add a new domain:

1. **Create directory**: `packages/frameworks/src/graphql/types/{domain}/`

2. **Create types.ts**: Define object types using Relay plugin

```typescript
// packages/frameworks/src/graphql/types/product/types.ts
import { builder } from "../../builder";
import type { ProductDTO } from "@mirai-app/use-cases";

export const ProductType = builder.node("Product", {
  id: { resolve: (product) => product.id },
  description: "A product in the catalog",
  fields: (t) => ({
    name: t.exposeString("name"),
    price: t.exposeInt("priceInCents"),
  }),
});

export const ProductConnectionType = builder.connection(
  { name: "ProductConnection", node: ProductType },
  { name: "ProductEdge" },
);
```

3. **Create queries.ts**: Define query resolvers

```typescript
// packages/frameworks/src/graphql/types/product/queries.ts
import { builder } from "../../builder";
import { clampFirst, decodeCursorWithDate } from "../../utils/connections";
import { ProductConnectionType } from "./types";

export const productQueries = builder.queryFields((t) => ({
  products: t.field({
    type: ProductConnectionType,
    args: {
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, ctx) => {
      const controller = ctx.controllers.productController;
      const first = clampFirst(args.first);
      const after = args.after ? decodeCursorWithDate(args.after) : undefined;
      const result = await controller.getProducts({ first, after });

      if (!result.success) {
        throw mapDomainErrorToGraphQL(result.error, ctx);
      }

      return result.data;
    },
  }),
}));
```

4. **Create index.ts**: Exports and side-effect imports

```typescript
// packages/frameworks/src/graphql/types/product/index.ts
export { ProductType, ProductConnectionType } from "./types";
export { productQueries } from "./queries";

// Side-effect registration
import "./types";
import "./queries";
```

5. **Register in schema.ts**: Add domain import

```typescript
// packages/frameworks/src/graphql/schema.ts
import "./types/user";
import "./types/event";
// Add new domain:
import "./types/product";
```

6. **Export from types/index.ts**: Add barrel export

```typescript
// packages/frameworks/src/graphql/types/index.ts
export * from "./user";
export * from "./event";
// Add new domain:
export * from "./product";
```

### Key Patterns

- **Type definition**: Use `builder.node()` with Relay plugin for global IDs
- **Connections**: Use `builder.connection()` for paginated lists
- **Authorization**: Use Scope Auth plugin with `authScopes: { authenticated: true }`
- **Error handling**: Use `mapDomainErrorToGraphQL()` in resolvers
- **Controller access**: Access via `ctx.controllers.{domain}Controller`
- **Pagination**: Use `clampFirst()` and `decodeCursorWithDate()` for Relay pagination

---

## Troubleshooting

### Effect runtime errors

- **Validate:** Ensure all Layers are provided before calling `Effect.runPromise`
- **Fix:** Add missing `Layer.provide()` calls in composition chain

### Controller access failures

- **Validate:** Check controller is accessed via `ctx.controllers.controllerName`
- **Fix:** Ensure context factory properly instantiates all controllers

### Scope violations

- **Validate:** Repositories are SINGLETON, Controllers are SCOPED
- **Fix:** Adjust Lifetime in Layer definitions

---

## Deep Reference

For comprehensive framework patterns, see **CLAUDE.md**:

- **§5.4:** Frameworks Layer — Layer composition, DI integration, awilix-modular patterns
- **§10.4:** Layer Composition and DI Integration — Effect + awilix-modular integration
- **§10.7:** Effect Pattern Quick Reference — Running Effects with runPromise
- **§11:** Summary of Architectural Guarantees

---

**Last Updated:** 2026-04-17  
**Version:** 1.2.0 (Updated DI Layer patterns - Effect Layer composition with type inference, no unsafe casts, proper gateway discovery)
