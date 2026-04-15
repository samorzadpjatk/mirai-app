---
name: graphql-pothos-migration
description: Guide for migrating inline GraphQL queries to Pothos schema with Codegen workflow
tags: [graphql, pothos, codegen, migration, urql]
---

# GraphQL Pothos Migration Guide

> **CRITICAL RULE:** Never edit generated GraphQL clients, types, or operations in `packages/graphql-client/src/generated/` (except `.graphql` files). Only edit Pothos schema files, then sync schema, then regenerate client.

## Overview

This skill provides step-by-step guidance for migrating inline GraphQL queries (template literal strings in TypeScript files) to the proper Pothos → Code Generator workflow.

### Why Migrate?

| Inline Queries        | Pothos + Codegen              |
| --------------------- | ----------------------------- |
| No type safety        | Full TypeScript inference     |
| Manual field tracking | Fragments auto-update         |
| Hard to maintain      | Centralized schema management |
| No IDE autocomplete   | Full autocomplete support     |

---

## Migration Workflow

### Step 1: Analyze the Inline Query

**Example target:**

```typescript
// apps/native/src/stores/judgement/useJudgement.ts
const GetChallengeDocument = `
  query GetChallenge($id: ID!, $tripId: ID!) {
    challenge(id: $id, tripId: $tripId) {
      id
      name
      scoringCategory
    }
  }
`;
```

**Questions to answer:**

1. Does the query field (`challenge`) exist in the Pothos schema?
2. Does the return type have a corresponding Pothos object type?
3. Are all requested fields (`id`, `name`, `scoringCategory`) defined?

### Step 2: Check/Create Pothos Schema

**File:** `apps/backend-server/src/graphql/types/challenge.ts`

```typescript
import { builder } from "../builder";

// 1. Define the object type (if not exists)
builder.objectType("Challenge", {
  description: "A challenge in a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    scoringCategory: t.exposeString("scoringCategory"),
  }),
});

// 2. Add query field (if not exists)
export const ChallengeQueryFields = {
  challenge: builder.queryField("challenge", (t) =>
    t.field({
      type: "Challenge",
      args: {
        id: t.arg.id({ required: true }),
        tripId: t.arg.id({ required: true }),
      },
      resolve: async (parent, args, context) => {
        // Use Effect-based resolver (see patterns below)
        return await resolveChallenge(args, context);
      },
    }),
  ),
};
```

### Step 3: Update Type Mappings (if needed)

**File:** `apps/backend-server/src/graphql/builder.ts`

```typescript
export interface PothosTypes {
  Objects: {
    // Add mapping from domain DTO to GraphQL type
    Challenge: GetChallengeOutput; // From use-cases package
  };
}
```

### Step 4: Sync Schema

```bash
cd apps/backend-server
bun run sync-schema
```

This outputs to: `packages/graphql-client/src/generated/graphql/schema.graphql`

### Step 5: Create .graphql Operation

**File:** `packages/graphql-client/src/generated/graphql/operations/challenge.operations.graphql`

```graphql
# Use fragment for reusable field selection
fragment ChallengeFields on Challenge {
  id
  name
  scoringCategory
}

query GetChallenge($id: ID!, $tripId: ID!) {
  challenge(id: $id, tripId: $tripId) {
    ...ChallengeFields
  }
}
```

**Best practices:**

- Use fragments for fields that appear in multiple operations
- Name operations with PascalCase (e.g., `GetChallenge`, not `getChallenge`)
- Group related operations in the same file
- Keep fragments in `../fragments/` directory

### Step 6: Regenerate Client

```bash
cd packages/graphql-client
bun run codegen
```

This generates typed hooks in: `packages/graphql-client/src/generated/urql.ts`

### Step 7: Update Consumer Code

**Before:**

```typescript
const GetChallengeDocument = `
  query GetChallenge($id: ID!, $tripId: ID!) {
    challenge(id: $id, tripId: $tripId) { ... }
  }
`;

const [{ data }] = useQuery({
  query: GetChallengeDocument,
  variables: { id, tripId },
});
```

**After:**

```typescript
import { useGetChallengeQuery } from "@mirai-app/graphql-client";

const [{ data, fetching, error }] = useGetChallengeQuery({
  variables: { id, tripId },
  pause: !id || !tripId, // Conditional fetching
});

// data.challenge is fully typed!
const challenge = data?.challenge;
```

---

## Effect-based Resolver Patterns

### Basic Pattern

```typescript
import { Effect } from "effect";
import { mapErrorToGraphQLError } from "../utils/error-mapper";

async function resolveChallenge(
  args: { id: string; tripId: string },
  context: Context,
) {
  const { controllers, runtime } = context;

  const effect = Effect.gen(function* () {
    // Call controller method
    const result = yield* controllers.challengeController.getById({
      id: args.id,
      tripId: args.tripId,
    });

    // Handle error cases
    if (!result.success) {
      yield* Effect.fail(
        new Data.TaggedError("ChallengeNotFound")({
          message: result.error,
        }),
      );
    }

    return result.data;
  });

  // Run and catch errors
  const result = await Effect.runPromise(
    effect.pipe(Effect.catchAll(mapErrorToGraphQLError)),
  );

  return result;
}
```

### With DataLoader (N+1 Prevention)

```typescript
builder.objectType("Challenge", {
  fields: (t) => ({
    id: t.exposeID("id"),
    // Use dataloader for child resolvers
    submissions: t.field({
      type: ["ChallengeSubmission"],
      resolve: (challenge, _args, context) => {
        return context.loaders.submissionsByChallenge.load(challenge.id);
      },
    }),
  }),
});
```

