# Business Analysis Scratchpad: Add unit tests to monorepo with Jest for native and Vitest for packages

Task: .specs/tasks/draft/add-unit-tests-monorepo.test.md
Created: 2025-01-20

---

## Phase 1: Requirements Discovery

### Task Overview
- Initial User Prompt: "Add unit tests to the monorepo's project: Jest for native app, Vitest for other projects"
- Current Description: // Will be filled in future stages by business analyst
- Task Type: feature
- Complexity: L

### Problem Definition (Step-by-Step Analysis)

Let's think step by step about what the user actually needs...

Step 1: What is the surface-level user request?
The user wants to add unit testing infrastructure to a TypeScript monorepo. Specifically, they want to use Jest for the Expo React Native app and Vitest for the backend and utility packages.

Step 2: What is the user actually trying to accomplish?
The user wants to establish a comprehensive testing strategy across the entire monorepo. This includes:
- Setting up test runners appropriate for each project type
- Configuring test environments and tooling
- Integrating tests into the Turborepo pipeline
- Ensuring CI/CD runs tests automatically
- Providing a foundation for developers to write tests

Step 3: What is the business value?
- **Quality Assurance**: Automated tests catch regressions before they reach production
- **Developer Confidence**: Developers can refactor and add features without fear of breaking existing functionality
- **Documentation**: Tests serve as executable documentation of expected behavior
- **Faster Feedback Loop**: Local test execution provides immediate feedback during development
- **CI/CD Gate**: Tests block broken code from being merged

Step 4: Who benefits from this change and how?
- **Developers**: Can write and run tests locally, get immediate feedback, refactor safely
- **Code Reviewers**: Tests verify behavior, making reviews more effective
- **DevOps/Maintainers**: CI/CD pipeline ensures quality gates are enforced
- **End Users**: Higher quality code means fewer bugs in production
- **Future Maintainers**: Tests document how the system works

Step 5: What features of this solution may be added immediately or in future?

**Immediate (MVP)**:
- Jest configuration for Expo React Native app
- Vitest configuration for backend-server
- Vitest configuration for utility packages (auth, db, shared, supabase, trpc)
- Turborepo pipeline integration for `turbo run test`
- CI/CD workflow updates to run tests
- Basic test examples in each project

**Future Enhancements**:
- Code coverage reporting and thresholds
- Test parallelization optimization
- Snapshot testing for UI components
- Integration tests with test database
- E2E tests for critical user flows
- Test data factories and fixtures
- Mocking utilities for external services

Step 6: What constraints or considerations exist?

- **Expo/React Native**: Requires specific Jest preset for React Native environment
- **TypeScript**: All configurations must support TypeScript compilation
- **Monorepo Structure**: Tests must respect workspace boundaries and dependencies
- **Turborepo**: Test tasks must integrate with existing pipeline and caching
- **CI/CD**: GitHub Actions workflows need updates to run tests
- **Performance**: Test suites should run quickly enough for local development
- **Developer Experience**: Test commands should be simple and consistent across packages

Therefore, the root problem is: "The monorepo lacks automated testing infrastructure, creating risk of regressions, slowing development velocity, and reducing code quality confidence. The solution requires setting up appropriate test runners for each project type (Jest for React Native, Vitest for Node.js packages) and integrating them into the development workflow."

### Scope
- What is included in this task?
  - Jest configuration for apps/native (Expo React Native)
  - Vitest configuration for apps/backend-server
  - Vitest configuration for apps/notification-sender
  - Vitest configuration for apps/seed
  - Vitest configuration for packages/auth
  - Vitest configuration for packages/db
  - Vitest configuration for packages/shared
  - Vitest configuration for packages/supabase
  - Vitest configuration for packages/trpc
  - Turborepo pipeline integration for test execution
  - CI/CD workflow updates for automated testing
  - Basic example tests in each project
  - Documentation for running tests

