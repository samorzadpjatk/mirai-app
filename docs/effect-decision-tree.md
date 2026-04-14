# Effect vs Async/Await — Quick Decision Tree

**Purpose:** Help developers choose the right async pattern quickly  
**Reference:** CLAUDE.md §10.7, §10.2, §10.5

---

## 🎯 The Decision Tree

```
Is this a CONTROLLER (system boundary)?
├─ YES → Use async/await with try/catch
│   ├─ Simple CRUD → Plain async/await
│   └─ Complex orchestration → async/await + Effect.runPromise at end
│
└─ NO → Is this USE CASE orchestration?
    ├─ YES → Use Effect.gen + yield* + Context.Tags
    │   └─ Need dependencies? → Use Context.Tag injection
    │
    └─ NO → Is this DOMAIN validation?
        ├─ YES → Use Effect<T, E, never> (pure Effects)
        │   └─ Simple validation? → Effect.succeed/fail directly
        │   └─ Complex validation? → Effect.gen for chaining
        │
        └─ NO → Is this GATEWAY (external API)?
            ├─ YES → Use Effect.tryPromise
            └─ NO → Use standard async/await
```

---

## 📋 Layer-by-Layer Guide

### Domain Layer (`packages/domain/`)

**When to use:** Business logic, validation, entity creation

```typescript
// ✅ GOOD: Pure validation
static create(props: Props): Effect.Effect<User, ValidationError, never> {
  if (!isValidEmail(props.email)) {
    return Effect.fail(new ValidationError({ field: "email", message: "Invalid" }));
  }
  return Effect.succeed(new User(props));
}

// ✅ GOOD: Chained validation with Effect.gen
static createComplex(props: Props): Effect.Effect<User, ValidationError, never> {
  return Effect.gen(function* () {
    const email = yield* Email.create(props.email);  // may fail
    const phone = yield* Phone.create(props.phone);  // may fail
    return new User({ email, phone });
  });
}
```

**Key rule:** Return `Effect<T, E, never>` — no dependencies, no exceptions

---

### Use Cases Layer (`packages/use-cases/`)

**When to use:** Orchestrating multiple domain operations, business workflows

```typescript
// ✅ GOOD: Orchestration with dependencies
execute(input: Input): Effect.Effect<Output, Errors, UserRepository | GroupRepository> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepository;  // Get from Context
    const groupRepo = yield* GroupRepository;

    const user = yield* userRepo.findById(input.userId);
    if (!user) {
      return yield* Effect.fail(new NotFoundError({ entity: "User", id: input.userId }));
    }

    const groups = yield* groupRepo.findByUserId(user.id);
    return { user, groups };
  });
}
```

**Key rule:** Return `Effect<T, E, R>` where R contains Context.Tags for dependencies

---

### Adapters Layer (`packages/adapters/`)

#### Gateways (External APIs, DB)

**When to use:** Wrapping external calls, converting errors

```typescript
// ✅ GOOD: Wrapping Drizzle with Effect.tryPromise
findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({
    try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
    catch: (error) => new DatabaseError({ operation: "findById", id, cause: error }),
  }).pipe(Effect.map((record) => record ? UserMapper.toDomain(record) : null));
}
```

**Key rule:** Use `Effect.tryPromise` to wrap external APIs, convert errors to domain types

#### Controllers (System Boundaries)

**When to use:** Converting Effects to HTTP responses

```typescript
// ✅ GOOD: Controller boundary with error conversion
async handle(input: Input, di: DIContext) {
  // Run the Effect and convert errors at the boundary
  return await Effect.runPromise(
    this.useCase.execute(input).pipe(
      Effect.catchTag("NotFoundError", () => {
        throw new TRPCError({ code: "NOT_FOUND" });
      }),
      Effect.catchTag("ValidationError", (error) => {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }),
    ),
  );
}

// ✅ ALSO GOOD: Simple controller with async/await
async simpleGet(input: { id: string }) {
  const user = await this.db.query.users.findFirst({ where: eq(users.id, input.id) });
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return user;
}
```

**Key rule:** Controllers can use either pattern:

- **Effect pattern:** When orchestrating multiple use cases, need error composition
- **Async/await:** When simple CRUD or single operation

---

## ⚡ Performance Considerations

| Pattern             | Overhead | Best For                                               |
| ------------------- | -------- | ------------------------------------------------------ |
| `async/await`       | Minimal  | Simple operations, controllers, single DB calls        |
| `Effect.gen`        | Low      | Orchestration, error composition, dependency injection |
| `Effect.tryPromise` | Low      | Wrapping external APIs                                 |
| `Effect.runPromise` | Low      | Running Effects at boundaries                          |

**Rule of thumb:**

- If you need **error composition** or **dependency injection** → Use Effect
- If you have **simple sequential operations** → Use async/await
- If you're at a **system boundary** (controller) → Either is fine, choose based on complexity

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't use Effect for simple validation

