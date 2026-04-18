# ADR 001: Migration from Supabase Auth to Better Auth

## Status

**Accepted**

## Context

The Mirai application currently uses Supabase Auth for authentication. While Supabase Auth has served the project well, several factors necessitate a migration to a more flexible authentication solution:

### Business Drivers

1. **Vendor Lock-in Concerns**: Supabase Auth ties authentication deeply to the Supabase ecosystem, limiting future flexibility
2. **Customization Limitations**: Supabase Auth has limited customization options for advanced authentication flows
3. **Data Ownership**: User authentication data resides in Supabase-managed tables, reducing control
4. **Cost Predictability**: As the application scales, external auth service costs become less predictable than self-hosted solutions

### Technical Drivers

1. **Clean Architecture Alignment**: Moving authentication to an embedded solution better aligns with our Clean Architecture principles
2. **Unified Database Layer**: Better Auth uses Drizzle ORM (already in use), creating consistency across the data layer
3. **Simplified Infrastructure**: Embedded auth shares the existing database connection pool
4. **Enhanced Customization**: Better Auth plugins allow custom authentication flows without vendor constraints

## Decision

Migrate from Supabase Auth to Better Auth using the **Strangler Fig Pattern** - gradual replacement with zero downtime.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database Adapter** | Drizzle ORM | Consistent with existing database layer; Better Auth provides official Drizzle adapter |
| **Deployment Model** | Embedded in backend-server | Simplifies infrastructure; shares database connection pool with application |
| **Session Strategy** | Cookie-based sessions | Better Auth native implementation; more secure than JWT (httpOnly, secure, sameSite by default) |
| **Route Structure** | `/api/auth/*` for Better Auth, `/api/graphql` for GraphQL | Clear separation of concerns; REST convention for auth, dedicated path for GraphQL |
| **Authorization** | Domain-level `verifyAccess()` | Better Auth handles authentication; domain layer handles resource permissions via existing gateway-auth-protection pattern |
| **Mobile Session** | Cookie jar with SecureStore | React Native uses `expo-secure-store` for session persistence; compatible with Better Auth cookie model |
| **User Migration** | Email OTP flow | Seamless migration - users verify via OTP, set new password, no data loss |
| **Error Handling** | Effect-based with domain errors | Maintains consistency with existing error handling patterns across the monorepo |

### Architecture Impact

```
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer (packages/domain/)                            │
│  ────────────────────────────                               │
│  • IAuthPort interface - extended with sendSignInOtp()     │
│  • New error types for Better Auth integration             │
│  • No Better Auth imports (Clean Architecture preserved)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Use-Cases Layer (packages/use-cases/)                      │
│  ───────────────────────────────                            │
│  • AuthPortTag - unchanged (Effect Context.Tag)           │
│  • All interactors unchanged (same interface contract)      │
│  • No Better Auth imports                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Adapters Layer (packages/adapters/)                        │
│  ─────────────────────────────                              │
│  • BetterAuthGateway - implements IAuthPort                │
│  • SupabaseAuthGateway - retained during dual-run period   │
│  • Better Auth SDK imports isolated to this layer            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Frameworks Layer (packages/frameworks/)                    │
│  ─────────────────────────────────                          │
│  • createBetterAuth() - Better Auth configuration factory  │
│  • Updated DI wiring with feature flag support             │
│  • Better Auth route mounting at /api/auth/*               │
└─────────────────────────────────────────────────────────────┘
```

## Consequences

### Positive

1. **Reduced Vendor Lock-in**: Authentication logic is now self-contained and portable
2. **Enhanced Customization**: Better Auth plugins enable custom authentication flows
3. **Unified Technology Stack**: Single ORM (Drizzle) for all database operations
4. **Improved Performance**: Embedded auth eliminates external API latency
5. **Better Type Safety**: Full TypeScript integration with generated types
6. **Clean Architecture Compliance**: Domain and Use-Case layers remain technology-agnostic

### Negative

1. **Migration Complexity**: OTP-based migration requires user interaction
2. **Temporary Dual-Run**: Period of maintaining both auth systems increases complexity
3. **Operational Responsibility**: Self-hosted auth requires monitoring and maintenance
4. **Initial Development Time**: Migration requires significant upfront investment

### Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| User data loss during migration | High | OTP-based migration ensures users verify identity before account transfer; existing Supabase users remain functional during dual-run |
| Session incompatibility (mobile) | Medium | Cookie jar pattern with SecureStore tested per mobile integration patterns |
| Performance degradation | Low | Load testing during Phase 2; Better Auth embedded deployment eliminates network latency vs external Supabase Auth |
| Rollback complexity | Medium | Feature flag enables instant rollback; SupabaseAuthGateway retained until 100% migration confirmed |

## Alternatives Considered

### 1. Direct Migration (Big Bang)

**Status**: Rejected

**Reasoning**: Too risky for production auth system. Zero user downtime requirement necessitates gradual approach. Big bang migrations offer no rollback path if issues arise.

### 2. Keep Supabase Auth Indefinitely

**Status**: Rejected

**Reasoning**: Vendor lock-in conflicts with business goal. Supabase Auth limitations (customization, data ownership) do not align with long-term architectural vision.

### 3. JWT Token Strategy

**Status**: Rejected

**Reasoning**: Better Auth natively uses cookies; JWT would require custom implementation deviating from framework conventions. Cookie-based sessions are more secure by default (httpOnly, secure, sameSite).

**Implementation Note**: GraphQL authentication uses `betterAuth.api.getSession()` with cookie headers for session validation, not JWT Bearer tokens. See `apps/backend-server/src/server/graphql.ts` for the implementation.

### 4. Separate Auth Microservice

**Status**: Rejected

**Reasoning**: Adds operational complexity; embedded approach leverages existing database connection pool and reduces infrastructure overhead.

### 5. Strangler Fig with Dual-Run

**Status**: Selected

**Reasoning**: Balances risk and progress; allows gradual user migration with full rollback capability. Users seamlessly migrate via OTP-based flow without service interruption.

## Implementation Strategy

### Migration Phases

1. **Phase 1: Parallel Implementation** - Create BetterAuthGateway alongside SupabaseAuthGateway
2. **Phase 2: Dual-Run Period** - Support both auth providers with feature flag control
3. **Phase 3: Gradual User Migration** - Users seamlessly migrate via OTP-based password reset
4. **Phase 4: Supabase Auth Removal** - Clean up after 100% user migration

### Rollback Strategy

If migration fails at any phase:

1. **Feature flag reversion**: Toggle `USE_BETTER_AUTH=false` to route all auth traffic back to SupabaseAuthGateway
2. **User impact**: Zero - users keep existing Supabase sessions during dual-run period
3. **Data integrity**: No data loss - Better Auth tables are additive; Supabase auth tables remain untouched
4. **Cleanup**: Remove Better Auth routes and gateway implementation; revert DI wiring to Supabase-only

**Rollback trigger conditions:**
- Auth error rate > 1% during Phase 2
- Session validation failures reported
- Performance regression > 100ms p95 latency increase
- Security audit findings in Better Auth implementation

## References

- `.specs/analysis/analysis-better-auth-migration.md` - Complete codebase audit identifying 46 affected files
- `.specs/plans/better-auth-migration.design.md` - Detailed design decisions for Clean Architecture integration
- `.claude/skills/better-auth-migration/SKILL.md` - Better Auth framework-specific patterns
- Better Auth Documentation: https://www.better-auth.com/

## Decision Date

2026-04-18

## Decision Makers

Architecture Team, Backend Team Lead, Security Lead
