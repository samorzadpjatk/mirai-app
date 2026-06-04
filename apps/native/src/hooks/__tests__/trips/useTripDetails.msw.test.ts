import { beforeEach, describe, expect, it } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useTripDetails } from "../../trips/useTripDetails";

describe("useTripDetails (MSW)", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("should return trip details when API returns data", async () => {
    const mockTrip = {
      id: "trip-1",
      name: "API Trip",
      description: "API Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: "/path/to/api-image.jpg",
      groups: [{ id: "group-1", name: "Group 1" }],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-1"));

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
    server.use(createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })));

    const { result } = renderHookWithMSW(() => useTripDetails(null));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.isLoadingTrip).toBe(false);
    expect(result.current.isErrorTrip).toBe(false);
    expect(result.current.tripId).toBe("");
  });

  it("should handle empty string tripId", async () => {
    server.use(createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })));

    const { result } = renderHookWithMSW(() => useTripDetails(""));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.isLoadingTrip).toBe(false);
    expect(result.current.isErrorTrip).toBe(false);
    expect(result.current.tripId).toBe("");
  });

  it("should show loading states while fetching", async () => {
    const mockTrip = {
      id: "trip-loading",
      name: "Loading Trip",
      description: "Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: null,
      groups: [],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-loading"));

    expect(result.current.isLoadingUser).toBe(true);
    expect(result.current.isLoadingTrip).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.isLoadingUser).toBe(false);
    expect(result.current.trip).toEqual(mockTrip);
    expect(result.current.tripId).toBe("trip-loading");
  });

  it("should determine if trip is past", async () => {
    const pastTrip = {
      id: "trip-past",
      name: "Past Trip",
      description: "Description",
      startDate: "2020-01-01",
      endDate: "2020-01-10",
      backgroundImagePath: null,
      groups: [],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => pastTrip),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-past"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.isTripPast).toBe(true);
    expect(result.current.trip?.id).toBe("trip-past");
    expect(result.current.tripId).toBe("trip-past");
  });

  it("should determine if trip is not past (future trip)", async () => {
    const futureTrip = {
      id: "trip-future",
      name: "Future Trip",
      description: "Description",
      startDate: "2099-01-01",
      endDate: "2099-01-10",
      backgroundImagePath: null,
      groups: [],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => futureTrip),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-future"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.isTripPast).toBe(false);
    expect(result.current.trip?.id).toBe("trip-future");
    expect(result.current.tripId).toBe("trip-future");
  });

  it("should return current user data", async () => {
    const mockUser = { id: "user-1", name: "John Doe", email: "john@example.com" };
    const mockTrip = {
      id: "trip-user",
      name: "Trip",
      description: "Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: null,
      groups: [],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["user", "getMy"], () => mockUser),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-user"));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.isLoadingUser).toBe(false);
    expect(result.current.tripId).toBe("trip-user");
  });

  it("should expose refetchTrip function", async () => {
    const mockTrip = {
      id: "trip-refetch",
      name: "Trip",
      description: "Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: null,
      groups: [],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-refetch"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(typeof result.current.refetchTrip).toBe("function");
    expect(result.current.tripId).toBe("trip-refetch");
  });

  it("should handle trip with minimal data", async () => {
    const minimalTrip = {
      id: "trip-min",
      name: "Minimal Trip",
      description: null,
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: null,
      groups: [],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => minimalTrip),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-min"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toEqual(minimalTrip);
    expect(result.current.trip?.description).toBeNull();
    expect(result.current.trip?.backgroundImagePath).toBeNull();
    expect(result.current.trip?.groups).toEqual([]);
    expect(result.current.tripId).toBe("trip-min");
  });

  it("should handle both APIs returning null", async () => {
    server.use(
      createORPCHandler(["trip", "getById"], () => null),
      createORPCHandler(["user", "getMy"], () => null),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-null"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isLoadingUser).toBe(false);
    expect(result.current.isLoadingTrip).toBe(false);
    expect(result.current.tripId).toBe("trip-null");
  });

  it("should handle trip with multiple groups", async () => {
    const mockTrip = {
      id: "trip-multi",
      name: "Multi Group Trip",
      description: "Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: "/image.jpg",
      groups: [
        { id: "group-1", name: "Group 1" },
        { id: "group-2", name: "Group 2" },
        { id: "group-3", name: "Group 3" },
      ],
    };

    server.use(
      createORPCHandler(["trip", "getById"], () => mockTrip),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-multi"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip?.groups).toHaveLength(3);
    expect(result.current.trip?.groups[0]!.name).toBe("Group 1");
    expect(result.current.trip?.groups[2]!.name).toBe("Group 3");
    expect(result.current.tripId).toBe("trip-multi");
  });

  it("should fall back to cached trip when API returns null", async () => {
    const cachedTrip = {
      id: "trip-cached",
      name: "Cached Trip",
      description: "Cached Description",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      backgroundImagePath: null,
      groups: [],
    };

    await AsyncStorage.setItem(
      "trip.details.cache.v1",
      JSON.stringify({ "trip-cached": cachedTrip }),
    );

    server.use(
      createORPCHandler(["trip", "getById"], () => null),
      createORPCHandler(["user", "getMy"], () => ({ id: "user-1", name: "Test User" })),
    );

    const { result } = renderHookWithMSW(() => useTripDetails("trip-cached"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip).toEqual(cachedTrip);
    expect(result.current.tripId).toBe("trip-cached");
  });
});
