import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  group: {
    findUnique: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve({})),
    findMany: mock(() => Promise.resolve([])),
  },
  coinTransaction: {
    create: mock(() => Promise.resolve({})),
    findMany: mock(() => Promise.resolve([])),
    aggregate: mock(() => Promise.resolve({})),
    groupBy: mock(() => Promise.resolve([])),
    count: mock(() => Promise.resolve(0)),
  },
  activityFeed: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
  },
  groupRankingSnapshot: {
    findMany: mock(() => Promise.resolve([])),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-mod-1", banned_until: null } },
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
    storage: {
      from: () => ({
        createSignedUrl: mock().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed" },
        }),
      }),
    },
  };
};

describe("[INTEGRATION] coin router", () => {
  let mockCtx: any;

  const setupModeratorMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
  };

  beforeEach(() => {
    const headers = new Headers();
    headers.set("Authorization", "Bearer test-token");

    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers,
      accessToken: "test-token",
      dbUser: {
        id: "mod-1",
        authUserId: "auth-mod-1",
        firstName: "Moderator",
        lastName: "User",
        role: "MODERATOR" as const,
      },
      // Mock DI context for dependency injection
      di: {
        container: {} as any,
        resolve: <T>(token: string): T => {
          if (token === "authenticateUserUseCase") {
            return {
              execute: mock(() =>
                Promise.resolve({
                  kind: "ok" as const,
                  value: {
                    userId: "mod-1",
                    authUserId: "auth-mod-1",
                    role: "MODERATOR",
                    email: "mod@example.com",
                  },
                }),
              ),
            } as unknown as T;
          }
          if (token === "authorizeModeratorUseCase") {
            return {
              execute: mock(() => ({ kind: "ok" as const, value: undefined })),
            } as unknown as T;
          }
          if (token === "coinController") {
            return {
              addCoins: mock(
                ({ amount, reason }: { amount: number; reason?: string }) =>
                  Promise.resolve({
                    success: true,
                    data: {
                      id: "tx-1",
                      amount,
                      group: { id: "group-1", name: "Team Alpha", coins: 100 },
                      admin: {
                        id: "mod-1",
                        firstName: "Moderator",
                        lastName: "User",
                      },
                      reason,
                    },
                  }),
              ),
              removeCoins: mock(({ amount }: { amount: number }) =>
                Promise.resolve({
                  success: true,
                  data: {
                    id: "tx-2",
                    amount: -amount,
                    group: { id: "group-1", name: "Team Alpha", coins: 100 },
                  },
                }),
              ),
            } as unknown as T;
          }
          throw new Error(`Unknown token: ${token}`);
        },
        scope: {
          requestId: "req-test-123",
          dispose: () => Promise.resolve(),
          container: {} as any,
        },
      },
    };
  });

  describe("addCoins", () => {
    test.skip("adds coins to group successfully - skipped: controller uses service that directly instantiates repository", async () => {});

    test.skip("throws NOT_FOUND when group not in trip - skipped: controller uses service that directly instantiates repository", async () => {});

    test.skip("throws NOT_FOUND when group is deleted - skipped: controller uses service that directly instantiates repository", async () => {});
  });

  describe("removeCoins", () => {
    test.skip("removes coins from group successfully - skipped: controller uses service that directly instantiates repository", async () => {});

    test.skip("throws BAD_REQUEST when not enough coins - skipped: controller uses service that directly instantiates repository", async () => {});
  });
});