### With Auth Scopes

```typescript
builder.queryField("adminChallenge", (t) =>
  t.field({
    type: "Challenge",
    args: { id: t.arg.id({ required: true }) },
    authScopes: { admin: true },  // Requires admin role
    resolve: async () => { ... },
  }),
);
```

---

## Common Mutation Pattern

### Pothos Schema

```typescript
// 1. Define input type
const CreateChallengeInput = builder.inputType("CreateChallengeInput", {
  fields: (t) => ({
    tripId: t.id({ required: true }),
    name: t.string({ required: true }),
    description: t.string(),
    scoringCategory: t.string({ required: true }),
  }),
});

// 2. Define output/payload type
builder.objectType("CreateChallengePayload", {
  fields: (t) => ({
    challenge: t.field({ type: "Challenge", nullable: true }),
    errors: t.field({ type: ["String"], nullable: true }),
  }),
});

// 3. Define mutation field
builder.mutationField("createChallenge", (t) =>
  t.field({
    type: "CreateChallengePayload",
    args: {
      input: t.arg({ type: CreateChallengeInput, required: true }),
    },
    resolve: async (parent, args, context) => {
      const { controllers } = context;

      const result = await Effect.runPromise(
        controllers.challengeController.create(args.input),
      );

      return result.success
        ? { challenge: result.data, errors: null }
        : { challenge: null, errors: [result.error] };
    },
  }),
);
```

### GraphQL Operation

```graphql
mutation CreateChallenge($input: CreateChallengeInput!) {
  createChallenge(input: $input) {
    challenge {
      ...ChallengeFields
    }
    errors
  }
}
```

### Consumer Usage

```typescript
import { useCreateChallengeMutation } from "@mirai-app/graphql-client";

const [, executeCreate] = useCreateChallengeMutation();

const result = await executeCreate({
  input: {
    tripId: "trip-123",
    name: "New Challenge",
    scoringCategory: "PHYSICAL",
  },
});

if (result.data?.createChallenge?.errors) {
  // Handle errors
}
```

---

## Fragment Patterns

### Defining Fragments

```graphql
# packages/graphql-client/src/generated/graphql/fragments/challenge.graphql

fragment ChallengeFields on Challenge {
  id
  name
  description
  scoringCategory
  createdAt
}

fragment ChallengeWithSubmissions on Challenge {
  ...ChallengeFields
  submissions {
    ...ChallengeSubmissionFields
  }
}
```

### Using Fragments in Operations

```graphql
#import "../fragments/challenge.graphql"
#import "../fragments/submission.graphql"

query GetChallengeWithSubmissions($id: ID!, $tripId: ID!) {
  challenge(id: $id, tripId: $tripId) {
    ...ChallengeWithSubmissions
  }
}
```

### Fragment Colocation (Alternative)

For component-specific fragments, colocate with component:

```typescript
// apps/native/src/components/ChallengeCard.tsx
import { graphql } from "@mirai-app/graphql-client";

const ChallengeCardFragment = graphql(`
  fragment ChallengeCard_challenge on Challenge {
    id
    name
    scoringCategory
  }
`);
```

---

## Migration Checklist

For each inline query being migrated:

- [ ] Query field exists in Pothos schema
- [ ] Return type mapped in `PothosTypes` interface
- [ ] All requested fields available on type
- [ ] Schema synced (`bun run sync-schema`)
- [ ] `.graphql` operation file created
- [ ] Fragments used for reusable fields
- [ ] Codegen run (`bun run codegen`)
- [ ] Consumer updated to use generated hook
- [ ] Types compile without errors
- [ ] Tests pass (`bun test`)

---

## Troubleshooting

### "Cannot find module '@mirai-app/graphql-client'"

Ensure package is built:

```bash
cd packages/graphql-client
bun run build
```

### "Property 'X' does not exist on type 'Y'"

The Pothos type doesn't have the field. Update the object type definition.

### "Field 'X' is not defined in the schema"

The query/mutation isn't defined in Pothos. Add it to the appropriate type file.

### "Fragment spread has no type condition"

Ensure the fragment is defined on the correct type and imported properly.

---

## Advanced Topics

### Handling Subscriptions

See companion skill: `graphql-subscriptions-urql`

### Pagination Patterns

```graphql
query GetChallenges($first: Int, $after: String) {
  challenges(first: $first, after: $after) {
    edges {
      node {
        ...ChallengeFields
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Error Handling with Effect

```typescript
const effect = Effect.gen(function* () {
  const result = yield* controller.method();

  if (!result.success) {
    yield* Effect.fail(
      new Data.TaggedError("DomainError")({
        code: result.errorCode,
        message: result.error,
      }),
    );
  }

  return result.data;
}).pipe(
  Effect.catchTag("DomainError", (error) =>
    Effect.succeed({
      data: null,
      errors: [{ code: error.code, message: error.message }],
    }),
  ),
);
```

---

## References

- **Pothos Docs:** https://pothos-graphql.dev/
- **Codegen urql plugin:** https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-urql
- **urql docs:** https://formidable.com/open-source/urql/docs/
- **Effect docs:** https://effect.website/

## Related Skills

- `graphql-subscriptions-urql` - Real-time GraphQL with WebSockets
- `sdd:implement` - Execute migration with automated quality gates
- `tdd:test-driven-development` - Write tests before migration
