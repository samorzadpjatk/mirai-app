# Pothos Schema Organization Design

> **Unified GraphQL schema with modular domain organization**
>
> Created: 2026-04-16
> Status: Validated and ready for implementation

---

## 1. Architecture Overview

The goal is a **single Pothos schema** that serves all apps, with modular organization across the Clean Architecture layers.

**Current State:**

- Pothos types scattered in `packages/frameworks/src/graphql/types/` (user.ts, event.ts, sponsor.ts, etc.)
- Apps use urql hooks from `packages/graphql-client/src/generated/`
- Backend-server has a `generate:sdl` script to output schema.graphql

**Proposed Structure:**

```
packages/frameworks/src/graphql/
├── builder.ts          # Shared Pothos builder (already exists)
├── index.ts            # Re-exports (already exists)
├── schema.ts           # Schema assembly point (NEW)
├── schema-output.ts    # SDL generation (already exists)
└── types/
    ├── user/           # User domain types
    │   ├── index.ts    # Exports all user types
    │   ├── types.ts    # Object types, scalars
    │   ├── queries.ts  # Query fields
    │   ├── mutations.ts # Mutation fields
    │   └── subscriptions.ts # Real-time subscriptions
    ├── event/          # Event domain types
    └── ...             # Other domains
```

**Key Principle:** Types import from their respective packages (`@mirai-app/domain`, `@mirai-app/use-cases`) to keep the schema synchronized with business logic. No schema code lives in apps - they only consume generated urql hooks.

---

## 2. Package Module Structure

Each domain gets its own directory under `types/` with a consistent internal structure that includes **subscriptions** and leverages all configured Pothos plugins:

**Directory Pattern:**

```typescript
// packages/frameworks/src/graphql/types/user/index.ts
export * from "./types.js";
export * from "./queries.js";
export * from "./mutations.js";
export * from "./subscriptions.js";

// Side-effect: registers types with builder when imported
import "./types.js";
import "./queries.js";
import "./mutations.js";
import "./subscriptions.js";
```

**Plugin Integration in Each Module:**

- **`types.ts`** - Uses **Relay plugin** (`nodeInterface`) and **DataLoader plugin** (`t.loadable`)

  ```typescript
  import { builder } from "../../builder.js";

  // Relay: Automatic global IDs and Node interface
  builder.objectType("User", {
    interfaces: [builder.nodeInterface],
    isTypeOf: (obj) => obj.__typename === "User",
    fields: (t) => ({
      id: t.exposeID("id"),
      email: t.exposeString("email"),
    }),
  });

  // DataLoader: Batch loading for relationships
  builder.objectType("User", {
    fields: (t) => ({
      trips: t.loadable({
        type: ["Trip"],
        // ... DataLoader config from plugin
      }),
    }),
  });
  ```

- **`queries.ts`** & **`mutations.ts`** - Uses **Scope Auth plugin** for authorization

  ```typescript
  builder.queryType({
    fields: (t) => ({
      user: t.field({
        type: "User",
        authScopes: { authenticated: true }, // Scope auth
        resolve: async (_parent, args, ctx) => {
          const result = await ctx.controllers.userController.getById({
            id: args.id,
          });
          // ... error handling
          return result.data;
        },
      }),
    }),
  });
  ```

- **`subscriptions.ts`** - Real-time subscriptions using `graphql-ws`
  ```typescript
  builder.subscriptionType({
    fields: (t) => ({
      userUpdated: t.field({
        type: "User",
        args: { userId: t.arg.id({ required: true }) },
        subscribe: async function* (_parent, args, ctx) {
          for await (const user of ctx.subscriptions.userUpdates(args.userId)) {
            yield user;
          }
        },
      }),
    }),
  });
  ```

**Migration Strategy:** Move existing flat files (`user.ts`, `event.ts`) into structured directories incrementally. The existing skill `graphql-pothos-migration` can help with this refactoring.

---

## 3. Schema Assembly and Generation

The unified schema is assembled in a central location and made available to all apps through the codegen pipeline:

