 
 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  invalidateCascadingQueries,
  invalidateWithPredicate,
  QUERY_GROUPS,
  invalidateRewardQueries,
  invalidateChallengeQueries,
  invalidateUserQueries,
  invalidateGroupQueries,
  invalidateAdminQueries,
  invalidateTransactionQueries,
  invalidateNotificationQueries,
  invalidateLocationQueries,
  invalidateTripQueries,
  invalidateFileQueries,
} from "../invalidationUtils";
import type { QueryClient } from "@tanstack/react-query";

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

    await invalidateCascadingQueries(
      mockQueryClient as MockQueryClientType,
      queryGroups
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate multiple query groups in parallel", async () => {
    const queryGroups = [["reward"], ["user"], ["group"]];

    await invalidateCascadingQueries(
      mockQueryClient as MockQueryClientType,
      queryGroups
    );

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

    await invalidateCascadingQueries(
      mockQueryClient as MockQueryClientType,
      queryGroups
    );

    expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it("should handle nested query keys", async () => {
    const queryGroups = [
      ["user", "profile"],
      ["challenge", "list"],
    ];

    await invalidateCascadingQueries(
      mockQueryClient as MockQueryClientType,
      queryGroups
    );

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

    await invalidateCascadingQueries(
      mockQueryClient as MockQueryClientType,
      queryGroups
    );

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

    await invalidateWithPredicate(
      mockQueryClient as MockQueryClientType,
      predicate
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate,
    });
  });

  it("should pass predicate function to invalidateQueries", async () => {
    const customPredicate = vi.fn().mockReturnValue(true);

    await invalidateWithPredicate(
      mockQueryClient as MockQueryClientType,
      customPredicate
    );

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
  });
});

describe("invalidateRewardQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate reward queries without admin", async () => {
    await invalidateRewardQueries(
      mockQueryClient as MockQueryClientType,
      false
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate reward and admin queries when includeAdmin is true", async () => {
    await invalidateRewardQueries(
      mockQueryClient as MockQueryClientType,
      true
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to not including admin queries", async () => {
    await invalidateRewardQueries(
      mockQueryClient as MockQueryClientType
    );

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
    await invalidateChallengeQueries(
      mockQueryClient as MockQueryClientType
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });
});

describe("invalidateUserQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate user and group queries when includeGroups is true", async () => {
    await invalidateUserQueries(
      mockQueryClient as MockQueryClientType,
      true
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate only user and group queries when includeGroups is false", async () => {
    await invalidateUserQueries(
      mockQueryClient as MockQueryClientType,
      false
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including groups", async () => {
    await invalidateUserQueries(
      mockQueryClient as MockQueryClientType
    );

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
    await invalidateGroupQueries(
      mockQueryClient as MockQueryClientType,
      true
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate only group queries when includeUsers is false", async () => {
    await invalidateGroupQueries(
      mockQueryClient as MockQueryClientType,
      false
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including users", async () => {
    await invalidateGroupQueries(
      mockQueryClient as MockQueryClientType
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});

describe("invalidateAdminQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate all admin-related queries when no domains specified", async () => {
    await invalidateAdminQueries(
      mockQueryClient as MockQueryClientType
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(10);
  });

  it("should invalidate only specified domains", async () => {
    await invalidateAdminQueries(
      mockQueryClient as MockQueryClientType,
      ["USER_DATA", "GROUPS"]
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should handle single domain", async () => {
    await invalidateAdminQueries(
      mockQueryClient as MockQueryClientType,
      ["TRIPS"]
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should handle CHALLENGES domain", async () => {
    await invalidateAdminQueries(
      mockQueryClient as MockQueryClientType,
      ["CHALLENGES"]
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });
});

describe("invalidateTransactionQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate transaction, coin and group queries when includeGroups is true", async () => {
    await invalidateTransactionQueries(
      mockQueryClient as MockQueryClientType,
      true
    );

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
    await invalidateTransactionQueries(
      mockQueryClient as MockQueryClientType,
      false
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including groups", async () => {
    await invalidateTransactionQueries(
      mockQueryClient as MockQueryClientType
    );

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
    await invalidateNotificationQueries(
      mockQueryClient as MockQueryClientType,
      true
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should invalidate only notification when includeSchedules is false", async () => {
    await invalidateNotificationQueries(
      mockQueryClient as MockQueryClientType,
      false
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });

  it("should default to including schedules", async () => {
    await invalidateNotificationQueries(
      mockQueryClient as MockQueryClientType
    );

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
    await invalidateLocationQueries(
      mockQueryClient as MockQueryClientType
    );

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
    await invalidateTripQueries(
      mockQueryClient as MockQueryClientType
    );

    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      predicate: expect.any(Function),
    });
  });
});

describe("invalidateFileQueries", () => {
  let mockQueryClient: MockQueryClient;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    vi.clearAllMocks();
  });

  it("should invalidate file queries directly", async () => {
    await invalidateFileQueries(
      mockQueryClient as MockQueryClientType
    );

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

    await expect(
      invalidateTripQueries(mockQueryClient as MockQueryClientType)
    ).rejects.toThrow("Network error");
  });
});
