## ADDED Requirements

### Requirement: Root AGENTS.md structure
The root AGENTS.md SHALL include a monorepo overview, structure diagram, build system documentation, development environment setup, a "How AGENTS.md Works" section explaining OpenAI's layered discovery pattern, and links to all app/package AGENTS.md files.

#### Scenario: AI assistant reads root AGENTS.md
- **WHEN** an AI assistant reads the root AGENTS.md file
- **THEN** they SHALL understand the overall monorepo structure
- **AND** they SHALL find links to all app and package AGENTS.md files
- **AND** they SHALL understand the build system and development workflow
- **AND** they SHALL understand how AGENTS.md files are layered and discovered

### Requirement: App AGENTS.md structure
Each app AGENTS.md SHALL include the application purpose, tech stack, key entry points and scripts, environment variables, local development commands, any overrides to root conventions, and links to relevant docs/ sections.

#### Scenario: AI assistant reads app AGENTS.md
- **WHEN** an AI assistant reads an app AGENTS.md file
- **THEN** they SHALL understand the app's purpose and tech stack
- **AND** they SHALL find the key entry points and available scripts
- **AND** they SHALL understand required environment variables
- **AND** they SHALL find any app-specific overrides to monorepo conventions
- **AND** they SHALL find links to detailed documentation in docs/ folder

### Requirement: Package AGENTS.md structure
Each package AGENTS.md SHALL include the package purpose and exports, dependencies and peer dependencies, configuration files, usage patterns and examples, any overrides to root conventions, and links to relevant docs/ sections.

#### Scenario: AI assistant reads package AGENTS.md
- **WHEN** an AI assistant reads a package AGENTS.md file
- **THEN** they SHALL understand the package's purpose and what it exports
- **AND** they SHALL understand its dependencies
- **AND** they SHALL find usage patterns and examples
- **AND** they SHALL find any package-specific overrides to monorepo conventions
- **AND** they SHALL find links to detailed documentation in docs/ folder

### Requirement: Consistent formatting across AGENTS.md files
All AGENTS.md files SHALL follow a consistent structure based on their location (root, app, or package) and use clear, scannable formatting with headers, lists, and code blocks where appropriate.

#### Scenario: Navigating between AGENTS.md files
- **WHEN** an AI assistant moves between different AGENTS.md files
- **THEN** they SHALL find consistent section ordering and formatting
- **AND** they SHALL quickly locate similar information across files

### Requirement: AGENTS.override.md support
The monorepo SHALL support AGENTS.override.md files in nested directories for temporary team-specific overrides without modifying base AGENTS.md files.

#### Scenario: Team needs temporary override
- **WHEN** a team needs to temporarily override base AGENTS.md guidance
- **THEN** they SHALL create an AGENTS.override.md file in their working directory
- **AND** the override file SHALL take precedence over the base AGENTS.md due to discovery order
- **AND** the override file SHOULD be removed when the specific need passes

#### Scenario: AI assistant discovers layered instructions
- **WHEN** an AI assistant works in a nested directory with an AGENTS.override.md
- **THEN** they SHALL receive instructions concatenated from root AGENTS.md, intermediate AGENTS.md files, and the override file
- **AND** guidance in the override file SHALL override earlier guidance due to concatenation order

### Requirement: Instruction size limits
All AGENTS.md files SHALL be kept concise to stay within OpenAI's default 32 KiB combined instruction limit. Root AGENTS.md SHOULD be 5-8 KiB, per-app/package files SHOULD be 2-4 KiB each.

#### Scenario: Monitoring instruction size
- **WHEN** adding or modifying AGENTS.md files
- **THEN** the combined size of all AGENTS.md files in the discovery path SHALL be monitored
- **AND** detailed technical content SHALL be moved to the docs/ folder
- **AND** AGENTS.md files SHALL focus on high-level guidance and conventions
