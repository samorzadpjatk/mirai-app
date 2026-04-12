---
title: "Migrate openspec Archive to .specs/ Directory"
type: design
status: done
created: "2026-04-12"
---

## Overview

This document describes the migration of historical spec-driven development artifacts from `openspec/changes/archive/` into the active `.specs/` directory structure, unifying all specifications into a single, searchable location.

## Goals

- Consolidate documentation to reduce confusion about where specs live
- Enable discovery of historical decisions via consistent structure
- Preserve completion status (all items marked as done)
- Add YAML frontmatter for programmatic filtering and linking
- Maintain traceability via `migrated_from` references

## Source Structure

The `openspec/changes/archive/` directory contains 12 completed changes, each with:

```
openspec/changes/archive/
├── 2026-04-09-apps-80-percent-coverage/
│   ├── .openspec.yaml          # Metadata (ignored)
│   ├── tasks.md                # Checklist format
│   ├── design.md               # Technical decisions
│   ├── proposal.md             # Business justification
│   └── specs/                  # Capability specifications
│       └── <capability>/
│           └── spec.md
└── [11 more dated folders...]
```

## Target Structure

| Source File            | Target Path                                | Frontmatter Type |
| ---------------------- | ------------------------------------------ | ---------------- |
| `tasks.md`             | `.specs/tasks/done/<topic>.task.md`        | `type: task`     |
| `design.md`            | `.specs/plans/<topic>.design.md`           | `type: design`   |
| `proposal.md`          | `.specs/plans/<topic>.proposal.md`         | `type: proposal` |
| `specs/<name>/spec.md` | `.specs/tasks/done/<topic>-<name>.task.md` | `type: task`     |

## Naming Conventions

**Topic extraction from folder names:**

- `2026-04-09-apps-80-percent-coverage` → `apps-80-percent-coverage`
- Date prefix becomes `created` field in frontmatter
- Kebab-case conversion for file names

**Frontmatter format:**

```yaml
---
title: "Apps 80% Test Coverage"
type: design
status: done
created: "2026-04-09"
migrated_from: "openspec/changes/archive/2026-04-09-apps-80-percent-coverage/design.md"
---
```

## Content Transformations

1. **tasks.md**: Convert checklist format to task file with frontmatter, preserving all completion markers
2. **design.md/proposal.md**: Add frontmatter, preserve content unchanged
3. **specs/<capability>/spec.md**: Create standalone task files with reference to parent design

## Migration Sequence

1. Create parent design/proposal documents first (they're referenced by tasks)
2. Convert and move spec files as child tasks
3. Verify no broken internal links remain
4. Delete `openspec/` directory after verification

## Validation Checklist

- [ ] All 12 archived changes migrated
- [ ] Frontmatter parses correctly
- [ ] No broken relative links
- [ ] `openspec/` removed successfully

## Migrated Changes

| Date       | Topic                                        | Files Migrated                   |
| ---------- | -------------------------------------------- | -------------------------------- |
| 2026-04-09 | apps-80-percent-coverage                     | tasks, design, proposal, 6 specs |
| 2026-04-08 | test-coverage-spike                          | tasks, design, proposal, 4 specs |
| 2026-04-08 | achieve-80-percent-test-coverage             | tasks, design, proposal, 5 specs |
| 2026-03-30 | web-admin-visual-parity                      | tasks, design, proposal, 4 specs |
| 2026-03-30 | optimize-admin-web-with-islands-architecture | tasks, design, proposal, 4 specs |
| 2026-03-30 | migrate-admin-panel-to-astro-web             | tasks, design, proposal, 5 specs |
| 2026-03-28 | migrate-ios-xcode-cloud-to-fastlane-cd       | tasks, design, proposal, 2 specs |
| 2026-03-27 | semver-android-release-submission-tracks     | proposal, design, 1 spec         |
| 2026-03-26 | migrate-eas-to-fastlane-android-cd           | tasks, design, proposal, 2 specs |
| 2026-03-26 | extract-monorepo-tagging-action              | tasks, design, proposal, 1 spec  |

## References

- Source: `openspec/changes/archive/`
- Target: `.specs/plans/`, `.specs/tasks/done/`
- Template: `.specs/templates/feature-spec.md`
