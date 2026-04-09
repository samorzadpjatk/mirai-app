# CI/CD for Bun Monorepos - Best Practices

## Overview

This skill covers best practices for setting up CI/CD pipelines for Bun-based monorepos, including build strategies, test execution, caching, and dependency management.

## Bun Monorepo CI Patterns

### Workspace Configuration

Bun workspaces are defined in `package.json`:

```json
{
  "workspaces": ["packages/*", "apps/*"]
}
```

### Build Strategies

#### 1. Parallel Builds

Build all packages in parallel (fastest, requires no interdependencies):

```yaml
- name: Build all packages
  run: bun run build --filter='./packages/*'
```

#### 2. Topological Builds

Build in dependency order (required when packages depend on each other):

```yaml
- name: Build in dependency order
  run: bun run build
```

#### 3. Selective Builds

Build only changed packages (optimization for large monorepos):

```yaml
- name: Build only affected packages
  run: bun run build --filter='...[HEAD~1]'
```

### Test Execution

#### Unit Tests

Run unit tests in parallel across packages:

```yaml
- name: Run unit tests
  run: bun run test:unit
```

#### Integration Tests

Integration tests may need services (databases, etc.):

```yaml
- name: Run integration tests
  run: bun run test:integration
```

#### Test Tagging Convention

Use Bun's test name filtering to categorize tests:

```typescript
// Unit test (pure logic)
describe("[UNIT] User entity", () => { ... })

// Integration test (requires database)
describe("[INTEGRATION] PrismaUserRepository", () => { ... })
```

### Caching Strategy

#### Bun Cache

Cache Bun's global package cache:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
    restore-keys: |
      ${{ runner.os }}-bun-
```

#### Build Cache

Cache compiled output for incremental builds:

```yaml
- uses: actions/cache@v4
  with:
    path: |
      **/dist/**
      **/.turbo/**
    key: ${{ runner.os }}-build-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-build-
```

### Dependency Management

#### Handling Cyclic Dependencies

1. **Detection**: Use dependency-cruiser to detect cyclic dependencies:

```yaml
- name: Check for cyclic dependencies
  run: bun run depcruise:check
```

2. **Resolution Strategies**:
   - **Interface Extraction**: Extract interfaces to a shared package
   - **Dependency Inversion**: Use dependency injection to break cycles
   - **Package Restructuring**: Merge interdependent packages

3. **Prevention**: Configure dependency-cruiser rules:

```javascript
// .dependency-cruiser.mjs
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
};
```

### GitHub Actions Configuration

#### Complete CI Workflow Example

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run typecheck

  build:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build

  test-unit:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:unit

  test-integration:
    runs-on: ubuntu-latest
    needs: test-unit
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:integration
```

### Best Practices

1. **Fail Fast**: Run linting and type checking before expensive tests
2. **Parallelize**: Run independent jobs in parallel
3. **Cache Aggressively**: Cache dependencies and build outputs
4. **Matrix Testing**: Test across Node.js versions if needed
5. **Artifact Upload**: Save test results and coverage reports

### Common Pitfalls

1. **Missing Build Step**: CI runs tests but forgets to build first
2. **No Caching**: Slow CI due to reinstalling dependencies every run
3. **Cyclic Dependencies**: Builds fail due to unresolved dependency cycles
4. **Environment Mismatches**: CI environment differs from local
5. **Test Isolation**: Tests depend on each other or shared state

## References

- [Bun Workspaces Documentation](https://bun.sh/docs/install/workspaces)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [dependency-cruiser Documentation](https://github.com/sverweij/dependency-cruiser)
