import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createMockActivity } from "../../../test-utils/activityMocks";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useCommunityActivityData } from "../../community/useCommunityActivityData";

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
      createMockActivity({
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
        title: "Rank Change",
        description: "",
        imageUrl: "",
        createdAt: new Date("2024-01-01"),
      }),
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
      createMockActivity({
        id: "activity-1",
        activityType: "user_post",
        tripId: "trip-1",
        title: "User Post",
        description: "",
        imageUrl: "",
        createdAt: new Date("2024-01-01"),
        userPost: {
          authorId: "",
          additionalImages: [],
          author: {
            id: "",
            userId: "",
            tripId: "",
            groupId: null,
            user: {
              id: "user-1",
              firstName: "User",
              lastName: "One",
              hasAvatar: false,
            },
            group: null,
          },
        },
      }),
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
      createMockActivity({
        id: "activity-1",
        activityType: "custom",
        tripId: "trip-1",
        title: "Admin Announcement",
        description: "",
        imageUrl: "",
        createdAt: new Date("2024-01-01"),
        admin: {
          id: "admin-1",
          firstName: "Admin",
          lastName: "User",
        },
      }),
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
      createMockActivity({
        id: "activity-1",
        activityType: "rank_change",
        tripId: "trip-1",
        title: "Rank Change",
        description: "",
        imageUrl: "",
        createdAt: new Date("2024-01-01"),
      }),
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
      createMockActivity({
        id: "activity-1",
        activityType: "user_post",
        tripId: "trip-1",
        title: "User Post",
        description: "",
        imageUrl: "",
        createdAt: new Date("2024-01-01"),
        userPost: {
          authorId: "",
          additionalImages: [],
          author: null,
        },
      }),
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