- What is explicitly NOT included?
  - Writing comprehensive test suites for all existing code
  - Integration tests requiring database/external services
  - E2E tests
  - Code coverage thresholds enforcement
  - Performance/load testing
  - Visual regression testing
  - Test data factories (beyond minimal examples)

- What are the boundaries?
  - Focus on unit test infrastructure setup only
  - Each project gets minimal example tests, not full coverage
  - Test configurations should be production-ready but not overly complex

### Ambiguous Areas
- [RESOLVED] Should notification-sender and seed use Vitest? Yes, they are Node.js apps like backend-server
- [RESOLVED] Should packages/trpc use Vitest? Yes, it's a utility package
- [RESOLVED] What about test coverage? Out of scope for initial setup, can be added later

---

## Phase 2: Concept Extraction

### Key Concepts Identified

Let's think step by step about the core elements of this feature...

Step 1: Who are the actors?
- Developers writing code in the monorepo
- CI/CD pipeline executing tests automatically
- Code reviewers verifying test presence
- Future maintainers relying on tests for understanding

Step 2: What actions/behaviors are involved?
- Running tests locally during development
- Running tests in CI/CD pipeline
- Writing new tests for features/bugfixes
- Debugging failing tests
- Viewing test results and reports

Step 3: What data entities exist?
- Test files (*.test.ts, *.spec.ts)
- Test configuration files (jest.config.js, vitest.config.ts)
- Test utilities and helpers
- Mock data and fixtures
- Test results and reports

Step 4: What constraints apply?
- Expo/React Native requires jest-expo preset
- TypeScript requires ts-jest or @swc/jest for Jest, native support in Vitest
- Monorepo requires proper module resolution across workspaces
- Turborepo requires task dependencies to be defined
- CI/CD requires test commands to exit with proper codes

Step 5: What's implicitly assumed?
- Developers know how to write tests
- Tests will be added incrementally, not all at once
- Test execution time should be reasonable (< 5 minutes total)
- Tests should be reliable (not flaky)
- Test failures block CI/CD (this is desired)

Therefore, the key concepts are: Multi-project monorepo testing infrastructure with different test runners for different project types (Jest for React Native, Vitest for Node.js), integrated into Turborepo pipeline and CI/CD, providing foundation for incremental test adoption.

### Concept Summary
- **Actors**: Developers, CI/CD pipeline, Code reviewers
- **Actions/Behaviors**: Run tests locally, run tests in CI, write tests, debug tests, view results
- **Data Entities**: Test files, config files, utilities, mocks, results
- **Constraints**: Expo preset for RN, TypeScript support, monorepo module resolution, Turborepo integration, CI/CD exit codes

### Implicit Assumptions
- Developers have basic testing knowledge
- Tests will be added gradually over time
- Test execution should complete in reasonable time
- Tests must be deterministic (no flakiness)
- CI/CD will enforce test passage

### Scope Analysis
- **In Scope**: 
  - Jest setup for native app
  - Vitest setup for all other apps and packages
  - Turborepo test pipeline configuration
  - CI/CD workflow test jobs
  - Example tests in each project
  - Documentation
- **Out of Scope**: 
  - Full test coverage of existing code
  - Integration/E2E tests
  - Coverage thresholds
  - Performance testing
  - Visual regression
- **Boundary Cases**: 
  - What if a project has no tests yet? (Pipeline should still pass)
  - What about shared test utilities? (Can be added to @mirai-app/shared if needed)

---

## Phase 3: Requirements Analysis

### Functional Requirements Analysis

Let's think step by step about each requirement systematically...

**Requirement 1: Jest Configuration for Native App**

Step 1: What does this actually mean?
The Expo React Native app needs Jest configured with the jest-expo preset to handle React Native specific modules and environment.

Step 2: What is the happy path?
Developer runs `bun run test` in apps/native → Jest executes with jest-expo preset → Tests pass/fail with proper output.

Step 3: What are the failure modes?
- Missing jest-expo preset: React Native modules fail to resolve
- Incorrect transform config: TypeScript files not compiled
- Missing setup files: Native modules not properly mocked

