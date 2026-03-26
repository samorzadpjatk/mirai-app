## 1. Fastlane Foundation

- [x] 1.1 Add Android Fastlane configuration files (`Fastfile`, `Appfile`, Gem dependencies) aligned with current project package ID and Play app mapping
- [x] 1.2 Implement `android_build`, `android_submit`, and composed `android_release` lanes with non-interactive CI-safe defaults
- [x] 1.3 Configure lane parameters for artifact path, release track, and submission metadata so submit-only runs can reuse prior artifacts
- [x] 1.4 Enforce single Play app lineage configuration (one app ID and one release signing lineage for promoted artifacts)
- [x] 1.5 Remove Bun/Node release helper scripts and port release-critical logic into Fastlane Ruby (`Fastfile`/`Appfile`)
- [x] 1.6 Align `android_build`/`android_submit` artifact contract so submit can resolve versioned AAB outputs (for example `app-<versionName>-<versionCode>.aab`) without default-path mismatch

## 2. CI/CD Workflow Migration

- [x] 2.1 Create or update Android CD workflow to install Ruby/Fastlane and pinned Android toolchain versions before lane execution
- [x] 2.2 Replace EAS Build/EAS Submit steps in the release pipeline with Fastlane lane invocations
- [x] 2.3 Publish build artifacts from CI to deterministic storage paths and pass artifact references between build and submit stages
- [x] 2.4 Implement immutable promotion flow `internal -> beta -> production` using the same uploaded release (no rebuild policy)
- [x] 2.5 Add manual approval gates for each promotion hop (`internal -> beta` and `beta -> production`)
- [x] 2.6 Update CI artifact handoff to pass build-produced artifact path into submit stage explicitly

## 3. Preflight Validation and Parity Controls

- [x] 3.1 Implement preflight checks for required secrets (including base64 env-materialized `credentials/android/google-services.json`), keystore files, package ID consistency, and Play service account availability
- [x] 3.2 Add EAS-parity checklist validation for Android build expectations (clean context, signing handling, artifact conventions)
- [x] 3.3 Fail pipeline early with actionable error messages when any preflight or parity validation fails
- [x] 3.4 Integrate GitHub `semver-action` trunk-based custom workflow that creates SemVer tags in the repository (`feat`=minor, `fix`=patch, breaking markers=major, non-release types=no default bump)
- [x] 3.5 Implement CI-managed versioning where Fastlane derives `versionName` from latest repository semver tag and enforces strictly monotonic `versionCode`
- [x] 3.6 Ensure preflight/version/credential handling in release runtime does not depend on Bun/Node helper scripts and that Fastlane does not run bump checks

## 4. Migration Safety and Operations

- [x] 4.1 Document migration runbook covering lane usage, track selection, and common troubleshooting paths
- [x] 4.2 Document rollback procedure to temporarily restore prior EAS-based release job during stabilization window
- [ ] 4.3 Execute a dual-run validation release (Fastlane build versus current release outputs) and capture sign-off criteria for cutover

## 5. Verification

- [x] 5.1 Validate build-only lane can generate release artifact successfully in CI
- [ ] 5.2 Validate submit-only lane can upload an existing artifact to a non-production Play track
- [x] 5.3 Validate composed release lane stops on first failure and reports stage-specific diagnostics
- [ ] 5.4 Validate promotion uses identical artifact fingerprint/release identity across `internal`, `beta`, and `production`
- [ ] 5.5 Validate approval gates block promotion until explicit human approval is granted
- [ ] 5.6 Validate trunk-based custom `semver-action` repository tag bump outcomes against representative Conventional Commit histories and confirm no-tag-change behavior for non-release commit types
- [ ] 5.7 Validate Android release lanes run end-to-end without Bun/Node helper script dependencies
- [ ] 5.8 Validate submit-only lane succeeds when artifact filename is versioned and differs from `dist/android/app-release.aab`
