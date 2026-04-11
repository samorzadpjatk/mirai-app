---
title: Migrate codebase to Effect framework with comprehensive test coverage
status: draft
issue_type: feature
complexity: XL
---

## Initial User Prompt

Research full migration of packages and apps into usage of Effect framework: https://effect.website/docs#docs-for-llMs. Also remove any redundant libraries in the process of migrating into Effect. Remove any file related to tRPC - it is deprecated.

## Description

The Mirai App monorepo currently uses a custom `Result<T,E>` type for error handling and `async/await` with `Promise<Result<T,E>>` patterns for asynchronous operations. While functional, these patterns lack the composability, type inference, and advanced features (structured concurrency, resource management, observability) of modern effect systems.

This migration will standardize the entire codebase on the Effect framework (https://effect.website), a production-grade TypeScript library for building composable, type-safe applications. Effect provides a unified abstraction for synchronous and asynchronous effects, explicit error handling, dependency injection through layers, and built-in observability.

The business value of this migration includes: (1) **Reduced bug rates** through type-safe error handling that prevents unhandled exceptions, (2) **Improved developer velocity** through better composability and a single abstraction for all effectful operations, and (3) **Enhanced scalability** through structured concurrency and resource management capabilities.

All packages (domain, use-cases, adapters, frameworks) and applications (backend-server, web, native, notification-sender, seed) will be migrated incrementally. The migration is a pure refactoring - no feature additions, behavior changes, or external API modifications are in scope.

**Scope**:

- **Included**:
  - Domain layer: Replace `Result<T,E>` with `Effect<T, E, never>`
  - Use cases: Convert `Promise<Result<T,E>>` to `Effect<T, E, R>`
  - Adapters: Update controllers to handle Effects at boundaries
  - Frameworks: Integrate Effect with DI container and provide Runtimes
  - Apps: Wire Effect at application entry points
  - Tests: Migrate all tests to Effect patterns
  - Dependencies: Remove redundant libraries (neverthrow, fp-ts alternatives)
  - Cleanup: Remove any remaining tRPC-related files

- **Excluded**:
  - Feature additions or behavioral changes
  - Database schema modifications
  - GraphQL schema changes (unless required for error handling)
  - UI/UX redesigns
  - Authentication mechanism changes
  - Infrastructure or deployment changes

**User Scenarios**:

1. **Primary Flow**: Developer adds Effect dependency to a package, replaces Result types with Effect, updates entity methods to return Effects, verifies tests pass, and proceeds to the next package.
2. **Alternative Flow**: Team migrates domain layer first, temporarily bridges old and new patterns in adapters, then completes use case and adapter migration.
3. **Error Handling**: When an Effect returns an error in a controller, it maps to the appropriate HTTP status code or GraphQL error format, maintaining the same external contract as before.

## Acceptance Criteria

### Functional Requirements

- [ ] **FC-01 Domain Effect Types**: Domain package exports Effect-based utilities instead of Result<T,E>
  - Given: The @mirai-app/domain package
  - When: Inspecting utils/result.ts exports
  - Then: Provides Effect<T, E, never> patterns instead of custom Result type

- [ ] **FC-02 Entity Creation**: All entity static factory methods return Effect
  - Given: A domain entity with a create method
  - When: Calling Entity.create(validProps)
  - Then: Returns Effect<Entity, ValidationError> instead of Result<Entity, ValidationError>

- [ ] **FC-03 Use Case Effects**: All use case interactors return Effect
  - Given: A use case interactor class
  - When: Calling execute() method
  - Then: Returns Effect<OutputDTO, DomainError> instead of Promise<Result<OutputDTO, DomainError>>

- [ ] **FC-04 Controller Integration**: Controllers properly handle Effects at boundaries
  - Given: A controller method receiving a request
  - When: Calling a method that returns Effect
  - Then: Properly runs Effect (via Effect.runPromise or similar) and returns result

- [ ] **FC-05 Error Mapping**: Errors are correctly mapped to HTTP/GraphQL responses
  - Given: An Effect that returns an error in a controller
  - When: The controller processes the error
  - Then: Returns the appropriate HTTP status code or GraphQL error format (preserving existing contracts)

- [ ] **FC-06 Layer Integration**: Effect integrates with DI container
  - Given: The awilix-modular DI container
  - When: Resolving dependencies in a controller
  - Then: Effect layers can be built from container dependencies and provided to use cases

- [ ] **FC-07 Application Boundary**: Apps properly run Effects at system boundary
  - Given: An application entry point (e.g., backend-server)
  - When: Starting the application
  - Then: Effects are run at the outermost layer with proper error handling

### Library Consolidation Requirements

- [ ] **LC-01 Remove Redundant Libraries**: No neverthrow, fp-ts, or similar libraries remain
  - Given: Any package.json in the monorepo
  - When: Checking dependencies
  - Then: Contains no neverthrow, fp-ts, true-myth, or other functional error-handling libraries

- [ ] **LC-02 Custom Result Removal**: No Result<T,E> type usage remains
  - Given: The entire codebase
  - When: Searching for Result type imports
  - Then: Zero imports of the custom Result type from @mirai-app/domain (only Effect)

- [ ] **LC-03 tRPC Cleanup**: All tRPC files removed
  - Given: The codebase
  - When: Searching for tRPC-related files
  - Then: No files containing "trpc" in name or @trpc/ imports exist

### Quality Requirements

- [ ] **QC-01 Test Coverage**: All tests pass with Effect
  - Given: The test suite
  - When: Running `bun test`
  - Then: All tests pass (unit and integration)

- [ ] **QC-02 Coverage Maintained**: Test coverage stays above threshold
  - Given: The coverage report
  - When: Running `bun test --coverage`
  - Then: Coverage is 80% or higher across all packages

- [ ] **QC-03 Type Safety**: No TypeScript errors
  - Given: The TypeScript compiler
  - When: Running `tsc --noEmit` in each package
  - Then: Zero type errors across all packages

- [ ] **QC-04 No Any Types**: No explicit any types introduced
  - Given: The codebase
  - When: Running linter or type check
  - Then: No new explicit `any` type annotations (compared to pre-migration baseline)

### Non-Functional Requirements

- [ ] **NFC-01 Performance**: Response times maintained
  - Given: Key API endpoints under load
  - When: Comparing to pre-migration baseline
  - Then: Response times are within 10% of baseline

- [ ] **NFC-02 Bundle Size**: Effect dependencies reasonable
  - Given: Production build
  - When: Analyzing bundle
  - Then: Effect adds no more than 40KB gzipped total

- [ ] **NFC-03 Documentation**: Effect patterns documented
  - Given: CLAUDE.md
  - When: Reviewing documentation
  - Then: Contains Effect patterns, examples, and migration guidance for developers

### Definition of Done

- [ ] All functional acceptance criteria pass
- [ ] All library consolidation criteria pass
- [ ] All quality criteria pass
- [ ] All non-functional criteria pass (or have documented exceptions)
- [ ] CLAUDE.md updated with Effect patterns and examples
- [ ] Code reviewed by at least one other developer
- [ ] No critical or high priority security vulnerabilities introduced
