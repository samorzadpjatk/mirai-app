## Context

`android-release.yml` currently resolves SemVer and pushes repository tags before Android build/upload steps. This makes a platform-specific workflow responsible for repository-wide version signaling, which is difficult to reuse for other release pipelines and increases coupling between Android release flow and monorepo version governance.

## Goals / Non-Goals

**Goals:**

- Move SemVer/tagging ownership into a dedicated workflow scoped to monorepo tagging.
- Keep current tagging behavior (branch conventions, bump rules, idempotent tag creation) functionally equivalent.
- Allow Android release to consume tagging outputs without directly creating/pushing tags.

**Non-Goals:**

- Changing branch naming or bump classification rules used by `gandarez/semver-action`.
- Introducing application versioning changes in runtime code or Fastlane lanes.
- Designing a full multi-platform release orchestration system in this change.

## Decisions

### Decision: Introduce a dedicated monorepo tagging workflow

Create a new workflow (for example `.github/workflows/monorepo-tagging.yml`) that centralizes SemVer resolution and tag publishing.

Rationale:

- Separates repository versioning concerns from platform build concerns.
- Enables reuse from Android and future release workflows.
- Reduces duplicate tag creation logic across pipelines.

Alternative considered:

- Keep tagging in Android workflow and copy it to other workflows. Rejected due to duplication and ownership ambiguity.

### Decision: Preserve semver-action contract with per-commit tag updates

Reuse the existing `gandarez/semver-action@v2.1.0` inputs, but change tag publishing semantics: the workflow runs on each `main` commit and ensures the resolved SemVer tag points to the latest `main` commit. If the resolved tag already exists, update (move) the tag to the new commit and push the update.

Rationale:

- Minimizes behavior drift during extraction.
- Keeps version calculation logic stable while changing workflow ownership and introducing per-commit tag refresh.

Alternative considered:

- Replace the semver action with custom scripts. Rejected to avoid unnecessary behavioral and maintenance risk.

### Decision: Expose tag metadata via workflow outputs for consumers

The new tagging workflow should provide outputs (resolved tag, previous tag, and whether a tag was created) so Android release can consume decision data through `workflow_call` or by sequencing workflow dependencies.

Rationale:

- Makes integration explicit and testable.
- Prevents Android workflow from reimplementing tag checks.

Alternative considered:

- Infer tag state in Android workflow from git state alone. Rejected because it is less explicit and harder to reason about.

## Risks / Trade-offs

- [Workflow trigger mismatch could create missing tags or duplicate tag attempts] -> Mitigate by documenting trigger policy and enforcing idempotent creation checks.
- [Mutable tag updates can surprise downstream consumers expecting immutable release tags] -> Mitigate by explicitly documenting mutable-tag policy and restricting this behavior to the auto-tag workflow.
- [Permissions differences between old/new workflow could break tag push] -> Mitigate by explicitly setting `permissions: contents: write` and validating on a dry run branch.
- [Cross-workflow dependency adds orchestration complexity] -> Mitigate by exposing simple outputs and keeping Android integration minimal.

## Migration Plan

1. Add the dedicated monorepo tagging workflow with the extracted semver and tag push steps.
2. Update `android-release.yml` to remove inlined tagging steps and consume tag data from the new workflow path.
3. Validate in a non-production run that tagging behavior matches new policy (workflow runs on each `main` commit and existing resolved tag is moved when unchanged).
4. Rollback strategy: if orchestration fails, temporarily restore inlined tagging steps in Android workflow and disable the new workflow.

## Open Questions

- Should the tagging workflow run only via `workflow_dispatch`/`workflow_call`, or also on pushes to `main` for broader automation?
- Which additional workflows (beyond Android release) should adopt the centralized tagging workflow in the first rollout?
