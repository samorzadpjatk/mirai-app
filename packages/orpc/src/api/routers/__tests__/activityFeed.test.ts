 
 
 
import { describe, test, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { appRouter } from "../../root";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB } from "@mirai-app/db";

const createCaller = (ctx: TRPCContext) => createRouterClient(appRouter, { context: ctx });

// Type for the mock context with vi.fn() methods
type MockedFunction<T = unknown> = ReturnType<typeof vi.fn> & T;

interface MockedDb {
  user: { findFirst: MockedFunction };
  tripParticipant: { findUnique: MockedFunction; findFirst: MockedFunction; findMany: MockedFunction };
  trip: { findUnique: MockedFunction; findMany: MockedFunction };
  activityFeed: { findMany: MockedFunction; findUnique: MockedFunction; create: MockedFunction; update: MockedFunction; delete: MockedFunction; count: MockedFunction };
  activityReaction: { groupBy: MockedFunction; findMany: MockedFunction; findUnique: MockedFunction; create: MockedFunction; delete: MockedFunction };
  group: { findMany: MockedFunction; findFirst: MockedFunction; findUnique: MockedFunction };
  challengeSubmission: { findFirst: MockedFunction };
  challenge: { findFirst: MockedFunction; findMany: MockedFunction };
  query: {
    users: { findFirst: MockedFunction };
    tripParticipants: { findUnique: MockedFunction; findFirst: MockedFunction; findMany: MockedFunction };
    trips: { findUnique: MockedFunction; findMany: MockedFunction };
    activityFeeds: { findMany: MockedFunction; findUnique: MockedFunction; create: MockedFunction; update: MockedFunction; delete: MockedFunction; count: MockedFunction };
    activityReactions: { groupBy: MockedFunction; findMany: MockedFunction; findUnique: MockedFunction; create: MockedFunction; delete: MockedFunction };
    groups: { findMany: MockedFunction; findFirst: MockedFunction; findUnique: MockedFunction };
    challengeSubmissions: { findFirst: MockedFunction };
    challenges: { findFirst: MockedFunction; findMany: MockedFunction };
  };
  insert: MockedFunction;
  $executeRaw?: MockedFunction;
}

interface MockedSupabase {
  auth: {
    getUser: MockedFunction;
    admin: { getUserById: MockedFunction };
  };
  storage: {
    from: MockedFunction;
  };
}

interface MockContext extends Omit<TRPCContext, "db" | "supabase"> {
  db: MockedDb;
  supabase: MockedSupabase;
}

