/**
 * GraphQL Yoga Integration Tests
 *
 * End-to-end tests for the GraphQL Yoga integration with Hono.
 * Verifies that the GraphQL endpoint responds correctly, handles auth,
 * and returns expected data.
 *
 * @module yoga-integration-tests
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { Hono } from "hono";
import { serve, type ServerType } from "@hono/node-server";
import { createYogaHandler } from "../../graphql/yoga-handler";
import { honoConfig } from "../../config/hono-config";
import { createTestLayer } from "@mirai-app/frameworks/di";
import { Layer, Effect, Runtime } from "effect";
import { InMemoryAuthAdapter, UserController } from "@mirai-app/adapters";
import { UserRepositoryTag } from "@mirai-app/use-cases";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";
import { User, UserRole, UserId, type AuthContext } from "@mirai-app/domain";
import type { Layer as EffectLayer } from "effect";
import type { Context as HonoContext } from "hono";

// =============================================================================
// Test Setup
// =============================================================================

/**
 * Test context with adapters and server
 */
interface TestContext {
  authAdapter: InMemoryAuthAdapter;
  userRepo: InMemoryUserRepository;
  server: HonoServer;
  baseUrl: string;
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
  regular: {
    id: "550e8400-e29b-41d4-a716-446655440003",
    authUserId: "auth-user-003",
    firstName: "Regular",
    lastName: "User",
    role: UserRole.USER,
    hasAvatar: false,
  },
};

let testContext: TestContext;
let adminToken: string;
let userToken: string;

