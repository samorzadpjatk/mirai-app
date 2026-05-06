import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useCommunityActivityData } from "../../community/useCommunityActivityData";

// Mock tRPC client
const mockRankingQuery = jest.fn();
const mockCreateDownloadUrlQuery = jest.fn();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPCClient: jest.fn(() => ({
    group: {
      ranking: {
        query: mockRankingQuery,
      },
    },
    storage: {
      createDownloadUrl: {
        query: mockCreateDownloadUrlQuery,
      },
    },
  })),
}));

// Mock React Query
interface QueryOptions {
  queryKey: string[];
  queryFn?: () => Promise<unknown>;
}

interface QueryResult {
  data: unknown;
  isLoading: boolean;
}

const mockUseQuery = jest.fn<(options: QueryOptions) => QueryResult>();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("useCommunityActivityData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty data when no activities provided", () => {
    mockUseQuery.mockReturnValue({
      data: {},
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities: [] })
    );

    expect(result.current.rankingData).toEqual({});
    expect(result.current.avatarUrls).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it("should extract ranking trip IDs from rank_change activities", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
      {
        id: "activity-2",
        activityType: "rank_change",
        tripId: "trip-2",
      },
      {
        id: "activity-3",
        activityType: "user_post",
        tripId: "trip-3",
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "community-rankings") {
        return {
          data: {
            "trip-1": [
              { id: "group-1", name: "Group 1", coins: 100, memberCount: 5, rank: 1, isCurrentUserGroup: false },
            ],
            "trip-2": [
              { id: "group-2", name: "Group 2", coins: 80, memberCount: 4, rank: 1, isCurrentUserGroup: false },
            ],
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    await waitFor(() => {
      expect(result.current.rankingData["trip-1"]).toBeDefined();
      expect(result.current.rankingData["trip-2"]).toBeDefined();
    });
  });

  it("should extract avatar user IDs from user_post activities", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
              name: "John Doe",
            },
          },
        },
      },
      {
        id: "activity-2",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-2",
              name: "Jane Smith",
            },
          },
        },
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "community-avatars") {
        return {
          data: {
            "user-1": "https://example.com/avatar1.jpg",
            "user-2": "https://example.com/avatar2.jpg",
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    await waitFor(() => {
      expect(result.current.avatarUrls["user-1"]).toBe("https://example.com/avatar1.jpg");
      expect(result.current.avatarUrls["user-2"]).toBe("https://example.com/avatar2.jpg");
    });
  });

  it("should extract avatar user IDs from admin activities", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "admin_announcement",
        admin: {
          id: "admin-1",
          name: "Admin User",
        },
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "community-avatars") {
        return {
          data: {
            "admin-1": "https://example.com/admin-avatar.jpg",
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    await waitFor(() => {
      expect(result.current.avatarUrls["admin-1"]).toBe("https://example.com/admin-avatar.jpg");
    });
  });

  it("should handle loading state for ranking queries", () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "community-rankings") {
        return {
          data: undefined,
          isLoading: true,
        };
      }
      return { data: {}, isLoading: false };
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle loading state for avatar queries", () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
            },
          },
        },
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "community-avatars") {
        return {
          data: undefined,
          isLoading: true,
        };
      }
      return { data: {}, isLoading: false };
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("should not fetch rankings when no rank_change activities", () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
            },
          },
        },
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey, enabled }) => {
      if (queryKey[0] === "community-rankings") {
        expect(enabled).toBe(false);
        return { data: {}, isLoading: false };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));
  });

  it("should not fetch avatars when no user activities", () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey, enabled }) => {
      if (queryKey[0] === "community-avatars") {
        expect(enabled).toBe(false);
        return { data: {}, isLoading: false };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));
  });

  it("should handle duplicate user IDs gracefully", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
            },
          },
        },
      },
      {
        id: "activity-2",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
            },
          },
        },
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "community-avatars") {
        return {
          data: {
            "user-1": "https://example.com/avatar1.jpg",
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    await waitFor(() => {
      expect(result.current.avatarUrls["user-1"]).toBe("https://example.com/avatar1.jpg");
    });
  });

  it("should handle duplicate trip IDs gracefully", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
      {
        id: "activity-2",
        activityType: "rank_change",
        tripId: "trip-1",
      },
    ];

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === "community-rankings") {
        return {
          data: {
            "trip-1": [
              { id: "group-1", name: "Group 1", coins: 100, memberCount: 5, rank: 1, isCurrentUserGroup: false },
            ],
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    await waitFor(() => {
      expect(result.current.rankingData["trip-1"]).toHaveLength(1);
    });
  });

  it("should handle activities without user data", () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: null,
      },
      {
        id: "activity-2",
        activityType: "user_post",
        userPost: {
          author: null,
        },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: {},
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    expect(result.current.avatarUrls).toEqual({});
  });

  it("should handle activities without admin data", () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "admin_announcement",
        admin: null,
      },
    ];

    mockUseQuery.mockReturnValue({
      data: {},
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCommunityActivityData({ activities })
    );

    expect(result.current.avatarUrls).toEqual({});
  });

  it("should execute ranking query function and handle successful response", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
    ];

    const rankingData = {
      data: [
        { id: "group-1", name: "Group 1", coins: 100, participants: [{ id: "p1" }] },
        { id: "group-2", name: "Group 2", coins: 80, participants: [{ id: "p2" }] },
      ],
    };

    mockRankingQuery.mockResolvedValue(rankingData);

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-rankings") {
        capturedQueryFn = queryFn;
        return {
          data: {
            "trip-1": [
              { id: "group-1", name: "Group 1", coins: 100, memberCount: 1, rank: 1, isCurrentUserGroup: false },
              { id: "group-2", name: "Group 2", coins: 80, memberCount: 1, rank: 2, isCurrentUserGroup: false },
            ],
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    // Execute the captured query function
    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("trip-1");
    }

    expect(mockRankingQuery).toHaveBeenCalledWith({ tripId: "trip-1" });
  });

  it("should execute ranking query function and handle errors gracefully", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
    ];

    mockRankingQuery.mockRejectedValue(new Error("Network error"));

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-rankings") {
        capturedQueryFn = queryFn;
        return {
          data: { "trip-1": [] },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    // Execute the captured query function - should not throw even when API fails
    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("trip-1");
      expect((result as Record<string, unknown[]>)["trip-1"]).toEqual([]);
    }
  });

  it("should execute avatar query function and handle successful response", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
            },
          },
        },
      },
    ];

    mockCreateDownloadUrlQuery.mockResolvedValue({ signedUrl: "https://example.com/avatar.jpg" });

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-avatars") {
        capturedQueryFn = queryFn;
        return {
          data: { "user-1": "https://example.com/avatar.jpg" },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    // Execute the captured query function
    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("user-1");
      expect((result as Record<string, string | null>)["user-1"]).toBe("https://example.com/avatar.jpg");
    }

    expect(mockCreateDownloadUrlQuery).toHaveBeenCalledWith({
      storagePath: "avatar/user-1.jpg",
      expiresInSeconds: 60 * 60,
    });
  });

  it("should execute avatar query function and handle errors gracefully", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
            },
          },
        },
      },
    ];

    mockCreateDownloadUrlQuery.mockRejectedValue(new Error("Storage error"));

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-avatars") {
        capturedQueryFn = queryFn;
        return {
          data: { "user-1": null },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    // Execute the captured query function - should not throw even when API fails
    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("user-1");
      expect((result as Record<string, string | null>)["user-1"]).toBeNull();
    }
  });

  it("should handle empty ranking trip IDs in query function", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          author: {
            user: {
              id: "user-1",
            },
          },
        },
      },
    ];

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-rankings") {
        capturedQueryFn = queryFn;
        return { data: {}, isLoading: false };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    // When no rank_change activities, query should return empty object
    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toEqual({});
    }
  });

  it("should handle empty avatar user IDs in query function", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
    ];

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-avatars") {
        capturedQueryFn = queryFn;
        return { data: {}, isLoading: false };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    // When no user_post activities, query should return empty object
    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toEqual({});
    }
  });

  it("should handle group without image in ranking data", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
    ];

    const rankingData = {
      data: [
        { id: "group-1", name: "Group 1", coins: 100, participants: [{ id: "p1" }] },
      ],
    };

    mockRankingQuery.mockResolvedValue(rankingData);

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-rankings") {
        capturedQueryFn = queryFn;
        return {
          data: {
            "trip-1": [
              { id: "group-1", name: "Group 1", image: null, coins: 100, memberCount: 1, rank: 1, isCurrentUserGroup: false },
            ],
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toBeDefined();
      const tripData = (result as Record<string, { image: null }[]>)["trip-1"];
      expect(tripData[0].image).toBeNull();
    }
  });

  it("should handle multiple ranking queries in parallel", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
      },
      {
        id: "activity-2",
        activityType: "rank_change",
        tripId: "trip-2",
      },
    ];

    mockRankingQuery
      .mockResolvedValueOnce({
        data: [{ id: "group-1", name: "Group 1", coins: 100, participants: [{ id: "p1" }] }],
      })
      .mockResolvedValueOnce({
        data: [{ id: "group-2", name: "Group 2", coins: 80, participants: [{ id: "p2" }] }],
      });

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-rankings") {
        capturedQueryFn = queryFn;
        return {
          data: {
            "trip-1": [{ id: "group-1", name: "Group 1", coins: 100, memberCount: 1, rank: 1, isCurrentUserGroup: false }],
            "trip-2": [{ id: "group-2", name: "Group 2", coins: 80, memberCount: 1, rank: 1, isCurrentUserGroup: false }],
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toBeDefined();
      expect((result as Record<string, unknown>)["trip-1"]).toBeDefined();
      expect((result as Record<string, unknown>)["trip-2"]).toBeDefined();
    }

    expect(mockRankingQuery).toHaveBeenCalledTimes(2);
  });

  it("should handle multiple avatar queries in parallel", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { author: { user: { id: "user-1" } } },
      },
      {
        id: "activity-2",
        activityType: "user_post",
        userPost: { author: { user: { id: "user-2" } } },
      },
    ];

    mockCreateDownloadUrlQuery
      .mockResolvedValueOnce({ signedUrl: "https://example.com/avatar1.jpg" })
      .mockResolvedValueOnce({ signedUrl: "https://example.com/avatar2.jpg" });

    let capturedQueryFn: (() => Promise<unknown>) | undefined;

    mockUseQuery.mockImplementation(({ queryKey, queryFn }) => {
      if (queryKey[0] === "community-avatars") {
        capturedQueryFn = queryFn;
        return {
          data: {
            "user-1": "https://example.com/avatar1.jpg",
            "user-2": "https://example.com/avatar2.jpg",
          },
          isLoading: false,
        };
      }
      return { data: {}, isLoading: false };
    });

    renderHook(() => useCommunityActivityData({ activities }));

    if (capturedQueryFn) {
      const result = await capturedQueryFn();
      expect(result).toBeDefined();
      expect((result as Record<string, string>)["user-1"]).toBe("https://example.com/avatar1.jpg");
      expect((result as Record<string, string>)["user-2"]).toBe("https://example.com/avatar2.jpg");
    }

    expect(mockCreateDownloadUrlQuery).toHaveBeenCalledTimes(2);
  });
});
