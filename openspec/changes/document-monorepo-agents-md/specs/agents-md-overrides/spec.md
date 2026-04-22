## ADDED Requirements

### Requirement: AGENTS.override.md file purpose
AGENTS.override.md files SHALL be used for temporary team-specific or task-specific overrides without modifying the base AGENTS.md files that other teams depend on.

#### Scenario: Temporary workflow change
- **WHEN** a team needs a temporary workflow change (e.g., during a migration or experiment)
- **THEN** they SHALL create an AGENTS.override.md in their working directory
- **AND** they SHALL document the temporary nature and expected duration in the override file
- **AND** they SHALL not modify the base AGENTS.md file

#### Scenario: Task-specific guidance
- **WHEN** working on a specific complex task requiring specialized guidance
- **THEN** an AGENTS.override.md MAY be created with task-specific instructions
- **AND** the override SHALL be removed when the task is complete

### Requirement: Override file discovery
AGENTS.override.md files SHALL be discovered and take precedence over AGENTS.md files in the same directory following OpenAI's discovery order.

#### Scenario: Override file takes precedence
- **WHEN** both AGENTS.md and AGENTS.override.md exist in the same directory
- **THEN** the AGENTS.override.md SHALL be included in the instruction chain
- **AND** the AGENTS.md in that directory SHALL be ignored (per OpenAI spec)
- **AND** guidance from the override file SHALL appear later than parent directory guidance

### Requirement: Override file best practices
All AGENTS.override.md files SHALL follow documentation best practices including clear purpose statements, scope definition, and removal recommendations.

#### Scenario: Creating proper override file
- **WHEN** creating an AGENTS.override.md file
- **THEN** it SHALL include a comment/header explaining why the override exists
- **AND** it SHALL define the scope of the override (what it affects)
- **AND** it SHALL include a recommendation for when to remove the override
- **AND** it SHALL reference the base AGENTS.md for unchanged conventions

#### Scenario: Override file maintenance
- **WHEN** reviewing AGENTS.override.md files periodically
- **THEN** teams SHALL assess whether the override is still needed
- **AND** outdated overrides SHALL be removed promptly
- **AND** long-lived overrides SHALL be considered for promotion to base AGENTS.md