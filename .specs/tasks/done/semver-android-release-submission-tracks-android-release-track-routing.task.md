---
title: "Android Release Track Routing"
type: task
status: done
created: "2026-03-27"
migrated_from: "openspec/changes/archive/2026-03-27-semver-android-release-submission-tracks/specs/android-release-track-routing/spec.md"
parent_design: ".specs/plans/semver-android-release-submission-tracks.design.md"
---

## ADDED Requirements

### Requirement: Route Android submissions by SemVer bump type

The Android release pipeline MUST classify each release as a SemVer major, minor, or patch change and SHALL determine submission tracks from that classification.

#### Scenario: Patch release routing

- **WHEN** the release version is a SemVer patch increment relative to the previous release
- **THEN** the pipeline submits the release to the internal track only

#### Scenario: Minor release routing

- **WHEN** the release version is a SemVer minor increment relative to the previous release
- **THEN** the pipeline submits the release to the internal and beta tracks

#### Scenario: Major release routing

- **WHEN** the release version is a SemVer major increment relative to the previous release
- **THEN** the pipeline submits the release to the internal and production tracks

### Requirement: Always submit internally

The Android release pipeline SHALL submit every release candidate to the internal track before evaluating any conditional track submissions.

#### Scenario: Any valid release version

- **WHEN** the pipeline processes any valid SemVer release version
- **THEN** internal track submission is included in the submission plan

### Requirement: Reject non-SemVer release metadata

The Android release pipeline MUST fail before track submission when the current or previous release version cannot be parsed as valid SemVer.

#### Scenario: Invalid current version

- **WHEN** the current release version is not parseable as SemVer
- **THEN** the pipeline fails and does not submit to any track

#### Scenario: Invalid comparison version

- **WHEN** the previous release version needed for bump classification is missing or not parseable as SemVer
- **THEN** the pipeline fails and does not submit to any track
