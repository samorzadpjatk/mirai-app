## ADDED Requirements

### Requirement: Android CD SHALL build release artifacts with Fastlane

The Android CD workflow SHALL provide a Fastlane build lane that produces a release Android artifact (AAB and/or APK as configured) in non-interactive CI mode using project-defined Android tooling and signing configuration.

#### Scenario: CI build lane produces release artifact

- **WHEN** the Android release build lane is triggered with valid environment and signing inputs
- **THEN** the lane MUST execute Gradle-based release build steps and output the configured artifact at a deterministic path

#### Scenario: Build fails fast on missing prerequisites

- **WHEN** required signing files, keystore credentials, or Android toolchain variables are missing
- **THEN** the lane MUST fail before build execution with an actionable error message

### Requirement: Android CD SHALL submit built artifacts to Google Play with Fastlane

The Android CD workflow SHALL provide a Fastlane submit lane that uploads a previously built artifact to a configured Google Play track using service account credentials and non-interactive authentication.

#### Scenario: Submit lane uploads artifact to target track

- **WHEN** a valid artifact path and Play service account credentials are provided
- **THEN** the lane MUST upload the artifact to the configured track and return submission metadata in CI logs

#### Scenario: Submit lane rejects invalid artifact references

- **WHEN** the provided artifact path does not exist or is incompatible with submission requirements
- **THEN** the lane MUST fail and report the invalid artifact condition without attempting partial submission

### Requirement: Android release orchestration SHALL support build-only and submit-only execution

The workflow SHALL support independently running build and submit lanes, and an orchestrated release lane that composes both for end-to-end delivery.

#### Scenario: Re-submit without rebuild

- **WHEN** a previously generated artifact is approved for re-submission
- **THEN** operators MUST be able to run submit-only lane without triggering a new build

#### Scenario: Full release runs composed flow

- **WHEN** the orchestrated release lane is executed
- **THEN** it MUST run build then submit in sequence and stop on the first failing stage

### Requirement: Android Play promotion SHALL use a single app lineage

The workflow SHALL treat the Play release as a single lineage for one application ID and one promotion chain, where the same uploaded release is promoted from `internal` to `beta` to `production` without rebuilding.

#### Scenario: Promotion chain uses same release artifact lineage

- **WHEN** a release is uploaded to `internal`
- **THEN** subsequent promotions to `beta` and `production` MUST reference the same Play release lineage and MUST NOT trigger a rebuild

#### Scenario: Promotions target fixed track order

- **WHEN** a release is approved for promotion
- **THEN** the pipeline MUST enforce track order `internal -> beta -> production`

### Requirement: Android Play promotion SHALL be human-gated at each hop

Promotion from one track to the next SHALL require explicit human approval before the next promotion action is executed.

#### Scenario: Internal to beta waits for approval

- **WHEN** a release is available in `internal`
- **THEN** promotion to `beta` MUST remain paused until a human approval gate is satisfied

#### Scenario: Beta to production waits for approval

- **WHEN** a release is available in `beta`
- **THEN** promotion to `production` MUST remain paused until a human approval gate is satisfied

### Requirement: Promotion SHALL preserve immutable release identity

The workflow SHALL preserve immutable artifact and release identity across promotions so that each promoted track points to the same build output and Play release reference.

#### Scenario: Release identity is preserved across tracks

- **WHEN** a release is promoted from one track to another
- **THEN** the pipeline MUST carry forward the same artifact fingerprint and Play release identifier for traceability
