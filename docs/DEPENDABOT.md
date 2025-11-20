# Dependabot Configuration

This document describes the Dependabot configuration for the Integral 2025 App monorepo.

## Overview

The Dependabot configuration is set up to automatically check for dependency updates across all workspaces in the Turborepo pnpm monorepo, adhering to semantic versioning principles.

## Configuration Structure

The configuration includes separate update schedules for:

### 1. Root Workspace (`/`)
- **Schedule**: Weekly on Monday at 09:00 (Europe/Warsaw)
- **Versioning Strategy**: `increase` - Always increases the version, even for pre-releases
- **PR Limit**: 10 open PRs
- **Grouped Updates**:
  - **turbo**: All Turbo-related packages (minor & patch updates)
  - **typescript**: TypeScript and related type packages (minor & patch updates)
  - **linters**: ESLint and Prettier packages (minor & patch updates)

### 2. Web App (`/apps/web`)
- **Schedule**: Weekly on Monday at 09:00
- **PR Limit**: 5 open PRs
- **Grouped Updates**:
  - **next**: Next.js and related packages
  - **react**: React and React DOM with type definitions
  - **trpc**: All tRPC packages
  - **testing**: Jest and Testing Library packages

### 3. Native App (`/apps/native`)
- **Schedule**: Weekly on Monday at 09:00
- **PR Limit**: 5 open PRs
- **Grouped Updates**:
  - **react-native**: React Native, Expo, and related packages
  - **react**: React core packages

### 4. Auth Package (`/packages/auth`)
- **Schedule**: Weekly on Tuesday at 09:00
- **PR Limit**: 3 open PRs
- **Grouped Updates**:
  - **supabase**: All Supabase packages
  - **testing**: Jest and Testing Library packages

### 5. Common Types Package (`/packages/common-types`)
- **Schedule**: Weekly on Tuesday at 09:00
- **PR Limit**: 3 open PRs
- **No grouping**: Simpler package with fewer dependencies

### 6. Database Package (`/packages/db`)
- **Schedule**: Weekly on Tuesday at 09:00
- **PR Limit**: 3 open PRs
- **Grouped Updates**:
  - **prisma**: Prisma ORM and related packages
  - **testing**: Vitest packages

### 7. Jest Config Package (`/packages/jest-config`)
- **Schedule**: Weekly on Tuesday at 09:00
- **PR Limit**: 3 open PRs
- **Grouped Updates**:
  - **jest**: All Jest-related packages

### 8. Docker (`/`)
- **Schedule**: Monthly on Monday at 09:00
- **PR Limit**: 3 open PRs
- **Scans**: `Dockerfile.web` and any other Dockerfiles

### 9. GitHub Actions (`/`)
- **Schedule**: Monthly on Monday at 09:00
- **PR Limit**: 3 open PRs
- **Scans**: All workflow files in `.github/workflows/`

## Semantic Versioning Strategy

The configuration uses `versioning-strategy: "increase"` which:
- Always increases the version number
- Follows semantic versioning (semver) rules
- Handles pre-release versions correctly
- Compatible with pnpm workspace protocol

### Update Types in Groups

Groups are configured to only update `minor` and `patch` versions automatically:
- **Patch updates** (e.g., 1.0.0 → 1.0.1): Bug fixes, no breaking changes
- **Minor updates** (e.g., 1.0.0 → 1.1.0): New features, backward compatible
- **Major updates** (e.g., 1.0.0 → 2.0.0): Will create separate PRs for review

This approach ensures:
1. Related packages are updated together
2. Breaking changes (major versions) get individual attention
3. Reduced PR noise while maintaining safety

## Commit Messages

All PRs follow conventional commit format:
- **Production dependencies**: `chore(deps): update <package-name>`
- **Development dependencies**: `chore(deps-dev): update <package-name>`
- **Docker**: `chore(docker): update <base-image>`
- **GitHub Actions**: `chore(ci): update <action-name>`

## Labels

Each PR is automatically labeled for easy filtering:
- **dependencies**: All dependency updates
- **root**: Root workspace updates
- **web**: Web app updates
- **native**: Native app updates
- **package:auth**: Auth package updates
- **package:common-types**: Common types package updates
- **package:db**: Database package updates
- **package:jest-config**: Jest config package updates
- **docker**: Docker image updates
- **github-actions**: GitHub Actions updates

## Customization

### Adding a New Workspace

To add a new workspace (e.g., `/apps/mobile` or `/packages/ui`):

```yaml
- package-ecosystem: "npm"
  directory: "/apps/mobile"  # or /packages/ui
  schedule:
    interval: "weekly"
    day: "monday"  # or "tuesday" for packages
    time: "09:00"
    timezone: "Europe/Warsaw"
  open-pull-requests-limit: 5  # 3 for packages
  versioning-strategy: "increase"
  commit-message:
    prefix: "chore(deps)"
    prefix-development: "chore(deps-dev)"
    include: "scope"
  labels:
    - "dependencies"
    - "mobile"  # or appropriate label
  groups:
    # Add relevant groups here
```

### Modifying Update Frequency

You can change the schedule interval to:
- `daily`: Every day
- `weekly`: Once per week (default)
- `monthly`: Once per month (used for Docker and GitHub Actions)

### Adjusting PR Limits

The `open-pull-requests-limit` controls how many PRs Dependabot can have open at once. Adjust based on:
- Team capacity for reviewing PRs
- Complexity of the workspace
- Number of dependencies

### Adding Ignore Rules

To ignore specific dependencies or versions:

```yaml
ignore:
  - dependency-name: "package-name"
    versions: ["1.x", "2.x"]  # Ignore versions 1.x and 2.x
  - dependency-name: "another-package"
    update-types: ["version-update:semver-major"]  # Ignore major updates
```

### Configuring Assignees

To automatically assign PRs to specific users or teams, you can configure this in your repository's branch protection rules or use GitHub Actions instead (as `reviewers` field is not supported in Dependabot config).

## Best Practices

1. **Review grouped updates carefully**: While grouping reduces PR noise, ensure all updates in a group are compatible
2. **Test major updates thoroughly**: Major version updates may contain breaking changes
3. **Keep pnpm overrides in sync**: Update the root `package.json` overrides when needed
4. **Monitor build failures**: Dependabot PRs trigger CI/CD; review failures promptly
5. **Use semantic versioning**: Follow semver in your own packages to work well with Dependabot

## Troubleshooting

### Dependabot isn't creating PRs

1. Check if the PR limit has been reached
2. Verify the schedule matches your expectations
3. Ensure the directory paths are correct
4. Check GitHub Actions logs for Dependabot runs

### Merge conflicts in Dependabot PRs

1. Use the "Update branch" button in the PR
2. Or rebase: `@dependabot rebase` in a comment
3. Consider increasing update frequency to reduce conflicts

### Version conflicts with pnpm overrides

1. Review the overrides in root `package.json`
2. Update overrides if blocking necessary updates
3. Consider removing overrides that are no longer needed

## Useful Dependabot Commands

Comment these commands on Dependabot PRs:

- `@dependabot rebase`: Rebase the PR
- `@dependabot recreate`: Recreate the PR from scratch
- `@dependabot merge`: Merge the PR (if all checks pass)
- `@dependabot squash and merge`: Squash and merge
- `@dependabot cancel merge`: Cancel a merge request
- `@dependabot reopen`: Reopen a closed PR
- `@dependabot close`: Close the PR
- `@dependabot ignore this [patch|minor|major] version`: Ignore this specific version
- `@dependabot ignore this dependency`: Ignore all future updates for this dependency

## References

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Semantic Versioning](https://semver.org/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
