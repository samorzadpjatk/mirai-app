## Why

The current Android release flow depends on EAS Build and EAS Submit, which limits control over CI/CD behavior, signing, and release orchestration in our own pipeline. We need a Fastlane-based workflow now to unify build and submission automation in app CD while preserving Android build behavior expected from Expo/EAS projects.

## What Changes

- Add a Fastlane-driven Android CD workflow that builds and submits Android artifacts from CI.
- Replace EAS Build/EAS Submit invocation in release automation with explicit Fastlane lanes.
- Mirror key EAS Android build expectations (environment setup, Gradle invocation, artifact handling, and signing inputs) based on official Expo documentation.
- Add GitHub Actions-based semantic version tagging to the repository.
- Configure GitHub `semver-action` with trunk-based custom settings for SemVer/tag decisions.
- Make Fastlane consume repository semver tags as the source of truth for app `versionName`, without running bump checks in `Fastfile`.
- Keep release orchestration and runtime logic in Ruby Fastlane configuration (`Fastfile`/`Appfile`), without Bun/Node helper scripts.
- Define required secrets, environment variables, and validation steps for reliable non-interactive CI execution.
- Add migration and rollback guidance so teams can switch safely from EAS-managed release steps.

## Capabilities

### New Capabilities

- `android-fastlane-build-and-submit`: Build Android app artifacts and submit them through Fastlane lanes within CD.
- `android-release-pipeline-migration`: Provide standardized migration behavior, required configuration, and operational checks when moving from EAS to Fastlane.

### Modified Capabilities

None.

## Impact

- Affected code: CI/CD workflow definitions, Fastlane configuration (`Fastfile`, `Appfile`, lane scripts), and release automation scripts.
- Affected systems: Android build runners, artifact storage, Google Play submission flow, and secret management.
- Dependencies: Fastlane tooling/plugins, Ruby runtime on CI runners, Android SDK/Java/Gradle setup, and Play Console service account credentials.
- Dependencies: GitHub Actions permissions capable of creating tags and a semver-tagging workflow integrated with release flow.
- Dependencies: `semver-action` trunk-based custom configuration maintained in GitHub Actions workflow.
- Constraint: release logic MUST remain Ruby-native in Fastlane files and MUST NOT depend on Bun/Node runtime scripts.
