import { describe, expect, it } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useChallenges } from "../../challenges/useChallenges";

describe("useChallenges (MSW)", () => {
  const mockTrip = {
    id: "trip-1",
    name: "Test Trip",
    description: "A test trip",
    startDate: "2024-01-01",
    endDate: "2024-01-10",
    groups: [
      { id: "group-1", name: "Group A", coins: 100, _count: { participants: 5 } },
      { id: "group-2", name: "Group B", coins: 200, _count: { participants: 3 } },
    ],
    participants: [
      {
        user: { id: "user-1", name: "Test User" },
        group: { id: "group-1", name: "Group A", coins: 100 },
      },
    ],
    tripSponsors: [],
  };

  const mockChallenges = [
    {
      id: "challenge-1",
      name: "Challenge One",
      description: "First challenge",
      submissionType: "IMAGE",
      basePoints: 10,
      firstPlacePoints: 20,
      scoringCategory: "SPEED",
      status: "ACTIVE",
      participantGroupsCount: 5,
      myGroupSubmissionStatus: null,
    },
    {
      id: "challenge-2",
      name: "Challenge Two",
      description: "Second challenge",
      submissionType: "TEXT",
      basePoints: 5,
      firstPlacePoints: 10,
      scoringCategory: "UNLIMITED",
      status: "VISIBLE",
      participantGroupsCount: 3,
      myGroupSubmissionStatus: "APPROVED",
    },
    {
      id: "challenge-3",
      name: "Challenge Three",
      description: "Third challenge",
      submissionType: "QR_CODE",
      basePoints: 15,
      firstPlacePoints: 30,
      scoringCategory: "JUDGED_STAFF",
      status: "ACTIVE",
      participantGroupsCount: 0,
      myGroupSubmissionStatus: "PENDING",
    },
  ];

  const mockUser = { id: "user-1", name: "Test User" };

  it("should return challenges, trip, and leaderboard info when loaded", async () => {
    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.challenges).toHaveLength(3);
    expect(result.current.challenges[0]!.id).toBe("challenge-1");
    expect(result.current.challenges[0]!.title).toBe("Challenge One");
    expect(result.current.challenges[1]!.status).toBe("solved");
    expect(result.current.challenges[2]!.status).toBe("submitted");
  });

  it("should calculate completed challenges count correctly", async () => {
    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.completedChallengesCount).toBe(2);
  });

  it("should calculate userGroup and leaderboardInfo correctly", async () => {
    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userGroup).toEqual({ id: "group-1", name: "Group A", coins: 100 });
    expect(result.current.leaderboardInfo).toEqual({
      position: 2,
      pointsDifference: 100,
      totalGroups: 2,
      targetPosition: 1,
      targetGroupName: "Group B",
    });
  });

  it("should indicate hasNextPage when more challenge pages exist", async () => {
    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: [mockChallenges[0]],
        pagination: { hasMore: true, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("should fetch next page of challenges", async () => {
    let callCount = 0;
    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["challenge", "getAllByTrip"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            challenges: [mockChallenges[0]],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          };
        }
        return {
          challenges: [mockChallenges[1]],
          pagination: { hasMore: false, offset: 30, limit: 30 },
        };
      }),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.isFetchingNextPage).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(2);
    expect(result.current.challenges[0]!.id).toBe("challenge-1");
    expect(result.current.challenges[1]!.id).toBe("challenge-2");
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should refresh all queries", async () => {
    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.challenges).toHaveLength(3);
  });

  it("should not fetch when tripId is null", async () => {
    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useChallenges(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trip).toBeUndefined();
    expect(result.current.challenges).toEqual([]);
    expect(result.current.completedChallengesCount).toBe(0);
  });

  it("should not fetch when tripId is undefined", async () => {
    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useChallenges(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trip).toBeUndefined();
    expect(result.current.challenges).toEqual([]);
    expect(result.current.completedChallengesCount).toBe(0);
  });

  it("should not fetch when tripId is empty string", async () => {
    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useChallenges(""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trip).toBeUndefined();
    expect(result.current.challenges).toEqual([]);
    expect(result.current.completedChallengesCount).toBe(0);
  });

  it("should return null leaderboardInfo when user has no group", async () => {
    const tripWithoutUserGroup = {
      ...mockTrip,
      participants: [
        {
          user: { id: "user-2", name: "Other User" },
          group: { id: "group-2", name: "Group B", coins: 200 },
        },
      ],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => tripWithoutUserGroup),
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: mockChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userGroup).toBeNull();
    expect(result.current.leaderboardInfo).toBeNull();
  });

  it("should handle challenges with null/undefined fields gracefully", async () => {
    const minimalChallenges = [
      {
        id: "challenge-min",
        name: "Minimal Challenge",
      },
    ];

    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["challenge", "getAllByTrip"], () => ({
        challenges: minimalChallenges,
        pagination: { hasMore: false, offset: 0, limit: 30 },
      })),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useChallenges("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(1);
    expect(result.current.challenges[0]!.title).toBe("Minimal Challenge");
    expect(result.current.challenges[0]!.points).toBe(0);
    expect(result.current.challenges[0]!.status).toBe("locked");
    expect(result.current.challenges[0]!.submissionType).toBe("IMAGE");
  });
});
