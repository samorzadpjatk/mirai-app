# TypeScript Error Fix Design

## Overview

Systematic fix for 997 TypeScript errors resulting from:

- **A:** GraphQL client migration (urql API changes)
- **B:** Package restructuring (module path changes)
- **C:** TypeScript configuration updates

## Error Analysis

### Error Distribution by Type

| Error Code | Count | Description                         |
| ---------- | ----- | ----------------------------------- |
| TS2322     | 579   | Type not assignable                 |
| TS2307     | 454   | Cannot find module                  |
| TS2339     | 374   | Property does not exist             |
| TS7006     | 335   | Parameter implicitly has 'any' type |
| TS2345     | 302   | Argument of type not assignable     |
| TS18046    | 225   | Object is possibly 'null'           |
| TS2820     | 176   | Expression not callable             |
| TS2416     | 101   | Property not compatible             |

### Top Missing Modules (TS2307)

| Module                    | Count   |
| ------------------------- | ------- |
| `~/styles`                | 30      |
| `../../ui/Button`         | 29      |
| `../../ui/ErrorMessage`   | 23      |
| `../../ui/Input`          | 22      |
| `../../ui/LoadingSpinner` | 21      |
| `graphql-request`         | 13      |
| `~/hooks/*`               | various |

## Package Dependency Order

Fix sequence follows dependency graph (lowest dependencies first):

```
Phase 1: Foundation
├── packages/domain (6 errors)
└── packages/graphql-client (40 errors)

Phase 2: Core Logic
├── packages/use-cases (676 errors)
└── packages/adapters (254 errors)

Phase 3: Presentation
├── packages/frameworks (294 errors)
└── packages/ui (107 errors)

Phase 4: Application
└── apps/native (remaining errors)
```

## Per-Package Fix Patterns

### packages/domain (6 errors)

Likely simple type annotation fixes. Verify branded ID patterns and Effect types align with current conventions.

### packages/graphql-client (40 errors)

**Key Changes:**

- Update `UseQueryResponse` type to include `data`, `isLoading`, `isError`, `error`, `refetch`, `isFetching`
- Add `invalidate()` method to `Client` type
- Export missing GraphQL documents:
  - `GetGroupJoinRequestDocument`
  - `GetPendingGroupJoinRequestsDocument`
  - `RequestToJoinGroupDocument`
  - `CancelGroupJoinRequestDocument`
  - `RespondToGroupJoinRequestDocument`
  - `LeaveGroupDocument`

**Example Fix:**

```typescript
// Before
export type UseQueryResponse<T, V> = {
  // missing properties
};

// After
export type UseQueryResponse<T, V> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
  isFetching: boolean;
};
```

### packages/use-cases (676 errors)

Primarily downstream of graphql-client changes. After graphql-client is fixed:

- Update Effect service implementations
- Fix Context.Tag usage patterns
- Add explicit error types to Effect return signatures

### packages/adapters (254 errors)

- Update controller validators
- Fix gateway implementations
- Align with new use-cases API

### packages/frameworks (294 errors)

- GraphQL resolvers need updated types
- Pothos schema builder adjustments
- Effect runtime layer updates

### packages/ui (107 errors)

- Fix Tamagui component exports:
  - Add `Image` export
  - Fix `SizeTokens` compatibility
  - Fix padding/border radius type annotations
- Update styled component prop types

**Example Fix:**

```typescript
// Before (TS2322)
<Button size="sm" />  // Error: Type '"sm"' not assignable

// After
<Button size="$sm" />  // Tamagui token syntax
```

### apps/native (remaining errors)

**Path Alias Fixes:**
Update `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"],
      "~/styles": ["./src/styles/index.ts"],
      "~/hooks/*": ["./src/hooks/*"],
      "~/components/*": ["./src/components/*"]
    }
  }
}
```

**Implicit Any Fixes (TS7006):**
Add explicit types to callback parameters:

```typescript
// Before
items.map((item) => item.name); // item: any

// After
items.map((item: ItemType) => item.name);
```

**GraphQL Client Usage Updates:**

```typescript
// Before
const { data, isLoading } = useQuery(...)

// After
const [{ data, fetching: isLoading }] = useQuery(...)
```

## Execution Workflow

### Per-Package Steps

1. **Baseline**

   ```bash
   cd packages/<name>
   npx tsc --noEmit 2>&1 | tee .specs/errors/<name>-baseline.log
   ```

2. **Fix**
   - Fix all errors in package
   - Run `tsc --noEmit` after each file batch
   - Document any `@ts-expect-error` with TODO

3. **Validation**

   ```bash
   cd packages/<name>
   npx tsc --noEmit
   # Must return exit code 0
   ```

4. **Commit**
   ```bash
   git add packages/<name>
   git commit -m "fix(types): resolve ts errors in packages/<name>"
   ```

### Quality Gates

- No package proceeds until previous phase packages are error-free
- Maximum 10 `@ts-expect-error` annotations total
- All existing tests must pass: `bun test`
- No runtime behavior changes (pure type fixes)

### Parallelization

Packages within same phase can be fixed in parallel:

- Phase 1: domain + graphql-client (parallel)
- Phase 2: use-cases + adapters (parallel after Phase 1)
- Phase 3: frameworks + ui (parallel after Phase 2)
- Phase 4: native (sequential after Phase 3)

## Success Criteria

1. `bun run typecheck` returns 0 errors across all packages
2. `bun test` passes with no new failures
3. No new `// @ts-ignore` or `any` suppressions (except documented)
4. All path aliases resolve correctly in apps/native
5. GraphQL client API fully migrated to urql patterns

## Risk Mitigation

### Rollback Strategy

Each package fix committed independently allows selective reversion if issues arise.

### Validation Checkpoints

After each phase, run:

```bash
bun run typecheck
bun run test:unit
```

### Edge Case Handling

Complex type errors that resist simple fixes:

1. Document with `@ts-expect-error` and detailed comment
2. Create follow-up task for proper fix
3. Limit to maximum 10 instances

## References

- CEK Five Pillars: TDD conventions, Effect patterns
- AGENTS.md per-package guides
- CLAUDE.md: TypeScript and Effect conventions

---

**Status:** Approved for implementation
**Created:** 2026-04-15
**Target:** 0 TypeScript errors
