# Codebase Impact Analysis: Reorganize Pothos Schemas

## Task Reference

- **Task**: Reorganize Pothos schemas in frameworks package with domain modules
- **Type**: Refactor
- **File**: `.specs/tasks/draft/reorganize-pothos-schemas.refactor.md`

## Current State Analysis

### Existing Type Files

| File                       | Lines | Types Defined                                          | Queries | Mutations |
| -------------------------- | ----- | ------------------------------------------------------ | ------- | --------- |
| `types/user.ts`            | 252   | User, UserEdge, UserConnection                         | 2       | 0         |
| `types/event.ts`           | 368   | Event, EventEdge, EventConnection                      | 4       | 0         |
| `types/sponsor.ts`         | 377   | Sponsor, TripSponsor, 4 types                          | 2       | 0         |
| `types/notification.ts`    | 269   | Notification, NotificationEdge, NotificationConnection | 2       | 0         |
| `types/coinTransaction.ts` | 245   | CoinTransaction, 3 embedded types, 2 edge/conn         | 1       | 0         |

### Current Architecture Patterns

1. **Builder Configuration**: Centralized in `builder.ts` with:
   - @pothos/plugin-relay (Relay pagination, Node interface)
   - @pothos/plugin-dataloader (N+1 prevention)
   - @pothos/plugin-scope-auth (authorization)
   - graphql-scalars (DateTime, EmailAddress, etc.)

2. **Type Registration**: All types use side-effect pattern via `builder.objectType()` and `builder.queryFields()`

3. **Query Organization**: Queries are co-located in type files using `builder.queryFields()`

4. **Connection Pattern**: Manual connection implementation (not using Relay plugin helpers)
   - Each domain has custom `build{Domain}Connection()` function
   - Cursor encoding using custom `encodeCursor()` from use-cases

5. **Resolver Pattern**: Direct controller access from context:
   ```typescript
   const controller = ctx.controllers.{domain}Controller;
   ```

### Files to Create/Modify

#### New Directory Structure

```
packages/frameworks/src/graphql/
├── builder.ts              [EXISTS - no change]
├── schema.ts               [NEW - central assembly point]
├── index.ts                [EXISTS - minor updates]
├── types/
│   ├── index.ts            [NEW - domain barrel exports]
│   ├── user/
│   │   ├── types.ts        [NEW - from types/user.ts]
│   │   ├── queries.ts      [NEW - split from types/user.ts]
│   │   ├── mutations.ts    [NEW - placeholder]
│   │   ├── subscriptions.ts[NEW - placeholder]
│   │   ├── index.ts        [NEW - exports + registration]
│   │   └── types.test.ts   [NEW - co-located tests]
│   ├── event/
│   │   ├── types.ts        [NEW - from types/event.ts]
│   │   ├── queries.ts      [NEW - split from types/event.ts]
│   │   ├── mutations.ts    [NEW - placeholder]
│   │   ├── subscriptions.ts[NEW - placeholder]
│   │   ├── index.ts        [NEW - exports + registration]
│   │   └── types.test.ts   [NEW - co-located tests]
│   ├── sponsor/
│   │   ├── types.ts        [NEW - from types/sponsor.ts]
│   │   ├── queries.ts      [NEW - split from types/sponsor.ts]
│   │   ├── mutations.ts    [NEW - placeholder]
│   │   ├── subscriptions.ts[NEW - placeholder]
│   │   ├── index.ts        [NEW - exports + registration]
│   │   └── types.test.ts   [NEW - co-located tests]
│   ├── notification/
│   │   ├── types.ts        [NEW - from types/notification.ts]
│   │   ├── queries.ts      [NEW - split from types/notification.ts]
│   │   ├── mutations.ts    [NEW - placeholder]
│   │   ├── subscriptions.ts[NEW - placeholder]
│   │   ├── index.ts        [NEW - exports + registration]
│   │   └── types.test.ts   [NEW - co-located tests]
│   └── coinTransaction/
│       ├── types.ts        [NEW - from types/coinTransaction.ts]
│       ├── queries.ts      [NEW - split from types/coinTransaction.ts]
│       ├── mutations.ts    [NEW - placeholder]
│       ├── subscriptions.ts[NEW - placeholder]
│       ├── index.ts        [NEW - exports + registration]
│       └── types.test.ts   [NEW - co-located tests]
```

#### Files to Delete (after migration)

- `packages/frameworks/src/graphql/types/user.ts`
- `packages/frameworks/src/graphql/types/event.ts`
- `packages/frameworks/src/graphql/types/sponsor.ts`
- `packages/frameworks/src/graphql/types/notification.ts`
- `packages/frameworks/src/graphql/types/coinTransaction.ts`

#### Files to Update

1. **packages/frameworks/src/graphql/index.ts**
   - Add `schema.ts` exports
   - Keep existing exports

2. **packages/frameworks/src/graphql/schema-output.ts**
   - Update to use new `schema.ts` entry point

### Integration Points

#### Consumers of GraphQL Schema

1. **apps/backend-server** - Uses schema via `createGraphQLServer({ schema })`
2. **packages/graphql-client** - Consumes schema SDL for codegen
3. **Tests** - Import types for unit testing

#### Dependencies Between Types

| Type                | Depends On       | Nature                                 |
| ------------------- | ---------------- | -------------------------------------- |
| TripSponsorType     | SponsorType      | Field reference (sponsor: SponsorType) |
| CoinTransactionType | 2 embedded types | Internal types only                    |

### Risk Assessment

| Risk                         | Level  | Mitigation                           |
| ---------------------------- | ------ | ------------------------------------ |
| Breaking schema changes      | HIGH   | Ensure generated SDL matches exactly |
| Import cycles                | MEDIUM | Use type-only imports where possible |
| Test failures                | LOW    | Add tests before refactoring (TDD)   |
| Missing type registrations   | MEDIUM | index.ts side-effect pattern         |
| Controller interface changes | LOW    | Keep controller access pattern       |

### Expected GraphQL Schema Compatibility

The refactor must maintain 100% schema compatibility:

- All type names identical
- All field names identical
- All argument names identical
- Connection/Edge types preserved
- Query names and signatures identical

## Implementation Notes

1. **Side-effect Registration**: Pothos types register themselves when imported. The module `index.ts` must import all files to trigger registration.

2. **Controller Access Pattern**: Current pattern `ctx.controllers.{name}Controller` must be preserved.

3. **Cursor Encoding**: Custom cursor functions use `encodeCursor()` from use-cases package - this stays unchanged.

4. **Error Handling**: Current `mapDomainErrorToGraphQL()` pattern must be preserved in new resolver files.

5. **Plugin Configuration**: No changes to `builder.ts` - all three plugins already configured.
