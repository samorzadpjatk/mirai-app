import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import {
  useAdminNotifications,
  getNextNotificationPageParam,
  buildNotificationQueryInput,
} from "../../admin/useAdminNotifications";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";

describe("useAdminNotifications (MSW)", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return loading state initially", async () => {
    server.use(
      createORPCHandler(
        ["notifications", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.notifications).toEqual([]);
  });

  it("should return notifications from API", async () => {
    const mockNotifications = [
      {
        id: "notif-1",
        title: "Welcome",
        body: "Welcome to the trip",
        url: "/trip",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: { id: "user-1", firstName: "John" },
        pushes: [
          {
            targetUserId: "user-1",
            status: "sent",
            sentAt: "2024-01-01T00:01:00Z",
            failureReason: null,
          },
        ],
      },
    ];

    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: mockNotifications,
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]!.id).toBe("notif-1");
  });

  it("should handle empty notifications", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);
  });

  it("should handle error state", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => {
        throw new Error("Failed to fetch notifications");
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);
  });

  it("should retry notification", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(["notifications", "retryNotification"], ({ notificationId }) => {
        expect(notificationId).toBe("notif-1");
        return { id: "notif-1", status: "sent" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.retryNotification("notif-1");
    });
  });

  it("should delete notification", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(["notifications", "delete"], ({ notificationId }) => {
        expect(notificationId).toBe("notif-1");
        return { id: "notif-1" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteNotification("notif-1");
    });
  });

  it("should indicate retrying state", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(
        ["notifications", "retryNotification"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.retryNotification("notif-1").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isRetrying).toBe(true);
    });
  });

  it("should indicate deleting state", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
      createORPCHandler(
        ["notifications", "delete"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current.deleteNotification("notif-1").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(true);
    });
  });

  it("should fetch next page", async () => {
    let callCount = 0;
    const mockNotifications = [
      {
        id: "notif-1",
        title: "First",
        body: "Body",
        url: "/",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: { id: "user-1" },
        pushes: [],
      },
    ];

    server.use(
      createORPCHandler(["notifications", "getAll"], () => {
        callCount++;
        return {
          notifications:
            callCount === 1
              ? mockNotifications
              : [
                  {
                    id: "notif-2",
                    title: "Second",
                    body: "Body",
                    url: "/",
                    createdAt: "2024-01-01T00:00:00Z",
                    createdBy: { id: "user-1" },
                    pushes: [],
                  },
                ],
          pagination: { hasMore: callCount === 1, offset: (callCount - 1) * 50, limit: 50 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });
  });

  it("should refetch notifications", async () => {
    let callCount = 0;

    server.use(
      createORPCHandler(["notifications", "getAll"], () => {
        callCount++;
        return {
          notifications:
            callCount === 1
              ? []
              : [
                  {
                    id: "notif-1",
                    title: "Test",
                    body: "Body",
                    url: "/",
                    createdAt: "2024-01-01T00:00:00Z",
                    createdBy: { id: "user-1" },
                    pushes: [],
                  },
                ],
          pagination: { hasMore: false, offset: 0, limit: 50 },
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });
  });

  it("should indicate fetching next page", async () => {
    let callCount = 0;
    server.use(
      createORPCHandler(["notifications", "getAll"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            notifications: [],
            pagination: { hasMore: true, offset: 0, limit: 50 },
          };
        }
        return new Promise(() => {
          /* no-op */
        });
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

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
      createORPCHandler(["notifications", "getAll"], () => {
        callCount++;
        if (callCount === 1) {
          return {
            notifications: [],
            pagination: { hasMore: false, offset: 0, limit: 50 },
          };
        }
        return new Promise(() => {
          /* no-op */
        });
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

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

  it("should return correct status badge", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getStatusBadge("sent")).toEqual({ color: "#10b981", text: "Sent" });
    expect(result.current.getStatusBadge("failed")).toEqual({ color: "#ef4444", text: "Failed" });
    expect(result.current.getStatusBadge("pending")).toEqual({ color: "#3b82f6", text: "Pending" });
    expect(result.current.getStatusBadge("unknown")).toEqual({ color: "#9ca3af", text: "unknown" });
  });

  it("should manage status state", async () => {
    server.use(
      createORPCHandler(["notifications", "getAll"], () => ({
        notifications: [],
        pagination: { hasMore: false, offset: 0, limit: 50 },
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBe("all");

    act(() => {
      result.current.setStatus("sent");
    });

    expect(result.current.status).toBe("sent");
  });
});

describe("getNextNotificationPageParam", () => {
  it("should return undefined when no more pages", () => {
    expect(
      getNextNotificationPageParam({ pagination: { hasMore: false, offset: 0, limit: 50 } }),
    ).toBeUndefined();
  });

  it("should return next offset when more pages", () => {
    expect(
      getNextNotificationPageParam({ pagination: { hasMore: true, offset: 0, limit: 50 } }),
    ).toBe(50);
  });
});

describe("buildNotificationQueryInput", () => {
  it("should build query input with tripId", () => {
    expect(buildNotificationQueryInput({ tripId: "trip-123" }, 0)).toEqual({
      tripId: "trip-123",
      pagination: { limit: 50, offset: 0 },
    });
  });

  it("should build query input without tripId", () => {
    expect(buildNotificationQueryInput(undefined, 0)).toEqual({
      pagination: { limit: 50, offset: 0 },
    });
  });

  it("should handle non-zero page param", () => {
    expect(buildNotificationQueryInput({ tripId: "trip-123" }, 50)).toEqual({
      tripId: "trip-123",
      pagination: { limit: 50, offset: 50 },
    });
  });
});
