# Purpose

This specification defines the documentation requirements for oRPC in the monorepo, covering router structure, procedures, client usage, middleware, error handling, and backend server integration.

## Requirements

### Requirement: oRPC router structure documentation
The packages/orpc AGENTS.md and docs/packages/orpc/ files SHALL document the router structure, including how routers are composed and exported.

#### Scenario: Understanding oRPC router composition
- **WHEN** an AI assistant needs to understand the oRPC router structure
- **THEN** they SHALL find documentation on how routers are composed
- **AND** they SHALL understand the router hierarchy and organization
- **AND** they SHALL find where new routers should be added

### Requirement: oRPC procedure documentation
The packages/orpc AGENTS.md and docs/packages/orpc/ files SHALL document how to create procedures (queries and mutations), including input validation and output types.

#### Scenario: Creating new oRPC procedures
- **WHEN** an AI assistant needs to create a new oRPC procedure
- **THEN** they SHALL find documentation on query and mutation patterns
- **AND** they SHALL understand input validation using Zod
- **AND** they SHALL understand how to define output types

### Requirement: oRPC client usage documentation
The packages/orpc AGENTS.md and docs/packages/orpc/ files SHALL document how to initialize and use the oRPC client in consuming applications.

#### Scenario: Using oRPC client in apps
- **WHEN** an AI assistant needs to use the oRPC client
- **THEN** they SHALL find documentation on client initialization
- **AND** they SHALL find examples of calling procedures
- **AND** they SHALL understand type inference and safety

### Requirement: oRPC middleware documentation
The docs/packages/orpc/ files SHALL document middleware patterns, including authentication, authorization, and logging middleware.

#### Scenario: Understanding oRPC middleware
- **WHEN** an AI assistant needs to understand or create oRPC middleware
- **THEN** they SHALL find documentation on middleware patterns
- **AND** they SHALL find examples of auth, authorization, and logging middleware
- **AND** they SHALL understand how middleware is applied to procedures

### Requirement: oRPC error handling documentation
The docs/packages/orpc/ files SHALL document error handling patterns, including custom error classes and error formatting.

#### Scenario: Handling oRPC errors
- **WHEN** an AI assistant needs to handle oRPC errors
- **THEN** they SHALL find documentation on error handling patterns
- **AND** they SHALL find examples of custom error classes
- **AND** they SHALL understand how errors are propagated to clients

### Requirement: Backend server oRPC integration documentation
The apps/backend-server AGENTS.md and docs/apps/backend-server/ files SHALL document how oRPC is integrated into the Fastify server and where routes are defined.

#### Scenario: Understanding oRPC integration
- **WHEN** an AI assistant needs to understand oRPC server integration
- **THEN** they SHALL find documentation on the Fastify + oRPC setup
- **AND** they SHALL find where the oRPC router is mounted
- **AND** they SHALL understand how to add new API endpoints