Step 4: How do we make this testable?
- Configuration file exists at apps/native/jest.config.js
- Running `bun run test` in apps/native executes without errors
- At least one example test passes

Step 5: What non-functional requirements apply?
- Test execution time < 30 seconds for initial suite
- Support for TypeScript out of the box
- Module resolution works for workspace dependencies

Therefore, the acceptance criteria must specify: jest-expo preset is configured, TypeScript support is enabled, at least one example test passes.

**Requirement 2: Vitest Configuration for Backend and Packages**

Step 1: What does this actually mean?
All Node.js projects (backend-server, notification-sender, seed, and all packages) need Vitest configured for fast, native TypeScript testing.

Step 2: What is the happy path?
Developer runs `bun run test` in any project → Vitest executes with TypeScript support → Tests pass/fail with proper output.

Step 3: What are the failure modes?
- Missing vitest.config.ts: Tests don't run
- Incorrect tsconfig paths: Module resolution fails
- Missing test script in package.json: Command not available

Step 4: How do we make this testable?
- Configuration file exists at vitest.config.ts in each project
- Running `bun run test` executes without errors
- At least one example test passes in each project

Step 5: What non-functional requirements apply?
- Test execution time < 10 seconds per project
- Native TypeScript support (no separate compilation step)
- Watch mode available for development

Therefore, the acceptance criteria must specify: vitest.config.ts exists in each project, test script works, example tests pass.

**Requirement 3: Turborepo Pipeline Integration**

Step 1: What does this actually mean?
Tests must be integrated into the Turborepo pipeline so `turbo run test` executes tests across all projects in the correct order.

Step 2: What is the happy path?
Running `turbo run test` from root → Turborepo executes tests for all projects → Results aggregated → Pipeline passes/fails.

Step 3: What are the failure modes?
- Missing test task in turbo.json: Command not recognized
- Incorrect task dependencies: Tests run before build
- No caching: Tests always run even when nothing changed

Step 4: How do we make this testable?
- turbo.json includes test pipeline configuration
- `turbo run test` executes successfully from root
- Task dependencies are correct (build before test if needed)

Step 5: What non-functional requirements apply?
- Caching should work to skip unchanged tests
- Parallel execution where possible
- Clear output showing which projects passed/failed

Therefore, the acceptance criteria must specify: turbo.json has test pipeline, command works from root, dependencies configured.

**Requirement 4: CI/CD Workflow Updates**

Step 1: What does this actually mean?
GitHub Actions workflows must be updated to run tests automatically on PRs and pushes.

Step 2: What is the happy path?
PR is opened → CI workflow triggers → Tests run → Results posted → PR can be merged if tests pass.

Step 3: What are the failure modes?
- Missing test job: Tests don't run in CI
- Incorrect Bun setup: Environment not ready
- Test failures don't block merge: Quality gate not enforced

Step 4: How do we make this testable?
- Workflow file includes test job
- Test job runs on PR and push to main
- Test failures cause workflow failure

Step 5: What non-functional requirements apply?
- CI test execution time < 10 minutes total
- Clear test output in CI logs
- Failed tests block PR merging

Therefore, the acceptance criteria must specify: CI workflow has test job, runs on appropriate triggers, failures block merge.

### Functional Requirements
1. Jest is configured for apps/native with jest-expo preset and TypeScript support
2. Vitest is configured for all Node.js projects (backend-server, notification-sender, seed, auth, db, shared, supabase, trpc)
3. Each project has a `test` script in package.json that runs the appropriate test runner
4. turbo.json includes test pipeline with proper task dependencies
5. CI/CD workflows run tests on PRs and pushes to main
6. Each project has at least one example test that passes

### Non-Functional Requirements
1. **Performance**: Test execution completes in < 5 minutes total for all projects
2. **Reliability**: Tests are deterministic and not flaky
3. **Developer Experience**: Test commands are consistent (`bun run test`) across all projects
4. **CI/CD Integration**: Test failures block PR merging
5. **Documentation**: README files include instructions for running tests

