# iOS Fastlane Release Runbook

This runbook defines iOS release operations after migrating from Xcode Cloud to Fastlane.

## Release Routing Model

SemVer classification drives destination automatically:

- `patch` -> TestFlight internal testing (`testflight_internal`)
- `minor` -> TestFlight external testing (`testflight_external`)
- `major` -> App Store distribution (`app_store`)

Classification is computed from current and previous SemVer tags in the `iOS Release (Fastlane)` workflow.

## Required GitHub Secrets

File payload secrets (base64 encoded):

- `IOS_PROFILE_MOBILEPROVISION_BASE64` -> `credentials/ios/profile.mobileprovision`
- `IOS_DIST_CERT_P12_BASE64` -> `credentials/ios/dist-cert.p12`
- `IOS_ASC_KEY_CONTENT_BASE64` -> `credentials/ios/asc-api-key.p8`

Plain-text secrets:

- `IOS_DIST_CERT_PASSWORD` (distribution certificate password; written to `credentials.json`)
- `IOS_BUNDLE_IDENTIFIER` (example: `edu.samorzadpjatk.mirai`)
- `IOS_ASC_KEY_ID`
- `IOS_ASC_ISSUER_ID`
- `IOS_TESTFLIGHT_EXTERNAL_GROUPS` (comma-separated, optional for external distribution)

## EAS iOS Phase Mapping

This maps Expo EAS iOS build phases to the new pipeline implementation.

1. Repository/build-context checks -> `fastlane ios ios_preflight_build` validates required env, files, tooling, bundle ID consistency.
2. Credentials restore -> workflow decodes profile/certificate to `credentials/ios/*`; Fastlane imports cert into temporary keychain and installs provisioning profile in `~/Library/MobileDevice/Provisioning Profiles`.
3. Dependency install -> workflow runs `bun install --frozen-lockfile`; lane also runs dependency install before prebuild for parity.
4. Optional EAS lifecycle hooks -> lane runs `eas-build-pre-install`, `eas-build-post-install`, `eas-build-on-success`, `eas-build-on-error`, `eas-build-on-complete` when scripts exist in `package.json`.
5. Managed project native generation -> lane runs `CI=1 bunx expo prebuild --platform ios --clean`.
6. Pod install -> lane runs `bundle exec pod install` in `ios/`.
7. Archive build -> lane runs `gym`, writes IPA to `dist/ios`, and writes `dist/ios/release-metadata.json`.
8. Artifact handoff + submit -> submit lane resolves IPA from explicit path/metadata/pattern and uploads via App Store Connect API key auth.

## Workflow Execution

1. Open GitHub Actions and run `iOS Release (Fastlane)`.
2. Workflow computes and validates SemVer routing (`patch/minor/major`), then logs resolved destination.
3. Workflow materializes signing files from base64 secrets and writes `credentials.json` with plain-text values.
4. Fastlane runs `ios_build`, generating `dist/ios/*.ipa` and `dist/ios/release-metadata.json`.
5. Fastlane runs `ios_submit` to the routed destination.
6. Workflow uploads IPA + metadata artifacts.

## Local Execution

From `apps/native`, with env vars set and credential files present:

```bash
bundle exec fastlane ios ios_release release_classification:patch
bundle exec fastlane ios ios_release release_classification:minor
bundle exec fastlane ios ios_release release_classification:major
```

You can also split stages:

```bash
bundle exec fastlane ios ios_build release_classification:patch
bundle exec fastlane ios ios_submit artifact_path:dist/ios/app-<version>.ipa release_classification:patch
```

## Side-by-Side Rehearsal Checklist

Use this before cutover:

- [ ] Run one iOS Fastlane release rehearsal on a non-production target and capture logs.
- [ ] Compare generated IPA metadata and signing lineage against expected EAS/Xcode Cloud outputs.
- [ ] Verify routed destination for each SemVer bump type (`patch`, `minor`, `major`).
- [ ] Confirm submit metadata appears in CI logs and artifact bundle contains `release-metadata.json`.

## Rollback Procedure

If Fastlane release fails critical checks during stabilization:

1. Disable/skip `iOS Release (Fastlane)` workflow dispatch for operators.
2. Re-enable the previous Xcode Cloud release trigger for the same app version line.
3. Restore previous secret wiring for Xcode Cloud if any mapping changed.
4. Open incident ticket with Fastlane failure logs and metadata artifact attached.
5. Fix Fastlane issue in branch, re-run rehearsal, and then re-enable Fastlane workflow.

## Troubleshooting

- `Missing required environment variable`: ensure required iOS secrets are present.
- `File not found for IOS_*_PATH`: verify base64 decode steps created files under `credentials/ios/`.
- `Provisioning profile ... incompatible with bundle identifier`: confirm profile app identifier matches `IOS_BUNDLE_IDENTIFIER`.
- `Unable to resolve iOS workspace/project`: verify `expo prebuild --platform ios` completed successfully.
- `Multiple iOS artifacts matched ...`: pass explicit `artifact_path` to `ios_submit`.
- App Store Connect auth errors: verify `IOS_ASC_KEY_ID`, `IOS_ASC_ISSUER_ID`, and `IOS_ASC_KEY_CONTENT_BASE64` are valid and not expired. Ensure the decoded key file at `credentials/ios/asc-api-key.p8` contains a valid `BEGIN PRIVATE KEY` block.
