import { describe, expect, test, mock, beforeEach } from "bun:test";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";
import { ok } from "@mirai-app/domain";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  notificationSchedule: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    deleteMany: mock(() => Promise.resolve({})),
    updateMany: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve({ count: 0 })),
  },
  notificationScheduleExecution: {
    findMany: mock(() => Promise.resolve([])),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    }),
  );
  return {
    auth: {
      getUser: getUserMock,
      admin: {
        getUserById: adminGetUserByIdMock,
      },
    },
  };
};

// Helper to create mock DI context with auth use cases
const createMockDI = (userId = "admin-1", role = "ADMIN") => ({
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

describe("[INTEGRATION] notificationSchedule router", () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers({ Authorization: "Bearer test-token" }),
      accessToken: "test-token",
      dbUser: {
        id: "admin-1",
        authUserId: "auth-admin-1",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
      },
      di: createMockDI(),
    };
  });

  describe("router structure", () => {
    test("has required procedures", () => {
      expect(appRouter.notificationSchedule).toBeDefined();
      expect(appRouter.notificationSchedule.getAll).toBeDefined();
      expect(appRouter.notificationSchedule.getById).toBeDefined();
      expect(appRouter.notificationSchedule.getActive).toBeDefined();
      expect(appRouter.notificationSchedule.getUpcoming).toBeDefined();
      expect(appRouter.notificationSchedule.create).toBeDefined();
      expect(appRouter.notificationSchedule.update).toBeDefined();
      expect(appRouter.notificationSchedule.delete).toBeDefined();
      expect(appRouter.notificationSchedule.toggleActive).toBeDefined();
      expect(appRouter.notificationSchedule.bulkDelete).toBeDefined();
      expect(appRouter.notificationSchedule.bulkToggleActive).toBeDefined();
      expect(appRouter.notificationSchedule.duplicate).toBeDefined();
      expect(appRouter.notificationSchedule.updateLastRun).toBeDefined();
      expect(appRouter.notificationSchedule.getExecutionHistory).toBeDefined();
    });
  });

  describe("auth context", () => {
    test("passes auth header to context", async () => {
      const caller = createCaller(mockCtx);
      expect(caller).toBeDefined();
      expect(caller.notificationSchedule).toBeDefined();
    });
  });
});
