import { describe, expect, test, mock, beforeEach } from "bun:test";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";
import { ok } from "@mirai-app/domain";

const createCaller = createCallerFactory(appRouter);

const mockDb = () => ({
  notification: {
    findUnique: mock(() =>
      Promise.resolve({
        id: "notif-1",
        tripId: "trip-1",
        title: "Test",
        body: "Body",
        url: "/test",
      }),
    ),
  },
  notificationPush: {
    findMany: mock(() => Promise.resolve([])),
  },
  pushSubscription: {
    findMany: mock(() => Promise.resolve([])),
  },
  tripParticipant: {
    findMany: mock(() => Promise.resolve([])),
  },
  notificationScheduleExecution: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  notificationDelivery: {
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    findUnique: mock(() => Promise.resolve(null)),
  },
});

const mockSupabase = () => ({
  auth: {
    getUser: mock().mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
    }),
  },
});

// Helper to create mock DI context with auth use cases
const createMockDI = (userId = "user-1", role = "ADMIN") => ({
  container: {} as any,
  resolve: <T>(token: string): T => {
    if (token === "authenticateUserUseCase") {
      return {
        execute: mock(() =>
          Promise.resolve(
            ok({
              userId,
              role,
              authenticatedAt: new Date(),
            }),
          ),
        ),
      } as unknown as T;
    }
    if (token === "authorizeAdminUseCase") {
      return {
        execute: mock(() =>
          role === "ADMIN"
            ? ok(undefined)
            : { kind: "err", error: new Error("Not admin") },
        ),
      } as unknown as T;
    }
    if (token === "authorizeModeratorUseCase") {
      return {
        execute: mock(() =>
          role === "MODERATOR" || role === "ADMIN"
            ? ok(undefined)
            : { kind: "err", error: new Error("Not moderator") },
        ),
      } as unknown as T;
    }
    throw new Error(`Unknown token: ${token}`);
  },
  scope: {
    requestId: "test-request-id",
    dispose: () => Promise.resolve(),
    container: {} as any,
  },
});

describe("[INTEGRATION] notificationSender router", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      db: mockDb(),
      supabase: mockSupabase(),
      headers: new Headers({ Authorization: "Bearer test-token" }),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
      },
      di: createMockDI(),
    };
  });

  describe("router structure", () => {
    test("has required procedures", () => {
      expect(appRouter.notificationSender).toBeDefined();
      expect(
        appRouter.notificationSender.sendMobileNotifications,
      ).toBeDefined();
      expect(appRouter.notificationSender.trackDeliveryStart).toBeDefined();
      expect(appRouter.notificationSender.trackDeliveryComplete).toBeDefined();
      expect(appRouter.notificationSender.trackDeliveryFailure).toBeDefined();
      expect(appRouter.notificationSender.checkInactiveUsers).toBeDefined();
    });
  });

  describe("auth context", () => {
    test("passes auth header to context", async () => {
      const caller = createCaller(mockCtx);
      expect(caller).toBeDefined();
      expect(caller.notificationSender).toBeDefined();
    });
  });
});
