# Test Performance Profiling Guide

This document provides strategies for identifying and reducing test execution bottlenecks in the MIRAI monorepo.

## Current Test Setup

The monorepo uses a dual test runner strategy:

| Runner | Packages | Config |
|--------|----------|--------|
| **Vitest** | 8 packages (backend-server, notification-sender, seed, orpc, db, auth, shared, supabase) | `vitest.config.ts` merging `packages/common/vitest.base.config.ts` |
| **Jest** | 1 package (`apps/native`) | `jest.config.cjs` with `jest-expo` preset |

Both runners use change-based testing locally (`--changed` / `--onlyChanged`) for speed. CI runs full suites via `test:ci` targets.

## Profiling Strategies

### Layer 1: Identify Slow Tests

#### Vitest (8 packages)

```bash
# Show individual test durations
cd packages/<package> && npx vitest --run --reporter=verbose

# Show top slowest imports (Vitest 3.2+)
npx vitest --run --experimental.importDurations.print

# Visual timing with module graph
npx vitest --ui --reporter=verbose
```

#### Jest (`apps/native`)

```bash
# Show individual test timing
cd apps/native && npx jest --verbose --runInBand

# Log heap usage to detect memory leaks
node --expose-gc ./node_modules/jest/bin/jest.js --runInBand --logHeapUsage
```

### Layer 2: Deep Profiling (CPU/Module)

#### Vitest CPU Profiling

Add to `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    fileParallelism: false, // Required for accurate profiles
    execArgv: ['--cpu-prof', '--cpu-prof-dir=./profiles'],
  },
});
```

Then run:

```bash
npx vitest --run
```

#### Jest CPU Profiling

```bash
node --cpu-prof --cpu-prof-dir=./profiles ./node_modules/jest/bin/jest.js --runInBand
```

#### Analyzing `.cpuprofile` Files

1. Open Chrome DevTools → Performance tab → Upload `.cpuprofile`
2. Or use [Speedscope](https://www.speedscope.app/) for flame graph visualization

## NX Monorepo Optimizations

### Profile NX Orchestration

```bash
# Profile task scheduling overhead
NX_PROFILE=profile.json nx affected -t test
# Open profile.json in Chrome DevTools Performance tab

# Enable Nx performance logging
NX_PERF_LOGGING=true NX_DAEMON=false nx affected -t test
```

### Run Only Affected Tests

```bash
# Run tests for changed projects + dependents
nx affected -t test --base=origin/main
```

### CI Sharding

```bash
# Split Vitest tests across multiple CI jobs
vitest run --reporter=blob --shard=1/3
vitest run --reporter=blob --shard=2/3
vitest run --reporter=blob --shard=3/3
# Then merge: vitest run --merge-reports
```

## Most Likely Bottlenecks

Based on the current codebase:

1. **PGLite database tests** (`packages/db`) — The `TESTING.md` already documents optimization from ~1000ms per test to ~1000ms per file + ~20ms per test using `beforeAll` + `truncate`. Verify this pattern applies everywhere.

2. **Module resolution overhead** (`packages/orpc`) — 15+ custom alias mappings in `vitest.config.ts`. Complex alias resolution slows test startup.

3. **Extended hook timeout** (`packages/orpc`) — `hookTimeout: 60000` suggests expensive setup hooks. Investigate `vitest.setup.ts`.

4. **Jest transform patterns** (`apps/native`) — The `transformIgnorePatterns` regex covers `.bun/`, `.pnpm/`, React Native, Expo, and `@orpc`. This complex regex evaluates for every file.

5. **Local vs CI discrepancy** — `--changed` / `--onlyChanged` are fast for local dev but mask full-suite slowness. Profile CI specifically with `test:ci`.

## Recommended Action Plan

| Step | Command | Reveals |
|------|---------|---------|
| 1 | `npx vitest --run --reporter=verbose` in each package | Top slow tests per package |
| 2 | `npx vitest --run --experimental.importDurations.print` in `packages/orpc` | Slow module imports |
| 3 | Add `--reporter=json` and parse durations | Quantified test times |
| 4 | Profile CI with `vitest --run --cpu-prof` | CPU time distribution |
| 5 | `npx jest --verbose --runInBand` in `apps/native` | Slow React Native tests |
| 6 | `NX_PROFILE=profile.json nx affected -t test` | NX scheduling overhead |

## Quick Start One-Liner

```bash
# Run all tests with verbose output to identify slow packages
nx run-many -t test --exclude=@mirai-app/monorepo -- --reporter=verbose
```

## Additional Tools

### Jest Slow Test Reporter

```bash
npm install --save-dev jest-slow-test-reporter
```

Add to `jest.config.cjs`:

```javascript
reporters: [
  ['jest-slow-test-reporter', { numTests: 10, warnOnSlowerThan: 300 }]
];
```

### Vitest UI

```bash
npm install --save-dev @vitest/ui
npx vitest --ui --reporter=verbose
```

Features: Module Graph with duration badges, Import Breakdown (top 10 slowest imports), Duration sorting (slowest first), Slow test filter.

## References

- [Vitest Profiling Guide](https://vitest.dev/guide/profiling-test-performance)
- [Jest CLI Options](https://jestjs.io/docs/cli)
- [NX Performance Profiling](https://nx.dev/docs/troubleshooting/performance-profiling)
- [Speedscope](https://www.speedscope.app/) — Flame graph visualization
