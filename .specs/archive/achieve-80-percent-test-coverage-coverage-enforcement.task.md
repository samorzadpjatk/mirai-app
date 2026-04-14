---
title: "Coverage Enforcement"
type: task
status: done
created: "2026-04-08"
migrated_from: "openspec/changes/archive/2026-04-08-achieve-80-percent-test-coverage/specs/coverage-enforcement/spec.md"
parent_design: ".specs/plans/achieve-80-percent-test-coverage.design.md"
---

## ADDED Requirements

### Requirement: Per-package coverage thresholds

Every package and app with source code SHALL define coverage thresholds of 80% lines and 75% branches in their `bunfig.toml`, causing `bun test --coverage` to fail if thresholds are not met.

#### Scenario: Coverage meets thresholds

- **WHEN** all tests pass and line coverage is ≥80% and branch coverage is ≥75%
- **THEN** `bun test --coverage` exits with code 0

#### Scenario: Line coverage below threshold

- **WHEN** tests pass but line coverage is below 80%
- **THEN** `bun test --coverage` exits with a non-zero code and prints a summary of uncovered lines

#### Scenario: Branch coverage below threshold

- **WHEN** tests pass but branch coverage is below 75%
- **THEN** `bun test --coverage` exits with a non-zero code and prints a summary of uncovered branches

### Requirement: Turborepo pipeline integration

The `turbo.json` configuration SHALL include the `test` task with proper dependency ordering and coverage output configuration, enabling `turbo run test` to execute tests across all packages in parallel with dependency awareness.

#### Scenario: Running tests across monorepo

- **WHEN** a developer runs `turbo run test` from the monorepo root
- **THEN** Turborepo executes `bun test` scripts for all packages in dependency order, collecting coverage artifacts in each package's `coverage/` directory

#### Scenario: Dependency-aware test execution

- **WHEN** `packages/trpc` depends on `packages/db` and both have test scripts
- **THEN** Turborepo runs `packages/db` tests before `packages/trpc` tests

### Requirement: CI test gate

The CI pipeline SHALL run `turbo run test` on every pull request and fail the build if any package's coverage threshold is not met.

#### Scenario: PR with passing coverage

- **WHEN** a pull request is opened and all packages meet the 80% line / 75% branch thresholds
- **THEN** the CI test step passes and the PR can be merged

#### Scenario: PR with failing coverage

- **WHEN** a pull request is opened and one or more packages fall below the coverage thresholds
- **THEN** the CI test step fails with a clear message indicating which package(s) and what percentage coverage was achieved

### Requirement: Coverage exclusion for generated code

The `bunfig.toml` configuration SHALL exclude auto-generated Prisma model files (`packages/db/src/prisma/lib/models/`) and generated client code from coverage calculations.

#### Scenario: Generated code excluded from coverage

- **WHEN** coverage is calculated for `packages/db`
- **THEN** files matching the exclusion patterns in `bunfig.toml` do not count toward or against the line/branch coverage percentages
