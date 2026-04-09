# Hono + GraphQL + Pothos Migration

Enable type-safe API access for Python, Go, Swift, and other languages while preserving Clean Architecture and existing business logic.

## Constraints

- Keep existing use cases unchanged
- Preserve Clean Architecture (Domain → Use Cases → Adapters → Frameworks)
- Run tRPC and GraphQL concurrently during transition (Strangler Fig)
- Generate SDL schema for polyglot client codegen

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Web (React) │  │  Native (RN) │  │ Python Utils │  │   Go Micro   │ │
│  │  (Pothos gen │  │  (Pothos gen │  │  (gen from  │  │  (gen from  │ │
│  │   types)     │  │   types)     │  │   SDL)       │  │   SDL)       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │                 │        │
│         └─────────────────┴──────────────────┘                 │        │
│                           │                                    │        │
│                           ▼                                    │        │
│                    ┌─────────────┐                             │        │
│                    │  GraphQL    │◄─────────────────────────────┘        │
│                    │  Endpoint   │   (port 4000)                        │
│                    │  /graphql   │                                      │
│                    └──────┬──────┘                                      │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Hono + GraphQL Yoga                            │  │
│  │  ┌───────────────────────────────────────────────────────────┐   │  │
│  │  │  Pothos Schema Builder (code-first)                        │   │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │   │  │
│  │  │  │  User   │ │  Trip   │ │ Challenge│ │  (more domains)  │  │   │  │
│  │  │  │  Types  │ │  Types  │ │  Types  │ │                 │  │   │  │
│  │  │  └────┬────┘ └────┬────┘ └────┬────┘ └─────────────────┘  │   │  │
│  │  │       │           │           │                           │   │  │
│  │  │       └───────────┴───────────┴───────────────────────────┘   │  │
│  │  │                         │                                       │  │
│  │  │                         ▼                                       │  │
│  │  │              ┌─────────────────────┐                            │  │
│  │  │              │  Schema Generation  │──► schema.graphql (SDL)   │  │
│  │  │              │  (graphql-codegen)  │    for docs/clients       │  │
│  │  │              └─────────────────────┘                            │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    USE CASE LAYER (unchanged)                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Resolvers call existing use cases via DI container (awilix)        │  │
│  │                                                                   │  │
│  │  userQuery.ts ──────► GetUserByIdUseCase                          │  │
│  │  createTrip.ts ─────► CreateTripUseCase                           │  │
│  │  voteChallenge.ts ──► SubmitChallengeVoteUseCase                   │  │
│  │                                                                   │  │
│  │  No business logic changes. Zero.                                  │  │
│  │  Use cases already return Result<T,E> — perfect for GraphQL errors  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LEGACY ENDPOINT (during transition)                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Fastify + tRPC (port 3000)                                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                             │  │
│  │  │  User   │ │  Trip   │ │ Challenge│  ... (existing routers)     │  │
│  │  │ Router  │ │ Router  │ │ Router   │                             │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘                             │  │
│  │       └───────────┴───────────┴──────► Same use cases             │  │
│  │                                                                   │  │
│  │  Stays alive until all clients migrated. Same use cases,          │  │
│  │  same business logic, same everything.                             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Package Structure

```
packages/adapters/src/
├── controllers/                    # All controllers
│   ├── trpc/                       # tRPC procedures
│   │   ├── user-controller.ts
│   │   ├── trip-controller.ts
│   │   ├── challenge-controller.ts
│   │   └── index.ts
│   │
│   └── graphql/                    # GraphQL resolvers
│       ├── builder.ts              # Pothos SchemaBuilder
│       ├── index.ts                # Schema composition
│       └── domains/
│           ├── user/
│           │   ├── types.ts
│           │   ├── queries.ts
│           │   ├── mutations.ts
│           │   └── index.ts
│           ├── trip/
│           ├── challenge/
│           └── ...
│
├── api/
│   └── routers/                    # tRPC routers
│       ├── user.ts
│       ├── trip.ts
│       └── ...
│
└── graphql-codegen/
    └── generate-sdl.ts

packages/frameworks/src/
├── trpc/
├── hono/                           # NEW
│   ├── server.ts                   # Hono + Yoga
│   └── context.ts
├── prisma/
├── supabase/
└── di/

graphql-sdl/
└── schema.graphql                  # Generated SDL
```

