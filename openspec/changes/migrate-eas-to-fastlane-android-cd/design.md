## Context

Android delivery currently relies on EAS Build and EAS Submit abstractions. The target state moves build and Play submission into the app CD workflow using Fastlane, while retaining behavior that Expo-managed Android builds normally expect (prepared native project, non-interactive CI execution, signing inputs, deterministic artifact output, and Gradle-driven release packaging). This change affects CI pipelines, secrets management, and release operations for Android maintainers.

## Goals / Non-Goals

**Goals:**

- Provide a repeatable Fastlane lane for Android build and a lane for Play submission that run in CI without manual prompts.
- Preserve release-quality outputs and environment assumptions currently satisfied by EAS Android build behavior.
- Define a migration path from EAS Build/Submit to Fastlane with preflight validation and rollback safety.
- Make required credentials and environment variables explicit and verifiable before execution.

**Non-Goals:**

- Rewriting app runtime code or changing Android app feature behavior.
- Replacing Expo tooling outside Android build/submit CD concerns.
- Implementing iOS migration as part of this change.

## Decisions

1. Use split Fastlane lanes (`android_build`, `android_submit`, plus orchestrating `android_release`) rather than a single monolithic lane.
   - Rationale: supports rerunning submit without rebuilding, cleaner failure recovery, and clearer audit logs.
   - Alternative considered: one lane that always builds and submits; rejected due to lower operational flexibility.

2. Run Android build through project-controlled Gradle invocation in CI and publish generated artifacts to pipeline storage before submission.
   - Rationale: explicit ownership of build steps, deterministic artifact retention, easier debugging than opaque remote orchestration.
   - Alternative considered: keep remote EAS Build and only swap EAS Submit for Fastlane; rejected because migration goal is CD ownership.

3. Require preflight validation for signing files, Play service account, package/application ID consistency, and expected release track configuration before lane execution.
   - Rationale: fail fast on configuration drift and reduce wasted build minutes.
   - Alternative considered: rely on lane failures only; rejected due to delayed feedback and harder troubleshooting.

4. Model EAS Android build expectations in documentation-backed pipeline steps (toolchain setup, clean build context, non-interactive mode, artifact path conventions).
   - Rationale: lowers migration risk by preserving semantics teams already depend on.
   - Alternative considered: adopt a minimal Fastlane setup without parity mapping; rejected due to high regression risk.

5. Adopt a single Play signing lineage for the promoted artifact path (internal → beta → production); optional debug or non-Play signing may differ but promoted releases must share the same keystore lineage.
   - Rationale: Play promotion reuses the same binary; dual keystores would break promotion eligibility and lineage continuity.
   - Alternative considered: separate staging/production Play signing; rejected because promotions would require rebuilds and diverging lineages.

## Risks / Trade-offs

- [CI runner drift (Java/Android SDK/Gradle/Ruby versions)] -> Mitigation: pin versions in workflow and validate in preflight.
- [Signing secret misconfiguration causes failed or invalid releases] -> Mitigation: explicit secret contract, preflight checks, and protected secret scopes.
- [Fastlane plugin or Play API instability] -> Mitigation: lock plugin versions and add retry/backoff for transient upload failures.
- [Operational knowledge gap after moving away from EAS commands] -> Mitigation: migration runbook, lane-level docs, and rollback procedure.
- [Longer initial setup time compared to managed EAS flow] -> Mitigation: template workflow and reusable lane conventions.

## Migration Plan

1. Introduce Fastlane config and CI workflow in parallel with existing EAS flow.
2. Add preflight checks and dry-run path for non-production track validation.
3. Execute dual-run period where Fastlane build is generated and compared with current release outputs.
4. Switch Android release trigger to Fastlane lanes and disable EAS Build/Submit invocation in CD.
5. Monitor first production releases with additional verification gates.

Rollback strategy:

- Keep prior EAS release job definition available for one release window.
- If Fastlane release fails or produces non-compliant output, revert pipeline trigger to EAS job and restore prior secrets mapping.

## Open Questions

- Which Play track(s) should be automated first (`internal`, `alpha`, `beta`, `production`) and with what promotion policy? **Resolved:** automate `internal` first with human-gated promotions `internal -> beta -> production` using the same binary (no rebuild between tracks).
- Should version code/name bumping remain external to Fastlane or be lane-managed? **Resolved:** versionName is computed in CI by GitHub `semver-action` from Conventional Commits (`feat`=minor, `fix`=patch, `type!` or `BREAKING CHANGE`=major; chores/docs/tests/refactor/nit without `!` do not bump by default). versionCode remains CI-managed, strictly monotonic.
- Do we require per-branch signing contexts (for example staging vs production keystores) at initial rollout? **Resolved:** Play-bound artifacts share a single signing lineage/keystore to allow promotion; non-Play debug/internal signing can differ.

## Tasks

- Integrate GitHub `semver-action` to compute SemVer bump intent for versionName from Conventional Commits and expose the resolved version to release lanes.
- Enforce manual approval gates on promotions `internal -> beta -> production` with lane support for pausing/resuming at each hop.
- Ensure release artifact and Play release-id are immutable across track promotions (submit once, promote without rebuild).

## Locked-In Model

- Single Play app lineage with one app ID and one promotion chain.
- Human-gated promotion at each step: `internal -> beta -> production`.
- `versionName` follows SemVer resolved in CI by GitHub `semver-action` from Conventional Commits.
- `versionCode` is lane-managed in CI and strictly monotonic.

Conceptual flow:

`main` -> compute SemVer `versionName` via GitHub `semver-action` + resolve CI `versionCode` -> build + sign (Play release lineage) -> upload to `internal` -> human approval -> promote same release to `beta` -> human approval -> promote same release to `production`.

No rebuild occurs between tracks; the same binary is promoted.

## Conventional Commit Version Policy

- `feat:` -> minor bump
- `fix:` -> patch bump
- `type!:` or `BREAKING CHANGE:` -> major bump
- `chore/docs/test/refactor/nit` without breaking marker -> no bump by default

The policy is executed by GitHub `semver-action` over the effective release commit range and remains overrideable only through an explicit release operator action.

## Signing Lineage Clarification

Promoted Play releases require one signing identity lineage for the single app lineage. Separate staging and production signing lineages are not supported for a single promoted artifact path because promotion reuses the same binary. Non-Play debug/internal builds may use separate signing if they do not enter the Play promotion chain.
