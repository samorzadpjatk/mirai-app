---
title: Move tRPC middleware and context to higher DDD layers
status: draft
issue_type: refactor
complexity: L
---

## Initial User Prompt

I don't want to use middleware and context inside tRPC framework - I want to move it into higher levels of DDD to keep it framework-agnostic

# Description

This refactoring extracts business-critical concerns currently embedded in tRPC middleware and context handling, moving them into the use case and domain layers where they belong in a proper DDD architecture.

Currently, authentication, authorization, and request context management are tightly coupled to tRPC's middleware pipeline. This creates several problems: the core business logic cannot be tested without mocking tRPC-specific objects, the application is locked into tRPC as the transport layer, and the architecture violates DDD principles by allowing the framework layer to contain business decisions.

The solution is to lift these concerns into higher layers: authentication becomes a port called by use cases, authorization moves to domain services using Either types, and context becomes explicit parameters passed to use cases rather than implicit dependencies. This preserves all existing functionality while making the core business logic framework-agnostic.

Developers will benefit from simplified testing (no tRPC mocks needed for use case tests), clearer architecture (transport concerns separated from business logic), and future flexibility (ability to add REST or GraphQL endpoints using the same core logic).

**Scope**:

- **Included**:
  - Extracting authentication logic from tRPC middleware to use case ports
  - Moving authorization checks to domain services
  - Refactoring use cases to accept identity/permissions as explicit parameters
  - Creating framework-agnostic ports for cross-cutting concerns
  - Updating DI wiring to support new patterns
  - Maintaining backward compatibility with existing tRPC routes
- **Excluded**:
  - Replacing tRPC with another framework
  - Changing the underlying authentication mechanism (Supabase/Clerk/etc.)
  - Adding new security features or permissions
  - Modifying database schema
  - Extracting tRPC-specific features that cannot be generalized

**User Scenarios**:

1. **Primary Flow**: Client authenticates via tRPC → Adapter extracts credentials → Use case validates via port → Domain checks authorization → Business logic executes → Response returns through stack
2. **Alternative Flow (Testing)**: Test creates mock identity → Calls use case directly → No tRPC infrastructure involved → Same business logic executes
3. **Error Handling**: Invalid credentials or insufficient permissions cause Effect.fail or Either.left at appropriate layer, propagating clear errors to client

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[Criterion 1]**: Authentication logic is extracted from tRPC middleware into use case layer ports
  - Given: A request with authentication credentials is received
  - When: The use case is invoked
  - Then: Authentication is performed via a port interface, not tRPC middleware

- [ ] **[Criterion 2]**: Authorization checks are moved to domain services using Either types
  - Given: An authenticated user attempts an action
  - When: Authorization is checked
  - Then: The domain service returns Either<PermissionDenied, Authorized> with no tRPC dependencies

- [ ] **[Criterion 3]**: Use cases accept user identity and permissions as explicit parameters
  - Given: A use case is being executed
  - When: User context is needed
  - Then: Identity and permissions are passed as typed parameters, not accessed via tRPC context

- [ ] **[Criterion 4]**: No business logic remains in tRPC middleware or context creation
  - Given: The tRPC framework layer is examined
  - When: Checking for business decisions
  - Then: Only transport concerns (request parsing, response formatting) are present

- [ ] **[Criterion 5]**: Use cases can be unit tested without tRPC dependencies or mocks
  - Given: A developer writes a unit test
  - When: Testing a use case
  - Then: No tRPC types, mocks, or context objects are required

- [ ] **[Criterion 6]**: Existing tRPC routes continue to work without breaking changes
  - Given: Existing client code makes tRPC calls
  - When: The refactoring is deployed
  - Then: All existing routes respond identically to before

- [ ] **[Criterion 7]**: Type safety is preserved throughout the stack with proper branded types
  - Given: IDs and typed parameters are used
  - When: Compiling the application
  - Then: TypeScript enforces correct branded types with no any types introduced

### Non-Functional Requirements

- [ ] **Testability**: All use cases can be tested with only Effect and Either patterns, zero external dependencies
- [ ] **Portability**: Core business logic has no imports from @trpc/server or tRPC-specific packages
- [ ] **Compatibility**: No breaking changes to existing API contracts or client behavior

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] Tests written and passing (unit tests for extracted use cases, integration tests for routes)
- [ ] Documentation updated (CLAUDE.md patterns updated if applicable)
- [ ] Code reviewed following SADD quality gates
- [ ] dependency-cruiser validates no domain/use-case imports from tRPC
