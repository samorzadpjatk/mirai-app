# Test Coverage Spike - Lessons Learned

## Summary

This spike successfully established 4 reusable testing patterns across the Mirai App monorepo and achieved 100% line coverage on 4 target files.

## Results

### Files Tested with 100% Line Coverage

| File                                              | Lines   | Pattern                                   | Tests  |
| ------------------------------------------------- | ------- | ----------------------------------------- | ------ |
| `apps/web/src/lib/fileValidation.ts`              | 80      | Pure Functions                            | 37     |
| `apps/backend-server/src/utils/headers.ts`        | 26      | External Mocking                          | 15     |
| `apps/notification-sender/src/utils/scheduler.ts` | 90      | Async/Timers                              | 17     |
| `apps/web/src/hooks/useActiveTripId.ts`           | 20      | React Hooks (with @testing-library/react) | 13     |
| **Total**                                         | **216** |                                           | **82** |

**Note**: React Testing Library works seamlessly with Bun + Happy DOM per [Bun documentation](https://bun.sh/docs/test/dom#react-testing-library).

### Overall Test Results

```
609 pass
10 skip (database tests requiring PostgreSQL)
30 fail (database tests requiring PostgreSQL)
858 expect() calls
Ran 649 tests across 37 files
```

### Auth Test Fix

- Fixed JWT mock token encoding in `packages/auth/src/__tests__/authServer.test.ts`
- Changed from `btoa()` to `Buffer.from().toString("base64")` for Bun compatibility
- All 39 auth tests now pass
- Documented Bun-specific base64 encoding behavior

### Dependencies Added

**apps/web/package.json** (devDependencies):

```json
"@testing-library/jest-dom": "^6.6.3",
"@testing-library/react": "^16.3.0"
```

**Note**: React Testing Library requires Happy DOM to be preloaded via `bunfig.toml`.

## Key Findings

### 1. Bun Test Runner Performance

- **Fast execution**: 649 tests run in ~2 seconds
- **Native coverage**: Built-in coverage reporting works well
- **Happy DOM integration**: Preloading works seamlessly via `bunfig.toml`

### 2. Pattern Effectiveness

| Pattern          | Complexity | Reusability | Notes                                         |
| ---------------- | ---------- | ----------- | --------------------------------------------- |
| Pure Functions   | Low        | High        | No setup needed, most reliable                |
| External Mocking | Medium     | High        | Type stubs work well                          |
| Async/Timers     | Medium     | High        | Real timers are fast enough                   |
| React Hooks      | Medium     | High        | Works with @testing-library/react + Happy DOM |

### 3. Bun-Specific Behaviors Discovered

#### Base64 Encoding

```typescript
// Bun-compatible approach
Buffer.from(json).toString("base64"); // ✓ Works
btoa(json); // ✗ May cause decode issues
```

#### Timer Behavior

- No fake timers needed - real timers execute fast
- `setTimeout`/`setInterval` work identically to Node.js
- Spy on console methods to test async logging

#### Test File Location

- Colocated `__tests__/*.test.ts` pattern works well
- Relative imports preferred over path aliases in tests

### 4. Coverage Thresholds

Current configuration in `bunfig.toml`:

```toml
coverageThreshold = { lines = 0.80, branches = 0.75 }
```

**Observation**: Threshold enforcement requires `--coverage` flag. Without it, tests pass regardless of coverage.

## Challenges Encountered

### 1. React Hook Testing

**Initial Assumption**: `@testing-library/react` would not be compatible with Bun.

**Actual Finding**: React Testing Library works seamlessly with Bun when using Happy DOM!

**Solution**: Use `@testing-library/react` directly:

```bash
bun add -d @testing-library/react @testing-library/jest-dom
```

```typescript
/// <reference lib="dom" />
import { renderHook } from "@testing-library/react";
import { test, expect } from "bun:test";

const { result } = renderHook(() => useMyHook());
expect(result.current).toBe(expectedValue);
```

**Reference**: [Bun DOM Testing Docs](https://bun.sh/docs/test/dom#react-testing-library)

**Note on SSR Testing**: Since React Testing Library requires a DOM environment, you cannot test `typeof window === "undefined"` scenarios by removing `window`. Instead:

- Verify SSR safety through code review
- Test via static analysis (TypeScript compilation)
- Use integration tests in actual SSR environments

### 2. JWT Decode Console Errors

**Challenge**: Bun's `Buffer.from(str, "base64")` logs errors to console for invalid input, even when caught.

**Impact**: Cosmetic only - tests pass, but console shows errors.

**Mitigation**: Fixed mock tokens to use valid base64 encoding.

### 3. Database Test Isolation

**Challenge**: 30 tests fail due to missing PostgreSQL (port 5433).

**Status**: Expected per requirements - database tests explicitly out of scope.

## Recommendations for Full Coverage Rollout

### Phase 1: Low-Hanging Fruit (Estimated: 1 week)

Apply Pure Function pattern to:

- `apps/web/src/lib/*.ts` (6 files, ~200 lines)
- `packages/shared/src/stores/*.ts` (4 files, ~300 lines)
- `packages/supabase/src/*.ts` (4 files, ~150 lines)

**Expected coverage increase**: +5-8%

### Phase 2: Backend Services (Estimated: 2 weeks)

Apply External Mocking pattern to:

- `apps/backend-server/src/services/*.ts`
- `apps/notification-sender/src/services/*.ts`

**Challenge**: May need Fastify mock patterns for request/response objects.

### Phase 3: React Hooks (Estimated: 2 weeks)

Apply React Hook pattern to:

- `apps/native/src/hooks/*.ts` (47 files)

**Challenge**: Will need Jest + jest-expo preset for native hooks.

### Phase 4: Complex Components (Estimated: 2 weeks)

- React components with state
- tRPC router tests
- Supabase integration tests

## CI/CD Integration

### Recommended CI Steps

```yaml
- name: Run tests
  run: bun test --coverage

- name: Check coverage thresholds
  run: |
    if [ $(bun test --coverage 2>&1 | grep -c "below threshold") -gt 0 ]; then
      echo "Coverage below threshold"
      exit 1
    fi
```

### Pre-commit Hooks

Consider adding:

```bash
# Check test files exist for modified source files
# Verify coverage doesn't decrease
```

## Testing Infrastructure Improvements

### Short Term

1. Create `@mirai-app/test-utils` package with:
   - `renderHook()` helper
   - `createMockToken()` for JWTs
   - `mockConsole()` helper

2. Add test template files for each pattern

### Long Term

1. Set up Jest for `apps/native` with jest-expo
2. Create integration test harness with test PostgreSQL
3. Add visual regression testing for UI components

## Documentation

Created comprehensive testing guide at:

- `docs/testing-patterns.md`

Includes:

- All 4 patterns with examples
- Bun-specific behaviors
- Quick reference card
- Migration plan for full coverage

## Conclusion

This spike validated the Bun + Happy DOM testing approach for the Mirai App monorepo. The 4 established patterns provide a solid foundation for achieving 80% test coverage:

1. ✅ Pure Functions - Simple, reliable, no mocks needed
2. ✅ External Mocking - Clean type-level stubs
3. ✅ Async/Timers - Real timers work well in Bun
4. ✅ React Hooks - Custom renderHook pattern established

**Next Action**: Apply these patterns to remaining files per the phased rollout plan.

---

_Document generated from test-coverage-spike change_
