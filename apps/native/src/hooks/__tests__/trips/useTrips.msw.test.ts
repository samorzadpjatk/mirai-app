import { describe, it, expect } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { useTrips } from "../../trips/useTrips";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";

describe("useTrips (MSW)", () => {
  it("should return trips from API", async () => {
    const mockTrips = [
      { id: "1", name: "Trip 1" },
      { id: "2", name: "Trip 2" },
    ];

    server.use(
      createORPCHandler(["trip", "getAll"], () => ({
        trips: mockTrips,
        pagination: { hasMore: false, offset: 0, limit: 20 },
      })),
    );

    const { result } = renderHookWithMSW(() => useTrips());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trips).toHaveLength(2);
    expect(result.current.trips[0]!.name).toBe("Trip 1");
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should handle pagination with hasMore true", async () => {
    const mockTrips = [{ id: "1", name: "Trip 1" }];

    server.use(
      createORPCHandler(["trip", "getAll"], () => ({
        trips: mockTrips,
        pagination: { hasMore: true, offset: 0, limit: 20 },
      })),
    );

    const { result } = renderHookWithMSW(() => useTrips());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trips).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);
  });
});
