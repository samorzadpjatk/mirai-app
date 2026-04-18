# =============================================================================
# GraphQL GQL Files
# =============================================================================

This directory contains all GraphQL operations (.gql/.graphql files) used by the application.
These files serve as the foundation for graphql-code-generator to create typed urql hooks.

## Directory Structure

```
gql/
├── fragments/           # Reusable GraphQL fragments
│   ├── user.graphql
│   ├── trip.graphql
│   ├── group.graphql
│   ├── challenge.graphql
│   ├── submission.graphql
│   ├── notification.graphql
│   ├── activity.graphql
│   ├── storage.graphql
│   └── pagination.graphql
├── operations/          # Queries and mutations by domain
│   ├── user/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── trip/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── group/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── challenge/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── submission/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── notification/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── activity/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── reward/
│   │   ├── queries.graphql
│   │   └── mutations.graphql
│   ├── coin/
│   │   └── queries.graphql
│   └── storage/
│       ├── queries.graphql
│       └── mutations.graphql
└── subscriptions/       # Real-time subscriptions
    ├── location.graphql
    ├── notification.graphql
    ├── activity.graphql
    ├── challenge.graphql
    ├── ranking.graphql
    ├── submission.graphql
    └── joinRequest.graphql
```

## Fragment Imports

Use `#import` directives to include fragments:

```graphql
#import "../../fragments/user.graphql"

query Me {
  me {
    ...UserProfileFields
  }
}
```

## Regeneration

To regenerate TypeScript types and urql hooks from these files:

```bash
bun run --filter=@mirai-app/frameworks sync:schema
```

This will:
1. Generate `schema.graphql` from the Pothos schema
2. Generate TypeScript types and urql hooks in `client/generated/`

## Usage in Apps

Apps should use the generated hooks:

```typescript
import { useGetUserQuery } from "@mirai-app/frameworks/graphql/client";

function UserProfile({ userId }: { userId: string }) {
  const [{ data, fetching, error }] = useGetUserQuery({
    variables: { id: userId }
  });

  if (fetching) return <Loading />;
  if (error) return <Error error={error} />;
  if (!data?.user) return <NotFound />;

  return <UserCard user={data.user} />;
}
```

## Adding New Operations

1. Create or edit the appropriate `.graphql` file
2. Use fragments for reusable field selections
3. Run `bun run --filter=@mirai-app/frameworks sync:schema`
4. Use the newly generated hook in your app

## Best Practices

- **Use fragments** for field sets that appear in multiple operations
- **Group by domain** (user, trip, group, etc.)
- **Name consistently**: PascalCase for operations (e.g., `GetUser`, `CreateTrip`)
- **Keep co-located**: Queries and mutations should be in their domain folder
- **Add to index**: When adding new domains, update the directory structure above