const createMockDb = () => {
  const lastResults: Record<string, unknown> = {};

  const rawDb = {
    user: {
      findFirst: vi.fn(() => Promise.resolve(null)),
    },
    tripParticipant: {
      findUnique: vi.fn(() => Promise.resolve(null)),
      findFirst: vi.fn(() => Promise.resolve(null)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    trip: {
      findUnique: vi.fn(() => Promise.resolve(null)),
      findFirst: vi.fn(() => Promise.resolve(null)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    activityFeed: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(() => Promise.resolve(null)),
      findFirst: vi.fn(() => Promise.resolve(null)),
      create: vi.fn(() => Promise.resolve({})),
      update: vi.fn(() => Promise.resolve({})),
      delete: vi.fn(() => Promise.resolve({})),
      count: vi.fn(() => Promise.resolve(0)),
    },
    activityReaction: {
      groupBy: vi.fn(() => Promise.resolve([])),
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(() => Promise.resolve(null)),
      findFirst: vi.fn(() => Promise.resolve(null)),
      create: vi.fn(() => Promise.resolve({})),
      delete: vi.fn(() => Promise.resolve({})),
    },
    group: {
      findMany: vi.fn(() => Promise.resolve([])),
      findFirst: vi.fn(() => Promise.resolve(null)),
      findUnique: vi.fn(() => Promise.resolve(null)),
    },
    challengeSubmission: {
      findFirst: vi.fn(() => Promise.resolve(null)),
    },
    challenge: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
  };

  // Wrap findFirst/findUnique with fallback to each other and lastResults
  for (const [modelName, model] of Object.entries(rawDb)) {
    const m = model as Record<string, unknown>;
    const rawFindFirst = m.findFirst as (...args: unknown[]) => Promise<unknown> | undefined;
    const rawFindUnique = m.findUnique as (...args: unknown[]) => Promise<unknown> | undefined;
    if (rawFindFirst || rawFindUnique) {
      m.findFirst = vi.fn(async (...args: unknown[]) => {
        if (rawFindFirst) {
          const r = await rawFindFirst(...args);
          if (r != null) return r;
        }
        if (rawFindUnique) {
          const r = await rawFindUnique(...args);
          if (r != null) return r;
        }
        return lastResults[modelName] ?? null;
      });
      m.findUnique = vi.fn(async (...args: unknown[]) => {
        if (rawFindUnique) {
          const r = await rawFindUnique(...args);
          if (r != null) return r;
        }
        if (rawFindFirst) {
          const r = await rawFindFirst(...args);
          if (r != null) return r;
        }
        return lastResults[modelName] ?? null;
      });
    }
  }

  const db = rawDb as Record<string, unknown>;

  db.query = {
    users: db.user,
    tripParticipants: db.tripParticipant,
    trips: db.trip,
    activityFeeds: db.activityFeed,
    activityReactions: db.activityReaction,
    groups: db.group,
    challengeSubmissions: db.challengeSubmission,
    challenges: db.challenge,
  };

  function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  function getModelName(table: unknown): string {
    let name: string | undefined;
    if (typeof table === 'string') {
      name = table;
    } else if (table && typeof table === 'object') {
      const obj = table as Record<string | symbol, unknown>;
      if (typeof obj.name === 'string') {
        name = obj.name;
      } else {
        const drizzleNameSym = Symbol.for('drizzle:Name');
        if (typeof obj[drizzleNameSym] === 'string') {
          name = obj[drizzleNameSym] as string;
        } else {
          const sym = Object.getOwnPropertySymbols(obj).find(
            (s) => s.description === 'drizzle:Name'
          );
          if (sym && typeof obj[sym] === 'string') {
            name = obj[sym] as string;
          }
        }
      }
    }
    if (!name) return 'unknown';
    const singular = name.replace(/ies$/, 'y').replace(/s$/, '');
    return toCamelCase(singular);
  }

  db.insert = vi.fn((table: unknown) => {
    const modelName = getModelName(table);
    return {
      values: vi.fn((data: unknown) => ({
        returning: () => {
          const model = db[modelName];
          if (model && typeof model === 'object' && 'create' in model) {
            return (model as Record<string, unknown>).create({ data }).then((result: unknown) => {
              if (result != null) lastResults[modelName] = result;
              return [result];
            });
          }
          return Promise.resolve([{}]);
        },
      })),
    };
  });

  db.update = vi.fn((table: unknown) => {
    const modelName = getModelName(table);
    return {
      set: vi.fn((data: unknown) => ({
        where: vi.fn(() => ({
          returning: () => {
            const model = db[modelName];
            if (model && typeof model === 'object' && 'update' in model) {
              return (model as Record<string, unknown>).update({ data }).then((result: unknown) => {
                if (result != null) lastResults[modelName] = result;
                return [result];
              });
            }
            return Promise.resolve([{}]);
          },
        })),
      })),
    };
  });

  db.delete = vi.fn((table: unknown) => {
    const modelName = getModelName(table);
    return {
      where: vi.fn(() => ({
        returning: () => {
          const model = db[modelName];
          if (model && typeof model === 'object' && 'delete' in model) {
            return (model as Record<string, unknown>).delete().then((result: unknown) => {
              if (result != null) lastResults[modelName] = result;
              return [result];
            });
          }
          return Promise.resolve([{}]);
        },
      })),
    };
  });

  db.select = vi.fn(() => {
    let primaryTable: string | undefined;
    const chainable: any = {
      from: (table: unknown) => {
        const name = typeof table === 'string' ? table : 'unknown';
        primaryTable = name.replace(/ies$/, 'y').replace(/s$/, '');
        return chainable;
      },
      innerJoin: () => chainable,
      leftJoin: () => chainable,
      where: () => chainable,
      orderBy: () => chainable,
      limit: () => chainable,
      offset: () => chainable,
      groupBy: () => chainable,
      having: () => chainable,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
        if (primaryTable) {
          const model = db[primaryTable];
          if (model && typeof model === 'object') {
            if ('findMany' in model) {
              return (model as Record<string, unknown>).findMany().then((results: unknown) => resolve(results), reject);
            }
            if ('count' in model) {
              return (model as Record<string, unknown>).count().then((count: unknown) => resolve([{ count }]), reject);
            }
            if ('aggregate' in model) {
              return (model as Record<string, unknown>).aggregate().then((agg: unknown) => resolve([agg]), reject);
            }
            if ('groupBy' in model) {
              return (model as Record<string, unknown>).groupBy().then((groups: unknown) => resolve(groups), reject);
            }
          }
        }
        return resolve([]);
      },
    };
    return chainable;
  });

  db.transaction = vi.fn(async (callback: unknown) => {
    if (typeof callback === "function") {
      return await (callback as (db: typeof db) => unknown)(db);
    }
    return Promise.all(callback as unknown[]);
  });

  db.$transaction = vi.fn(async (callback: unknown) => {
    if (typeof callback === "function") {
      return await (callback as (db: typeof db) => unknown)(db);
    }
    return Promise.all(callback as unknown[]);
  });

  return db;
};

const createMockSupabase = () => {
  const getUserMock = vi.fn(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = vi.fn(() =>
    Promise.resolve({
      data: { user: { id: "auth-user-1", banned_until: null } },
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
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://example.com/image.jpg" },
          error: null,
        }),
      }),
    },
  } satisfies SupabaseClient;
};