```typescript
// BAD: Overkill for simple check
static validateEmail(email: string): Effect.Effect<boolean, ValidationError, never> {
  return Effect.gen(function* () {
    if (!email.includes("@")) {
      return yield* Effect.fail(new ValidationError({ field: "email", message: "Invalid" }));
    }
    return true;
  });
}

// GOOD: Direct return
static validateEmail(email: string): Effect.Effect<boolean, ValidationError, never> {
  if (!email.includes("@")) {
    return Effect.fail(new ValidationError({ field: "email", message: "Invalid" }));
  }
  return Effect.succeed(true);
}
```

### ❌ Don't wrap every Promise in Effect.tryPromise

```typescript
// BAD: Unnecessary wrapping
const result = await Effect.runPromise(
  Effect.tryPromise({
    try: () => fetch("/api/users"),
    catch: (e) => new NetworkError({ cause: e }),
  }),
);

// GOOD: Simple fetch with try/catch
try {
  const result = await fetch("/api/users");
  return result;
} catch (e) {
  throw new NetworkError({ cause: e });
}
```

### ❌ Don't mix patterns within a function

```typescript
// BAD: Mixing async/await and Effect
async function mixed() {
  const user = await db.query.users.findFirst(); // async/await
  const validated = await Effect.runPromise(
    User.validate(user), // Effect
  );
  return validated;
}

// GOOD: Choose one pattern
async function consistentAsync() {
  const user = await db.query.users.findFirst();
  if (!user) throw new NotFoundError();
  return user;
}

// OR: Full Effect
function consistentEffect() {
  return Effect.gen(function* () {
    const user = yield* Effect.tryPromise({
      try: () => db.query.users.findFirst(),
      catch: () => new DatabaseError(),
    });
    if (!user) {
      return yield* Effect.fail(new NotFoundError());
    }
    return user;
  });
}
```

---

## 🎓 Migration Examples

### From Async/Await to Effect (Use Case)

```typescript
// BEFORE: Async/await with manual error handling
async function createUser(
  input: CreateUserInput,
): Promise<Result<User, Error>> {
  try {
    const existing = await userRepo.findByEmail(input.email);
    if (existing) {
      return err(new UserAlreadyExistsError(input.email));
    }

    const user = await userRepo.create({
      email: input.email,
      createdAt: new Date(),
    });

    return ok(user);
  } catch (e) {
    return err(new DatabaseError(String(e)));
  }
}

// AFTER: Effect with composable errors
function createUser(
  input: CreateUserInput,
): Effect.Effect<User, UserAlreadyExistsError | DatabaseError, UserRepository> {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepository;

    const existing = yield* userRepo.findByEmail(input.email);
    if (existing) {
      return yield* Effect.fail(
        new UserAlreadyExistsError({ email: input.email }),
      );
    }

    return yield* userRepo.create({
      email: input.email,
      createdAt: new Date(),
    });
  });
}
```

### From Effect to Async/Await (Controller Simplification)

```typescript
// BEFORE: Unnecessary Effect wrapping
async function getUserController(input: { id: string }) {
  return await Effect.runPromise(
    Effect.tryPromise({
      try: () => db.query.users.findFirst({ where: eq(users.id, input.id) }),
      catch: (e) => new DatabaseError({ cause: e }),
    }).pipe(
      Effect.map((user) => {
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),
    ),
  );
}

// AFTER: Simple async/await
async function getUserController(input: { id: string }) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, input.id),
  });
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return user;
}
```

---

## 📚 Quick Reference Card

| Situation              | Pattern                               | Return Type           |
| ---------------------- | ------------------------------------- | --------------------- |
| Domain validation      | `Effect.succeed/fail` or `Effect.gen` | `Effect<T, E, never>` |
| Use case orchestration | `Effect.gen` + `yield*`               | `Effect<T, E, R>`     |
| External API wrapper   | `Effect.tryPromise`                   | `Effect<T, E, never>` |
| Simple controller      | `async/await` + try/catch             | `Promise<T>`          |
| Complex controller     | `async/await` + `Effect.runPromise`   | `Promise<T>`          |
| Repository gateway     | `Effect.tryPromise`                   | `Effect<T, E, never>` |
| Simple validation      | Direct return, no Effect              | `T \| null`           |

---

## 🆘 When in Doubt

**Ask yourself:**

1. Do I need to compose multiple operations with shared error handling? → **Use Effect**
2. Do I need dependency injection for repositories? → **Use Effect**
3. Is this a simple, single-operation controller endpoint? → **Use async/await**
4. Am I at a system boundary converting to HTTP? → **Either is fine**

**Still unsure?** Use async/await — it's simpler and easier to refactor later if needed.

---

**Last Updated:** 2026-04-14  
**Reference:** CLAUDE.md §10.x (Effect Framework Patterns)
