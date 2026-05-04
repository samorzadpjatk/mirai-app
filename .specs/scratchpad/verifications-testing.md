# LLM-as-Judge Verification Testing Scratchpad

## Purpose
This scratchpad tracks the development and validation of LLM-as-Judge verification rubrics for the unit testing monorepo implementation task.

## Verification Strategy Overview

### Verification Levels
| Level | Use Case | Threshold | Judge Count |
|-------|----------|-----------|-------------|
| **None** | Simple documentation updates, trivial changes | N/A | 0 |
| **Low** | Configuration files, simple script additions | 3.5/5.0 | 1 |
| **Medium** | Package configuration, standard test setup | 4.0/5.0 | 1 |
| **High** | Complex test configurations, cross-package dependencies | 4.0/5.0 | 2 |
| **Panel** | Critical infrastructure, CI/CD changes, final integration | 4.5/5.0 | 3 |

### Rubric Categories
1. **Correctness** - Does the implementation match the specification?
2. **Completeness** - Are all requirements and subtasks satisfied?
3. **Quality** - Is the code/config well-structured and maintainable?
4. **Testing** - Are tests present and passing?
5. **Integration** - Does it work with the broader system?

## Step-by-Step Verification Plan

### Phase 1: Setup (Root Configuration)

#### Step 1.1: Root Package.json Test Scripts
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubric Focus**: Correctness, Completeness
- **Artifacts**: package.json scripts section
- **Key Checks**:
  - Scripts use correct turbo commands
  - Bun is specified as runner
  - No conflicts with existing scripts

#### Step 1.2: Turborepo Pipeline Configuration
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Integration
- **Artifacts**: turbo.json pipeline configuration
- **Key Checks**:
  - Proper dependsOn configuration
  - Outputs correctly specified
  - No circular dependencies

#### Step 1.3: Shared Test Utilities Package (Optional)
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Quality, Testing
- **Artifacts**: Mock factories, test helpers
- **Key Checks**:
  - Mocks are reusable
  - Helpers are well-documented
  - Proper exports configured

### Phase 2: Foundational (Packages with Existing Infrastructure)

#### Step 2.1: Verify packages/supabase Configuration
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubric Focus**: Correctness, Testing
- **Artifacts**: Existing vitest config verification
- **Key Checks**:
  - Config files exist and are valid
  - Tests pass when run
  - Setup file properly configured

#### Step 2.2: Configure packages/shared
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Quality, Testing
- **Artifacts**: vitest.config.ts, example.test.ts
- **Key Checks**:
  - TypeScript support configured
  - Example test is meaningful
  - Test script works correctly

#### Step 2.3: Configure packages/db
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubric Focus**: Correctness
- **Artifacts**: Decision documentation
- **Key Checks**:
  - Decision is documented
  - Rationale is clear

### Phase 3: Core Implementation (Remaining Packages)

#### Step 3.1: Configure packages/auth
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Quality, Testing, Integration
- **Artifacts**: vitest.config.ts, vitest.setup.ts, example.test.ts
- **Key Checks**:
  - Workspace aliases resolved
  - Supabase/DB mocks comprehensive
  - Example test passes
  - No circular dependency issues

#### Step 3.2: Configure packages/trpc
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Quality, Testing, Integration
- **Artifacts**: vitest.config.ts, example.test.ts
- **Key Checks**:
  - Router test is meaningful
  - Context mocking works
  - Database calls mocked

#### Step 3.3: Configure apps/backend-server
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Quality, Testing, Integration
- **Artifacts**: vitest.config.ts, example.test.ts
- **Key Checks**:
  - Fastify testing environment works
  - tRPC client integration functional
  - Endpoint test passes

#### Step 3.4: Configure apps/notification-sender
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Quality, Testing
- **Artifacts**: vitest.config.ts, example.test.ts
- **Key Checks**:
  - Expo SDK mocked
  - Notification logic test passes

#### Step 3.5: Configure apps/seed
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Quality, Testing
- **Artifacts**: vitest.config.ts, example.test.ts
- **Key Checks**:
  - Database operations mocked
  - Seed logic test passes

