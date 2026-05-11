## MODIFIED Requirements

### Requirement: tRPC router structure documentation
The packages/trpc AGENTS.md and docs/packages/trpc/ files SHALL document the oRPC router structure, including how plain-object routers are composed and exported.

#### Scenario: Understanding oRPC router composition
- **WHEN** an AI assistant needs to understand the oRPC router structure
- **THEN** they SHALL find documentation on how routers are composed as plain objects
- **AND** they SHALL understand the router hierarchy and organization
- **AND** they SHALL find where new routers should be added
- **AND** they SHALL understand that `createTRPCRouter` is replaced by plain object exports

### Requirement: tRPC procedure documentation
The packages/trpc AGENTS.md and docs/packages/trpc/ files SHALL document how to create oRPC procedures using `.handler()`, including input validation and output types.

#### Scenario: Creating new oRPC procedures
- **WHEN** an AI assistant needs to create a new oRPC procedure
- **THEN** they SHALL find documentation on `.handler()` patterns (no `.query()`/`.mutation()` distinction)
- **AND** they SHALL understand input validation using Zod with `.input(schema)`
- **AND** they SHALL understand how to define output types with `.output(schema)`
- **AND** they SHALL understand that `ctx` is renamed to `context` in handlers

### Requirement: tRPC client usage documentation
The packages/trpc AGENTS.md and docs/packages/trpc/ files SHALL document how to initialize and use the oRPC client in consuming applications.

#### Scenario: Using oRPC client in apps
- **WHEN** an AI assistant needs to use the oRPC client
- **THEN** they SHALL find documentation on `createORPCClient` with `RPCLink`
- **AND** they SHALL find examples of calling procedures (no `.query()` suffix)
- **AND** they SHALL understand type inference and safety
- **AND** they SHALL understand that TanStack Query uses provider-less `createTanstackQueryUtils`

### Requirement: tRPC middleware documentation
The docs/packages/trpc/ files SHALL document oRPC middleware patterns, including authentication, authorization, and logging middleware.

#### Scenario: Understanding oRPC middleware
- **WHEN** an AI assistant needs to understand or create oRPC middleware
- **THEN** they SHALL find documentation on `os.middleware()` patterns
- **AND** they SHALL find examples of auth, authorization, and logging middleware
- **AND** they SHALL understand how middleware is applied to procedures via `.use()`
- **AND** they SHALL understand that context is passed via `next({ context: {...} })`

### Requirement: tRPC error handling documentation
The docs/packages/trpc/ files SHALL document oRPC error handling patterns, including `ORPCError` and error formatting.

#### Scenario: Handling oRPC errors
- **WHEN** an AI assistant needs to handle oRPC errors
- **THEN** they SHALL find documentation on `ORPCError` with error codes
- **AND** they SHALL find examples of custom error classes mapped from auth errors
- **AND** they SHALL understand how errors are propagated to clients

### Requirement: Backend server tRPC integration documentation
The apps/backend-server AGENTS.md and docs/apps/backend-server/ files SHALL document how oRPC is integrated into the Hono server and where routes are defined.

#### Scenario: Understanding oRPC integration
- **WHEN** an AI assistant needs to understand oRPC server integration
- **THEN** they SHALL find documentation on the Hono + oRPC setup using `createMiddleware`
- **AND** they SHALL find where the oRPC router is mounted at `/rpc`
- **AND** they SHALL understand how Bun WebSocket is integrated via `RPCHandler` from `@orpc/server/bun-ws`
- **AND** they SHALL understand how to add new API endpoints (add to plain object router)

## REMOVED Requirements

### Requirement: tRPC-specific package references
**Reason**: tRPC packages are replaced by oRPC packages
**Migration**: All references to `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@hono/trpc-server`, and `@valkyrie-resistance/trpc-ws-hono-bun-adapter` are removed. Use `@orpc/server`, `@orpc/client`, `@orpc/tanstack-query` instead.
