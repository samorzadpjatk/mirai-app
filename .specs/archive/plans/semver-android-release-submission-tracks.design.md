---
title: "SemVer Android Release Submission Tracks"
type: design
status: done
created: "2026-03-27"
migrated_from: "openspec/changes/archive/2026-03-27-semver-android-release-submission-tracks/design.md"
---

## Context

The Android release pipeline currently submits artifacts without a strict, version-based policy for promotion tracks. We need deterministic routing so every build is available internally, while wider rollout depends on SemVer bump type.

Constraints:

- The pipeline must consume the existing app version source.
- Release automation must fail fast when version data is not valid SemVer.
- Track submission must remain idempotent and safe to re-run.

## Goals / Non-Goals

**Goals:**

- Enforce a single routing policy: internal for all changes, beta for minor, production for major.
- Use SemVer parsing and bump classification to drive routing decisions.
- Make routing outcomes visible in pipeline logs for auditability.

**Non-Goals:**

- Changing versioning strategy outside standard SemVer.
- Redesigning unrelated release stages (build, signing, artifact upload).
- Introducing progressive rollout percentages or staged rollout policy changes.

## Decisions

- Add a dedicated routing step that classifies the release as `major`, `minor`, or `patch` from the current version compared with the previous released version.
  - Rationale: centralizes policy logic and avoids duplicated conditional checks.
  - Alternative considered: hardcoding per-pipeline branch conditions; rejected because it is harder to test and maintain.
- Implement SemVer parsing/comparison through a maintained GitHub Action (`madhead/semver-utils`) rather than a custom runtime script.
  - Rationale: reduces custom maintenance burden and delegates SemVer edge-case handling to a purpose-built action.
  - Alternative considered: keeping an in-repo Bun helper script; rejected because it duplicates behavior already available from a reusable action.
- Always enqueue internal submission before any conditional tracks.
  - Rationale: guarantees baseline availability for QA and validation on every release.
  - Alternative considered: conditional internal submission; rejected because it violates the requested policy.
- Map classification to tracks:
  - `patch` -> internal only
  - `minor` -> internal + beta
  - `major` -> internal + production
  - Rationale: directly expresses required SemVer policy and keeps behavior explicit.
- Fail pipeline when SemVer parsing or diff classification cannot be computed.
  - Rationale: prevents accidental submission to incorrect tracks.
  - Alternative considered: fallback to internal-only; rejected because silent fallback can hide release metadata defects.

## Risks / Trade-offs

- Invalid or missing previous-version reference can block releases -> Add explicit precheck and actionable error output.
- Major/minor detection can be wrong if version tags drift from released artifacts -> Source previous version from the same authoritative release metadata used by deployment.
- Production-only-on-major may reduce release cadence to production -> This is intentional policy; monitor cycle time and revisit if needed.

## Migration Plan

1. Integrate `madhead/semver-utils` into the Android release workflow to validate and compare current/previous release versions.
2. Derive `major`/`minor`/`patch` routing flags from action outputs and apply the track policy conditions.
3. Add automated workflow-level checks for major, minor, patch, and invalid-version cases.
4. Run dry-run pipeline checks to verify planned track targets without publishing.
5. Enable in production pipeline and monitor first releases.

Rollback:

- Revert to previous pipeline definition if routing logic causes blocking failures.
- Keep release artifact generation unchanged so rollback only affects submission routing.

## Open Questions

- Should release candidates with pre-release tags (for example, `2.1.0-rc.1`) be treated as minor for beta routing or excluded until stable?
