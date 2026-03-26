# Android Fastlane Release Runbook

This runbook defines the Android release process after migration from EAS Build/EAS Submit.

## Release Model

- Single Play app lineage (`ANDROID_APP_PACKAGE`) and one signing lineage (`ANDROID_SIGNING_LINEAGE`) for Play-promoted artifacts.
- Build once and upload to `internal`.
- Promote same release to `beta`, then `production` with human approval at each hop.
- No rebuild between tracks.

## Required GitHub Secrets

- `PLAY_JSON_KEY_BASE64` (base64 encoded Play service account JSON)
- `ANDROID_KEYSTORE_BASE64` (base64 encoded release keystore)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_APP_PACKAGE` (example: `edu.samorzadpjatk.mirai`)
- `ANDROID_SIGNING_LINEAGE` (stable identifier like `play-release-v1`)

## Approval Gates

Configure protected environments with required reviewers:

- `android-beta-approval`
- `android-production-approval`

The workflow pauses before each promotion until approved.

## Release Execution

1. Open GitHub Actions and run `Android Release (Fastlane)`.
2. Workflow computes bump intent, creates/pushes SemVer tag via `semver-action`, and refreshes tags.
3. Fastlane reads latest repository SemVer tag as `versionName` and runs build + upload to internal.
4. Approve `Promote internal -> beta` when validation is complete.
5. Approve `Promote beta -> production` when beta sign-off is complete.

## Local CD Execution (without GitHub Actions)

You can run the same CD flow locally with Fastlane.

1. Option A: Create `apps/native/credential.json` from `apps/native/credential.example.json` and fill Android keystore values.
2. Option B: Export required environment variables directly (same values as repo secrets):
   - `ANDROID_APP_PACKAGE`
   - `ANDROID_SIGNING_LINEAGE`
   - `PLAY_JSON_KEY_PATH`
   - `ANDROID_KEYSTORE_PATH`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
3. From `apps/native`, run:

```bash
bundle exec fastlane android android_local_cd
```

Fastlane bootstrap behavior:

- If env vars are missing, Fastlane tries to populate Android release values from `credential.json` (or `CREDENTIALS_JSON_PATH`).
- `ANDROID_APP_PACKAGE` falls back to `expo.android.package` from `app.json`.
- `PLAY_JSON_KEY_PATH` defaults to `credentials/android/play-credentials.json` or `credentials/android/service-account.json` when present.

Examples:

```bash
# Build + internal upload only
bundle exec fastlane android android_local_cd

# Build + internal upload + beta promotion with prompt
bundle exec fastlane android android_local_cd promote_beta:true

# Full local chain with non-interactive approvals
bundle exec fastlane android android_local_cd promote_beta:true promote_production:true auto_approve:true
```

## Expected Outputs

- Built artifact: `apps/native/dist/android/app-<versionName>-<versionCode>.aab`
- Metadata: `apps/native/dist/android/release-metadata.json`

Metadata includes:

- `versionName` (latest repository SemVer tag created by GitHub Actions)
- `versionCode` (CI-managed monotonic integer)
- `artifactSha256` (artifact fingerprint for no-rebuild promotion evidence)
- `signingLineage` (single lineage identifier)

## Troubleshooting

- `Missing required environment variable`: verify repository variables/secrets are set.
- `Package mismatch`: ensure `ANDROID_APP_PACKAGE` equals `expo.android.package` in `app.json`.
- `File not found` for keystore or Play key: verify base64 secrets are valid and decode correctly.
- `Version code ... not found on <track>`: confirm internal upload succeeded and track propagation finished.
- `Monotonicity` failure: existing Play version code is greater or equal; inspect latest published code.