## Resolver Pattern

```typescript
// packages/adapters/src/controllers/graphql/domains/user/queries.ts

builder.queryField("getUser", (t) =>
  t.field({
    type: UserType,
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const authContext = await requireAuth(ctx.headers, ctx.container);
      const useCase =
        ctx.container.resolve<GetUserByIdUseCase>("getUserByIdUseCase");
      const result = await useCase.execute({
        userId: args.id,
        authContext,
      });

      if (result.kind === "ok") {
        return result.value;
      }

      throw mapResultToGraphQLError(result.error);
    },
  }),
);
```

## Error Mapping

```typescript
// packages/adapters/src/controllers/graphql/error-mapper.ts

export function mapResultToGraphQLError<T, E extends Error>(
  result: Result<T, E>,
): never {
  if (result.kind === "ok") {
    throw new Error("mapResultToGraphQLError called on ok result");
  }

  const error = result.error;
  const errorCodeMap: Record<string, string> = {
    ValidationError: "VALIDATION_ERROR",
    UserNotFoundError: "USER_NOT_FOUND",
    UserAlreadyExistsError: "USER_ALREADY_EXISTS",
    AuthenticationError: "UNAUTHENTICATED",
    AuthorizationError: "FORBIDDEN",
    EntityNotFoundError: "NOT_FOUND",
  };

  throw new GraphQLError(error.message, {
    extensions: {
      code: errorCodeMap[error.constructor.name] || "INTERNAL_ERROR",
      errorType: error.constructor.name,
    },
  });
}
```

## SDL Generation

```typescript
// packages/adapters/src/controllers/graphql/generate-sdl.ts

import { printSchema } from "graphql";
import { schema } from "./index";
import * as fs from "fs";
import * as path from "path";

const sdl = printSchema(schema);
const outputPath = path.join(
  __dirname,
  "../../../../graphql-sdl/schema.graphql",
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sdl);
console.log(`Generated ${outputPath}`);
```

## Dependencies

```json
// packages/adapters/package.json
{
  "dependencies": {
    "@pothos/core": "^3.41.0",
    "@pothos/plugin-scope-auth": "^3.19.0",
    "graphql": "^16.8.1"
  }
}

// packages/frameworks/package.json
{
  "dependencies": {
    "graphql-yoga": "^5.1.1",
    "hono": "^3.12.0",
    "@hono/node-server": "^1.8.0"
  }
}
```

## Migration

| Phase         | Duration  | Tasks                                                                               |
| ------------- | --------- | ----------------------------------------------------------------------------------- |
| **Bootstrap** | Week 1    | Create GraphQL controllers structure, set up Hono server, migrate User domain first |
| **Parallel**  | Weeks 2-3 | Migrate remaining domains one by one; tRPC + GraphQL coexist                        |
| **External**  | Week 4    | Generate schema.graphql; Python/Go/Swift teams create SDKs                          |
| **Deprecate** | Future    | Mark tRPC deprecated; migrate remaining native clients; remove tRPC                 |

## Testing

- Domain tests: No changes (pure logic)
- Use case tests: No changes (same interactors)
- GraphQL resolver tests: Integration tests in `adapters/__tests__/graphql/`

## CI Validation

```yaml
# .github/workflows/graphql.yml
- name: Validate schema is up-to-date
  run: |
    bun run generate:schema
    git diff --exit-code graphql-sdl/schema.graphql || (echo "Schema out of sync!" && exit 1)
```

## Decisions

1. Keep tRPC controllers during transition
2. Place GraphQL resolvers in `controllers/` alongside tRPC
3. Keep GraphQL as adapter concern (no new package)
4. Generate SDL only — polyglot teams handle their own client codegen
5. Leave use cases unchanged — resolvers map `Result<T,E>` to GraphQL errors

## Success Criteria

- [ ] Pothos generates schema.graphql
- [ ] GraphQL endpoints return identical data to tRPC
- [ ] All existing tests pass
- [ ] Python/Go/Swift teams generate clients from schema.graphql
- [ ] tRPC remains functional during transition
