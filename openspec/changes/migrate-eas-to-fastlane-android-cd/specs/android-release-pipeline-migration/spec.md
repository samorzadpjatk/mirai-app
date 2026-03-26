## ADDED Requirements

### Requirement: Migration SHALL define parity with EAS Android build expectations

The migration plan SHALL document and enforce key Android build expectations currently provided by EAS Build, including toolchain setup, clean CI execution context, signing input handling, and artifact output conventions.

#### Scenario: Parity checklist validated before cutover

- **WHEN** the team prepares to switch CD from EAS Build/Submit to Fastlane
- **THEN** a parity checklist MUST confirm each required EAS-aligned Android build expectation is satisfied in the Fastlane workflow

### Requirement: Migration SHALL require explicit CI secret and environment contracts

The migration SHALL define a required set of CI secrets and environment variables for build and submission, and MUST validate presence and formatting before release execution.

#### Scenario: Preflight validation blocks unsafe release

- **WHEN** any required credential, environment variable, or configuration value is missing or malformed
- **THEN** the preflight step MUST fail the pipeline before build or submission starts

### Requirement: Migration SHALL provide rollback instructions

The release process SHALL retain a documented rollback path to temporarily restore the previous EAS-based release automation during the stabilization window.

#### Scenario: Rollback triggered after failed migration release

- **WHEN** the first Fastlane-driven release fails critical verification
- **THEN** operators MUST be able to re-enable the prior EAS release job using documented rollback steps

### Requirement: Migration SHALL include operational runbook updates

The change SHALL provide updated operational documentation for triggering lanes, troubleshooting common failures, and verifying successful Play submissions.

#### Scenario: On-call operator resolves release failure

- **WHEN** a release job fails in build or submit stage
- **THEN** the runbook MUST include lane-specific troubleshooting actions and verification commands sufficient for recovery

### Requirement: Migration SHALL define SemVer and Conventional Commits bump policy

The release process SHALL set `versionName` from SemVer computed by GitHub `semver-action` with bump intent derived from Conventional Commits: `feat` indicates minor, `fix` indicates patch, and major is triggered by `type!` or `BREAKING CHANGE`; commit types such as `chore`, `docs`, `test`, `refactor`, and `nit` without breaking markers SHALL not bump by default.

#### Scenario: Minor bump for feature commits

- **WHEN** the effective commit set includes `feat:` changes and no breaking marker
- **THEN** GitHub `semver-action` MUST resolve a minor SemVer bump for release versionName

#### Scenario: Patch bump for fix-only commits

- **WHEN** the effective commit set includes `fix:` changes and no `feat:` or breaking marker
- **THEN** GitHub `semver-action` MUST resolve a patch SemVer bump for release versionName

#### Scenario: Major bump for breaking changes

- **WHEN** the effective commit set includes `type!:` or `BREAKING CHANGE:`
- **THEN** GitHub `semver-action` MUST resolve a major SemVer bump for release versionName

#### Scenario: No default bump for non-release commit types

- **WHEN** the effective commit set contains only `chore`, `docs`, `test`, `refactor`, or `nit` commits without breaking markers
- **THEN** GitHub `semver-action` MUST keep versionName unchanged unless an explicit override is provided

### Requirement: Migration SHALL enforce CI-managed monotonic versionCode

The release process SHALL compute and apply `versionCode` in CI as an integer that is strictly monotonic for the Play app lineage.

#### Scenario: CI assigns strictly increasing versionCode

- **WHEN** a new Play-bound release is created
- **THEN** CI release automation MUST set a versionCode greater than any previously published versionCode for that app lineage

#### Scenario: Pipeline blocks non-monotonic versionCode

- **WHEN** computed or supplied versionCode is not greater than the latest published versionCode
- **THEN** the release pipeline MUST fail before upload with a clear monotonicity error

### Requirement: Migration SHALL enforce single signing lineage for promoted Play releases

The migration SHALL require one release signing lineage for artifacts that enter the Play promotion chain and SHALL prohibit swapping keystore lineage between `internal`, `beta`, and `production` promotions.

#### Scenario: Promotion rejects mixed Play signing lineage

- **WHEN** a promotion attempt references a release artifact signed with a different Play release lineage than the existing promoted artifact
- **THEN** the pipeline MUST reject the promotion and require a new release lifecycle
