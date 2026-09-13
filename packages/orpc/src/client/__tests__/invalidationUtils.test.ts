import { generateOperationKey } from "@orpc/tanstack-query";
import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  QUERY_GROUPS,
  invalidateCascadingQueries,
  invalidateChallengeQueries,
  invalidateFileQueries,
  invalidateGroupQueries,
  invalidateLocationQueries,
  invalidateNotificationQueries,
  invalidateRewardQueries,
  invalidateTransactionQueries,
  invalidateTripQueries,
  invalidateUserQueries,
  invalidateWithPredicate,
} from "../invalidationUtils";

interface MockQueryClient {
  invalidateQueries: ReturnType<typeof vi.fn>;
}

const createMockQueryClient = (): MockQueryClient => ({
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
});

type MockQueryClientType = MockQueryClient & QueryClient;

describe("invalidateCascadingQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate single query group", async () => {
    const queryGroups = [["reward"]];

    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, queryGroups);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate multiple query groups in parallel", async () => {
    const queryGroups = [["reward"], ["user"], ["group"]];

    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, queryGroups);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should handle empty query groups array", async () => {
    const queryGroups: string[][] = [];

    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, queryGroups);

    expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it("should handle nested query keys", async () => {
    const queryGroups = [
      ["user", "profile"],
      ["challenge", "list"],
    ];

    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, queryGroups);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should execute invalidations in parallel", async () => {
    const queryGroups = [["a"], ["b"], ["c"], ["d"], ["e"]];

    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, queryGroups);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(5);
  });
});

describe("invalidateWithPredicate", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate queries matching predicate", async () => {
    const predicate = (query: unknown) => {
      const q = query as { queryKey: string[] };
      return q.queryKey[0] === "user";
    };

    await invalidateWithPredicate(mockQueryClient as MockQueryClientType, predicate);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate,
    });
  });

  it("should pass predicate function to invalidateQueries", async () => {
    const customPredicate = vi.fn().mockReturnValue(true);

    await invalidateWithPredicate(mockQueryClient as MockQueryClientType, customPredicate);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: customPredicate,
    });
  });
});

describe("QUERY_GROUPS constants", () => {
  it("should have all expected query groups defined", () => {
    expect(QUERY_GROUPS.REWARDS).toEqual([["reward"]]);
    expect(QUERY_GROUPS.REWARDS_ADMIN).toEqual([["reward"], ["admin"]]);
    expect(QUERY_GROUPS.CHALLENGES).toEqual([["challenge"]]);
    expect(QUERY_GROUPS.CHALLENGE_SUBMISSIONS).toEqual([["challengeSubmission"]]);
    expect(QUERY_GROUPS.NOTIFICATIONS).toEqual([["notification"], ["notificationSchedule"]]);
    expect(QUERY_GROUPS.USER_DATA).toEqual([["user"], ["group"]]);
    expect(QUERY_GROUPS.TRIPS).toEqual([["trip"]]);
    expect(QUERY_GROUPS.ADMIN).toEqual([["admin"]]);
    expect(QUERY_GROUPS.GROUPS).toEqual([["group"]]);
    expect(QUERY_GROUPS.SCHEDULES).toEqual([["schedule"], ["notificationSchedule"]]);
    expect(QUERY_GROUPS.TRANSACTIONS).toEqual([["transaction"], ["coin"]]);
    expect(QUERY_GROUPS.JUDGEMENTS).toEqual([["judgement"]]);
    expect(QUERY_GROUPS.LOCATION).toEqual([["location"]]);
    expect(QUERY_GROUPS.MAP).toEqual([["map"], ["mapOverlay"]]);
    expect(QUERY_GROUPS.COMMUNITY_FEED).toEqual([["community-feed"]]);
  });

  it("should match the hand-rolled community feed key and ignore the disabled placeholder", async () => {
    const mockQueryClient = createMockQueryClient();

    await invalidateCascadingQueries(
      mockQueryClient as MockQueryClientType,
      QUERY_GROUPS.COMMUNITY_FEED,
    );

    const predicate = mockQueryClient.invalidateQueries.mock.calls[0]?.[0]?.predicate as (query: {
      queryKey: unknown[];
    }) => boolean;

    expect(predicate({ queryKey: ["community-feed", "trip-1", 30] })).toBe(true);
    expect(predicate({ queryKey: ["community-feed-disabled"] })).toBe(false);
  });
});

describe("invalidateRewardQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate reward queries without admin", async () => {
    await invalidateRewardQueries(mockQueryClient as MockQueryClientType, false);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate reward and admin queries when includeAdmin is true", async () => {
    await invalidateRewardQueries(mockQueryClient as MockQueryClientType, true);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to not including admin queries", async () => {
    await invalidateRewardQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });
});

