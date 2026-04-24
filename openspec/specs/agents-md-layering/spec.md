# Purpose

This specification defines how AGENTS.md files are layered and discovered in the monorepo, following OpenAI's pattern where files are concatenated from root to nested directories, with later files taking precedence over earlier ones.

## Requirements

### Requirement: Layered instruction discovery
The monorepo SHALL implement layered AGENTS.md discovery following OpenAI's pattern: root → apps/packages → nested directories, with files concatenated in discovery order.

#### Scenario: AI assistant works from repository root
- **WHEN** an AI assistant starts from the repository root
- **THEN** they SHALL receive instructions from root AGENTS.md only
- **AND** they SHALL understand this is the base guidance layer

#### Scenario: AI assistant works in app directory
- **WHEN** an AI assistant works in an app directory (e.g., apps/native/)
- **THEN** they SHALL receive instructions concatenated from root AGENTS.md and apps/native/AGENTS.md
- **AND** the app AGENTS.md SHALL appear later in the combined prompt
- **AND** app-specific guidance SHALL override root conventions where specified

#### Scenario: AI assistant works in package directory
- **WHEN** an AI assistant works in a package directory (e.g., packages/db/)
- **THEN** they SHALL receive instructions concatenated from root AGENTS.md and packages/db/AGENTS.md
- **AND** the package AGENTS.md SHALL appear later in the combined prompt
- **AND** package-specific guidance SHALL override root conventions where specified

### Requirement: Override precedence documentation
All AGENTS.md files SHALL document their relationship to parent/inherited guidance and explicitly state any overrides to higher-level conventions.

#### Scenario: Understanding override hierarchy
- **WHEN** reading any AGENTS.md file
- **THEN** the file SHALL document which conventions it inherits from parent AGENTS.md files
- **AND** it SHALL explicitly state any overrides using clear language (e.g., "Override to root convention: ...")
- **AND** it SHALL reference the root AGENTS.md for full monorepo conventions

### Requirement: Clear concatenation boundaries
All AGENTS.md files SHALL be designed to work when concatenated with other files, using clear section headers and avoiding ambiguous pronouns or context-dependent references.

#### Scenario: Concatenated instructions work correctly
- **WHEN** AGENTS.md files are concatenated from root down
- **THEN** each file SHALL remain understandable without context from other files
- **AND** section headers SHALL clearly indicate what the guidance applies to
- **AND** vague references like "this project" or "here" SHALL be avoided in favor of specific names
