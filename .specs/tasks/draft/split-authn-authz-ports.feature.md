---
title: Split IAuthPort into IAuthNPort and IAuthZPort with gateway migrations
depends_on: 
  - implement-gateway-auth-protection.feature.md
---

## Initial User Prompt

Split IAuthPort into AuthN (authentication - JWT validation) and AuthZ (authorization - Role-based permissions) ports. AuthN implemented by SupabaseAuthGateway, AuthZ implemented by UserDrizzleGateway (which has Role enum). Also migrate remaining gateways: Group, Challenge, Reward, CoinTransaction.

## Description

// Will be filled in future stages by business analyst

## Design Reference

See `.specs/plans/authn-authz-split-design.md` for complete architecture design.

### Implementation Summary

Split the existing monolithic `IAuthPort` into two focused interfaces following Single Responsibility Principle:

**IAuthNPort** (Authentication - Infrastructure):
- signIn/signOut/getSession/refreshSession
- Implemented by SupabaseAuthGateway (or Better Auth in future)
- DI Tag: AuthNPortTag

**IAuthZPort** (Authorization - Domain):
- verifyAccess with Role-based checks
- checkRolePermission for complex permission logic
- Implemented by UserDrizzleGateway (has Role enum and user data)
- DI Tag: AuthZPortTag

**Gateway Migrations:**
- GroupDrizzleGateway - group organizer checks
- ChallengeDrizzleGateway - trip membership for challenges
- RewardDrizzleGateway - reward access permissions
- CoinTransactionDrizzleGateway - financial transaction auth

### Key Files

**New Interfaces:**
- `packages/domain/src/auth/ports/AuthNPort.ts`
- `packages/domain/src/auth/ports/AuthZPort.ts`

**New DI Tags:**
- `packages/use-cases/src/auth/ports/AuthNPort.ts`
- `packages/use-cases/src/auth/ports/AuthZPort.ts`

**Updated Implementations:**
- `SupabaseAuthGateway` - IAuthNPort only
- `UserDrizzleGateway` - IAuthZPort (with Role data)

**Updated Layer Composition:**
- `packages/frameworks/src/di/layer/auth.ts` - separate makeAuthNLayer/makeAuthZLayer

**Gateway Migrations:**
- Group, Challenge, Reward, CoinTransaction gateways

### Acceptance Criteria

1. IAuthNPort interface created with AuthN methods
2. IAuthZPort interface created with Role-based AuthZ methods
3. SupabaseAuthGateway implements IAuthNPort only
4. UserDrizzleGateway implements IAuthZPort
5. Both DI Tags (AuthNPortTag, AuthZPortTag) created in use-cases
6. GroupDrizzleGateway migrated with auth
7. ChallengeDrizzleGateway migrated with auth
8. RewardDrizzleGateway migrated with auth
9. CoinTransactionDrizzleGateway migrated with auth
10. All tests pass
11. No breaking changes to existing code
