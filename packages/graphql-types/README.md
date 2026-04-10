# GraphQL Types Package

TypeScript type definitions and React Query hooks generated from GraphQL schema and operations for the Mirai App.

## Installation

```bash
bun add @mirai-app/graphql-types
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
- `src/generated/graphql.ts` - Auto-generated TypeScript types and React Query hooks

## Building

```bash
bun run build
```
