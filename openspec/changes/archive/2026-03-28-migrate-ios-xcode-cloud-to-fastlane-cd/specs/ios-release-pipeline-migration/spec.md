## ADDED Requirements

### Requirement: Migration SHALL define parity baseline with EAS Build iOS expectations

The migration plan SHALL document and validate the iOS build expectations defined by Expo EAS Build iOS behavior, including clean build context checks, credentials restore/verification, install and native preparation ordering, archive generation with `gym`, and archive output resolution for downstream submission.

#### Scenario: EAS parity checklist completed before cutover

- **WHEN** the team prepares to switch iOS CD to Fastlane
- **THEN** a parity checklist MUST confirm required EAS iOS build expectations are satisfied in the Fastlane workflow

### Requirement: Migration SHALL require explicit CI secret and environment contracts

The migration SHALL define the required set of CI-provided secrets and environment variables for iOS build and submission and MUST validate them before lane execution.

iOS signing files SHALL be materialized from base64-encoded environment secrets:

- `IOS_PROVISIONING_PROFILE_BASE64` → `credentials/ios/profile.mobileprovision`
- `IOS_DISTRIBUTION_CERTIFICATE_BASE64` → `credentials/ios/dist-cert.p12`

`credentials.json` SHALL be materialized from secret-sourced configuration and MUST include:

- `ios.distributionCertificate.path`: relative path to distribution certificate (defaults to `credentials/ios/dist-cert.p12`)
- `ios.distributionCertificate.password`: plain-text password for certificate import
- `ios.provisioningProfilePath`: relative path to provisioning profile (defaults to `credentials/ios/profile.mobileprovision`)

The `bootstrap_ios_release_env!` function SHALL read `credentials.json` and populate environment variables consumed by signing material preparation.

#### Scenario: Preflight blocks missing or malformed credentials

- **WHEN** any required App Store Connect, signing, or bundle configuration value is absent or invalid
- **THEN** preflight MUST fail before invoking build or submit lanes

#### Scenario: Signing inputs are validated before build

- **WHEN** iOS release workflow starts
- **THEN** the pipeline MUST validate required signing assets and identifier consistency before running the build lane

#### Scenario: Archive-time signing overrides prevent development-cert fallback

- **WHEN** the Xcode project contains stale or mixed signing identities
- **THEN** Fastlane archive execution MUST explicitly set release signing to manual `Apple Distribution` with the provisioning profile team identifier so builds do not require `iOS Development` certificates

#### Scenario: Base64 signing files are decoded to expected paths

- **WHEN** CI workflow begins credential preparation
- **THEN** it MUST decode `IOS_PROVISIONING_PROFILE_BASE64` to `credentials/ios/profile.mobileprovision` and `IOS_DISTRIBUTION_CERTIFICATE_BASE64` to `credentials/ios/dist-cert.p12` before build lane execution

#### Scenario: credentials.json references materialized signing files

- **WHEN** `credentials.json` is created in CI
- **THEN** it MUST contain `ios.provisioningProfilePath` pointing to `credentials/ios/profile.mobileprovision` and `ios.distributionCertificate.path` pointing to `credentials/ios/dist-cert.p12`

#### Scenario: Plain-text signing password is available in credentials.json

- **WHEN** distribution certificate password is provided as CI secret (e.g., `IOS_DIST_CERT_PASSWORD`)
- **THEN** workflow MUST write it to `credentials.json` at `ios.distributionCertificate.password` and Fastlane MUST consume it for certificate import without interactive prompts

### Requirement: Migration SHALL provide rollback instructions

The migration SHALL retain and document a rollback path to temporarily restore the previous Xcode Cloud release process during stabilization.

#### Scenario: Rollback after failed migration release

- **WHEN** an early Fastlane-driven iOS release fails critical validation
- **THEN** operators MUST be able to restore Xcode Cloud release execution using documented rollback steps

### Requirement: Migration SHALL include operational runbook updates

The change SHALL provide updated runbook guidance for triggering iOS Fastlane lanes, troubleshooting lane-specific failures, and verifying successful submissions.

#### Scenario: Operator resolves failed iOS release job

- **WHEN** a build or submit stage fails in CI
- **THEN** the runbook MUST provide lane-specific diagnostics and recovery actions sufficient for on-call resolution

### Requirement: Migration SHALL align iOS CD structure with Android Fastlane conventions

The iOS workflow SHALL follow the same control pattern used by Android Fastlane CD, including split build/submit lanes, a composed release lane, preflight validation, and explicit artifact handoff between stages.

#### Scenario: iOS workflow exposes Android-aligned control model

- **WHEN** operators inspect release lane structure for both platforms
- **THEN** iOS MUST present equivalent build-only, submit-only, and composed release controls with matching preflight and handoff semantics

### Requirement: Migration SHALL align iOS release routing with Android SemVer convention

The iOS migration SHALL implement Android-equivalent SemVer routing conventions so release audience and distribution channel are selected from bump type without manual destination branching.

#### Scenario: Routing policy is documented and enforced

- **WHEN** a release is classified as patch, minor, or major
- **THEN** the workflow MUST enforce `patch -> TestFlight internal`, `minor -> TestFlight external`, and `major -> App Store distribution`

### Requirement: Migration runbook SHALL map each EAS iOS build phase to Fastlane/CI implementation

The migration documentation SHALL include an explicit phase mapping between EAS Build iOS reference steps and the corresponding Fastlane lane or CI step used after migration.

#### Scenario: Operator can trace EAS phase to new pipeline step

- **WHEN** maintainers review migration documentation
- **THEN** they MUST be able to locate a phase-by-phase mapping from EAS iOS build behavior to implemented Fastlane and CI steps
