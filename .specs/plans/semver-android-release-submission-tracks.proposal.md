---
title: "SemVer Android Release Submission Tracks"
type: proposal
status: done
created: "2026-03-27"
migrated_from: "openspec/changes/archive/2026-03-27-semver-android-release-submission-tracks/proposal.md"
---

## Why

The Android release pipeline currently lacks a consistent rule for which track to submit to after a build. This creates manual decisions and inconsistent rollout risk, so we need an explicit SemVer-based policy that is predictable and automatic.

## What Changes

- Define SemVer-driven release track routing in the Android release pipeline.
- Always submit to the internal track for every change, regardless of version bump type.
- Submit to the beta track only for minor releases (`X.Y.0`, where `Y` increases).
- Submit to the production track only for major releases (`X.0.0`, where `X` increases).
- Exclude patch-only releases from beta and production submission.
- Add validation to ensure version metadata is parseable as SemVer before deciding tracks.
- Prefer a maintained GitHub Action for SemVer parsing/comparison over custom scripting where possible.

## Capabilities

### New Capabilities

- `android-release-track-routing`: Determines Android Play submission tracks from SemVer bump type, including mandatory internal submission and conditional beta/production submission.

### Modified Capabilities

- None.

## Impact

- Affected systems: Android release CI/CD workflow and release automation scripts.
- Affected behavior: Google Play track submission sequence and conditional publication targets.
- Dependencies: Existing version source used by the pipeline must provide valid SemVer.
- Dependencies: Third-party GitHub Action `madhead/semver-utils` for SemVer parsing/comparison (or approved equivalent).
- Operational impact: More deterministic release promotions with lower risk of accidental production pushes.
