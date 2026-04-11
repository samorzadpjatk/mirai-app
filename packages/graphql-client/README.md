# GraphQL Client Package

TypeScript type definitions and React Query hooks generated from GraphQL schema and operations for the Mirai App.

## Installation

```bash
bun add @mirai-app/graphql-client
```

## Usage

Generate types from GraphQL schema and operation files:

```bash
bun run generate
```

Watch for changes and regenerate automatically:

```bash
bun run generate:watch
```

## Structure

- `src/graphql/schema.graphql` - GraphQL schema definition
- `src/graphql/operations/` - GraphQL query/mutation/subscription files
- `src/graphql/fragments/` - Reusable GraphQL fragments
- `src/generated/urql.ts` - Auto-generated TypeScript types and urql hooks

## Building

```bash
bun run build
```
