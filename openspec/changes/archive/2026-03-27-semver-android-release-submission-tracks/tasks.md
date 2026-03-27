## 1. SemVer Routing Foundation

- [x] 1.1 Identify the pipeline version source and previous-release version source used for comparison.
- [x] 1.2 Replace custom SemVer helper with `madhead/semver-utils` GitHub Action and derive `major`, `minor`, or `patch` classification from action outputs.
- [x] 1.3 Add fail-fast validation for invalid or missing SemVer values with actionable error messages.

## 2. Track Submission Policy Integration

- [x] 2.1 Refactor Android release pipeline submission logic to always include the internal track.
- [x] 2.2 Add conditional beta submission for `minor` classification and ensure it is skipped for `patch` and `major`.
- [x] 2.3 Add conditional production submission for `major` classification and ensure it is skipped for `patch` and `minor`.
- [x] 2.4 Ensure submission order executes internal submission before any beta or production submission.

## 3. Verification and Rollout

- [x] 3.1 Add automated tests covering patch, minor, major, invalid current version, and invalid previous version cases.
- [x] 3.2 Add pipeline logs/output that clearly show classification and planned submission tracks for each run.
- [x] 3.3 Run dry-run validation for representative versions and confirm routing outcomes match specification.
- [x] 3.4 Remove obsolete in-repo SemVer routing script/tests after action-based workflow is validated.
