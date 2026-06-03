import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { useCommunityActivityData } from "../../community/useCommunityActivityData";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";

describe("useCommunityActivityData (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return empty data when no activities provided", () => {
    const { result } = renderHookWithMSW(() => useCommunityActivityData({ activities: [] }));

    expect(result.current.rankingData).toEqual({});
    expect(result.current.avatarUrls).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch ranking data for rank_change activities", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change" as const,
        tripId: "trip-1",
        title: "Rank Change",
        description: null,
        imageUrl: null,
        createdAt: "2024-01-01",
      },
    ];

    server.use(
      createORPCHandler(["group", "ranking"], () => ({
        data: [{ id: "group-1", name: "Group 1", coins: 100, participants: [{ id: "p1" }] }],
      })),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityActivityData({
        activities,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rankingData["trip-1"]).toBeDefined();
    expect(result.current.rankingData["trip-1"]?.[0]).toBeDefined();
    expect(result.current.rankingData["trip-1"]?.[0]?.id).toBe("group-1");
  });

  it("should fetch avatar URLs for user_post activities", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post" as const,
        tripId: "trip-1",
        title: "User Post",
        description: null,
        imageUrl: null,
        createdAt: "2024-01-01",
        userPost: {
          additionalImages: [],
          author: {
            user: {
              id: "user-1",
              firstName: "User",
              lastName: "One",
            },
          },
        },
      },
    ];

    server.use(
      createORPCHandler(["storage", "createDownloadUrl"], () => ({
        signedUrl: "https://example.com/avatar1.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityActivityData({
        activities,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.avatarUrls["user-1"]).toBe("https://example.com/avatar1.jpg");
  });

  it("should fetch avatar URLs for admin activities", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "custom" as const,
        tripId: "trip-1",
        title: "Admin Announcement",
        description: null,
        imageUrl: null,
        createdAt: "2024-01-01",
        admin: {
          id: "admin-1",
          firstName: "Admin",
          lastName: "User",
        },
      },
    ];

    server.use(
      createORPCHandler(["storage", "createDownloadUrl"], () => ({
        signedUrl: "https://example.com/admin-avatar.jpg",
      })),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityActivityData({
        activities,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.avatarUrls["admin-1"]).toBe("https://example.com/admin-avatar.jpg");
  });

  it("should handle API errors gracefully", async () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "rank_change" as const,
        tripId: "trip-1",
        title: "Rank Change",
        description: null,
        imageUrl: null,
        createdAt: "2024-01-01",
      },
    ];

    server.use(
      createORPCHandler(["group", "ranking"], () => {
        throw new Error("Network error");
      }),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityActivityData({
        activities,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.rankingData["trip-1"]).toEqual([]);
  });

  it("should not fetch when no matching activities", () => {
    const activities = [
      {
        id: "activity-1",
        activityType: "user_post" as const,
        tripId: "trip-1",
        title: "User Post",
        description: null,
        imageUrl: null,
        createdAt: "2024-01-01",
        userPost: null,
      },
    ];

    const { result } = renderHookWithMSW(() =>
      useCommunityActivityData({
        activities,
      }),
    );

    expect(result.current.rankingData).toEqual({});
    expect(result.current.avatarUrls).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });
});