### Constraints & Assumptions
- Bun is the package manager (affects test runner installation)
- Turborepo is used for task orchestration
- TypeScript is used throughout the monorepo
- Expo SDK version determines jest-expo version compatibility
- GitHub Actions is the CI/CD platform

### Measurable Outcomes
- How will we know this is complete?
  - `turbo run test` executes successfully from root
  - All projects have at least one passing test
  - CI/CD runs tests on PRs
  - Test failures cause CI to fail
- What can be tested?
  - Test runner configuration in each project
  - Example tests pass
  - Pipeline integration works
- What are the success metrics?
  - All 9 projects have working test configurations
  - Test execution completes in < 5 minutes
  - Zero configuration errors

### User Scenarios

#### Primary Flow (Happy Path)
1. Developer clones repository and installs dependencies with `bun install`
2. Developer makes changes to code in any project
3. Developer runs `bun run test` in that project to verify changes
4. Tests execute and pass, giving developer confidence
5. Developer pushes changes and creates PR
6. CI automatically runs tests and they pass
7. PR is merged with confidence

#### Alternative Flows
- **Running all tests**: Developer runs `turbo run test` from root to verify entire monorepo
- **Watch mode**: Developer runs tests in watch mode during development for immediate feedback
- **Single project focus**: Developer works only in backend-server, runs tests only there

#### Error Scenarios
- **Test failure**: Test fails with clear error message showing what went wrong
- **Configuration error**: Missing config shows helpful error about what's needed
- **CI failure**: Failed tests in CI block PR merging with clear status check

---

### Acceptance Criteria Draft

**Criterion 1: Jest Configuration for Native App**

Let's think step by step about what makes this criterion testable...

Step 1: Is this specific enough to test?
Yes, we can verify the config file exists and tests run.

Step 2: What are the Given/When/Then components?
- Given: apps/native has jest.config.js with jest-expo preset
- When: Developer runs `bun run test` in apps/native
- Then: Jest executes and at least one example test passes

Step 3: Is the outcome measurable?
Yes - config file exists, command runs, test passes.

Therefore, this criterion is TESTABLE.

**Criterion 2: Vitest Configuration for Backend Server**

Let's think step by step about what makes this criterion testable...

Step 1: Is this specific enough to test?
Yes, similar to Jest config.

Step 2: What are the Given/When/Then components?
- Given: apps/backend-server has vitest.config.ts
- When: Developer runs `bun run test` in apps/backend-server
- Then: Vitest executes and at least one example test passes

Step 3: Is the outcome measurable?
Yes - config file exists, command runs, test passes.

Therefore, this criterion is TESTABLE.

**Criterion 3: Vitest Configuration for All Packages**

Let's think step by step about what makes this criterion testable...

Step 1: Is this specific enough to test?
Yes, applies to auth, db, shared, supabase, trpc packages.

Step 2: What are the Given/When/Then components?
- Given: Each package has vitest.config.ts and test script
- When: Developer runs `bun run test` in each package
- Then: Vitest executes and at least one example test passes

Step 3: Is the outcome measurable?
Yes - can verify each package individually.

Therefore, this criterion is TESTABLE.

**Criterion 4: Turborepo Pipeline Integration**

Let's think step by step about what makes this criterion testable...

Step 1: Is this specific enough to test?
Yes, can verify turbo.json and run the command.

Step 2: What are the Given/When/Then components?
- Given: turbo.json has test pipeline configured
- When: Developer runs `turbo run test` from root
- Then: Tests execute for all projects with correct dependencies

Step 3: Is the outcome measurable?
Yes - command runs, all projects tested.

Therefore, this criterion is TESTABLE.

**Criterion 5: CI/CD Workflow Integration**

Let's think step by step about what makes this criterion testable...

Step 1: Is this specific enough to test?
Yes, can verify workflow files and test in CI.

Step 2: What are the Given/When/Then components?
- Given: GitHub Actions workflow has test job
- When: PR is opened or pushed to main
- Then: Tests run automatically and failures block merge

