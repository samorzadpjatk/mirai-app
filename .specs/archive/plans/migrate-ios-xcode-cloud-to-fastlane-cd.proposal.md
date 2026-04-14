---
title: "Migrate iOS Xcode Cloud to Fastlane CD"
type: proposal
status: done
created: "2026-03-28"
migrated_from: "openspec/changes/archive/2026-03-28-migrate-ios-xcode-cloud-to-fastlane-cd/proposal.md"
---

## Why

The current iOS release flow depends on Xcode Cloud for build and submission, which keeps key release logic outside the repository and makes it harder to keep Android and iOS CD behavior aligned. We need a Fastlane-based iOS workflow now so both platforms use the same CI/CD model, while preserving iOS build behavior that teams expect from EAS Build.

## What Changes

- Add a Fastlane-driven iOS CD workflow that builds and submits iOS artifacts from CI.
- Replace Xcode Cloud-triggered build and submit orchestration with repository-managed Fastlane lanes.
- Align iOS Fastlane build behavior with EAS Build iOS conventions documented by Expo (build preflight, credentials restore, dependency/install flow, optional EAS lifecycle hooks, `expo prebuild`/`pod install`, and `gym`-based archive generation).
- Mirror Android CD workflow conventions for lane structure, artifact handoff, environment validation, and non-interactive execution.
- Route iOS release destination by SemVer bump type using the Android convention: `patch` -> TestFlight internal testing, `minor` -> TestFlight external testing, `major` -> App Store distribution.
- Define required App Store Connect authentication, signing, and secret contracts for reliable CI builds and submissions.
- Require CI to decode `IOS_PROVISIONING_PROFILE_BASE64` into `credentials/ios/profile.mobileprovision` and `IOS_DISTRIBUTION_CERTIFICATE_BASE64` into `credentials/ios/dist-cert.p12`, then write `credentials.json` (including `ios.provisioningProfilePath`, `ios.distributionCertificate.path`, and `ios.distributionCertificate.password`) from secret inputs.
- Enforce release archive signing in Fastlane by updating project provisioning and passing archive `xcargs` for manual `Apple Distribution` signing with the profile team identifier to prevent development-certificate fallback.
- Document migration and rollback guidance so teams can move from Xcode Cloud to Fastlane safely.

## Capabilities

### New Capabilities

- `ios-fastlane-build-and-submit`: Build and submit iOS releases through Fastlane lanes in CI.
- `ios-release-pipeline-migration`: Standardize migration behavior, configuration, and validation when moving iOS CD from Xcode Cloud to Fastlane.

### Modified Capabilities

None.

## Impact

- Affected code: iOS CI/CD workflow definitions, Fastlane configuration (`Fastfile`, `Appfile`, lane logic), and release automation scripts.
- Affected systems: iOS build runners, Apple signing/certificates/profiles, TestFlight/App Store submission flow, and CI secret management.
- Dependencies: Fastlane tooling/plugins, Ruby runtime on CI runners, Xcode toolchain on macOS runners, and App Store Connect API credentials.
- Dependencies: CI secret contract for signing material and App Store Connect authentication values used by iOS lanes.
- Dependencies: CI secret format contract (base64 for file payloads, plain text for non-file values).
- Constraint: iOS release orchestration MUST live in repository-managed Fastlane code and MUST NOT require Xcode Cloud pipeline steps.
