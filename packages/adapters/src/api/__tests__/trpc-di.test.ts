/**
 * tRPC DI Context Integration Tests
 *
 * These tests verify that the DIContext is properly integrated into tRPC context
 * with request-scoped containers, PrismaClient registration, and container resolution.
 *
 * Tests cover:
 * - Context creation with DI
 * - Request-scoped container behavior
 * - Container resolution works when properly configured
 * - Fallback behavior when container not initialized
 * - Memory management (no leaks)
 *
 * @module trpc-di.test
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  createContainer,
  asValue,
  asClass,
  type AwilixContainer,
} from "awilix";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import { createTRPCContext, type TRPCContext, type DIContext } from "../trpc";
import {
  initializeContainer,
  resetContainer,
  AppModule,
  isContainerInitialized,
  createRequestScope,
  createChildContainer,
  getContainer,
} from "@mirai-app/frameworks/di";

// =============================================================================
// Mock Setup
// =============================================================================

/**
 * Create a mock PrismaClient for testing
 */
const createMockPrismaClient = (): PrismaClient => {
  return {
    user: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: "test-user-id" }),
      update: () => Promise.resolve({ id: "test-user-id" }),
      delete: () => Promise.resolve({ id: "test-user-id" }),
      count: () => Promise.resolve(0),
    },
    challenge: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: "test-challenge-id" }),
      update: () => Promise.resolve({ id: "test-challenge-id" }),
      delete: () => Promise.resolve({ id: "test-challenge-id" }),
      count: () => Promise.resolve(0),
    },
    group: {
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({ id: "test-group-id" }),
      update: () => Promise.resolve({ id: "test-group-id" }),
      delete: () => Promise.resolve({ id: "test-group-id" }),
      count: () => Promise.resolve(0),
    },
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  } as unknown as PrismaClient;
};

/**
 * Create a mock Supabase client for testing
 */
const createMockSupabaseClient = () => {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
  } as unknown;
};

/**
 * Create test context options
 */
const createTestContextOptions = () => {
  return {
    headers: new Headers({
      "Content-Type": "application/json",
      "User-Agent": "test-agent/1.0",
    }),
    db: createMockPrismaClient(),
    supabase: createMockSupabaseClient(),
  };
};

/**
 * Create a mock repository for testing
 */
class MockUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return { id, email: "test@example.com" };
  }
}

/**
 * Create a test container with mock registrations
 */
const createTestContainer = (): AwilixContainer => {
  const container = createContainer({
    injectionMode: "CLASSIC",
  });

  const mockPrisma = createMockPrismaClient();

  // Register mock implementations
  container.register({
    prisma: asValue(mockPrisma),
    userRepository: asClass(MockUserRepository).singleton(),
  });

  return container;
};

// =============================================================================
// Test Suite
// =============================================================================

