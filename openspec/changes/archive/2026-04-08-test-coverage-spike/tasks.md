## 1. Setup and Infrastructure

- [x] 1.1 Verify bunfig.toml coverage thresholds are active (80% lines, 75% branches)
- [x] 1.2 Verify Happy DOM preload is working in happydom.ts
- [x] 1.3 Create `apps/web/src/lib/__tests__/` directory
- [x] 1.4 Create `apps/backend-server/src/utils/__tests__/` directory
- [x] 1.5 Create `apps/notification-sender/src/utils/__tests__/` directory
- [x] 1.6 Create `apps/web/src/hooks/__tests__/` directory
- [ ] 1.7 Run baseline `bun test --coverage` to capture current coverage metrics

## 2. Pure Function Testing Pattern - fileValidation.ts

- [x] 2.1 Create `apps/web/src/lib/__tests__/fileValidation.test.ts`
- [x] 2.2 Implement tests for formatBytes edge cases (zero, negative, NaN)
- [x] 2.3 Implement tests for formatBytes unit conversion (B → KB → MB → GB → TB)
- [x] 2.4 Implement tests for validateFileType with allowed types
- [x] 2.5 Implement tests for validateFileType with disallowed types
- [x] 2.6 Implement tests for validateFileType with empty allowed list
- [x] 2.7 Implement tests for validateFileSize within limit
- [x] 2.8 Implement tests for validateFileSize exceeding limit
- [x] 2.9 Implement tests for validateImageFile combining type and size validation
- [x] 2.10 Implement tests for DEFAULT_MAX_FILE_SIZE_MB and DEFAULT_IMAGE_MIME_TYPES constants
- [x] 2.11 Run tests and verify 100% line coverage for fileValidation.ts

## 3. External Mocking Pattern - headers.ts

- [x] 3.1 Create `apps/backend-server/src/utils/__tests__/headers.test.ts`
- [x] 3.2 Create type-level mock for FastifyRequest headers
- [x] 3.3 Implement tests for converting simple string header values
- [x] 3.4 Implement tests for handling array header values (multi-value headers)
- [x] 3.5 Implement tests for filtering out undefined values
- [x] 3.6 Implement tests for handling empty/undefined headers object
- [x] 3.7 Implement tests for converting non-string values to strings
- [x] 3.8 Run tests and verify 100% line coverage for headers.ts

## 4. Async and Timer Testing Pattern - scheduler.ts

- [x] 4.1 Create `apps/notification-sender/src/utils/__tests__/scheduler.test.ts`
- [x] 4.2 Implement tests for Scheduler.start() running task immediately via setTimeout
- [x] 4.3 Implement tests for Scheduler running task at regular intervals using fake timers
- [x] 4.4 Implement tests for Scheduler preventing double-start (warning logged)
- [x] 4.5 Implement tests for Scheduler.stop() clearing interval and updating state
- [x] 4.6 Implement tests for stopping inactive scheduler (no error thrown)
- [x] 4.7 Implement tests for Scheduler catching and logging task errors
- [x] 4.8 Implement tests for Scheduler continuing after task error
- [x] 4.9 Implement tests for isActive() returning correct state
- [x] 4.10 Implement tests for createInactivityScheduler factory function
- [x] 4.11 Run tests and verify 100% line coverage for scheduler.ts

## 5. React Hook Testing Pattern - useActiveTripId.ts

- [x] 5.1 Create `apps/web/src/hooks/__tests__/useActiveTripId.test.ts`
- [x] 5.2 Implement mock setup for window.location (URL search params)
- [x] 5.3 Implement mock setup for localStorage
- [x] 5.4 Implement test for extracting tripId from URL search params
- [x] 5.5 Implement test for falling back to localStorage when no URL param
- [x] 5.6 Implement test for returning empty string when neither source has value
- [x] 5.7 Implement test for SSR safety (using code verification approach due to RTL DOM requirements)
- [x] 5.8 Use `@testing-library/react` renderHook (Bun compatible with Happy DOM)
- [x] 5.9 Implement cleanup between tests to prevent state leakage
- [x] 5.10 Run tests and verify 100% line coverage for useActiveTripId.ts

## 6. Fix Existing Broken Tests

- [x] 6.1 Investigate JWT decode error in `packages/auth/src/__tests__/authServer.test.ts`
- [x] 6.2 Identify if error is environment-specific (Bun vs Node) or test data issue
- [x] 6.3 Fix mock JWT payload in failing test
- [x] 6.4 Run auth tests and verify all pass
- [x] 6.5 Document the fix in code comments for future reference

## 7. Documentation and Pattern Capture

- [x] 7.1 Create internal documentation for "Pure Function Testing Pattern" (fileValidation examples)
- [x] 7.2 Create internal documentation for "External Mocking Pattern" (headers examples)
- [x] 7.3 Create internal documentation for "Async and Timer Testing Pattern" (scheduler examples)
- [x] 7.4 Create internal documentation for "React Hook Testing Pattern" (useActiveTripId examples)
- [x] 7.5 Document Bun-specific behaviors discovered (timer API, mock differences from Jest)
- [x] 7.6 Create quick reference card for common test scenarios

## 8. Verification and Coverage

- [x] 8.1 Run full test suite: `bun test`
- [x] 8.2 Verify all 3 spike test files achieve 100% coverage
- [x] 8.3 Verify auth tests are now passing
- [x] 8.4 Capture total project coverage metrics (baseline for 80% goal)
- [x] 8.5 Verify coverage threshold enforcement (test should fail if below 80% lines)
- [x] 8.6 Run lint and typecheck to ensure no regressions
- [x] 8.7 Document lessons learned and next steps for full coverage rollout

## Success Criteria

- [x] All 3 spike files (fileValidation.ts, headers.ts, scheduler.ts) have 100% line coverage
- [x] useActiveTripId.ts hook has 100% line coverage with Happy DOM
- [x] Existing auth JWT test is fixed and passing
- [x] Total project coverage has measurable increase from baseline
- [x] 4 testing patterns are documented with working examples
- [x] CI pipeline passes with new tests