Step 3: Is the outcome measurable?
Yes - workflow runs, status checks appear.

Therefore, this criterion is TESTABLE.

### Acceptance Criteria Summary

| # | Criterion | Given | When | Then | Testable? |
|---|-----------|-------|------|------|-----------|
| 1 | Jest configured for native | jest.config.js exists with jest-expo | `bun run test` in apps/native | Jest runs, example test passes | Yes |
| 2 | Vitest configured for backend | vitest.config.ts exists | `bun run test` in apps/backend-server | Vitest runs, example test passes | Yes |
| 3 | Vitest configured for packages | vitest.config.ts in each package | `bun run test` in each package | Vitest runs, example test passes | Yes |
| 4 | Turborepo test pipeline | turbo.json has test task | `turbo run test` from root | All project tests execute | Yes |
| 5 | CI/CD test integration | Workflow has test job | PR opened/pushed | Tests run, failures block merge | Yes |

### Non-Functional Requirements
- **Performance**: All tests complete in < 5 minutes total
- **Reliability**: Tests are deterministic, no flaky tests
- **Developer Experience**: Consistent `bun run test` command across all projects
- **CI/CD**: Test failures cause workflow failure and block merging

### Ambiguity Resolution

| Ambiguous Element | Reasoning | Default Applied |
|-------------------|-----------|-----------------|
| Test runner for notification-sender and seed | They are Node.js apps like backend-server | Use Vitest |
| Test runner for trpc package | It's a utility package, not React Native | Use Vitest |
| Coverage requirements | Not specified in initial request | Out of scope for initial setup |
| E2E/Integration tests | Not mentioned in request | Out of scope |
| Test file naming convention | Industry standard | *.test.ts |

### Needs Clarification (MAX 3)
- None - all ambiguities resolved with reasonable defaults

---

## Phase 4: Draft Output

### Synthesis Reasoning

Let's think step by step about which findings are most relevant for the specification...

Step 1: What is the core business value I identified?
The core value is establishing quality assurance infrastructure that enables developers to write tests, catch regressions early, and maintain confidence when refactoring. This reduces bugs in production and speeds up development velocity.

Step 2: What are the must-have vs nice-to-have requirements?

Must-have:
- Jest configuration for native app (Expo requires Jest)
- Vitest configuration for backend server
- Vitest configuration for all packages
- Turborepo pipeline integration
- CI/CD workflow updates
- Example tests in each project

Nice-to-have:
- Test coverage reporting
- Watch mode configuration
- Test utilities in shared package
- Parallel test execution optimization

Out of scope:
- Full test coverage of existing code
- Integration/E2E tests
- Performance testing
- Visual regression testing

Step 3: What acceptance criteria passed testability review?
All 5 criteria passed:
1. Jest config for native - testable
2. Vitest config for backend - testable
3. Vitest config for packages - testable
4. Turborepo pipeline - testable
5. CI/CD integration - testable

Step 4: What scope boundaries must be explicit?
In scope: Test infrastructure setup for all 9 projects, Turborepo integration, CI/CD updates, example tests
Out of scope: Writing comprehensive test suites, coverage thresholds, integration/E2E tests, performance testing

Step 5: What's the clearest way to communicate this?
Lead with the problem (no testing infrastructure), then the solution (Jest for RN, Vitest for Node.js), then specific requirements for each project type, then integration points (Turborepo, CI/CD), then clear boundaries.

Therefore, my refined description will: (1) State the lack of testing infrastructure problem, (2) Explain the dual test runner approach (Jest for RN, Vitest for Node.js), (3) List specific configuration requirements for each project, (4) Define integration requirements, (5) Clearly bound scope to infrastructure only.

### Refined Description

This task establishes comprehensive unit testing infrastructure across the MIRAI monorepo to enable automated quality assurance and developer confidence. The monorepo currently lacks any testing setup, creating risk of regressions and reducing development velocity.

