# GraphQL Schema Extensions

## Overview

Patterns and best practices for extending GraphQL schemas using Pothos builder in the Mirai App codebase.

## When to Use

Use this skill when:

- Adding new GraphQL types (object types, input types, enums)
- Implementing new queries or mutations
- Adding pagination support (offset or cursor-based)
- Integrating Supabase Auth fields into GraphQL types
- Creating urql client operations for React Native

## Patterns

### 1. Object Type Definition

```typescript
export const TypeName = builder.objectType("TypeName", {
  description: "Clear description of the type",
  authScopes: { public: true }, // or authenticated: true, admin: true, etc.
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique identifier", nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    optional: t.exposeString("optional", { nullable: true }),
    computed: t.boolean({
      nullable: false,
      resolve: (parent) => parent.isActive,
    }),
  }),
});
```

### 2. Input Type Definition

```typescript
export const InputType = builder.inputType("InputType", {
  description: "Input description",
  fields: (t) => ({
    id: t.id({ description: "...", required: true }),
    name: t.string({ required: true }),
    optional: t.string({ required: false }),
    defaultValue: t.int({ required: false, defaultValue: 30 }),
  }),
});
```

### 3. Query Field Pattern

```typescript
builder.queryField("queryName", (t) =>
  t.field({
    description: "Query description",
    type: "ReturnType",
    nullable: true, // or false
    args: {
      id: t.arg.id({ description: "...", required: true }),
    },
    authScopes: { authenticated: true },
    resolve: async (_root, args, context) => {
      await requireAuth(context);
      const controller =
        context.container.resolve<Controller>("controllerName");
      const result = await controller.getById({ id: args.id });
      if (!result.success) {
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }
      return result.data;
    },
  }),
);
```

### 4. Mutation Field Pattern

```typescript
builder.mutationField("mutationName", (t) =>
  t.field({
    description: "Mutation description",
    type: "PayloadType",
    nullable: false,
    args: {
      input: t.arg({ type: "InputType", required: true }),
    },
    authScopes: { authenticated: true }, // or moderator: true, admin: true
    resolve: async (_root, args, context) => {
      const authContext = await requireAuth(context);
      const controller =
        context.container.resolve<Controller>("controllerName");
      const result = await controller.action({ ...args.input });
      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }
      return { success: true, data: result.data };
    },
  }),
);
```

### 5. Cursor-Based Pagination

The codebase uses @pothos/plugin-relay configured in builder.ts:

```typescript
// Encode cursor: base64(JSON.stringify({ id, sortField }))
const encodeCursor = (item: Item): string => {
  return Buffer.from(
    JSON.stringify({
      id: item.id,
      createdAt: item.createdAt.toISOString(),
    }),
  ).toString("base64");
};

// Decode cursor
const decodeCursor = (cursor: string): Cursor => {
  return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
};
```

GraphQL Connection types:

```graphql
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type ItemEdge {
  node: Item!
  cursor: String!
}

type ItemConnection {
  edges: [ItemEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

### 6. Supabase Auth Integration

For adding email verification or other auth fields:

```typescript
emailVerified: t.boolean({
  description: "Whether user's email is verified",
  nullable: false,
  resolve: async (user, _args, context) => {
    const authService = context.container.resolve<AuthService>("authService");
    const authUser = await authService.getUserById(user.authUserId);
    return authUser?.email_confirmed_at != null;
  },
}),
```

### 7. urql Client Patterns (React Native)

Mutation hook:

```typescript
import { useMutation, useClient } from "urql";

export function useAction() {
  const client = useClient();
  const [, executeMutation] = useMutation(MutationDocument);

  const execute = async (input: InputType) => {
    const result = await executeMutation({ input });
    if (result.error) {
      throw result.error;
    }
    // Invalidate related queries
    client.invalidate(QueryDocument, { id: input.id });
    return result.data;
  };

  return { execute };
}
```

## References

- [Pothos Documentation](https://pothos-graphql.dev/)
- [Relay Cursor Connections Spec](https://relay.dev/graphql/connections.htm)
- [urql Documentation](https://formidable.com/open-source/urql/docs/)
