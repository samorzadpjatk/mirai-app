# Adapter Layer — Quick Reference

> **DI patterns, controllers, and gateways for the Mirai App monorepo**
>
> This package contains GraphQL resolvers, database gateways, and awilix-modular DI configuration.

---

## Package Structure

The adapters package uses **domain-based folder organization**:

```
src/
├── activity/       # Activity domain adapters
├── challenge/      # Challenge domain
├── coin/           # Coin transaction domain
├── event/          # Event domain
├── group/          # Group domain
├── location/       # Location domain
├── notification/   # Notification domain
├── ranking/        # Ranking domain
├── reward/         # Reward domain
├── sponsor/        # Sponsor domain
├── storage/        # Storage domain
├── submission/     # Submission report domain
├── trip/           # Trip domain
├── user/           # User domain
├── auth/           # Authentication adapters
└── system/         # Shared utilities (controllers, gateways, mappers, errors)
```

Each domain folder contains: `controllers/`, `gateways/`, `mappers/`

---

## Universal Rules

- **TDD first:** Write the failing test before implementation
- **GraphQL workflow:** Never edit generated GraphQL clients, types, or operations. Only edit Pothos schema files, then sync schema, then regenerate client

---

## Dependency Injection (Effect-based)

The monorepo uses **Effect-based DI** with controllers instantiated per-request. **Controllers are accessed via `ctx.controllers`.**

### Quick reference

```ts
// In resolver: access controller from context
const controller = ctx.controllers.userController;
const result = await controller.getById(input);
if (!result.success) {
  throw new GraphQLError(result.error, {
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  });
}
return result.data;

// In test: create test context with mocked controllers
const ctx = createTestContext({
  controllers: {
    userController: new MockUserController(),
  },
});
```

### Controller access in resolvers

```ts
export const userResolvers = {
  Query: {
    user: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) => {
      // Auth happens in controller, not middleware
      const controller = ctx.controllers.userController;
      const result = await controller.getById({ id: args.id });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  },
};
```

### Effect Layer Composition

```ts
import { Layer } from "effect";

// Compose layers for dependency injection
export const AppLayer = Layer.mergeAll(RepositoryLive, ServiceLive, LoggerLive);

// Controllers are instantiated with the appLayer
export const controllers = createControllers({ appLayer });
```

### Scope strategy

| Scope     | Use for                          | Lifetime         |
| --------- | -------------------------------- | ---------------- |
| SINGLETON | Repositories, stateless services | One per app      |
| SCOPED    | Controllers, use cases           | One per request  |
| TRANSIENT | Utilities, factories             | New each resolve |

---

## Authentication in controllers

Controllers handle authentication using the `AuthServer` class:

```typescript
import { AuthServer } from "@mirai-app/adapters/auth/controllers";

// In controller method:
async getById(input: GetByIdInput, di: DIContext) {
  // Require authentication (throws GraphQLError if missing/invalid)
  const { dbUser } = await this.authServer.requireAuth(di.supabase, di.accessToken);

  // Now dbUser.id, dbUser.role available
  const authContext = { userId: dbUser.id, role: dbUser.role };
  return await this.useCase.execute({ ...input, authContext });
}

// For admin-only endpoints:
async adminAction(input: AdminInput, di: DIContext) {
  // Throws if not admin
  const { dbUser } = await this.authServer.requireAdmin(di.supabase, di.accessToken);
  // ...
}
```

AuthContext is passed explicitly to use cases. No auth in GraphQL middleware.

Available `AuthServer` methods:

- `requireAuth(supabase, accessToken)` - Require valid authentication
- `requireAdmin(supabase, accessToken)` - Require admin role
- `requireModerator(supabase, accessToken)` - Require moderator role
- `getOptionalAuth(supabase, accessToken)` - Get auth if present (returns null if missing)

---

## Logging in Effect

Use `EffectLogger` from `@mirai-app/shared` for all Effect-based logging:

```ts
import { EffectLogger } from "@mirai-app/shared";

// In Effect.gen blocks
const program = Effect.gen(function* () {
  yield* EffectLogger.info("Operation started", { userId: "123" });
  // ... logic
  yield* EffectLogger.error("Failed", error, { operation: "save" });
});
```

---

## Gateway Patterns with Effect.tryPromise

Wrap external calls (Drizzle ORM, Supabase, HTTP APIs) with `Effect.tryPromise`:

### Gateway Implementation Pattern

Gateways implement the domain `IXxxPort` interface directly:

```ts
// packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts
import type { IUserPort } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

export class UserDrizzleGateway
  extends BaseDrizzleGateway
  implements IUserPort
{
  // Implement I-prefix interface from domain
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
      catch: (error) => new DatabaseError({ cause: error }),
    }).pipe(
      Effect.map((dbUser) => (dbUser ? this.mapper.toDomain(dbUser) : null)),
    );
  }

  // ... implement all IUserPort methods
}
```

### Key Points

- Implement `IXxxPort` interface from `@mirai-app/domain`
- Extend `BaseDrizzleGateway` for consistent error handling
- Use `Effect.tryPromise` to wrap database calls
- Convert errors at boundaries — never let database errors leak into use cases
- Map database records to domain entities using mappers

---

## BaseDrizzleGateway rules

The shared base gateway (`BaseDrizzleGateway` in `system/shared/gateways/drizzle-base.ts`) must remain **mechanical**:

- **Allowed:** CRUD boilerplate, query helpers, pagination helpers, transaction plumbing.
- **Not allowed:** business rules, invariants, authorization, domain decisions.
- **Mapping rule:** persistence ↔ domain mapping stays in **mappers**.
- **Invariant rule:** invariants live in **domain/use-cases**, not adapters.

---

## Port Naming Pattern Reference

### Cross-Layer Naming Conventions

| Layer         | Pattern              | Example                      |
| ------------- | -------------------- | ---------------------------- |
| **Domain**    | `I` + `XxxPort`      | `IUserPort`, `ITripPort`     |
| **Use-Cases** | `XxxPortTag`         | `UserPortTag`, `TripPortTag` |
| **Adapters**  | Implement `IXxxPort` | `implements IUserPort`       |

### Example: User Domain

```typescript
// Domain (packages/domain/src/user/ports/UserPort.ts)
export interface IUserPort {
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never>;
}

// Use-Cases (packages/use-cases/src/user/ports/UserPort.ts)
export class UserPortTag extends Context.Tag("UserPort")<
  UserPortTag,
  IUserPort
>() {}

// Adapters (packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts)
export class UserDrizzleGateway implements IUserPort {
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never> {
    // Implementation
  }
}
```

---

## Deep Reference

For comprehensive adapter patterns, see CLAUDE.md:

- §5.3 Adapters Layer: Effect.tryPromise, error conversion
- §5.4 Frameworks Layer: awilix-modular integration
- §5.5 Authentication & Authorization: Controller patterns
- §10.5.3: Adapter/Gateway testing patterns
- §10.7: Effect Pattern Quick Reference — tryPromise, runPromise

---

**Last Updated:** 2026-04-17 (Added Port naming pattern documentation)