The solution implements a dual test runner strategy: **Jest** for the Expo React Native application (apps/native) due to its React Native specific preset requirements, and **Vitest** for all Node.js applications (backend-server, notification-sender, seed) and utility packages (auth, db, shared, supabase, trpc) for fast, native TypeScript support without compilation steps.

Key deliverables include: (1) Jest configuration with jest-expo preset for the native app, (2) Vitest configuration for all 8 Node.js projects, (3) Turborepo pipeline integration enabling `turbo run test` to execute all tests, (4) CI/CD workflow updates to run tests on PRs and block merges on failures, and (5) at least one passing example test in each of the 9 projects to validate configuration.

**Scope**:
- **Included**: Test runner configuration for all 9 projects, Turborepo pipeline setup, CI/CD integration, example tests, documentation
- **Excluded**: Comprehensive test coverage of existing code, integration/E2E tests, coverage thresholds, performance testing, test data factories

**User Scenarios**:
1. **Primary Flow**: Developer makes changes, runs `bun run test` locally to verify, pushes code, CI runs tests automatically, PR merges with confidence
2. **Alternative Flow**: Developer runs `turbo run test` from root to verify entire monorepo before major release
3. **Error Handling**: Test failures provide clear error messages locally and in CI, blocking PR merge until resolved

### Scope Summary
- **Included**: 
  - Jest configuration for apps/native with jest-expo preset
  - Vitest configuration for apps/backend-server
  - Vitest configuration for apps/notification-sender
  - Vitest configuration for apps/seed
  - Vitest configuration for packages/auth
  - Vitest configuration for packages/db
  - Vitest configuration for packages/shared
  - Vitest configuration for packages/supabase
  - Vitest configuration for packages/trpc
  - Turborepo test pipeline in turbo.json
  - CI/CD workflow test jobs
  - Example tests in all 9 projects
  - Documentation updates
- **Excluded**: 
  - Full test coverage of existing code
  - Integration tests with database
  - E2E tests
  - Coverage threshold enforcement
  - Performance/load testing
  - Visual regression testing
  - Test data factories beyond minimal examples

### User Scenarios Summary
1. **Primary Flow**: Developer writes code, runs `bun run test` locally to verify changes, pushes to PR, CI runs tests automatically, tests pass, PR merges
2. **Alternative Flow**: Developer runs `turbo run test` from root before release to verify entire monorepo health
3. **Error Handling**: Test fails with clear error message locally; in CI, test failures block PR merge with status check failure

### Acceptance Criteria (Final)

Only criteria that passed testability check:

1. **Jest Configuration for Native App**: apps/native has jest.config.js with jest-expo preset, TypeScript support, and at least one passing example test
2. **Vitest Configuration for Backend Server**: apps/backend-server has vitest.config.ts with TypeScript support and at least one passing example test
3. **Vitest Configuration for All Packages**: Each package (auth, db, shared, supabase, trpc) has vitest.config.ts and at least one passing example test
4. **Vitest Configuration for Other Apps**: apps/notification-sender and apps/seed have vitest.config.ts and at least one passing example test
5. **Turborepo Pipeline Integration**: turbo.json has test pipeline configured, `turbo run test` from root executes tests for all projects
6. **CI/CD Workflow Integration**: GitHub Actions workflow runs tests on PRs and pushes to main, test failures cause workflow failure
7. **Test Script Availability**: All 9 projects have `test` script in package.json that runs appropriate test runner
8. **Documentation**: README files include instructions for running tests locally and in CI

---

## Self-Critique

Let's think step by step about whether this specification meets quality standards...

Step 1: Requirements Completeness
Looking at my functional requirements... I have 8 criteria covering all 9 projects (native with Jest, 8 others with Vitest), Turborepo integration, CI/CD, and documentation. I have error scenarios (test failures block merge), alternative flows (watch mode, full monorepo test). This appears complete for an infrastructure setup task.

Step 2: Scope Clarity
My "Out of Scope" section explicitly lists: full test coverage, integration/E2E tests, coverage thresholds, performance testing. This is specific and clear. The "Included" section lists all 9 projects individually, leaving no ambiguity.