describe("invalidateChallengeQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate challenge and submission queries", async () => {
    await invalidateChallengeQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  // The admin challenge list is a `useInfiniteQuery`. oRPC stamps `type: "infinite"` into
  // its key while `queryOptions(...).queryKey` stamps `type: "query"`, so invalidating by
  // that key silently matched nothing and deleted challenges stayed on screen. These
  // helpers match on the operation path instead, which covers both.
  it("matches both the query and the infinite key shape of the same operation", async () => {
    const path = ["challenge", "getAllByTrip"];
    const infiniteKey = generateOperationKey(path, {
      input: { tripId: "trip-1", pagination: { limit: 30, offset: 0 } },
      type: "infinite",
    });
    const queryKey = generateOperationKey(path, {
      input: { tripId: "trip-1" },
      type: "query",
    });
    const unrelatedKey = generateOperationKey(["reward", "getByTrip"], {
      input: { tripId: "trip-1" },
      type: "query",
    });

    expect(infiniteKey).not.toEqual(queryKey);

    await invalidateChallengeQueries(mockQueryClient as MockQueryClientType);

    const predicate = mockQueryClient.invalidateQueries.mock.calls[0]?.[0]?.predicate as (
      query: unknown,
    ) => boolean;

    expect(predicate({ queryKey: infiniteKey })).toBe(true);
    expect(predicate({ queryKey })).toBe(true);
    expect(predicate({ queryKey: unrelatedKey })).toBe(false);
  });
});

describe("invalidateUserQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate user and group queries when includeGroups is true", async () => {
    await invalidateUserQueries(mockQueryClient as MockQueryClientType, true);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate only user and group queries when includeGroups is false", async () => {
    await invalidateUserQueries(mockQueryClient as MockQueryClientType, false);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including groups", async () => {
    await invalidateUserQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe("invalidateGroupQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate group and user queries when includeUsers is true", async () => {
    await invalidateGroupQueries(mockQueryClient as MockQueryClientType, true);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate only group queries when includeUsers is false", async () => {
    await invalidateGroupQueries(mockQueryClient as MockQueryClientType, false);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including users", async () => {
    await invalidateGroupQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe("invalidateTransactionQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate transaction, coin and group queries when includeGroups is true", async () => {
    await invalidateTransactionQueries(mockQueryClient as MockQueryClientType, true);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate only transaction and coin when includeGroups is false", async () => {
    await invalidateTransactionQueries(mockQueryClient as MockQueryClientType, false);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including groups", async () => {
    await invalidateTransactionQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe("invalidateNotificationQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate notification and schedule queries when includeSchedules is true", async () => {
    await invalidateNotificationQueries(mockQueryClient as MockQueryClientType, true);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate only notification when includeSchedules is false", async () => {
    await invalidateNotificationQueries(mockQueryClient as MockQueryClientType, false);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including schedules", async () => {
    await invalidateNotificationQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe("invalidateLocationQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate location queries", async () => {
    await invalidateLocationQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });
});

describe("invalidateTripQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate trip queries", async () => {
    await invalidateTripQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });
});

describe("predicate matching", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("matches flat query keys", async () => {
    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, [["reward"]]);
    const predicate = mockQueryClient.invalidateQueries.mock.calls[0]?.[0]?.predicate as (query: {
      queryKey: unknown[];
    }) => boolean;

    expect(predicate({ queryKey: ["reward", "list"] })).toBe(true);
    expect(predicate({ queryKey: ["reward"] })).toBe(true);
  });

  it("matches nested query keys", async () => {
    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, [["reward"]]);
    const predicate = mockQueryClient.invalidateQueries.mock.calls[0]?.[0]?.predicate as (query: {
      queryKey: unknown[];
    }) => boolean;

    expect(predicate({ queryKey: [["reward"]] })).toBe(true);
    expect(predicate({ queryKey: [["reward"], "extra"] })).toBe(true);
  });

  it("rejects non-array keys", async () => {
    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, [["reward"]]);
    const predicate = mockQueryClient.invalidateQueries.mock.calls[0]?.[0]?.predicate as (query: {
      queryKey: unknown;
    }) => boolean;

    expect(predicate({ queryKey: "reward" })).toBe(false);
  });

  it("rejects query keys with different prefix", async () => {
    await invalidateCascadingQueries(mockQueryClient as MockQueryClientType, [["reward"]]);
    const predicate = mockQueryClient.invalidateQueries.mock.calls[0]?.[0]?.predicate as (query: {
      queryKey: unknown[];
    }) => boolean;

    expect(predicate({ queryKey: ["user", "profile"] })).toBe(false);
    expect(predicate({ queryKey: [["user"]] })).toBe(false);
  });
});

describe("invalidateFileQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate file queries directly", async () => {
    await invalidateFileQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });
});

describe("Integration scenarios", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should handle multiple invalidation calls in sequence", async () => {
    await invalidateUserQueries(mockQueryClient as MockQueryClientType);
    await invalidateChallengeQueries(mockQueryClient as MockQueryClientType);
    await invalidateRewardQueries(mockQueryClient as MockQueryClientType);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(6);
  });

  it("should handle concurrent invalidation calls", async () => {
    await Promise.all([
      invalidateUserQueries(mockQueryClient as MockQueryClientType),
      invalidateChallengeQueries(mockQueryClient as MockQueryClientType),
      invalidateRewardQueries(mockQueryClient as MockQueryClientType),
    ]);

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(6);
  });

  it("should properly handle query client errors", async () => {
    mockQueryClient.invalidateQueries.mockRejectedValueOnce(new Error("Network error"));

    await expect(invalidateTripQueries(mockQueryClient as MockQueryClientType)).rejects.toThrow(
      "Network error",
    );
  });
});
