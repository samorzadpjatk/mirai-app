## ADDED Requirements

### Requirement: CI pipeline shall enforce coverage thresholds

The system SHALL integrate coverage checks into the CI pipeline, failing builds if coverage falls below 80% lines and 75% branches.

#### Scenario: Coverage check runs on PR

- **WHEN** a pull request is opened
- **THEN** CI SHALL run tests with coverage
- **AND** coverage report SHALL be generated
- **AND** build SHALL fail if below threshold

#### Scenario: Coverage thresholds are configurable

- **WHEN** examining CI configuration
- **THEN** 80% line threshold SHALL be enforced
- **AND** 75% branch threshold SHALL be enforced
- **AND** thresholds SHALL match bunfig.toml

#### Scenario: Coverage delta is checked

- **WHEN** PR coverage is calculated
- **THEN** delta from main branch SHALL be computed
- **AND** PR SHALL fail if coverage decreases significantly

### Requirement: Coverage reports shall be generated and accessible

The system SHALL generate human-readable and machine-readable coverage reports.

#### Scenario: HTML coverage report is generated

- **WHEN** running tests with --coverage
- **THEN** HTML report SHALL be created
- **AND** report SHALL show file-by-file coverage
- **AND** uncovered lines SHALL be highlighted

#### Scenario: LCOV report is generated for CI integration

- **WHEN** CI runs tests
- **THEN** LCOV format SHALL be output
- **AND** coverage services (CodeCov, Coveralls) SHALL be supported

#### Scenario: Coverage badge is available

- **WHEN** viewing README
- **THEN** coverage percentage badge SHALL display
- **AND** badge SHALL update automatically

### Requirement: Coverage enforcement shall support hybrid test runners

The system SHALL aggregate coverage from both Bun and Jest test runs into a single metric.

#### Scenario: Bun and Jest coverage is combined

- **WHEN** running full test suite
- **THEN** Bun test coverage SHALL be collected
- **AND** Jest (native) coverage SHALL be collected
- **AND** combined coverage SHALL be computed

#### Scenario: Separate coverage reports are available

- **WHEN** examining coverage details
- **THEN** per-app coverage SHALL be visible
- **AND** web app coverage SHALL be separate from native
- **AND** package coverage SHALL be separate from apps

### Requirement: PR process includes coverage review

The system SHALL integrate coverage information into the PR review process.

#### Scenario: Coverage comment is posted on PR

- **WHEN** PR is opened
- **THEN** coverage summary SHALL be posted as comment
- **AND** changed files coverage SHALL be highlighted
- **AND** uncovered lines in diff SHALL be listed

#### Scenario: Coverage check is required for merge

- **WHEN** PR is ready to merge
- **THEN** coverage check SHALL be a required status check
- **AND** admin override SHALL be available for edge cases
