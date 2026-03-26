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
2. Optionally set `release_from_ref` to limit Conventional Commit parsing range used for bump intent.
3. Wait for `Build + upload to internal` to finish.
4. Approve `Promote internal -> beta` when validation is complete.
5. Approve `Promote beta -> production` when beta sign-off is complete.

## Local CD Execution (without GitHub Actions)

You can run the same CD flow locally with Bun + Fastlane.

1. Export required environment variables (same values as repo secrets):
   - `ANDROID_APP_PACKAGE`
   - `ANDROID_SIGNING_LINEAGE`
   - `PLAY_JSON_KEY_PATH`
   - `ANDROID_KEYSTORE_PATH`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
2. From `apps/native`, run:

```bash
bun run release:android:local-cd
```

Optional flags:

- `--from-ref <git-ref>` and `--to-ref <git-ref>` to control bump intent commit range
- `--promote-beta` to include `internal -> beta` promotion
- `--promote-production` to include `beta -> production` promotion (requires `--promote-beta`)
- `--yes` to auto-approve local promotion gates without prompts

Examples:

```bash
# Build + internal upload only
bun run release:android:local-cd

# Build + internal upload + beta promotion with prompt
bun run release:android:local-cd -- --promote-beta

# Full local chain with non-interactive approvals
bun run release:android:local-cd -- --promote-beta --promote-production --yes
```

## Expected Outputs

- Built artifact: `apps/native/dist/android/app-<versionName>-<versionCode>.aab`
- Metadata: `apps/native/dist/android/release-metadata.json`

Metadata includes:

- `versionName` (SemVer resolved in CI by GitHub `semver-action`)
- `versionCode` (CI-managed monotonic integer)
- `artifactSha256` (artifact fingerprint for no-rebuild promotion evidence)
- `signingLineage` (single lineage identifier)

## Troubleshooting

- `Missing required environment variable`: verify repository variables/secrets are set.
- `Package mismatch`: ensure `ANDROID_APP_PACKAGE` equals `expo.android.package` in `app.json`.
- `File not found` for keystore or Play key: verify base64 secrets are valid and decode correctly.
- `Version code ... not found on <track>`: confirm internal upload succeeded and track propagation finished.
- `Monotonicity` failure: existing Play version code is greater or equal; inspect latest published code.