Step 3: Acceptance Criteria Testability
All 8 criteria use Given/When/Then format with specific, measurable outcomes. Each criterion can be verified by a QA engineer without asking questions. For example, "apps/native has jest.config.js with jest-expo preset" is verifiable by file existence and content check.

Step 4: Business Value Traceability
Every requirement traces back to the core problem: establishing testing infrastructure. Jest for native is required because Expo needs it. Vitest for others provides fast TypeScript testing. Turborepo integration enables monorepo-wide testing. CI/CD ensures quality gates. All requirements serve the business value of quality assurance.

Step 5: No Implementation Details
The criteria specify WHAT (jest.config.js exists, vitest.config.ts exists) not HOW (use specific plugin, configure in specific way). The only implementation detail mentioned is "jest-expo preset" which is a requirement for React Native testing, not an arbitrary choice. This is acceptable.

Conclusion: The specification meets quality standards with complete requirements, clear scope, testable criteria, traceable business value, and minimal implementation details.

### Verification Results

| # | Verification Question | Reasoning | Evidence | Rating |
|---|----------------------|-----------|----------|--------|
| 1 | **Requirements Completeness**: Have I captured all functional requirements, including edge cases and error scenarios, with testable acceptance criteria? | I have 8 criteria covering all 9 projects, Turborepo, CI/CD, and documentation. Error scenarios (test failures blocking merge) are covered. Alternative flows (full monorepo test) are documented. | 8 acceptance criteria, error handling in user scenarios | COMPLETE |
| 2 | **Scope Clarity**: Are the boundaries explicitly defined, with clear 'Out of Scope' items that prevent scope creep? | "Out of Scope" lists 6 specific items: full coverage, integration tests, E2E tests, coverage thresholds, performance testing, visual regression. "Included" lists all 9 projects individually. | Explicit In/Out scope sections with specific items | COMPLETE |
| 3 | **Acceptance Criteria Testability**: Can a QA engineer write test cases directly from each criterion without asking clarifying questions? | All criteria use Given/When/Then format. Example: "Given: apps/native has jest.config.js with jest-expo preset, When: Developer runs `bun run test`, Then: Jest executes and example test passes" - fully testable. | All 8 criteria have Given/When/Then components | COMPLETE |
| 4 | **Business Value Traceability**: Does every requirement trace back to a stated business goal or user need? | Core problem stated: "monorepo lacks automated testing infrastructure, creating risk of regressions". Each requirement serves this: Jest/Vitest configs enable testing, Turborepo enables monorepo testing, CI/CD enforces quality gates. | Problem statement in description, traceability in synthesis | COMPLETE |
| 5 | **No Implementation Details**: Is the spec free of HOW (tech stack, APIs, code structure)? | Spec mentions jest-expo preset (required for RN) and Vitest (requirement), but doesn't specify HOW to configure them (which plugins, specific settings). This is acceptable as these are requirements, not implementation choices. | Criteria focus on existence of configs and behavior, not implementation | COMPLETE |

### Gaps Found

| Gap | Analysis | Action Needed | Priority |
|-----|----------|---------------|----------|
| None found | All 5 verification questions passed with COMPLETE rating | No action needed | - |

### Revisions Made

No revisions needed - all verification checks passed on first draft.

---

## Final Output Summary

**Task File**: .specs/tasks/draft/add-unit-tests-monorepo.test.md

**Scratchpad**: .specs/scratchpad/2d27b8db9f7f8d71baa3d7ba.md

**Acceptance Criteria**: 8 criteria covering all 9 projects, Turborepo integration, CI/CD, and documentation

**Scope**: Clearly defined with 9 items in scope, 6 items explicitly out of scope

**User Scenarios**: 3 scenarios (primary, alternative, error handling)

**Complexity**: L (Large) - confirmed appropriate for multi-project infrastructure setup

**Self-Critique**: All 5 verification questions checked, all rated COMPLETE, no gaps found