describe("[INTEGRATION] tRPC DI Context", () => {
  beforeAll(() => {
    // Ensure container is initialized for tests
    if (!isContainerInitialized()) {
      initializeContainer([AppModule]);
    }
  });

  afterAll(() => {
    // Reset container after tests to clean state
    resetContainer();
  });

  // ============================================================================
  // Context Creation Tests
  // ============================================================================

  describe("Context Creation", () => {
    it("should create TRPCContext with di property", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      expect(context.di).toBeDefined();
      expect(context.di.container).toBeDefined();
      expect(context.di.resolve).toBeDefined();
      expect(context.di.scope).toBeDefined();
    });

    it("should preserve existing context properties", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      expect(context.db).toBe(opts.db);
      expect(context.supabase).toBe(opts.supabase);
      expect(context.headers).toBeInstanceOf(Headers);
      expect(context.accessToken).toBeNull();
    });

    it("should include request ID in scope", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      expect(context.di.scope.requestId).toBeDefined();
      expect(context.di.scope.requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
    });

    it("should have unique request IDs per context", () => {
      const opts1 = createTestContextOptions();
      const opts2 = createTestContextOptions();

      const context1 = createTRPCContext(opts1);
      const context2 = createTRPCContext(opts2);

      expect(context1.di.scope.requestId).not.toBe(context2.di.scope.requestId);
    });
  });

  // ============================================================================
  // Request Scoping Tests
  // ============================================================================

  describe("Request Scoping", () => {
    it("should create different container instances per request", () => {
      const opts1 = createTestContextOptions();
      const opts2 = createTestContextOptions();

      const context1 = createTRPCContext(opts1);
      const context2 = createTRPCContext(opts2);

      // Containers should be different instances
      expect(context1.di.container).not.toBe(context2.di.container);
    });

    it("should maintain request isolation between concurrent contexts", async () => {
      const contexts: TRPCContext[] = [];

      // Create 5 concurrent request contexts
      for (let i = 0; i < 5; i++) {
        const opts = createTestContextOptions();
        const ctx = createTRPCContext(opts);
        contexts.push(ctx);
      }

      // Verify all contexts have unique request IDs
      const requestIds = contexts.map((ctx) => ctx.di.scope.requestId);
      const uniqueRequestIds = new Set(requestIds);
      expect(uniqueRequestIds.size).toBe(5);
    });

    it("should have different PrismaClient instances across requests", () => {
      const opts1 = createTestContextOptions();
      const opts2 = createTestContextOptions();

      const context1 = createTRPCContext(opts1);
      const context2 = createTRPCContext(opts2);

      // The PrismaClient in the context should be the one passed to createTRPCContext
      expect(context1.db).toBe(opts1.db);
      expect(context2.db).toBe(opts2.db);

      // The containers should be different
      expect(context1.di.container).not.toBe(context2.di.container);
    });
  });

  // ============================================================================
  // Container Resolution Tests (with manually configured container)
  // ============================================================================

  describe("Container Resolution", () => {
    it("should resolve from request-scoped container with test registrations", () => {
      // Create a test container with mock registrations
      const testContainer = createTestContainer();
      const mockPrisma = createMockPrismaClient();

      // Create a child container (like createRequestScope does)
      const scopedContainer = createChildContainer(testContainer);
      scopedContainer.register({
        prisma: asValue(mockPrisma),
      });

      // Should be able to resolve from the scoped container
      const userRepo = scopedContainer.resolve("userRepository");

      expect(userRepo).toBeDefined();
      expect(userRepo.findById).toBeDefined();
      expect(typeof userRepo.findById).toBe("function");
    });

    it("should maintain PrismaClient injection through request scope", () => {
      // Create test container
      const testContainer = createTestContainer();
      const mockPrisma = createMockPrismaClient();

      // Create request scope with PrismaClient
      const scope = createRequestScope({
        prisma: mockPrisma,
      });

      // Register the mock on the scoped container
      scope.container.register({
        userRepository: asClass(MockUserRepository).singleton(),
      });

      // Resolve and verify
      const userRepo = scope.container.resolve("userRepository");
      expect(userRepo).toBeDefined();
    });
  });

  // ============================================================================
  // Memory Management Tests
  // ============================================================================

  describe("Memory Management", () => {
    it("should provide dispose function in scope", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      expect(context.di.scope.dispose).toBeDefined();
      expect(typeof context.di.scope.dispose).toBe("function");
    });

    it("should allow scope disposal without errors", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      // Should not throw when disposing
      expect(() => context.di.scope.dispose()).not.toThrow();
    });

    it("should handle multiple scope creations and disposals", () => {
      const contexts: TRPCContext[] = [];

      // Create 10 contexts
      for (let i = 0; i < 10; i++) {
        const opts = createTestContextOptions();
        contexts.push(createTRPCContext(opts));
      }

      // Dispose all
      for (const ctx of contexts) {
        expect(() => ctx.di.scope.dispose()).not.toThrow();
      }
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe("Type Safety", () => {
    it("should maintain DIContext type structure", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      // Type checking - DIContext should have these properties
      const di: DIContext = context.di;
      expect(di.container).toBeDefined();
      expect(di.resolve).toBeDefined();
      expect(di.scope).toBeDefined();
    });

    it("should maintain TRPCContext type structure with di", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      // Type checking - TRPCContext should have all properties
      const ctx: TRPCContext = context;
      expect(ctx.db).toBeDefined();
      expect(ctx.supabase).toBeDefined();
      expect(ctx.headers).toBeDefined();
      expect(ctx.accessToken).toBeDefined();
      expect(ctx.di).toBeDefined();
    });
  });

  // ============================================================================
  // Fallback Behavior Tests (Container Not Initialized)
  // ============================================================================

  describe("Fallback Behavior (Container Not Initialized)", () => {
    let wasInitialized = false;

    beforeAll(() => {
      // Check if container was initialized
      wasInitialized = isContainerInitialized();
      // Reset container to simulate uninitialized state
      resetContainer();
    });

    afterAll(() => {
      // Restore container for other tests
      if (!isContainerInitialized() && wasInitialized) {
        initializeContainer([AppModule]);
      }
    });

    it("should provide fallback DI context when container not initialized", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      // Should still have di property with fallback container
      expect(context.di).toBeDefined();
      expect(context.di.container).toBeDefined();
    });

    it("should throw on resolve when container not initialized", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      // Should throw when trying to resolve from fallback
      expect(() => context.di.resolve("userRepository")).toThrow(
        "DI container not initialized",
      );
    });

    it("should provide helpful error message for fallback resolution", () => {
      const opts = createTestContextOptions();
      const context = createTRPCContext(opts);

      try {
        context.di.resolve("userRepository");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain(
          "initializeContainer([AppModule])",
        );
      }
    });
  });

  // ============================================================================
  // createRequestScope Integration Tests
  // ============================================================================

  describe("createRequestScope Integration", () => {
    beforeAll(() => {
      // Ensure container is initialized for these tests
      if (!isContainerInitialized()) {
        initializeContainer([AppModule]);
      }
    });

    it("should create scope with PrismaClient registration", () => {
      const mockPrisma = createMockPrismaClient();

      const scope = createRequestScope({
        prisma: mockPrisma,
      });

      expect(scope.container).toBeDefined();
      expect(scope.requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
      expect(scope.dispose).toBeDefined();
    });

    it("should create scope with user context", () => {
      const mockPrisma = createMockPrismaClient();

      const scope = createRequestScope({
        prisma: mockPrisma,
        userContext: {
          userId: "user-123",
          email: "test@example.com",
          role: "admin",
        },
      });

      expect(scope.container).toBeDefined();
    });

    it("should create scope with custom values", () => {
      const mockPrisma = createMockPrismaClient();

      const scope = createRequestScope({
        prisma: mockPrisma,
        values: {
          customValue: "test-value",
          anotherValue: 42,
        },
      });

      expect(scope.container).toBeDefined();
    });

    it("should allow custom request ID", () => {
      const mockPrisma = createMockPrismaClient();

      const scope = createRequestScope({
        prisma: mockPrisma,
        requestId: "custom-request-id",
      });

      expect(scope.requestId).toBe("custom-request-id");
    });
  });
});
