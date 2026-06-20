import { describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useHomeFull } from "../../home/useHomeFull";

describe("useHomeFull (MSW)", () => {
  it("should return user, trips, and notifications from consolidated endpoint", async () => {
    server.use(
      createORPCHandler(["home", "getHomeFull"], () => ({
        user: { id: "user-1", firstName: "Test", lastName: "User", role: "USER" },
        trips: {
          trips: [
            { id: "trip-1", name: "Trip 1" },
            { id: "trip-2", name: "Trip 2" },
          ],
          pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
        },
        notifications: { unreadCount: 3 },
      })),
    );

    const { result } = renderHookWithMSW(() => useHomeFull());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trips).toHaveLength(2);
    expect(result.current.trips[0]!.name).toBe("Trip 1");
    expect(result.current.user?.firstName).toBe("Test");
    expect(result.current.notifications?.unreadCount).toBe(3);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should handle paginated trips", async () => {
    server.use(
      createORPCHandler(["home", "getHomeFull"], () => ({
        user: { id: "user-1", firstName: "Test", lastName: "User", role: "USER" },
        trips: {
          trips: [{ id: "trip-1", name: "Trip 1" }],
          pagination: { total: 2, limit: 20, offset: 0, hasMore: true },
        },
        notifications: { unreadCount: 0 },
      })),
    );

    const { result } = renderHookWithMSW(() => useHomeFull());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trips).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });
});
