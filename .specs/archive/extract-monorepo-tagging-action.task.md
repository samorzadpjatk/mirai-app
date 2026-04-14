---
title: "Extract Monorepo Tagging Action"
type: task
status: done
created: "2026-03-26"
migrated_from: "openspec/changes/archive/2026-03-26-extract-monorepo-tagging-action/tasks.md"
---

## 1. Create dedicated tagging workflow

- [x] 1.1 Add `.github/workflows/monorepo-tagging.yml` with checkout, semver resolution, and tag creation steps extracted from Android release.
- [x] 1.2 Configure workflow permissions and triggers so auto-tagging runs on every `main` commit and can be reused by release pipelines.
- [x] 1.3 Expose workflow outputs for resolved tag metadata (for example resolved tag, previous tag, and creation status).
- [x] 1.4 Implement tag update logic so an existing resolved tag is moved to the latest `main` commit and pushed.

## 2. Integrate Android release with centralized tagging

- [x] 2.1 Remove inlined semver/tag creation steps from `.github/workflows/android-release.yml`.
- [x] 2.2 Wire Android release workflow to consume outputs from the dedicated tagging workflow.
- [x] 2.3 Ensure Android build/promotion jobs preserve current behavior after tagging extraction.

## 3. Validate release automation behavior

- [x] 3.1 Run workflow validation/lint checks for changed GitHub Actions workflows.
- [x] 3.2 Verify tagging paths: unchanged version moves the existing tag to latest commit, new version creates/pushes tag, and repeated runs remain stable.
- [x] 3.3 Document rollback steps or operational notes in workflow comments/README if required by the repo release process.
