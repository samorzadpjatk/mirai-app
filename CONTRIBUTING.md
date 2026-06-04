[![English](https://img.shields.io/badge/English-Click-yellow)](CONTRIBUTING.md)
[![Polski](https://img.shields.io/badge/Polski-Click-yellow)](CONTRIBUTING_PL.md)

# Collaboration guidelines inside the repo

## Naming standards

We follow the following standards:
- [Conventional Branch](https://conventional-branch.github.io/en/v1.0.0/)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Testing Requirements

All contributions must include appropriate tests. The MIRAI monorepo uses **~2,950 tests** across 267+ suites (Jest) and **850+ tests** (Vitest) across multiple packages with coverage reporting.

### Test Runners Overview

| Project | Runner | Packages |
|---------|--------|----------|
| `apps/native` | **Jest** (jest-expo preset) | React Native app |
| All other apps & packages | **Vitest** | shared, auth, orpc, backend-server, notification-sender, seed |

For detailed test commands, configuration, and examples, see [TESTING.md](TESTING.md).

### Before Submitting a PR

Run tests for any packages you modified:

```bash
# Run all tests (from repository root)
bun run test

# Run tests for a specific package
cd packages/shared && bun run test
cd apps/backend-server && bun run test

# Run tests in watch mode during development
bun run test:watch
```

**When to run the full test suite:**
- Changes to `packages/shared` (shared utilities affect all packages)
- Changes to `packages/auth` (authentication affects multiple apps)
- Changes to `packages/orpc` (oRPC routers affect backend and native)
- Any refactoring that could have cross-package impact

### CI/CD Testing

All PRs must pass the CI test job before merging. The CI runs:

```bash
bun run test:ci
```

Local validation should match CI as closely as possible. Test failures in CI block PR merging.

### Coverage Requirements

- Coverage reports are generated for all test runs
- Do not regress coverage in areas you modify
- New features should include tests that maintain or improve coverage

## How to contribute to the project?

1. Create a branch for your PR
2. On your branch, make changes to the source code
3. Create a PR with a general description of changes in the title, and in the description show that the source code works correctly after the changes

   **PR Checklist:**
   - [ ] Tests added or updated for new features
   - [ ] All tests pass locally (`bun run test`)
   - [ ] Coverage not regressed for changed areas
   - [ ] Relevant packages tested (see [TESTING.md](TESTING.md) for commands)
   - [ ] CI test job passes

4. Request review from authorized persons
5. Merge the code into the main branch using `squash and merge`: the final commit title must also follow the standards!
