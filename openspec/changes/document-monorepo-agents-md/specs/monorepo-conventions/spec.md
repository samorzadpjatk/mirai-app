## ADDED Requirements

### Requirement: Turborepo pipeline documentation
The AGENTS.md and docs/ files SHALL document the Turborepo pipeline configuration from turbo.json, including task dependencies and caching strategies.

#### Scenario: Understanding build pipeline
- **WHEN** an AI assistant needs to understand the build pipeline
- **THEN** they SHALL find documentation on task dependencies (build → test → deploy)
- **AND** they SHALL understand what tasks depend on what other tasks
- **AND** they SHALL understand the caching configuration

### Requirement: Bun workspaces documentation
The AGENTS.md and docs/ files SHALL document the Bun workspace configuration from package.json and the workspace: protocol for cross-package dependencies.

#### Scenario: Working with workspaces
- **WHEN** an AI assistant needs to add or modify workspace dependencies
- **THEN** they SHALL understand how Bun workspaces are configured
- **AND** they SHALL understand the workspace: protocol for local package references
- **AND** they SHALL understand how bun.lock manages dependencies

### Requirement: Script naming conventions documentation
The AGENTS.md and docs/ files SHALL document standard script naming conventions including dev, build, test, lint, and db:* patterns.

#### Scenario: Running common tasks
- **WHEN** an AI assistant needs to run common development tasks
- **THEN** they SHALL find the standard script names (dev, build, test, lint)
- **AND** they SHALL understand what each script does
- **AND** they SHALL find the database-related script patterns (db:generate, db:push, db:studio)

### Requirement: Cross-package dependency documentation
The AGENTS.md and docs/ files SHALL document how packages reference each other using workspace: protocol and the dependency graph between packages.

#### Scenario: Understanding package relationships
- **WHEN** an AI assistant needs to understand how packages relate to each other
- **THEN** they SHALL find documentation on the dependency graph
- **AND** they SHALL understand which packages depend on which other packages
- **AND** they SHALL understand the workspace: protocol usage
