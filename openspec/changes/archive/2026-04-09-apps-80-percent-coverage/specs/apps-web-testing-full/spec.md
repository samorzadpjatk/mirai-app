## ADDED Requirements

### Requirement: All web app utilities shall have comprehensive unit tests

The system SHALL provide 100% line coverage for all utility functions in `apps/web/src/lib/`, including fileValidation, auth, env, supabase, toast, and logout utilities.

#### Scenario: fileValidation.ts achieves full coverage

- **WHEN** running tests for fileValidation.ts
- **THEN** coverage SHALL be 100% lines and branches
- **AND** all edge cases SHALL be tested (zero, negative, NaN inputs)

#### Scenario: auth.ts utilities are tested

- **WHEN** testing auth helper functions
- **THEN** all exported functions SHALL have passing tests
- **AND** Supabase client initialization SHALL be testable with mocks

#### Scenario: env.ts configuration is validated

- **WHEN** testing environment variable handling
- **THEN** all env var access SHALL be covered
- **AND** missing variable scenarios SHALL be tested

#### Scenario: supabase.ts client creation is tested

- **WHEN** testing Supabase client initialization
- **THEN** both success and failure paths SHALL be covered
- **AND** environment-based configuration SHALL be tested

#### Scenario: toast utilities are tested

- **WHEN** testing toast helper functions
- **THEN** all toast types (success, error, loading) SHALL be covered
- **AND** toast configuration options SHALL be tested

#### Scenario: logout functionality is tested

- **WHEN** testing logout helper
- **THEN** Supabase signout SHALL be called
- **AND** local cleanup (storage, state) SHALL be verified

### Requirement: All web app hooks shall have comprehensive unit tests

The system SHALL provide comprehensive unit tests for all hooks in `apps/web/src/hooks/`, achieving 80%+ line coverage with Happy DOM for browser API mocking.

#### Scenario: useActiveTripId hook is fully tested

- **WHEN** testing useActiveTripId
- **THEN** URL param extraction SHALL be tested
- **AND** localStorage fallback SHALL be tested
- **AND** SSR safety SHALL be verified
- **AND** empty state handling SHALL be tested

#### Scenario: useChallengeForm hook is tested

- **WHEN** testing useChallengeForm
- **THEN** form state management SHALL be tested
- **AND** validation logic SHALL be covered
- **AND** submit handling SHALL be tested with mocked tRPC

#### Scenario: useChallengeSubmissions hook is tested

- **WHEN** testing useChallengeSubmissions
- **THEN** data fetching with tRPC SHALL be tested
- **AND** loading states SHALL be verified
- **AND** error handling SHALL be tested

#### Scenario: useJudgement hook is tested

- **WHEN** testing useJudgement
- **THEN** judgement state management SHALL be tested
- **AND** voting actions SHALL be tested with mocks
- **AND** optimistic updates SHALL be verified

#### Scenario: useStaffVoting hook is tested

- **WHEN** testing useStaffVoting
- **THEN** staff voting logic SHALL be tested
- **AND** permission checks SHALL be verified
- **AND** vote submission SHALL be tested

#### Scenario: useWebFileUpload hook is tested

- **WHEN** testing useWebFileUpload
- **THEN** file selection handling SHALL be tested
- **AND** upload progress tracking SHALL be verified
- **AND** error handling for invalid files SHALL be tested

### Requirement: Web app React island components shall be tested

The system SHALL provide unit tests for critical React island components, achieving 80%+ coverage on components with significant logic.

#### Scenario: LoginForm component is tested

- **WHEN** testing LoginForm
- **THEN** form rendering SHALL be verified
- **AND** input change handling SHALL be tested
- **AND** form submission SHALL be tested with mocked auth
- **AND** error state display SHALL be tested

#### Scenario: LogoutButton component is tested

- **WHEN** testing LogoutButton
- **THEN** button rendering SHALL be verified
- **AND** click handler SHALL trigger logout
- **AND** loading state during logout SHALL be tested

#### Scenario: Admin dashboard components are tested

- **WHEN** testing admin components (Rewards, Transactions, Challenges)
- **THEN** data fetching SHALL be tested
- **AND** CRUD operations SHALL be tested with mocks
- **AND** permission-based rendering SHALL be verified

### Requirement: Web app middleware shall be testable

The system SHALL ensure `apps/web/src/middleware.ts` can be tested with mocked request/response objects.

#### Scenario: Middleware auth checks are tested

- **WHEN** testing middleware
- **THEN** authenticated requests SHALL be allowed
- **AND** unauthenticated requests SHALL be redirected
- **AND** role-based access SHALL be verified
