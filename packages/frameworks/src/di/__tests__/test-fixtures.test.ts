import { describe, it, expect, beforeEach } from "bun:test";
import {
  createTestContainer,
  createMockPortFactory,
  createMockFn,
} from "../test-container";
import {
  createTestUserId,
  createTestUserIds,
  createTestUserRole,
  TestRoles,
  createTestAuthContext,
  TestAuthContexts,
  createMockAuthPort,
  createMockTelemetryPort,
  type TestAuthContext,
} from "../test-fixtures";
import { UserRole } from "../../../../domain/src/entities/User";
import { asClass } from "awilix";

describe("[UNIT] Test Fixtures", () => {
  describe("[UNIT] createTestUserId", () => {
    it("should create a valid branded UserId", () => {
      const userId = createTestUserId();

      expect(typeof userId).toBe("string");
      expect(userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should accept a specific UUID", () => {
      const specificId = "550e8400-e29b-41d4-a716-446655440000";
      const userId = createTestUserId(specificId);

      expect(userId).toBe(specificId);
    });

    it("should create unique UserIds on each call", () => {
      const id1 = createTestUserId();
      const id2 = createTestUserId();

      expect(id1).not.toBe(id2);
    });
  });

  describe("[UNIT] createTestUserIds", () => {
    it("should create multiple UserIds", () => {
      const ids = createTestUserIds(3);

      expect(ids).toHaveLength(3);
      ids.forEach((id) => {
        expect(typeof id).toBe("string");
      });
    });

    it("should return empty array for count 0", () => {
      const ids = createTestUserIds(0);

      expect(ids).toHaveLength(0);
    });
  });

  describe("[UNIT] createTestUserRole", () => {
    it("should default to USER role", () => {
      const role = createTestUserRole();

      expect(role).toBe(UserRole.USER);
    });

    it("should create specific roles", () => {
      expect(createTestUserRole("USER")).toBe(UserRole.USER);
      expect(createTestUserRole("MODERATOR")).toBe(UserRole.MODERATOR);
      expect(createTestUserRole("ADMIN")).toBe(UserRole.ADMIN);
      expect(createTestUserRole("SERVICE")).toBe(UserRole.SERVICE);
    });
  });

  describe("[UNIT] TestRoles", () => {
    it("should provide pre-defined role values", () => {
      expect(TestRoles.user).toBe(UserRole.USER);
      expect(TestRoles.moderator).toBe(UserRole.MODERATOR);
      expect(TestRoles.admin).toBe(UserRole.ADMIN);
      expect(TestRoles.service).toBe(UserRole.SERVICE);
    });
  });

  describe("[UNIT] createTestAuthContext", () => {
    it("should create default auth context", () => {
      const context = createTestAuthContext();

      expect(context.userId).toBeDefined();
      expect(context.role).toBe(UserRole.USER);
      expect(context.email).toBe("test@example.com");
      expect(context.authUserId).toBeDefined();
    });

    it("should allow role override", () => {
      const context = createTestAuthContext({ role: UserRole.ADMIN });

      expect(context.role).toBe(UserRole.ADMIN);
    });

    it("should allow email override", () => {
      const context = createTestAuthContext({
        email: "custom@example.com",
      });

      expect(context.email).toBe("custom@example.com");
    });

    it("should allow specific UserId", () => {
      const specificId = createTestUserId(
        "550e8400-e29b-41d4-a716-446655440001",
      );
      const context = createTestAuthContext({ userId: specificId });

      expect(context.userId).toBe(specificId);
    });

    it("should use branded UserId type", () => {
      const context = createTestAuthContext();

      // This test verifies TypeScript branding is preserved
      // If branding were lost, this would cause a type error
      const userId: string & { readonly __brand: "UserId" } = context.userId;
      expect(userId).toBeDefined();
    });
  });

  describe("[UNIT] TestAuthContexts", () => {
    it("should provide user context factory", () => {
      const context = TestAuthContexts.user();

      expect(context.role).toBe(UserRole.USER);
    });

    it("should provide moderator context factory", () => {
      const context = TestAuthContexts.moderator();

      expect(context.role).toBe(UserRole.MODERATOR);
    });

    it("should provide admin context factory", () => {
      const context = TestAuthContexts.admin();

      expect(context.role).toBe(UserRole.ADMIN);
    });

    it("should provide service context factory", () => {
      const context = TestAuthContexts.service();

      expect(context.role).toBe(UserRole.SERVICE);
    });

    it("should create unique contexts on each call", () => {
      const context1 = TestAuthContexts.user();
      const context2 = TestAuthContexts.user();

      expect(context1.userId).not.toBe(context2.userId);
      expect(context1.authUserId).not.toBe(context2.authUserId);
    });
  });

  describe("[UNIT] createMockAuthPort", () => {
    it("should create mock with default valid token", async () => {
      const mockPort = createMockAuthPort();
      const result = await mockPort.validateToken("valid-test-token");

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.role).toBe(UserRole.USER);
      }
    });

    it("should reject invalid tokens", async () => {
      const mockPort = createMockAuthPort();
      const result = await mockPort.validateToken("invalid-token");

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it("should use configured valid token", async () => {
      const customContext = createTestAuthContext({ role: UserRole.ADMIN });
      const mockPort = createMockAuthPort({
        validToken: "custom-token",
        authContext: customContext,
      });

      const result = await mockPort.validateToken("custom-token");

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.role).toBe(UserRole.ADMIN);
      }
    });

    it("should support refreshSession", async () => {
      const mockPort = createMockAuthPort();
      const result = await mockPort.refreshSession();

      expect(result.kind).toBe("ok");
      expect(result.value).toBeDefined();
    });
  });

  describe("[UNIT] createMockTelemetryPort", () => {
    it("should create mock with log method", async () => {
      const mockPort = createMockTelemetryPort();

      await mockPort.log({ event: "test" });

      expect(mockPort.getEvents()).toHaveLength(1);
    });

    it("should capture logged events", async () => {
      const mockPort = createMockTelemetryPort();

      await mockPort.log({ event: "event1" });
      await mockPort.log({ event: "event2" });

      const events = mockPort.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ event: "event1" });
      expect(events[1]).toEqual({ event: "event2" });
    });

    it("should provide last event", async () => {
      const mockPort = createMockTelemetryPort();

      await mockPort.log({ event: "first" });
      await mockPort.log({ event: "last" });

      expect(mockPort.getLastEvent()).toEqual({ event: "last" });
    });

    it("should clear events", async () => {
      const mockPort = createMockTelemetryPort();

      await mockPort.log({ event: "test" });
      mockPort.clearEvents();

      expect(mockPort.getEvents()).toHaveLength(0);
    });
  });

  describe("[UNIT] createMockPortFactory", () => {
    it("should register mock in container", () => {
      const container = createTestContainer();
      const mockPort = createMockAuthPort();

      container.register({
        authPort: createMockPortFactory(mockPort),
      });

      const resolved = container.resolve("authPort");
      expect(resolved).toBe(mockPort);
    });

    it("should allow DI injection of mock port", async () => {
      // Define a simple test service that uses auth port
      class TestAuthService {
        constructor(
          private cradle: {
            authPort: { validateToken: (t: string) => Promise<unknown> };
          },
        ) {}

        async authenticate(token: string) {
          return this.cradle.authPort.validateToken(token);
        }
      }

      const container = createTestContainer();
      const mockPort = createMockAuthPort();

      container.register({
        authPort: createMockPortFactory(mockPort),
        testService: asClass(TestAuthService).scoped(),
      });

      const service = container.resolve<TestAuthService>("testService");
      const result = await service.authenticate("valid-test-token");

      expect(result.kind).toBe("ok");
    });
  });

  describe("[UNIT] createMockFn", () => {
    it("should track function calls", () => {
      const mockFn = createMockFn("return-value");

      mockFn("arg1", "arg2");
      mockFn("arg3");

      expect(mockFn.getCallCount()).toBe(2);
    });

    it("should return configured value", () => {
      const mockFn = createMockFn("expected-value");

      const result = mockFn();

      expect(result).toBe("expected-value");
    });

    it("should track call arguments", () => {
      const mockFn = createMockFn();

      mockFn("first", 123, true);

      const lastCall = mockFn.getLastCall();
      expect(lastCall).toEqual(["first", 123, true]);
    });

    it("should check if called with specific args", () => {
      const mockFn = createMockFn();

      mockFn("target", 456);
      mockFn("other", 789);

      expect(mockFn.wasCalledWith("target", 456)).toBe(true);
      expect(mockFn.wasCalledWith("nonexistent", 0)).toBe(false);
    });

    it("should reset calls", () => {
      const mockFn = createMockFn();

      mockFn("arg");
      mockFn.reset();

      expect(mockFn.getCallCount()).toBe(0);
    });
  });

  describe("[UNIT] Integration: Full DI Test Setup", () => {
    it("should enable testing with mocked auth dependencies", async () => {
      // Setup test container with mocked auth
      const container = createTestContainer();
      const adminContext = createTestAuthContext({ role: UserRole.ADMIN });

      container.register({
        authPort: createMockPortFactory(
          createMockAuthPort({
            validToken: "admin-token",
            authContext: adminContext,
          }),
        ),
        telemetryPort: createMockPortFactory(createMockTelemetryPort()),
      });

      // Verify mocks are properly registered
      const authPort = container.resolve<{
        validateToken: (t: string) => Promise<unknown>;
      }>("authPort");
      const telemetryPort = container.resolve<{
        log: (e: unknown) => Promise<void>;
        getEvents: () => unknown[];
      }>("telemetryPort");

      // Test authentication flow
      const authResult = await authPort.validateToken("admin-token");
      expect(authResult.kind).toBe("ok");

      // Test telemetry flow
      await telemetryPort.log({ action: "test-action" });
      expect(telemetryPort.getEvents()).toHaveLength(1);
    });

    it("should support multiple test scenarios with isolated containers", async () => {
      // Container 1: Admin user
      const adminContainer = createTestContainer();
      adminContainer.register({
        authPort: createMockPortFactory(
          createMockAuthPort({
            validToken: "token1",
            authContext: TestAuthContexts.admin(),
          }),
        ),
      });

      // Container 2: Regular user
      const userContainer = createTestContainer();
      userContainer.register({
        authPort: createMockPortFactory(
          createMockAuthPort({
            validToken: "token2",
            authContext: TestAuthContexts.user(),
          }),
        ),
      });

      // Verify isolation
      const adminPort = adminContainer.resolve<{
        validateToken: (t: string) => Promise<unknown>;
      }>("authPort");
      const userPort = userContainer.resolve<{
        validateToken: (t: string) => Promise<unknown>;
      }>("authPort");

      const adminResult = await adminPort.validateToken("token1");
      const userResult = await userPort.validateToken("token2");

      expect(adminResult.kind).toBe("ok");
      expect(userResult.kind).toBe("ok");

      if (adminResult.kind === "ok" && userResult.kind === "ok") {
        expect(adminResult.value.role).toBe(UserRole.ADMIN);
        expect(userResult.value.role).toBe(UserRole.USER);
      }
    });
  });
});
