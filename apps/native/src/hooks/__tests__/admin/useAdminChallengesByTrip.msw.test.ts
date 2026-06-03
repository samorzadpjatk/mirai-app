import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import {
  buildAdminChallengeQueryInput,
  getNextAdminChallengePageParam,
  useAdminChallengesByTrip,
} from "../../admin/useAdminChallengesByTrip";

describe("useAdminChallengesByTrip (MSW)", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return loading state initially", async () => {
    server.use(
      createORPCHandler(
        ["challenge", "getAllByTrip"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.challenges).toEqual([]);
  });

  it("should return challenges from API", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Photo Challenge",
        description: "Take a photo",
        basePoints: 100,
        status: "ACTIVE",
        tripId: "trip-123",
      },
      {
        id: "challenge-2",
        name: "Quiz Challenge",
        description: null,
        basePoints: 50,
        status: "HIDDEN",
        tripId: "trip-123",
      },
    ];

    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(2);
    expect(result.current.challenges[0]!.id).toBe("challenge-1");
    expect(result.current.challenges[0]!.title).toBe("Photo Challenge");
    expect(result.current.challenges[0]!.basePoints).toBe(100);
    expect(result.current.challenges[1]!.title).toBe("Quiz Challenge");
    expect(result.current.challenges[1]!.status).toBe("HIDDEN");
  });

  it("should handle empty challenges", async () => {
    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toEqual([]);
    expect(result.current.stats.totalChallenges).toBe(0);
  });

  it("should handle null description", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Photo Challenge",
        description: null,
        basePoints: 100,
        status: "ACTIVE",
        tripId: "trip-123",
      },
    ];

    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges[0]!.description).toBeNull();
  });

  it("should handle undefined basePoints and status", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Photo Challenge",
        description: "Take a photo",
        basePoints: undefined,
        status: undefined,
        tripId: "trip-123",
      },
    ];

    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges[0]!.basePoints).toBe(0);
    expect(result.current.challenges[0]!.status).toBe("HIDDEN");
  });

  it("should fetch next page", async () => {
    let callCount = 0;
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "First",
        description: "Desc",
        basePoints: 100,
        status: "ACTIVE",
        tripId: "trip-123",
      },
    ];

    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => {
        callCount++;
        return {
          challenges:
            callCount === 1
              ? mockChallenges
              : [
                  {
                    id: "challenge-2",
                    name: "Second",
                    description: "Desc",
                    basePoints: 50,
                    status: "ACTIVE",
                    tripId: "trip-123",
                  },
                ],
          pagination: { hasMore: callCount === 1, offset: (callCount - 1) * 30, limit: 30 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.challenges).toHaveLength(2);
    });
  });

  it("should indicate fetching next page", async () => {
    let callCount = 0;
    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            challenges: [],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          };
        }
        return new Promise(() => {
          /* no-op */
        });
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFetchingNextPage).toBe(false);

    result.current.fetchNextPage().catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(true);
    });
  });

  it("should indicate refetching", async () => {
    let callCount = 0;
    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            challenges: [],
            pagination: { hasMore: false, offset: 0, limit: 30 },
          };
        }
        return new Promise(() => {
          /* no-op */
        });
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isRefetching).toBe(false);

    result.current.refetch().catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(true);
    });
  });

  it("should delete challenge", async () => {
    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["challenge", "delete"], ({ id, tripId: t }) => {
        expect(id).toBe("challenge-1");
        expect(t).toBe("trip-123");
        return { id: "challenge-1" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteChallenge("challenge-1");
    });
  });

  it("should indicate deleting state", async () => {
    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: [],
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(
        ["challenge", "delete"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.deleteChallenge("challenge-1").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(true);
    });
  });

  it("should handle error state", async () => {
    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => {
        throw new Error("Failed to fetch challenges");
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toEqual([]);
  });

  it("should calculate stats", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "First",
        description: "Desc",
        basePoints: 100,
        status: "ACTIVE",
        tripId: "trip-123",
      },
      {
        id: "challenge-2",
        name: "Second",
        description: "Desc",
        basePoints: 50,
        status: "ACTIVE",
        tripId: "trip-123",
      },
      {
        id: "challenge-3",
        name: "Third",
        description: "Desc",
        basePoints: 25,
        status: "HIDDEN",
        tripId: "trip-123",
      },
    ];

    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.totalChallenges).toBe(3);
  });
});

describe("getNextAdminChallengePageParam", () => {
  it("should return undefined when no more pages", () => {
    expect(
      getNextAdminChallengePageParam({ pagination: { hasMore: false, offset: 0, limit: 30 } }),
    ).toBeUndefined();
  });

  it("should return next offset when more pages", () => {
    expect(
      getNextAdminChallengePageParam({ pagination: { hasMore: true, offset: 0, limit: 30 } }),
    ).toBe(30);
  });
});

describe("buildAdminChallengeQueryInput", () => {
  it("should build query input with tripId", () => {
    expect(buildAdminChallengeQueryInput("trip-123", 0)).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 0 },
    });
  });

  it("should handle non-zero page param", () => {
    expect(buildAdminChallengeQueryInput("trip-123", 30)).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 30 },
    });
  });
});
