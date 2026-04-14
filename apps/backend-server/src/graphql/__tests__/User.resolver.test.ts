/**
 * User GraphQL Resolver Tests
 *
 * Tests for User domain GraphQL resolvers.
 * Verifies query behavior, authentication, and error handling.
 *
 * @module User/resolver-tests
 */

import { describe, it, expect, beforeEach, beforeAll } from "bun:test";
import { graphql, printSchema } from "graphql";
import { schema } from "../schema";
import { createTestContainer, PORT_TOKENS } from "@mirai-app/frameworks/di";
import { asClass, asValue } from "awilix";
import { UserController, InMemoryAuthAdapter } from "@mirai-app/adapters";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";
import { User, UserRole, UserId } from "@mirai-app/domain";
import type { AwilixContainer } from "awilix";
import { Runtime } from "effect";
import type { AuthContext } from "@mirai-app/domain";

// =============================================================================
// Test Setup
// =============================================================================

/**
 * Test context with container
 */
interface TestContext {
  container: AwilixContainer;
  authAdapter: InMemoryAuthAdapter;
}

/**
 * Helper to create GraphQL context for tests
 * Includes the required runtime field for Effect integration
 */
function createTestGraphQLContext(
  container: AwilixContainer,
  authToken?: string,
  authContext?: AuthContext,
): {
  container: AwilixContainer;
  request: Request;
  runtime: Runtime.Runtime<never>;
  authContext?: AuthContext;
} {
  return {
    container,
    request: new Request("http://localhost/graphql", {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    }),
    runtime: Runtime.defaultRuntime,
    authContext,
  };
}

// Test users
const TEST_USERS = {
  admin: {
    id: "550e8400-e29b-41d4-a716-446655440001",
    authUserId: "auth-admin-001",
    firstName: "Admin",
    lastName: "User",
    role: UserRole.ADMIN,
    hasAvatar: false,
  },
  moderator: {
    id: "550e8400-e29b-41d4-a716-446655440002",
    authUserId: "auth-moderator-002",
    firstName: "Moderator",
    lastName: "User",
    role: UserRole.MODERATOR,
    hasAvatar: true,
  },
  regular: {
    id: "550e8400-e29b-41d4-a716-446655440003",
    authUserId: "auth-user-003",
    firstName: "Regular",
    lastName: "User",
    role: UserRole.USER,
    hasAvatar: false,
  },
};

