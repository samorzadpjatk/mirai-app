# GraphQL Pothos Migration

## Project: migrate-inline-graphql-queries-pothos

### Date: 2026-04-15

---

## Task Context

Migrate 30+ inline GraphQL queries scattered across:

- `apps/web/`
- `apps/native/`
- `apps/seed/`

**Target Workflow:**

1. Define schema in Pothos (apps/backend-server/src/graphql/)
2. Sync schema to packages/graphql-client/src/generated/graphql/schema.graphql
3. Define operations in .graphql files (packages/graphql-client/src/generated/graphql/operations/)
4. Run codegen to generate typed urql hooks (packages/graphql-client/src/generated/urql.ts)
5. Import generated hooks from `@mirai-app/graphql-client`

---

## Research Findings

### Technology Stack

**Backend:**

- Pothos (code-first schema builder)
  - @pothos/core
  - @pothos/plugin-scope-auth (field-level authorization)
  - @pothos/plugin-dataloader (N+1 optimization)
  - @pothos/plugin-relay (cursor pagination)
- graphql-yoga (GraphQL server)
- Effect framework for orchestration

**Frontend:**

- urql (GraphQL client with subscription support)
- GraphQL Code Generator (typescript-urql plugin)

**Code Generation:**

```typescript
// packages/graphql-client/codegen.ts
const config: CodegenConfig = {
  schema: "src/generated/graphql/schema.graphql",
  documents: "src/generated/graphql/**/*.graphql",
  generates: {
    "src/generated/urql.ts": {
      plugins: ["typescript-urql"],
      config: { withSubscription: true },
    },
  },
};
```

---

## Discovered Inline Queries (Sample)

### apps/native/src/stores/judgement/useJudgement.ts (Line 14-22)

```typescript
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

**Status:** ❌ Inline - needs migration to .graphql file

### apps/seed/src/graphql-executor.ts (Lines 111-140, 146-172, 174-181, etc.)

Multiple inline mutations:

- `UpsertTripDocument`
- `UpsertUserDocument`
- `FindUserByAuthIdDocument`
- `AddTripParticipantDocument`
- `CreateSponsorDocument`
- `FindSponsorByNameDocument`
- `LinkSponsorToTripDocument`
- `CreateRewardDocument`
- `ClearTripResourcesDocument`
- `CreateTripResourceDocument`
- `ClearTripInsuranceDocument`
- `CreateTripInsuranceDocument`
- `CreateInsuranceStepDocument`

**Status:** ❌ All inline - need migration

### apps/web/src/hooks/useWebFileUpload.ts (Line 126-138)

```typescript
mutation CreateUploadUrl($input: CreateUploadUrlInput!) { ... }
query CreateDownloadUrl($input: CreateDownloadUrlInput!) { ... }
```

**Status:** ❌ Inline - needs migration

---

## Migration Pattern

### Step 1: Create/Update Pothos Type (if needed)

File: `apps/backend-server/src/graphql/types/challenge.ts`

```typescript
builder.objectType("Challenge", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    scoringCategory: t.exposeString("scoringCategory"),
  }),
});
```

### Step 2: Add to Query/Mutation Types

File: `apps/backend-server/src/graphql/types/Query.ts`

```typescript
builder.queryField("challenge", (t) =>
  t.field({
    type: "Challenge",
    args: {
      id: t.arg.id({ required: true }),
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (parent, args, context) => {
      // Use Effect-based resolver pattern
    },
  }),
);
```

### Step 3: Sync Schema

```bash
cd apps/backend-server
bun run sync-schema  # Outputs schema.graphql
```

### Step 4: Create .graphql Operation File

File: `packages/graphql-client/src/generated/graphql/operations/challenge.operations.graphql`

```graphql
query GetChallenge($id: ID!, $tripId: ID!) {
  challenge(id: $id, tripId: $tripId) {
    ...ChallengeFields
  }
}

fragment ChallengeFields on Challenge {
  id
  name
  scoringCategory
}
```

### Step 5: Regenerate Client

```bash
cd packages/graphql-client
bun run codegen
```

### Step 6: Update Consumer Code

**Before:**

```typescript
// apps/native/src/stores/judgement/useJudgement.ts
const GetChallengeDocument = `
  query GetChallenge($id: ID!, $tripId: ID!) {
    challenge(id: $id, tripId: $tripId) { ... }
  }
`;
const [{ data }] = useQuery({ query: GetChallengeDocument, ... });
```

**After:**

```typescript
import { useGetChallengeQuery } from "@mirai-app/graphql-client";
const [{ data }] = useGetChallengeQuery({ variables: { id, tripId } });
```

---

## Key Pothos Patterns in This Project

### 1. Effect-based Resolvers

```typescript
import { Effect } from "effect";

builder.queryField("challenge", (t) =>
  t.field({
    type: "Challenge",
    args: { ... },
    resolve: async (parent, args, context) => {
      const { controllers, runtime } = context;

      const effect = Effect.gen(function* () {
        const result = yield* controllers.challengeController.getById({
          id: args.id,
          tripId: args.tripId,
        });

        if (!result.success) {
          yield* Effect.fail(new Error(result.error));
        }

        return result.data;
      });

      return await Effect.runPromise(effect);
    },
  })
);
```

### 2. Auth Scopes Pattern

```typescript
builder.queryField("adminOnlyField", (t) =>
  t.field({
    type: "SomeType",
    authScopes: { admin: true },  // Requires admin scope
    resolve: async () => { ... },
  })
);
```

### 3. Type Mapping from Domain DTOs

See `apps/backend-server/src/graphql/builder.ts` lines 91-927:

```typescript
export interface PothosTypes {
  Context: { ... };
  AuthScopes: { ... };
  Objects: {
    User: GetUserOutput;
    Challenge: GetChallengeOutput;
    // ... mapped from use case DTOs
  };
}
```

---

## Critical Rules

**⚠️ NEVER:**

- Edit files in `packages/graphql-client/src/generated/` (except .graphql files)
- Mix inline queries with generated hooks
- Bypass the Pothos → Codegen workflow

**✅ ALWAYS:**

- Define schema in Pothos first
- Use fragments for reusable field selections
- Import hooks from `@mirai-app/graphql-client`
- Run `bun test` after migration

---

## Resources

### Pothos Documentation

- https://pothos-graphql.dev/docs/guide
- https://pothos-graphql.dev/docs/guide/subscriptions
- https://pothos-graphql.dev/docs/guide/dataloader

### GraphQL Code Generator

- https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-urql

### Project References

- Builder: `apps/backend-server/src/graphql/builder.ts`
- Schema: `apps/backend-server/src/graphql/schema.ts`
- Operations: `packages/graphql-client/src/generated/graphql/operations/`
- Subscriptions Skill: `.claude/skills/graphql-subscriptions-urql/SKILL.md`

---

## Scratchpad Notes

_Add research notes here as migration progresses..._
