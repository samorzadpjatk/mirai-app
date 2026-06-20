import { beforeEach, describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useTripByIdFull } from "../../trips/useTripDetails";

function createFullTripResponse(trip: unknown) {
  return {
    trip,
    groups: [],
    challenges: [],
    sponsors: [],
    latestNews: [],
  };
}

const mockTrip = {
  id: "trip-1",
  name: "API Trip",
  description: "API Description",
  startDate: "2024-02-01",
  endDate: "2024-02-10",
  backgroundImagePath: "/path/to/api-image.jpg",
  groups: [{ id: "group-1", name: "Group 1" }],
};

describe("useTripByIdFull (MSW)", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(mockTrip)));
  });

  it("should return trip details when API returns data", async () => {
    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip?.id).toBe("trip-1");
    expect(result.current.trip?.name).toBe("API Trip");
    expect(result.current.trip?.description).toBe("API Description");
    expect(result.current.trip?.startDate).toBe("2024-02-01");
    expect(result.current.trip?.endDate).toBe("2024-02-10");
    expect(result.current.trip?.backgroundImagePath).toBe("/path/to/api-image.jpg");
    expect(result.current.trip?.groups).toEqual([{ id: "group-1", name: "Group 1" }]);
    expect(result.current.isLoadingTrip).toBe(false);
    expect(result.current.isErrorTrip).toBe(false);
    expect(result.current.tripError).toBeNull();
    expect(result.current.tripId).toBe("trip-1");
  });

  it("should return null when no tripId provided", async () => {
    const { result } = renderHookWithMSW(() => useTripByIdFull(null));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.isLoadingTrip).toBe(false);
    expect(result.current.isErrorTrip).toBe(false);
    expect(result.current.tripId).toBe("");
  });

  it("should handle empty string tripId", async () => {
    const { result } = renderHookWithMSW(() => useTripByIdFull(""));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.isLoadingTrip).toBe(false);
    expect(result.current.isErrorTrip).toBe(false);
    expect(result.current.tripId).toBe("");
  });

  it("should show loading state while fetching", async () => {
    server.use(createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(mockTrip)));

    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-loading"));

    expect(result.current.isLoadingTrip).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.tripId).toBe("trip-loading");
  });

  it("should determine if trip is past", async () => {
    const pastTrip = {
      ...mockTrip,
      id: "trip-past",
      startDate: "2020-01-01",
      endDate: "2020-01-10",
    };

    server.use(createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(pastTrip)));

    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-past"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.isTripPast).toBe(true);
    expect(result.current.trip?.id).toBe("trip-past");
    expect(result.current.tripId).toBe("trip-past");
  });

  it("should determine if trip is not past (future trip)", async () => {
    const futureTrip = {
      ...mockTrip,
      id: "trip-future",
      startDate: "2099-01-01",
      endDate: "2099-01-10",
    };

    server.use(
      createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(futureTrip)),
    );

    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-future"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.isTripPast).toBe(false);
    expect(result.current.trip?.id).toBe("trip-future");
    expect(result.current.tripId).toBe("trip-future");
  });

  it("should expose refetchTrip function", async () => {
    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-refetch"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(typeof result.current.refetchTrip).toBe("function");
    expect(result.current.tripId).toBe("trip-refetch");
  });

  it("should handle trip with minimal data", async () => {
    const minimalTrip = {
      ...mockTrip,
      id: "trip-min",
      description: null,
      backgroundImagePath: null,
      groups: [],
    };

    server.use(
      createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(minimalTrip)),
    );

    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-min"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toEqual(minimalTrip);
    expect(result.current.trip?.description).toBeNull();
    expect(result.current.trip?.backgroundImagePath).toBeNull();
    expect(result.current.trip?.groups).toEqual([]);
    expect(result.current.tripId).toBe("trip-min");
  });

  it("should handle API returning null trip", async () => {
    server.use(createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(null)));

    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-null"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.isLoadingTrip).toBe(false);
    expect(result.current.tripId).toBe("trip-null");
  });

  it("should handle trip with multiple groups", async () => {
    const multiGroupTrip = {
      ...mockTrip,
      id: "trip-multi",
      backgroundImagePath: "/image.jpg",
      groups: [
        { id: "group-1", name: "Group 1" },
        { id: "group-2", name: "Group 2" },
        { id: "group-3", name: "Group 3" },
      ],
    };

    server.use(
      createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(multiGroupTrip)),
    );

    const { result } = renderHookWithMSW(() => useTripByIdFull("trip-multi"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip?.groups).toHaveLength(3);
    expect(result.current.trip?.groups[0]!.name).toBe("Group 1");
    expect(result.current.trip?.groups[2]!.name).toBe("Group 3");
    expect(result.current.tripId).toBe("trip-multi");
  });
});