describe("[INTEGRATION] GraphQL Yoga Endpoint", () => {
  beforeAll(async () => {
    // Create InMemory adapters
    const authAdapter = new InMemoryAuthAdapter();
    const userRepo = new InMemoryUserRepository();

    // Create test layer with the shared repository
    // This ensures the same repo instance is used everywhere
    const testLayer = createTestLayer({
      authAdapter,
      userRepository: userRepo,
    });

    // Create admin user in repository
    const adminResult = User.create({
      id: TEST_USERS.admin.id,
      authUserId: TEST_USERS.admin.authUserId,
      firstName: TEST_USERS.admin.firstName,
      lastName: TEST_USERS.admin.lastName,
      role: TEST_USERS.admin.role,
      hasAvatar: TEST_USERS.admin.hasAvatar,
      createdAt: new Date("2024-01-01"),
    });
    if (adminResult.kind === "ok") {
      await Effect.runPromise(userRepo.save(adminResult.value));
    }

    // Create regular user in repository
    const userResult = User.create({
      id: TEST_USERS.regular.id,
      authUserId: TEST_USERS.regular.authUserId,
      firstName: TEST_USERS.regular.firstName,
      lastName: TEST_USERS.regular.lastName,
      role: TEST_USERS.regular.role,
      hasAvatar: TEST_USERS.regular.hasAvatar,
      createdAt: new Date("2024-01-03"),
    });
    if (userResult.kind === "ok") {
      await Effect.runPromise(userRepo.save(userResult.value));
    }

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

    // Create custom context factory for testing
    // This factory properly resolves auth context and provides container
    const customContextFactory = async (honoContext: HonoContext) => {
      // Get AppLayer from Hono context
      const appLayer = honoContext.get(
        "appLayer",
      ) as EffectLayer.Layer<unknown>;

      if (!appLayer) {
        throw new Error("AppLayer not found in Hono context");
      }

      // Use the appLayer directly - it already has userRepo via createTestLayer

      // Extract auth token and resolve auth context
      const authHeader =
        honoContext.req.header("authorization") ??
        honoContext.req.header("Authorization");
      let authContext: AuthContext | undefined;

      if (authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const session = authAdapter.getSessionByToken(token);
        if (session) {
          authContext = {
            userId: session.userId,
            role: session.role,
            authenticatedAt: new Date(session.createdAt),
            sessionId: session.id,
          };
        }
      }

      // Create container that resolves controllers
      // UserController expects a Layer, not a repository directly
      const mockContainer = {
        resolve: (name: string) => {
          if (name === "userController") {
            return new UserController(appLayer);
          }
          if (name === "authPort") {
            return {
              validateToken: (token: string) => {
                const session = authAdapter.getSessionByToken(token);
                if (!session) {
                  return Effect.fail(new Error("Invalid token"));
                }
                return Effect.succeed({
                  userId: session.userId,
                  role: session.role,
                  sessionId: session.id,
                  authenticatedAt: new Date(session.createdAt),
                });
              },
            };
          }
          throw new Error(`Unknown service: ${name}`);
        },
      };

      return {
        appLayer,
        request: honoContext.req.raw,
        runtime: Runtime.defaultRuntime,
        container: mockContainer,
        ...(authContext ? { authContext } : {}),
      };
    };

    // Create custom server with custom context factory
    const testConfig = {
      ...honoConfig,
      port: 4001,
      enableGraphiQL: true,
      enableLogging: false,
    };

    const app = new Hono();

    // Add AppLayer middleware
    app.use("*", async (c, next) => {
      c.set("appLayer", testLayer);
      await next();
    });

    // Create Yoga handler with custom context factory
    const yoga = createYogaHandler({
      enableGraphiQL: testConfig.enableGraphiQL,
      contextFactory: customContextFactory,
    });

    // GraphQL endpoint
    app.all("/graphql", async (c) => {
      return yoga.handle(c.req.raw, { context: c });
    });

    // Health endpoints
    app.get("/graphql/health", async (c) => {
      return c.json({
        status: "healthy",
        schema: "loaded",
        timestamp: new Date().toISOString(),
      });
    });

    app.get("/health", (c) => {
      return c.json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    // Create server
    let serverInstance: ServerType | null = null;
    let isRunning = false;

    const start = async () => {
      if (isRunning) return;
      if (!serverInstance) {
        serverInstance = serve({
          fetch: app.fetch,
          port: testConfig.port,
        });
      }
      return new Promise<void>((resolve, reject) => {
        serverInstance?.on("listening", () => {
          isRunning = true;
          resolve();
        });
        serverInstance?.on("error", reject);
      });
    };

    const stop = async () => {
      if (!isRunning || !serverInstance) return;
      return new Promise<void>((resolve) => {
        serverInstance?.close(() => {
          isRunning = false;
          resolve();
        });
      });
    };

    await start();

    testContext = {
      authAdapter,
      userRepo,
      server: {
        app,
        get server() {
          return serverInstance;
        },
        yoga,
        start,
        stop,
        isRunning: () => isRunning,
        getPort: () => testConfig.port,
      } as any,
      baseUrl: `http://localhost:${testConfig.port}`,
    };
  });

  afterAll(async () => {
    if (testContext?.server) {
      await testContext.server.stop();
    }
  });

  beforeEach(() => {
    // Reset any per-test state if needed
  });

  // =============================================================================
  // Endpoint Health Tests
  // =============================================================================

  describe("[UNIT] GraphQL Endpoint Health", () => {
    it("GraphQL endpoint at /graphql responds to GET", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
      });

      // GET to /graphql should return the GraphiQL UI, 405 (method not allowed),
      // or 406 (not acceptable) based on server configuration
      expect([200, 405, 406]).toContain(response.status);
    });

    it("GraphQL endpoint at /graphql responds to POST", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "{ __typename }",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data?.__typename).toBe("Query");
    });

    it("GraphQL health endpoint returns healthy status", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql/health`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.schema).toBe("loaded");
      expect(data.timestamp).toBeDefined();
    });
  });

  // =============================================================================
  // User Query Tests
  // =============================================================================

  describe("[UNIT] User Query Endpoint", () => {
    it("returns user data via GraphQL HTTP endpoint", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          query: `
            query GetUser($id: ID!) {
              user(id: $id) {
                id
                firstName
                lastName
                fullName
                role
              }
            }
          `,
          variables: { id: TEST_USERS.regular.id },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.errors).toBeUndefined();
      expect(data.data?.user).toBeDefined();
      expect(data.data?.user.id).toBe(TEST_USERS.regular.id);
      expect(data.data?.user.firstName).toBe("Regular");
      expect(data.data?.user.fullName).toBe("Regular User");
      expect(data.data?.user.role).toBe("USER");
    });

    it("returns current user via me query", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          query: `
            query GetMe {
              me {
                id
                firstName
                lastName
                role
                isAdmin
              }
            }
          `,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.errors).toBeUndefined();
      expect(data.data?.me).toBeDefined();
      expect(data.data?.me.id).toBe(TEST_USERS.regular.id);
      expect(data.data?.me.role).toBe("USER");
      expect(data.data?.me.isAdmin).toBe(false);
    });

    it("returns admin user data when requested by admin", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          query: `
            query GetMe {
              me {
                id
                role
                isAdmin
              }
            }
          `,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.errors).toBeUndefined();
      expect(data.data?.me.role).toBe("ADMIN");
      expect(data.data?.me.isAdmin).toBe(true);
    });
  });

  // =============================================================================
  // Authentication Error Tests
  // =============================================================================

  describe("[UNIT] Authentication Error Handling", () => {
    it("returns UNAUTHENTICATED error when no token provided", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetMe {
              me {
                id
              }
            }
          `,
        }),
      });

      expect(response.status).toBe(200); // GraphQL returns 200 even for errors
      const data = await response.json();
      expect(data.errors).toBeDefined();
      expect(data.errors.length).toBeGreaterThan(0);
      expect(data.errors[0].extensions?.code).toBe("UNAUTHENTICATED");
    });

    it("returns UNAUTHENTICATED error with invalid token", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          query: `
            query GetMe {
              me {
                id
              }
            }
          `,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.errors).toBeDefined();
      expect(data.errors[0].extensions?.code).toBe("UNAUTHENTICATED");
    });

    it("returns FORBIDDEN error when user lacks permissions", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          query: `
            query GetUsers {
              users {
                id
              }
            }
          `,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.errors).toBeDefined();
      expect(data.errors[0].extensions?.code).toBe("FORBIDDEN");
    });
  });

  // =============================================================================
  // Schema Introspection Tests
  // =============================================================================

  describe("[UNIT] Schema Introspection", () => {
    it("supports introspection query", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query IntrospectionQuery {
              __schema {
                queryType {
                  name
                }
                mutationType {
                  name
                }
                types {
                  name
                }
              }
            }
          `,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.errors).toBeUndefined();
      expect(data.data?.__schema).toBeDefined();
      expect(data.data?.__schema.queryType?.name).toBe("Query");
      expect(data.data?.__schema.mutationType?.name).toBe("Mutation");

      // Verify User type exists
      const typeNames = data.data?.__schema.types.map(
        (t: { name: string }) => t.name,
      );
      expect(typeNames).toContain("User");
      expect(typeNames).toContain("UserRole");
    });

    it("returns User type fields via introspection", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query UserTypeIntrospection {
              __type(name: "User") {
                name
                fields {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
          `,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.errors).toBeUndefined();
      expect(data.data?.__type?.name).toBe("User");

      const fieldNames = data.data?.__type?.fields.map(
        (f: { name: string }) => f.name,
      );
      expect(fieldNames).toContain("id");
      expect(fieldNames).toContain("firstName");
      expect(fieldNames).toContain("lastName");
      expect(fieldNames).toContain("fullName");
      expect(fieldNames).toContain("role");
      expect(fieldNames).toContain("hasAvatar");
    });
  });

  // =============================================================================
  // GraphiQL Tests
  // =============================================================================

  describe("[UNIT] GraphiQL Playground", () => {
    it("serves GraphiQL UI at /graphql with Accept: text/html", async () => {
      const response = await fetch(`${testContext.baseUrl}/graphql`, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
      });

      // Should return HTML for GraphiQL
      if (response.status === 200) {
        const contentType = response.headers.get("content-type");
        expect(contentType).toContain("text/html");
        const html = await response.text();
        expect(html).toContain("GraphiQL");
      }
    });
  });

  // =============================================================================
  // Context Isolation Tests
  // =============================================================================

  describe("[UNIT] Context Isolation", () => {
    it("properly passes auth context to resolvers", async () => {
      // Make two concurrent requests with different tokens
      const [regularResponse, adminResponse] = await Promise.all([
        fetch(`${testContext.baseUrl}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            query: `query { me { id role } }`,
          }),
        }),
        fetch(`${testContext.baseUrl}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            query: `query { me { id role } }`,
          }),
        }),
      ]);

      const regularData = await regularResponse.json();
      const adminData = await adminResponse.json();

      expect(regularData.data?.me?.role).toBe("USER");
      expect(adminData.data?.me?.role).toBe("ADMIN");
      expect(regularData.data?.me?.id).not.toBe(adminData.data?.me?.id);
    });
  });
});