**Schema Assembly Point:**

```typescript
// packages/frameworks/src/graphql/schema.ts
import { builder } from "./builder.js";

// Import all domain modules (side-effect registration)
import "./types/user/index.js";
import "./types/event/index.js";
import "./types/sponsor/index.js";
// ... other domains

// Export the complete schema
export const schema = builder.toSchema();
```

**Schema Generation Script:**

```typescript
// packages/frameworks/src/graphql/generate-schema.ts
import { schema } from "./schema.js";
import { generateSchemaFile } from "./schema-output.js";

const outputPath = await generateSchemaFile(
  schema,
  "../../graphql-client/src/generated/graphql",
);
console.log(`Schema written to: ${outputPath}`);
```

**Package.json Script:**

```json
{
  "scripts": {
    "generate:sdl": "bun src/graphql/generate-schema.ts"
  }
}
```

**Workflow:**

1. Developer adds/modifies Pothos types in `packages/frameworks/src/graphql/types/`
2. Run `bun run generate:sdl` in frameworks package
3. Schema outputs to `packages/graphql-client/src/generated/graphql/schema.graphql`
4. Codegen generates urql hooks from SDL
5. Apps import hooks from `@mirai-app/graphql-client`

**Key Point:** Apps never import the Pothos schema directly - they only consume generated urql hooks. The schema is a build-time artifact for the monorepo.

---

## 4. Error Handling and Testing

Consistent error patterns and comprehensive testing ensure schema reliability across all apps:

**Error Handling:**

Domain errors from `@mirai-app/use-cases` are mapped to GraphQL errors using the existing utilities:

```typescript
// In query/mutation resolvers
import { mapDomainErrorToGraphQL } from "../errors.js";

resolve: async (_parent, args, ctx) => {
  const result = await ctx.controllers.userController.getById({ id: args.id });
  if (!result.success) {
    throw mapDomainErrorToGraphQL(result.error);
  }
  return result.data;
};
```

**Testing Strategy:**

Each domain module gets co-located tests:

```
types/user/
├── index.ts
├── types.ts
├── queries.ts
├── mutations.ts
├── subscriptions.ts
└── __tests__/
    ├── types.test.ts      # Type definition tests
    ├── queries.test.ts    # Query resolver tests
    └── mutations.test.ts  # Mutation resolver tests
```

**Test Patterns:**

- **Unit tests** for type definitions using `builder.toSchema()` to verify schema structure
- **Integration tests** with mocked controllers to verify resolver behavior
- **Auth scope tests** for permission verification using the Scope Auth plugin

**Effect Integration:**
Resolvers that return Effect types are handled at the boundary:

```typescript
resolve: async (_parent, args, ctx) => {
  const effect = ctx.controllers.userController.getById({ id: args.id });
  return await Effect.runPromise(effect);
};
```

**CI/CD Integration:**

- Schema generation runs in pre-commit hooks
- Breaking schema changes block CI until codegen is re-run
- Schema diffing alerts teams to downstream impacts

---

## 5. Implementation Phases

### Phase 1: Foundation

- Create `schema.ts` assembly point
- Move one domain (user) to new structure as proof of concept
- Add tests for user domain

### Phase 2: Migration

- Migrate remaining domains (event, sponsor, notification, etc.)
- Update imports in all affected files
- Verify schema output remains unchanged

### Phase 3: Validation

- Run full test suite
- Verify all apps build and work correctly
- Update AGENTS.md documentation

### Phase 4: Cleanup

- Remove old flat files
- Finalize directory structure
- Add CI checks for schema generation

---

## References

- [AGENTS.md](../../../AGENTS.md) - Universal conventions
- [packages/frameworks/AGENTS.md](../../../packages/frameworks/AGENTS.md) - Framework layer patterns
- [Skill: graphql-pothos-migration](../../../.claude/skills/graphql-pothos-migration/SKILL.md) - Migration patterns
- [Skill: graphql-subscriptions-urql](../../../.claude/skills/graphql-subscriptions-urql/SKILL.md) - Subscription patterns
