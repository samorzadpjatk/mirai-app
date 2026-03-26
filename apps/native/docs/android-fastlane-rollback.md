# Android Fastlane Rollback Procedure

Use this procedure during the stabilization window if Fastlane release execution fails critically.

## Rollback Trigger Criteria

- Internal upload repeatedly fails due to non-transient release pipeline defects.
- Promotion verification fails for release identity continuity.
- Versioning logic produces invalid or non-compliant release metadata.

## Rollback Steps

1. Disable the `Android Release (Fastlane)` workflow for release operations.
2. Re-enable prior EAS-based release pipeline job in CI/CD.
3. Restore EAS-related release variables/secrets as needed for the legacy job.
4. Announce temporary rollback in release channel and link failing workflow run.
5. Open follow-up issue capturing root cause and remediation plan before retrying Fastlane cutover.

## Safety Constraints

- Do not promote partially validated Fastlane release candidates to production.
- Keep existing production artifact lineage unchanged during rollback.
- Resume Fastlane only after a successful dual-run validation and sign-off.