describe("[INTEGRATION] User GraphQL Resolvers () => {
  let context: TestContext;
  let adminToken: string;
  let userToken: string;
  let adminAuthContext: AuthContext;
  let userAuthContext: AuthContext;

  beforeAll(async () => {
    // Setup container
    context = {
      container: createTestContainer(),
      authAdapter: new InMemoryAuthAdapter(),
    };

    // Register auth adapter, user repository, and user controller
    // Using asValue to avoid PROXY mode issues with Effect-based repositories
    const userRepo = new InMemoryUserRepository();
    context.container.register({
      [PORT_TOKENS.AuthPort]: asClass(InMemoryAuthAdapter).singleton(),
      userRepository: asValue(userRepo),
      userController: asValue(new UserController(userRepo)),
    });

    // Get auth adapter (userRepo already declared above)
    const authAdapter = context.container.resolve<InMemoryAuthAdapter>(
      PORT_TOKENS.AuthPort,
    );

    // Import Effect for running Effects
    const { Effect } = await import("effect");

    // Create users using Effect and run them
    const adminEffect = User.create({
      id: TEST_USERS.admin.id,
      authUserId: TEST_USERS.admin.authUserId,
      firstName: TEST_USERS.admin.firstName,
      lastName: TEST_USERS.admin.lastName,
      role: TEST_USERS.admin.role,
      hasAvatar: TEST_USERS.admin.hasAvatar,
      createdAt: new Date("2024-01-01"),
    });
    const modEffect = User.create({
      id: TEST_USERS.moderator.id,
      authUserId: TEST_USERS.moderator.authUserId,
      firstName: TEST_USERS.moderator.firstName,
      lastName: TEST_USERS.moderator.lastName,
      role: TEST_USERS.moderator.role,
      hasAvatar: TEST_USERS.moderator.hasAvatar,
      createdAt: new Date("2024-01-02"),
    });
    const userEffect = User.create({
      id: TEST_USERS.regular.id,
      authUserId: TEST_USERS.regular.authUserId,
      firstName: TEST_USERS.regular.firstName,
      lastName: TEST_USERS.regular.lastName,
      role: TEST_USERS.regular.role,
      hasAvatar: TEST_USERS.regular.hasAvatar,
      createdAt: new Date("2024-01-03"),
    });

    // Run Effects and collect successful results
    const users: import("@mirai-app/domain").User[] = [];

    const adminEither = await Effect.runPromise(Effect.either(adminEffect));
    if (adminEither._tag === "Right") users.push(adminEither.right);
    else console.log("Admin creation failed:", adminEither.left.message);

    const modEither = await Effect.runPromise(Effect.either(modEffect));
    if (modEither._tag === "Right") users.push(modEither.right);
    else console.log("Mod creation failed:", modEither.left.message);

    const userEither = await Effect.runPromise(Effect.either(userEffect));
    if (userEither._tag === "Right") users.push(userEither.right);
    else console.log("User creation failed:", userEither.left.message);

    console.log("Seeding users:", users.length, "users");
    await Effect.runPromise(userRepo.seed(users));

    // Verify users are seeded
    const allUsers = await Effect.runPromise(userRepo.findAll());
    console.log("Users in repo after seed:", allUsers.length);
    console.log(
      "User IDs in repo:",
      allUsers.map((u) => u.id),
    );

    // Try to find a specific user
    const foundUser = await Effect.runPromise(
      userRepo.findById(TEST_USERS.regular.id),
    );
    console.log("Found user by ID:", foundUser ? foundUser.id : null);

    // Verify controller has the same repository
    const resolvedController =
      context.container.resolve<UserController>("userController");
    const controllerRepoUsers = await Effect.runPromise(
      resolvedController["userRepository"].findAll(),
    );
    console.log("Users via controller's repo:", controllerRepoUsers.length);

    // Create auth users in InMemoryAuthAdapter
    const adminUserId = UserId.create(TEST_USERS.admin.id);
    const regularUserId = UserId.create(TEST_USERS.regular.id);

    authAdapter.createUser({
      id: adminUserId,
      role: UserRole.ADMIN,
    });

    authAdapter.createUser({
      id: regularUserId,
      role: UserRole.USER,
    });

    // Create sessions and get tokens
    const adminSession = authAdapter.createSession(adminUserId);
    adminToken = adminSession.token;

    const userSession = authAdapter.createSession(regularUserId);
    userToken = userSession.token;

    // Create auth contexts for tests
    const { AuthContext: AuthContextClass } = await import("@mirai-app/domain");

    // Run admin auth context Effect
    const adminAuthEffect = AuthContextClass.create({
      userId: adminUserId,
      role: UserRole.ADMIN,
      authenticatedAt: new Date(),
      sessionId: adminSession.id,
    });
    const adminAuthEither = await Effect.runPromise(
      Effect.either(adminAuthEffect),
    );
    if (adminAuthEither._tag === "Right") {
      adminAuthContext = adminAuthEither.right;
    }

    // Run user auth context Effect
    const userAuthEffect = AuthContextClass.create({
      userId: regularUserId,
      role: UserRole.USER,
      authenticatedAt: new Date(),
      sessionId: userSession.id,
    });
    const userAuthEither = await Effect.runPromise(
      Effect.either(userAuthEffect),
    );
    if (userAuthEither._tag === "Right") {
      userAuthContext = userAuthEither.right;
    }
  });

  beforeEach(() => {
    // Reset container state if needed
  });

  // =============================================================================
  // user(id: ID!) Query Tests
  // =============================================================================

  describe("[UNIT] Query: user(id: ID!)", () => {
    const USER_QUERY = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          authUserId
          firstName
          lastName
          fullName
          role
          hasAvatar
          isAdmin
          isModerator
        }
      }
    `;

    it("returns user data when authenticated with valid ID", async () => {
      const result = await graphql({
        schema,
        source: USER_QUERY,
        variableValues: { id: TEST_USERS.regular.id },
        contextValue: createTestGraphQLContext(
          context.container,
          userToken,
          userAuthContext,
        ),
      });

      // Debug: log full result
      console.log("GraphQL result:", JSON.stringify(result, null, 2));
      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.id).toBe(TEST_USERS.regular.id);
      expect(result.data?.user.firstName).toBe("Regular");
      expect(result.data?.user.fullName).toBe("Regular User");
      expect(result.data?.user.role).toBe("USER");
      expect(result.data?.user.isAdmin).toBe(false);
      expect(result.data?.user.isModerator).toBe(false);
    });

    it("returns admin user data when requested by regular user", async () => {
      const result = await graphql({
        schema,
        source: USER_QUERY,
        variableValues: { id: TEST_USERS.admin.id },
        contextValue: createTestGraphQLContext(
          context.container,
          userToken,
          userAuthContext,
        ),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.id).toBe(TEST_USERS.admin.id);
      expect(result.data?.user.role).toBe("ADMIN");
      expect(result.data?.user.isAdmin).toBe(true);
    });

    it("returns null for non-existent user ID", async () => {
      const result = await graphql({
        schema,
        source: USER_QUERY,
        variableValues: { id: "550e8400-e29b-41d4-a716-446655440999" },
        contextValue: createTestGraphQLContext(
          context.container,
          userToken,
          userAuthContext,
        ),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.user).toBeNull();
    });

    it("returns authentication error when no token provided", async () => {
      const result = await graphql({
        schema,
        source: USER_QUERY,
        variableValues: { id: TEST_USERS.regular.id },
        contextValue: createTestGraphQLContext(context.container),
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
    });

    it("returns authentication error with invalid token", async () => {
      const result = await graphql({
        schema,
        source: USER_QUERY,
        variableValues: { id: TEST_USERS.regular.id },
        contextValue: createTestGraphQLContext(context.container, "invalid"),
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
    });
  });

  // =============================================================================
  // Query: users Tests
  // =============================================================================

  describe("[UNIT] Query: users (admin only)", () => {
    const USERS_QUERY = `
      query GetUsers($limit: Int, $offset: Int) {
        users(limit: $limit, offset: $offset) {
          id
          firstName
          lastName
          role
        }
      }
    `;

    it("returns all users when authenticated as admin", async () => {
      const result = await graphql({
        schema,
        source: USERS_QUERY,
        variableValues: {},
        contextValue: createTestGraphQLContext(
          context.container,
          adminToken,
          adminAuthContext,
        ),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.users).toBeInstanceOf(Array);
      expect(result.data?.users.length).toBeGreaterThanOrEqual(3);
    });

    it("returns forbidden error when authenticated as regular user", async () => {
      const result = await graphql({
        schema,
        source: USERS_QUERY,
        variableValues: {},
        contextValue: createTestGraphQLContext(
          context.container,
          userToken,
          userAuthContext,
        ),
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].extensions?.code).toBe("FORBIDDEN");
    });

    it("respects pagination parameters", async () => {
      const result = await graphql({
        schema,
        source: USERS_QUERY,
        variableValues: { limit: 2, offset: 0 },
        contextValue: createTestGraphQLContext(
          context.container,
          adminToken,
          adminAuthContext,
        ),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.users).toBeInstanceOf(Array);
      expect(result.data?.users.length).toBeLessThanOrEqual(2);
    });
  });

  // =============================================================================
  // Query: me Tests
  // =============================================================================

  describe("[UNIT] Query: me", () => {
    const ME_QUERY = `
      query GetMe {
        me {
          id
          authUserId
          firstName
          lastName
          fullName
          role
          hasAvatar
          isAdmin
          isModerator
        }
      }
    `;

    it("returns current authenticated user data", async () => {
      const result = await graphql({
        schema,
        source: ME_QUERY,
        contextValue: createTestGraphQLContext(
          context.container,
          userToken,
          userAuthContext,
        ),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      expect(result.data?.me).toBeDefined();
      expect(result.data?.me.id).toBe(TEST_USERS.regular.id);
      expect(result.data?.me.authUserId).toBe(TEST_USERS.regular.authUserId);
      expect(result.data?.me.firstName).toBe("Regular");
      expect(result.data?.me.role).toBe("USER");
    });

    it("returns admin user when authenticated as admin", async () => {
      const result = await graphql({
        schema,
        source: ME_QUERY,
        contextValue: createTestGraphQLContext(
          context.container,
          adminToken,
          adminAuthContext,
        ),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.me).toBeDefined();
      expect(result.data?.me.id).toBe(TEST_USERS.admin.id);
      expect(result.data?.me.role).toBe("ADMIN");
      expect(result.data?.me.isAdmin).toBe(true);
    });

    it("returns authentication error when no token provided", async () => {
      const result = await graphql({
        schema,
        source: ME_QUERY,
        contextValue: createTestGraphQLContext(context.container),
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
    });

    it("returns authentication error with malformed token", async () => {
      const result = await graphql({
        schema,
        source: ME_QUERY,
        contextValue: createTestGraphQLContext(context.container, "invalid"),
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
    });
  });

  // =============================================================================
  // Schema Generation Test
  // =============================================================================

  describe("[UNIT] Schema Generation", () => {
    it("generates valid GraphQL schema", () => {
      console.log("[Test] About to print schema...");
      const sdl = printSchema(schema);
      console.log("[Test] Schema length:", sdl.length);
      console.log("[Test] Has type User:", sdl.includes("type User"));
      console.log("[Test] Has user(id:", sdl.includes("user(id"));

      // Check Query type specifically - print first 5000 chars of Query section
      const queryStart = sdl.indexOf("type Query {");
      if (queryStart >= 0) {
        const querySection = sdl.slice(queryStart, queryStart + 5000);
        console.log("[Test] Query type section (first 5000 chars):");
        console.log(querySection);
        console.log(
          "[Test] user(id: ID!): User in section:",
          querySection.includes("user(id: ID!): User"),
        );
        console.log(
          "[Test] just 'user(' in section:",
          querySection.includes("user("),
        );
      } else {
        console.log("[Test] Query type not found in schema");
        // Print all type definitions
        const allTypes = sdl.match(/type \w+ \{/g);
        console.log("[Test] All types in schema:", allTypes);
      }

      expect(sdl).toContain("type User");
      expect(sdl).toContain("type Query");
      expect(sdl).toContain("user(id: ID!): User");
      expect(sdl).toContain("users(limit: Int, offset: Int): [User!]!");
      expect(sdl).toContain("me: User");
      expect(sdl).toContain("enum UserRole");
    });

    it("includes User fields in schema", () => {
      const sdl = printSchema(schema);

      expect(sdl).toContain("id: ID!");
      expect(sdl).toContain("firstName: String!");
      expect(sdl).toContain("lastName: String!");
      expect(sdl).toContain("fullName: String!");
      expect(sdl).toContain("role: UserRole!");
      expect(sdl).toContain("hasAvatar: Boolean!");
      expect(sdl).toContain("isAdmin: Boolean!");
      expect(sdl).toContain("isModerator: Boolean!");
    });
  });
});
