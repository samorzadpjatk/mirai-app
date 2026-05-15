## ADDED Requirements

### Requirement: iOS CD SHALL build release artifacts with Fastlane

The iOS CD workflow SHALL provide a Fastlane build lane that produces a release IPA in non-interactive CI mode using project-defined iOS tooling, signing configuration, and export options.

#### Scenario: CI build lane produces release IPA

- **WHEN** the iOS build lane runs with valid signing and environment inputs
- **THEN** the lane MUST execute build/export steps and output an IPA artifact at a deterministic path

#### Scenario: Build lane fails fast on missing prerequisites

- **WHEN** required signing assets, App Store Connect authentication values, or iOS toolchain prerequisites are missing
- **THEN** the lane MUST fail before build execution with actionable error messages

#### Scenario: Build lane uses CI-materialized provisioning profile path

- **WHEN** CI decodes iOS signing secrets before lane execution
- **THEN** Fastlane MUST read `ios.provisioningProfilePath` from `credentials.json`, resolve `credentials/ios/profile.mobileprovision`, and use that profile for signing/export configuration

#### Scenario: Archive enforces distribution signing for release destinations

- **WHEN** build lane archives for TestFlight or App Store distribution
- **THEN** archive MUST use manual signing with `Apple Distribution`, resolved provisioning profile UUID, and profile team identifier instead of development identity defaults

### Requirement: iOS build lane SHALL follow EAS Build iOS lifecycle semantics

The iOS build lane SHALL preserve EAS Build iOS process expectations as documented by Expo, including repository/build-context preflight, credential restoration for signing, dependency installation, managed-project native generation when required, CocoaPods installation, and `fastlane gym` archive generation.

#### Scenario: Build runs EAS-aligned preparation and native steps

- **WHEN** an iOS build is triggered in CI
- **THEN** the lane MUST execute an EAS-aligned sequence that includes preflight checks, dependency install, `expo prebuild` for managed projects, `pod install`, and `gym` archive export

#### Scenario: Build validates credential pairing before archive

- **WHEN** certificate and provisioning profile inputs are restored for signing
- **THEN** the pipeline MUST verify they are compatible before invoking `gym`

#### Scenario: Optional EAS lifecycle hooks are honored when configured

- **WHEN** project scripts equivalent to EAS lifecycle hooks are configured
- **THEN** the build process MUST execute them in the documented phase order with non-interactive CI behavior

### Requirement: iOS CD SHALL submit built artifacts with Fastlane

The iOS CD workflow SHALL provide a Fastlane submit lane that uploads a previously built IPA to the configured App Store Connect destination using non-interactive authentication.

#### Scenario: Submit lane uploads IPA successfully

- **WHEN** a valid IPA path and valid App Store Connect credentials are provided
- **THEN** the lane MUST upload the artifact to the configured destination and report submission metadata in CI logs

#### Scenario: Submit lane rejects invalid IPA references

- **WHEN** the provided artifact path does not exist or is incompatible with submission requirements
- **THEN** the lane MUST fail before upload with an actionable validation error

### Requirement: iOS submission destination SHALL follow SemVer routing policy

The iOS release workflow SHALL determine submission destination from the SemVer bump classification using Android-aligned policy: `patch` targets TestFlight internal testing, `minor` targets TestFlight external testing, and `major` targets App Store distribution.

#### Scenario: Patch release routes to TestFlight internal

- **WHEN** release classification is `patch`
- **THEN** submit MUST target TestFlight internal testing destination

#### Scenario: Minor release routes to TestFlight external

- **WHEN** release classification is `minor`
- **THEN** submit MUST target TestFlight external testing destination

#### Scenario: Major release routes to App Store distribution

- **WHEN** release classification is `major`
- **THEN** submit MUST target App Store distribution destination

### Requirement: iOS release orchestration SHALL support build-only and submit-only execution

The workflow SHALL support running build and submit lanes independently, and SHALL also expose an orchestrated release lane that composes both stages for end-to-end delivery.

#### Scenario: Submit-only rerun after successful build

- **WHEN** an already-built IPA is approved for re-submission
- **THEN** operators MUST be able to run the submit lane without triggering a new build

#### Scenario: Orchestrated release runs in sequence

- **WHEN** the composed release lane is executed
- **THEN** it MUST run build before submit and stop on the first failing stage

### Requirement: Build and submit stages SHALL use explicit artifact handoff

The submit stage SHALL consume the exact IPA reference produced by build outputs (or an explicit override) and SHALL NOT assume a static filename when dynamic or versioned names are used.

#### Scenario: Submit consumes build-produced artifact reference

- **WHEN** build publishes an IPA at a versioned or dynamic path
- **THEN** submit MUST use the build-provided artifact reference for upload

#### Scenario: Missing handoff reference blocks submission

- **WHEN** submit cannot resolve an IPA from build outputs and no explicit artifact override is provided
- **THEN** the lane MUST fail before upload with guidance to provide the artifact path

### Requirement: iOS build artifact resolution SHALL match EAS archive path behavior

The iOS workflow SHALL support explicit IPA archive path configuration and pattern-based resolution so submit uses the same artifact-selection semantics expected from EAS Build `applicationArchivePath` behavior.

#### Scenario: Configured archive path resolves IPA for submit

- **WHEN** build publishes IPA using configured or pattern-based archive path rules
- **THEN** submit MUST resolve and upload the matching IPA artifact without requiring static filename assumptions

### Requirement: iOS release logic SHALL be implemented in repository Fastlane configuration

iOS release orchestration, preflight validation, and lane behavior SHALL be implemented in repository-managed Fastlane Ruby files and SHALL NOT depend on Xcode Cloud runtime pipelines.

#### Scenario: Release execution does not require Xcode Cloud pipeline steps

- **WHEN** iOS release lanes execute in CI
- **THEN** all release-critical behavior MUST run via repository Fastlane configuration without invoking Xcode Cloud jobs
