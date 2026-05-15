## ADDED Requirements

### Requirement: oRPC integrates with Hono HTTP server
The backend server SHALL use oRPC's Hono adapter (`createMiddleware` from `@orpc/server/hono`) to mount the oRPC router at `/rpc`.

#### Scenario: HTTP requests route to oRPC procedures
- **WHEN** an HTTP request arrives at `GET /rpc/user.getMy` or `POST /rpc/user.updateMyProfile`
- **THEN** the Hono adapter SHALL route it to the matching oRPC procedure
- **AND** it SHALL create the oRPC context from request headers and environment variables
- **AND** it SHALL handle body parsing correctly (Proxy pattern for Hono compatibility)
- **AND** on unmatched routes, it SHALL fall through to `next()`

#### Scenario: CORS is enabled in development
- **WHEN** the server runs in dev mode
- **THEN** CORS SHALL be enabled via `hono/cors` or oRPC `CORSPlugin`
- **AND** it SHALL allow all origins with credentials

### Requirement: oRPC integrates with Bun WebSocket server
The backend server SHALL use `@orpc/server/bun-ws` `RPCHandler` to handle WebSocket messages for real-time subscriptions.

#### Scenario: WebSocket upgrade succeeds
- **WHEN** a WebSocket upgrade request arrives at `/rpc`
- **THEN** `Bun.serve()` SHALL upgrade the connection
- **AND** the `RPCHandler` SHALL handle messages on the WebSocket

#### Scenario: WebSocket message invokes subscription procedure
- **WHEN** a WebSocket message requests a subscription procedure
- **THEN** the `RPCHandler` SHALL create oRPC context with the connection params (including auth token)
- **AND** it SHALL invoke the subscription handler
- **AND** it SHALL stream results back over the WebSocket

#### Scenario: WebSocket auth token is passed via context
- **WHEN** a WebSocket connection includes auth token in connection params or URL
- **THEN** the `RPCHandler.message()` call SHALL receive the token in `context.accessToken`
- **AND** the context SHALL be created with the same logic as HTTP context

### Requirement: Health check endpoint remains functional
The `/health` endpoint SHALL continue to return `OK` independently of the oRPC migration.

#### Scenario: Health check request
- **WHEN** `GET /health` is requested
- **THEN** it SHALL return `200 OK` with body text `"OK"`
