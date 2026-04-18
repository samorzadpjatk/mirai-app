# Scratchpad: Effect Auth Gateway Implementation

## Research Summary

### Existing Patterns Found

1. **Current IAuthPort** (`packages/domain/src/shared/services/index.ts`)
   - Has basic auth methods: signInWithPassword, signInWithOtp, signUp, signOut, getSession, refreshSession
   - Missing: verifyAccess method for unified session + resource verification

2. **Existing SupabaseAuthGateway** (`packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts`)
   - Implements current IAuthPort
   - Uses Effect.tryPromise pattern
   - Returns ApplicationError for failures

3. **Gateway Patterns** (from TripDrizzleGateway)
   - Extends BaseDrizzleGateway
   - Uses Effect.gen for sequential operations
   - Type inference for return types (no explicit annotations)
   - Uses branded IDs with toString() conversion

4. **Layer Composition** (`packages/frameworks/src/di/layer/app.ts`)
   - Uses Layer.mergeAll to compose layers
   - makeAppLayer receives { db, supabase } config
   - NotificationServiceLayer as example of dependent layers

5. **Error Patterns** (`packages/domain/src/shared/errors/domain-errors.ts`)
   - All errors implement IPortError
   - Use Data.TaggedError pattern
   - Have _tag and message properties

### What Needs to Be Added

1. **Domain Layer**
   - Add verifyAccess method to IAuthPort
   - Create AuthErrors.ts with AuthSessionExpiredError, PermissionDeniedError
   - Add AccessCheckRequest interface

2. **Use-Cases Layer**
   - Create AuthPortTag Context.Tag
   - Already exists in AGENTS.md but need actual implementation

3. **Adapters Layer**
   - Extend SupabaseAuthGateway with verifyAccess method
   - Implement resource permission checking against domain tables

4. **Frameworks Layer**
   - Create makeAuthLayer in packages/frameworks/src/di/layer/auth.ts
   - Update makeAppLayer to include auth layer

5. **Migration**
   - Update TripDrizzleGateway to accept authToken and call verifyAccess
   - Update other gateways (UserDrizzleGateway, etc.)
   - Update GraphQL resolvers to pass access token

### Key Decisions

1. **Port Naming**: Follow I-prefix convention - IAuthPort (exists), AuthPortTag (needs creation)

2. **Error Strategy**: Use IPortError abstract interface, concrete errors in implementations

3. **Verification Flow**:
   - Step 1: Validate JWT with Supabase Auth
   - Step 2: Check resource permissions against domain tables (trip_participants, group_members, etc.)

4. **Token Passing**: Pass authToken as explicit parameter to gateway methods (not in context)
   - Clean, explicit
   - Easy to test with different tokens
   - Clear data flow

5. **Testing Strategy**:
   - Mock auth layer for unit tests (bypass auth)
   - Real auth layer for integration tests
   - Use Effect.either for type-safe error testing

### Open Questions

1. How to handle different resource permission models?
   - Trip: check trip_participants table
   - Group: check group_members table
   - Challenge: check challenge_participants or group membership
   - User: self or admin only

2. Should verifyAccess return user info or just void?
   - Return void: simpler, already have user from token
   - Return user info: useful for logging/auditing
   - Decision: Return void for now, can extend later

3. How to handle admin override?
   - Add admin flag to user metadata
   - Check is_admin in verifyAccess
   - Short-circuit permission check for admins

### Implementation Order

1. Domain layer (IAuthPort, AuthErrors) - no dependencies
2. Use-cases layer (AuthPortTag) - depends on domain
3. Frameworks layer (makeAuthLayer) - depends on use-cases
4. Adapters layer (SupabaseAuthGateway.verifyAccess) - depends on all above
5. Migration (update gateways) - depends on adapter changes
6. GraphQL resolvers - depends on gateway changes
7. Testing - parallel with migration

### Files to Create/Modify

**New Files:**
- packages/domain/src/auth/ports/AuthPort.ts
- packages/domain/src/auth/errors/AuthErrors.ts
- packages/domain/src/auth/index.ts
- packages/use-cases/src/auth/ports/AuthPort.ts
- packages/use-cases/src/auth/index.ts
- packages/frameworks/src/di/layer/auth.ts

**Modified Files:**
- packages/domain/src/shared/services/index.ts (add verifyAccess to IAuthPort)
- packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts (add verifyAccess)
- packages/frameworks/src/di/layer/app.ts (include auth layer)
- packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.ts (add auth)
- packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts (add auth)
- GraphQL resolvers (pass access token)

### Verification Checklist

- [ ] IAuthPort has verifyAccess method
- [ ] AuthPortTag Context.Tag exists
- [ ] SupabaseAuthGateway implements verifyAccess
- [ ] makeAuthLayer factory exists
- [ ] makeAppLayer includes auth layer
- [ ] TripDrizzleGateway calls verifyAccess
- [ ] UserDrizzleGateway calls verifyAccess
- [ ] GraphQL resolvers pass access token
- [ ] Mock auth layer works for tests
- [ ] Integration tests pass with real auth
- [ ] Error mapping to GraphQL works

### References to Project Patterns

- AGENTS.md: Port naming convention (I-prefix, Tag suffix)
- AGENTS.md: Inference-first convention for gateways
- AGENTS.md: Effect patterns (Effect.gen, yield*, Context.Tag)
- packages/adapters/AGENTS.md: Gateway patterns with Effect.tryPromise
- packages/frameworks/AGENTS.md: Layer composition patterns
- .specs/plans/gateway-auth-protection.design.md: Full design document
