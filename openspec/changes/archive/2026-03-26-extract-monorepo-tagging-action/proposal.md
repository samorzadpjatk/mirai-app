## Why

The Android release workflow currently owns SemVer resolution and tag creation, which couples global repository versioning to a single platform pipeline. As release automation grows across the monorepo, tagging needs to be managed once in a dedicated workflow so all changes are versioned consistently.

## What Changes

- Add a standalone GitHub Actions workflow dedicated to repository tagging in the monorepo.
- Move the SemVer/tag creation logic out of `android-release.yml` into the new workflow.
- Update the Android release workflow to consume the tagging outcome instead of creating tags directly.
- Run auto-tagging on every commit to `main`.
- If SemVer resolves to an existing tag, move/update that tag to the latest `main` commit instead of skipping.

## Capabilities

### New Capabilities

- `monorepo-release-tagging`: Centralized workflow capability to compute and publish SemVer tags for repository changes independently of Android build/release steps.

### Modified Capabilities

- None.

## Impact

- GitHub Actions workflows under `.github/workflows/`, especially `android-release.yml`.
- CI/release behavior around tag ownership, sequencing, and reuse across monorepo pipelines.
- No application runtime code changes; impact is limited to release automation and repository versioning process.
