---
title: "Monorepo Release Tagging"
type: task
status: done
created: "2026-03-26"
migrated_from: "openspec/changes/archive/2026-03-26-extract-monorepo-tagging-action/specs/monorepo-release-tagging/spec.md"
parent_design: ".specs/plans/extract-monorepo-tagging-action.design.md"
---

## ADDED Requirements

### Requirement: Dedicated tagging workflow

The repository SHALL provide a dedicated GitHub Actions workflow responsible for computing and publishing SemVer tags for monorepo changes, independent from Android build and promotion jobs.

#### Scenario: Tagging executes without Android build coupling

- **WHEN** the monorepo tagging workflow is triggered for a release candidate commit
- **THEN** SemVer resolution and tag publication logic run within the dedicated tagging workflow
- **AND** Android release workflow does not include direct tag creation steps

### Requirement: Auto-tagging runs for every main commit

The monorepo tagging workflow MUST run automatically for each commit pushed to the `main` branch.

#### Scenario: New main commit triggers tagging workflow

- **WHEN** a commit is pushed to `main`
- **THEN** the dedicated tagging workflow is started automatically
- **AND** SemVer is recalculated for that commit

### Requirement: Resolved tag points to latest main commit

The tagging workflow MUST ensure the resolved SemVer tag points to the latest processed `main` commit. If the resolved tag already exists, the workflow MUST update the tag reference to the current commit and push that update.

#### Scenario: Existing resolved tag is updated when version is unchanged

- **WHEN** SemVer resolution returns a tag equal to the previous tag for a newer `main` commit
- **THEN** the workflow SHALL move that tag to the newer commit
- **AND** push the updated tag reference to origin

#### Scenario: New resolved tag is created when absent

- **WHEN** SemVer resolution returns a tag that does not exist in the repository
- **THEN** the workflow SHALL create the tag at the current commit
- **AND** push the new tag to origin

### Requirement: Tag metadata is consumable by release workflows

The tagging workflow SHALL expose resolved tag metadata so other workflows in the monorepo can consume tagging outcomes without reimplementing SemVer logic.

#### Scenario: Android release consumes tag outcome

- **WHEN** Android release workflow runs in the updated pipeline
- **THEN** it reads tag metadata produced by the dedicated tagging workflow
- **AND** it proceeds without executing duplicate SemVer/tagging logic
