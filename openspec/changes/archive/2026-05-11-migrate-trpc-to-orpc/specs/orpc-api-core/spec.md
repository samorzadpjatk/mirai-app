## ADDED Requirements

### Requirement: oRPC server initialization provides builder, context, and procedures
The oRPC server initialization in `packages/trpc/src/api/trpc.ts` SHALL provide an `os` builder from `@orpc/server`, a context factory `createORPCContext`, and typed procedures (`publicProcedure`, `protectedProcedure`, `moderatorProcedure`, `adminProcedure`).

#### Scenario: Server initializes with oRPC builder
- **WHEN** an AI assistant or developer imports from `@mirai-app/orpc`
- **THEN** they SHALL find `os` (or equivalent builder) exported from the server package
- **AND** the builder SHALL support `.use()`, `.input()`, `.output()`, and `.handler()` chaining
- **AND** the builder SHALL be typed with the project's context type

#### Scenario: Context factory creates database and auth context
- **WHEN** `createORPCContext` is called with headers, database URL, Supabase URL, and Supabase key
- **THEN** it SHALL create a lazy-initialized Supabase singleton client
- **AND** it SHALL create a Prisma database client
- **AND** it SHALL extract the access token from Authorization header, connection params, or URL query params
- **AND** it SHALL return `{ db, supabase, headers, accessToken }`

### Requirement: oRPC middleware implements telemetry and authentication
The oRPC middleware chain SHALL replicate existing tRPC middleware behavior: telemetry logging (user-agent, platform, endpoint) and authentication/authorization guards.

#### Scenario: Telemetry middleware logs requests
- **WHEN** any procedure is called
- **THEN** the telemetry middleware SHALL extract User-Agent and determine platform (ios/android)
- **AND** it SHALL asynchronously log to the `userAgent` database table (fire-and-forget)
- **AND** it SHALL NOT block the request on logging failures

#### Scenario: Auth middleware guards protected procedures
- **WHEN** a protected procedure is called
- **THEN** the auth middleware SHALL verify the access token via `requireAuth`
- **AND** on valid token, it SHALL enrich context with `{ user, dbUser }`
- **AND** on invalid/missing token, it SHALL throw `ORPCError` with code `UNAUTHORIZED`

#### Scenario: Role-based middleware guards moderator and admin procedures
- **WHEN** a moderator procedure is called
- **THEN** the middleware SHALL verify the user has moderator or higher role
- **AND** on insufficient role, it SHALL throw `ORPCError` with code `FORBIDDEN`
- **AND** admin procedures SHALL similarly require admin role

### Requirement: Error handling maps to oRPC error system
All errors thrown in procedures SHALL use `ORPCError` from `@orpc/server` with appropriate error codes.

#### Scenario: Procedure throws authentication error
- **WHEN** a procedure throws `AuthenticationError`
- **THEN** the middleware SHALL convert it to `ORPCError('UNAUTHORIZED')`
- **AND** the client SHALL receive the error with code `UNAUTHORIZED`

#### Scenario: Procedure throws authorization error
- **WHEN** a procedure throws `AuthorizationError`
- **THEN** the middleware SHALL convert it to `ORPCError('FORBIDDEN')`
- **AND** the client SHALL receive the error with code `FORBIDDEN`

#### Scenario: Validation errors preserve Zod detail
- **WHEN** input validation fails via Zod
- **THEN** the error response SHALL include flattened Zod error details
- **AND** the client SHALL be able to display field-level validation messages