describe("activityFeed router", () => {
  let mockCtx: MockContext;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}`, banned_until: null } },
      error: null,
    });
    mockCtx.db.query.users.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.query.users.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
  };

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
    mockCtx.db.query.users.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
    mockCtx.db.query.users.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
  };

  const setupAdminMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.query.users.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
    mockCtx.db.query.users.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
    };
  });

  describe("getByTrip", () => {
    test("returns activities for trip", async () => {
      setupUserMocks();
      mockCtx.db.query.tripParticipants.findFirst.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.query.activityFeeds.count.mockResolvedValueOnce(1);
      mockCtx.db.query.activityFeeds.findMany.mockResolvedValueOnce([
        {
          id: "activity-1",
          title: "Test Activity",
          activityType: "custom",
          isPinned: false,
          isHidden: false,
          _count: { reactions: 5 },
        },
      ]);
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      mockCtx.db.$executeRaw = vi.fn();
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.getByTrip({
        tripId: "trip-1",
        page: 1,
        pageSize: 30,
      });
      expect(result.activities).toHaveLength(1);
    });

    test("throws FORBIDDEN when user is not participant", async () => {
      setupUserMocks();
      mockCtx.db.query.tripParticipants.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.getByTrip({ tripId: "trip-1" }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("getByTripModeration", () => {
    test("moderator can get activities including hidden", async () => {
      setupModeratorMocks();
      mockCtx.db.query.trips.findFirst.mockResolvedValueOnce({ id: "trip-1" });
      mockCtx.db.query.activityFeeds.count.mockResolvedValueOnce(1);
      mockCtx.db.query.activityFeeds.findMany.mockResolvedValueOnce([
        {
          id: "activity-1",
          isHidden: true,
          _count: { reactions: 0 },
        },
      ]);
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.getByTripModeration({
        tripId: "trip-1",
        page: 1,
        pageSize: 20,
      });
      expect(result.activities).toHaveLength(1);
    });
  });

  describe("getById", () => {
    test("returns activity by id", async () => {
      setupModeratorMocks();
      mockCtx.db.query.activityFeeds.findFirst.mockResolvedValueOnce({
        id: "activity-1",
        title: "Test Activity",
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.getById({ id: "activity-1" });
      expect(result.id).toBe("activity-1");
    });

    test("throws NOT_FOUND when activity does not exist", async () => {
      setupModeratorMocks();
      mockCtx.db.query.activityFeeds.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.getById({ id: "nonexistent" }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("createCustom", () => {
    test("moderator can create custom activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.trips.findFirst.mockResolvedValueOnce({ id: "trip-1" });
      mockCtx.db.query.activityFeeds.create.mockResolvedValueOnce({
        id: "activity-new",
        title: "Custom Activity",
        activityType: "custom",
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.createCustom({
        tripId: "trip-1",
        title: "Custom Activity",
        description: "Description",
      });
      expect(result.title).toBe("Custom Activity");
    });
  });

  describe("createUserPost", () => {
    test("user can create post activity", async () => {
      setupUserMocks();
      mockCtx.db.query.tripParticipants.findFirst.mockResolvedValueOnce({
        id: "part-1",
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.query.activityFeeds.create.mockResolvedValueOnce({
        id: "activity-new",
        title: "User Post",
        activityType: "user_post",
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.createUserPost({
        tripId: "trip-1",
        title: "User Post",
      });
      expect(result.title).toBe("User Post");
    });
  });

  describe("createSubmissionActivity", () => {
    test("moderator can create submission activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.challengeSubmissions.findFirst.mockResolvedValueOnce({
        id: "sub-1",
        videoId: null,
        imageIds: ["img-1"],
        challenge: { tripId: "trip-1" },
      });
      mockCtx.db.query.activityFeeds.create.mockResolvedValueOnce({
        id: "activity-new",
        title: "Submission",
        activityType: "submission",
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.createSubmissionActivity({
        tripId: "trip-1",
        submissionId: "sub-1",
        challengeId: "challenge-1",
        groupId: "group-1",
        title: "Submission",
      });
      expect(result.title).toBe("Submission");
    });

    test("throws NOT_FOUND when submission not found", async () => {
      setupModeratorMocks();
      mockCtx.db.query.challengeSubmissions.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.createSubmissionActivity({
          tripId: "trip-1",
          submissionId: "nonexistent",
          challengeId: "challenge-1",
          groupId: "group-1",
          title: "Submission",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("createChallengeActivity", () => {
    test("moderator can create challenge activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.challenges.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        description: "Challenge description",
        image: null,
        endTime: new Date(),
        submissionType: "IMAGE",
        basePoints: 100,
      });
      mockCtx.db.query.activityFeeds.create.mockResolvedValueOnce({
        id: "activity-new",
        title: "Challenge Event",
        activityType: "challenge_event",
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.createChallengeActivity({
        tripId: "trip-1",
        challengeId: "challenge-1",
        eventType: "challenge_started",
        title: "Challenge Event",
      });
      expect(result.title).toBe("Challenge Event");
    });

    test("throws NOT_FOUND when challenge not found", async () => {
      setupModeratorMocks();
      mockCtx.db.query.challenges.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.createChallengeActivity({
          tripId: "trip-1",
          challengeId: "nonexistent",
          eventType: "challenge_started",
          title: "Challenge Event",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("createRankChangeActivity", () => {
    test("moderator can create rank change activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.groups.findFirst.mockResolvedValueOnce({
        id: "group-1",
        image: null,
      });
      mockCtx.db.query.activityFeeds.create.mockResolvedValueOnce({
        id: "activity-new",
        title: "Rank Change",
        activityType: "rank_change",
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.createRankChangeActivity({
        tripId: "trip-1",
        groupId: "group-1",
        newRank: 1,
        totalCoins: 1000,
        coinsGained: 100,
        title: "Rank Change",
      });
      expect(result.title).toBe("Rank Change");
    });

    test("throws NOT_FOUND when group not found", async () => {
      setupModeratorMocks();
      mockCtx.db.query.groups.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.createRankChangeActivity({
          tripId: "trip-1",
          groupId: "nonexistent",
          newRank: 1,
          totalCoins: 1000,
          coinsGained: 100,
          title: "Rank Change",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("update", () => {
    test("moderator can update activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.activityFeeds.update.mockResolvedValueOnce({
        id: "activity-1",
        title: "Updated Title",
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.update({
        activityId: "activity-1",
        title: "Updated Title",
      });
      expect(result.title).toBe("Updated Title");
    });

    test("throws BAD_REQUEST when no fields provided", async () => {
      setupModeratorMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.update({ activityId: "activity-1" }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("setPinned", () => {
    test("moderator can pin activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.activityFeeds.update.mockResolvedValueOnce({
        id: "activity-1",
        isPinned: true,
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.setPinned({
        activityId: "activity-1",
        isPinned: true,
      });
      expect(result.isPinned).toBe(true);
    });
  });

  describe("hide", () => {
    test("moderator can hide activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.activityFeeds.update.mockResolvedValueOnce({
        id: "activity-1",
        isHidden: true,
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.hide({
        activityId: "activity-1",
        reason: "Inappropriate content",
      });
      expect(result.isHidden).toBe(true);
    });
  });

  describe("unhide", () => {
    test("moderator can unhide activity", async () => {
      setupModeratorMocks();
      mockCtx.db.query.activityFeeds.update.mockResolvedValueOnce({
        id: "activity-1",
        isHidden: false,
        _count: { reactions: 0 },
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.unhide({
        activityId: "activity-1",
      });
      expect(result.isHidden).toBe(false);
    });
  });

  describe("toggleReaction", () => {
    test("user can add reaction", async () => {
      setupUserMocks();
      mockCtx.db.query.activityFeeds.findFirst.mockResolvedValueOnce({
        id: "activity-1",
        tripId: "trip-1",
        isHidden: false,
      });
      mockCtx.db.query.tripParticipants.findFirst.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.query.activityReactions.findFirst.mockResolvedValueOnce(null);
      mockCtx.db.query.activityReactions.create.mockResolvedValueOnce({
        id: "reaction-1",
      });
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([
        { reactionType: "heart", _count: { _all: 1 } },
      ]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([
        { reactionType: "heart" },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.toggleReaction({
        activityId: "activity-1",
        reactionType: "heart",
      });
      expect(result.isActive).toBe(true);
      expect(result.reactionType).toBe("heart");
    });

    test("user can remove existing reaction", async () => {
      setupUserMocks();
      mockCtx.db.query.activityFeeds.findFirst.mockResolvedValueOnce({
        id: "activity-1",
        tripId: "trip-1",
        isHidden: false,
      });
      mockCtx.db.query.tripParticipants.findFirst.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.query.activityReactions.findFirst.mockResolvedValueOnce({
        id: "reaction-1",
      });
      mockCtx.db.query.activityReactions.delete.mockResolvedValueOnce({});
      mockCtx.db.query.activityReactions.groupBy.mockResolvedValueOnce([]);
      mockCtx.db.query.activityReactions.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.toggleReaction({
        activityId: "activity-1",
        reactionType: "heart",
      });
      expect(result.isActive).toBe(false);
    });

    test("throws NOT_FOUND when activity does not exist", async () => {
      setupUserMocks();
      mockCtx.db.query.activityFeeds.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.toggleReaction({
          activityId: "nonexistent",
          reactionType: "heart",
        }),
      ).rejects.toThrow(ORPCError);
    });

    test("throws FORBIDDEN when activity is hidden", async () => {
      setupUserMocks();
      mockCtx.db.query.activityFeeds.findFirst.mockResolvedValueOnce({
        id: "activity-1",
        tripId: "trip-1",
        isHidden: true,
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.activityFeed.toggleReaction({
          activityId: "activity-1",
          reactionType: "heart",
        }),
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("delete", () => {
    test("admin can delete activity", async () => {
      setupAdminMocks();
      mockCtx.db.query.activityFeeds.delete.mockResolvedValueOnce({
        id: "activity-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.activityFeed.delete({
        activityId: "activity-1",
      });
      expect(result.success).toBe(true);
    });
  });
});
