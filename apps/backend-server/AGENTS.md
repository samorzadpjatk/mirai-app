# Backend Server — Quick Reference

> **Agent instructions for apps/backend-server/**
>
> For universal conventions, see root `AGENTS.md`.
> For comprehensive DI and auth patterns, see `../packages/adapters/AGENTS.md`.

---

## GraphQL Workflow

**GraphQL workflow:** Never edit generated GraphQL clients, types, or operations. Only edit Pothos schema files, then sync schema, then regenerate client.

Note: The backend now uses GraphQL (Pothos schema-first). See `@mirai-app/api-graphql` for schema definitions.

---

## GraphQL Resolver Patterns

### Controller Resolution in Resolvers

Resolvers use controllers from the context. No auth in middleware.

```ts
export const userResolvers = {
  Query: {
    user: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      // Access controller from context
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

### Resolver Template

```ts
import { GraphQLError } from "graphql";

export const featureResolvers = {
  Query: {
    features: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      const controller = ctx.controllers.featureController;
      const result = await controller.list();
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  },

  Mutation: {
    createFeature: async (
      _parent: unknown,
      args: { input: { name: string } },
      ctx: GraphQLContext,
    ) => {
      const controller = ctx.controllers.featureController;
      const result = await controller.create(args.input);
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  },
};
```

---

## Auth Flow

### Using requireAuth in Controllers

Auth happens in controllers using helper functions from `@mirai-app/adapters`:

```ts
import { requireAuth, requireAdmin, getOptionalAuth }
  from "@mirai-app/adapters";

async getById(input: GetByIdInput, di: DIContext) {
  // Throws GraphQLError if missing/invalid
  const authContext = await requireAuth(di.headers, di);

  // Now authContext.userId, authContext.role available
  return await this.useCase.execute({ ...input, authContext });
}

// Admin-only endpoints:
async adminAction(input: AdminInput, di: DIContext) {
  const authContext = await requireAdmin(di.headers, di);
  // ...
}
```

---

## Testing

Backend-server tests live in `src/__tests__/` and test integration of GraphQL + DI + auth.

---

## Deep Reference

For comprehensive backend patterns:

- See `../packages/adapters/AGENTS.md` for DI and auth patterns
- `CLAUDE.md` §5.5: Authentication & Authorization patterns
- `CLAUDE.md` §10.3: Error conversion at boundaries
- `CLAUDE.md` §10.7: Running Effects with runPromise
