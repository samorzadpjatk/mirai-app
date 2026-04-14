---
title: "Migrate iOS Xcode Cloud to Fastlane CD"
type: task
status: done
created: "2026-03-28"
migrated_from: "openspec/changes/archive/2026-03-28-migrate-ios-xcode-cloud-to-fastlane-cd/tasks.md"
---

## 1. Fastlane iOS Lane Foundation

- [x] 1.1 Add `ios_build`, `ios_submit`, and composed `ios_release` lanes in repository Fastlane configuration.
- [x] 1.2 Add lane input validation for required App Store Connect auth, signing values, and bundle identifiers.
- [x] 1.3 Implement build-stage output contract that publishes resolved IPA artifact path for downstream submit.
- [x] 1.4 Implement SemVer-based destination routing in release lane: `patch -> TestFlight internal`, `minor -> TestFlight external`, `major -> App Store`.

## 2. EAS iOS Build Parity

- [x] 2.1 Implement CI preflight checks that mirror EAS iOS expectations (build context, required tools, credential presence, and compatibility checks).
- [x] 2.2 Implement EAS-aligned build sequence in CI/Fastlane: dependency install, managed-project `expo prebuild` when applicable, `pod install`, and `gym` archive export.
- [x] 2.3 Add support for optional lifecycle hook execution in documented phase order when project scripts are configured.
- [x] 2.4 Implement configurable/pattern-based IPA archive path resolution compatible with EAS `applicationArchivePath` semantics.
- [x] 2.5 Materialize `credentials/ios/profile.mobileprovision` from `IOS_PROVISIONING_PROFILE_BASE64` and `credentials/ios/dist-cert.p12` from `IOS_DISTRIBUTION_CERTIFICATE_BASE64` before lane execution.
- [x] 2.6 Materialize `credentials.json` from secret inputs with `ios.provisioningProfilePath=credentials/ios/profile.mobileprovision`, `ios.distributionCertificate.path=credentials/ios/dist-cert.p12`, and `ios.distributionCertificate.password`, then validate Fastlane consumption.
- [x] 2.7 Enforce archive-time manual distribution signing in Fastlane (`CODE_SIGN_STYLE=Manual`, `CODE_SIGN_IDENTITY=Apple Distribution`, `DEVELOPMENT_TEAM=<profile team>`) and apply provisioning profile UUID to project before `gym`.

## 3. Submission and Operational Controls

- [x] 3.1 Implement submit-stage behavior to consume build-produced IPA path (or explicit override) and fail fast on ambiguous/missing artifacts.
- [x] 3.2 Add non-interactive App Store Connect upload flow with CI-visible submission metadata.
- [x] 3.3 Add iOS runbook updates for lane usage, failure diagnostics, and verification of successful submission.
- [x] 3.4 Add CI logging and guardrails to show resolved SemVer bump classification and destination routing before submit.

## 4. Migration and Rollback

- [x] 4.1 Document phase-by-phase mapping from Expo EAS iOS build reference steps to new Fastlane/CI implementation.
- [ ] 4.2 Execute side-by-side migration rehearsal and validate parity checklist before cutover. (Blocked: requires live Apple/App Store Connect access in CI)
- [x] 4.3 Document rollback procedure to restore Xcode Cloud release path during stabilization window.
- [ ] 4.4 Rehearse patch/minor/major release flows and verify each goes to the expected target (`internal` TF, `external` TF, App Store). (Blocked: requires live releases in CI)