#### Step 3.6: Configure apps/native (Jest + jest-expo)
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubric Focus**: All categories (Critical infrastructure)
- **Artifacts**: jest.config.js, jest.setup.js, example.test.tsx
- **Key Checks**:
  - jest-expo preset configured correctly
  - Transform ignore patterns proper
  - Module name mapping works
  - Expo/RN mocks comprehensive
  - TypeScript support functional
  - Example test passes
  - No version conflicts

### Phase 4: Polish (CI/CD, Documentation)

#### Step 4.1: GitHub Actions CI/CD Integration
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubric Focus**: Correctness, Integration
- **Artifacts**: .github/workflows/ci.yml
- **Key Checks**:
  - Test step runs after lint/typecheck
  - Uses bun run test:ci
  - Failures block PR merging
  - Coverage upload works (if configured)

#### Step 4.2: Documentation Updates
- **Level**: Low
- **Threshold**: 3.5/5.0
- **Rubric Focus**: Completeness, Quality
- **Artifacts**: README.md files
- **Key Checks**:
  - Testing instructions clear
  - Dual runner strategy explained
  - Troubleshooting section present

#### Step 4.3: Final Verification & Integration Testing
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubric Focus**: All categories (Final integration)
- **Artifacts**: Full test suite execution
- **Key Checks**:
  - turbo run test executes all tests
  - All 9 projects have passing tests
  - No failures or errors
  - Execution time < 5 minutes
  - No flaky tests

## Verification Summary Template

| Step | Level | Threshold | Judge Count | Focus Areas |
|------|-------|-----------|-------------|-------------|
| 1.1 | Low | 3.5/5.0 | 1 | Correctness, Completeness |
| 1.2 | Medium | 4.0/5.0 | 1 | Correctness, Integration |
| 1.3 | Medium | 4.0/5.0 | 1 | Quality, Testing |
| 2.1 | Low | 3.5/5.0 | 1 | Correctness, Testing |
| 2.2 | Medium | 4.0/5.0 | 1 | Correctness, Quality, Testing |
| 2.3 | Low | 3.5/5.0 | 1 | Correctness |
| 3.1 | High | 4.0/5.0 | 2 | All except Integration |
| 3.2 | High | 4.0/5.0 | 2 | All except Integration |
| 3.3 | High | 4.0/5.0 | 2 | All except Integration |
| 3.4 | Medium | 4.0/5.0 | 1 | Correctness, Quality, Testing |
| 3.5 | Medium | 4.0/5.0 | 1 | Correctness, Quality, Testing |
| 3.6 | Panel | 4.5/5.0 | 3 | All categories |
| 4.1 | High | 4.0/5.0 | 2 | Correctness, Integration |
| 4.2 | Low | 3.5/5.0 | 1 | Completeness, Quality |
| 4.3 | Panel | 4.5/5.0 | 3 | All categories |

## Rubric Templates by Category

### Correctness Rubric (Weight: 30%)
- Implementation matches specification exactly
- No syntax errors or invalid configurations
- File paths and names are correct
- Dependencies are properly referenced

### Completeness Rubric (Weight: 25%)
- All subtasks completed
- All acceptance criteria met
- No TODOs or placeholders remaining
- Edge cases considered

### Quality Rubric (Weight: 20%)
- Code/config is clean and readable
- Follows project conventions
- Properly structured and organized
- Maintainable and extensible

### Testing Rubric (Weight: 15%)
- Tests exist and are meaningful
- Tests pass consistently
- Coverage is appropriate
- Mock setup is comprehensive

### Integration Rubric (Weight: 10%)
- Works with dependent packages
- Pipeline integration correct
- No breaking changes
- CI/CD compatibility verified

## Notes

- Panel-level verifications require 3 independent judges
- High-level verifications use 2 judges for cross-validation
- Medium and Low levels use single judge for efficiency
- All thresholds must be met for step to pass
- Failed verifications trigger automatic retry (max 3 attempts)
