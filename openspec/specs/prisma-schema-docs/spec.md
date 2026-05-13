# Purpose

This specification defines the documentation requirements for Drizzle database configuration in packages/db, covering schema location, migrations, client usage, seeding, conventions, and connection management.

## Requirements

### Requirement: Drizzle schema location documentation
The packages/db AGENTS.md and docs/packages/db/ files SHALL document where the Drizzle schema is located and how it's organized.

#### Scenario: Finding Drizzle schema
- **WHEN** an AI assistant needs to find or modify the Drizzle schema
- **THEN** they SHALL find documentation on schema.ts location
- **AND** they SHALL understand the schema organization
- **AND** they SHALL understand naming conventions for tables

### Requirement: Drizzle migration documentation
The packages/db AGENTS.md and docs/packages/db/ files SHALL document migration commands and best practices for creating and applying migrations.

#### Scenario: Working with migrations
- **WHEN** an AI assistant needs to create or apply migrations
- **THEN** they SHALL find documentation on migration commands
- **AND** they SHALL understand the migration workflow
- **AND** they SHALL find best practices for migration creation

### Requirement: Drizzle client usage documentation
The packages/db AGENTS.md and docs/packages/db/ files SHALL document how to use the Drizzle client for database queries, including patterns for common operations.

#### Scenario: Using Drizzle client
- **WHEN** an AI assistant needs to use the Drizzle client
- **THEN** they SHALL find documentation on client initialization
- **AND** they SHALL find examples of common query patterns
- **AND** they SHALL understand transaction handling

### Requirement: Drizzle seeding documentation
The docs/packages/db/ files SHALL document how database seeding works, including the seed script location and how to run seeds.

#### Scenario: Seeding database
- **WHEN** an AI assistant needs to seed the database
- **THEN** they SHALL find documentation on seed scripts
- **AND** they SHALL understand how to run seeds
- **AND** they SHALL find examples of seed data creation

### Requirement: Database schema conventions documentation
The docs/packages/db/ files SHALL document schema design conventions, including naming standards, relationship patterns, and indexing strategies.

#### Scenario: Following schema conventions
- **WHEN** an AI assistant needs to add new tables to the schema
- **THEN** they SHALL find documentation on naming conventions
- **AND** they SHALL find documentation on relationship patterns
- **AND** they SHALL find documentation on indexing strategies

### Requirement: Database connection documentation
The docs/packages/db/ files SHALL document database connection configuration, including connection pooling and environment variables.

#### Scenario: Understanding database connection
- **WHEN** an AI assistant needs to understand database connection setup
- **THEN** they SHALL find documentation on connection configuration
- **AND** they SHALL understand connection pooling settings
- **AND** they SHALL find required environment variables
