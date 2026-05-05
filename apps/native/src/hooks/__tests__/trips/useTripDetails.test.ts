import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useTripDetails } from "../../trips/useTripDetails";

// Mock the storage functions
const mockGetCachedTripById = jest.fn();
const mockSetCachedTripById = jest.fn();
const mockUpsertCachedTripListItem = jest.fn();

jest.mock("~/services/storage/selectedTripStorage", () => ({
  getCachedTripById: (id: string) => mockGetCachedTripById(id),
  setCachedTripById: (id: string, trip: unknown) => mockSetCachedTripById(id, trip),
  upsertCachedTripListItem: (trip: unknown) => mockUpsertCachedTripListItem(trip),
}));

// Mock the trip utility
jest.mock("~/utils/trip", () => ({
  isTripPast: (endDate: string | Date) => {
    const end = new Date(endDate);
    return end < new Date("2024-01-01");
  },
}));

// Mock tRPC
const mockUseQuery = jest.fn();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    trip: {
      getById: {
        queryOptions: jest.fn((params: { id: string }, options?: { enabled?: boolean }) => ({
          queryKey: ["trip", "getById", params.id],
          enabled: options?.enabled ?? true,
        })),
      },
    },
    user: {
      getMy: {
        queryOptions: jest.fn(() => ({
          queryKey: ["user", "getMy"],
        })),
      },
    },
  })),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("useTripDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedTripById.mockResolvedValue(null);
  });

  it("should return initial state when no tripId provided", () => {
    mockUseQuery.mockImplementation((options: { queryKey?: string[]; enabled?: boolean }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return { data: null, isLoading: false, isError: false, error: null, refetch: jest.fn() };
    });

    const { result } = renderHook(() => useTripDetails(null));

    expect(result.current.trip).toBeNull();
    expect(result.current.isLoadingTrip).toBe(false);
  });

  it("should return cached trip while loading", async () => {
    const cachedTrip = {
      id: "trip-1",
      name: "Cached Trip",
      description: "Cached Description",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      backgroundImagePath: "/path/to/image.jpg",
      groups: [],
    };
    mockGetCachedTripById.mockResolvedValue(cachedTrip);

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(result.current.trip).toBeTruthy();
    });

    expect(result.current.trip?.id).toBe("trip-1");
    expect(result.current.trip?.name).toBe("Cached Trip");
  });

  it("should return trip from API after loading", async () => {
    mockGetCachedTripById.mockResolvedValue(null);

    const apiTrip = {
      id: "trip-1",
      name: "API Trip",
      description: "API Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: "/path/to/api-image.jpg",
      groups: [{ id: "group-1", name: "Group 1" }],
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: apiTrip,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.trip?.id).toBe("trip-1");
    expect(result.current.trip?.name).toBe("API Trip");
  });

  it("should handle error state", async () => {
    mockGetCachedTripById.mockResolvedValue(null);
    const error = new Error("Failed to fetch trip");

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: null,
        isLoading: false,
        isError: true,
        error,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(result.current.isErrorTrip).toBe(true);
    });

    expect(result.current.tripError).toBe(error);
  });

  it("should return current user data", async () => {
    mockGetCachedTripById.mockResolvedValue(null);

    const currentUser = {
      id: "user-1",
      email: "user@example.com",
      name: "Test User",
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: currentUser, isLoading: false };
      }
      return {
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(result.current.currentUser).toEqual(currentUser);
    });

    expect(result.current.isLoadingUser).toBe(false);
  });

  it("should indicate loading while fetching user", () => {
    mockGetCachedTripById.mockResolvedValue(null);

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: true };
      }
      return {
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    expect(result.current.isLoadingUser).toBe(true);
  });

  it("should determine if trip is past", async () => {
    mockGetCachedTripById.mockResolvedValue(null);

    const pastTrip = {
      id: "trip-1",
      name: "Past Trip",
      description: "Description",
      startDate: "2023-01-01",
      endDate: "2023-01-10",
      backgroundImagePath: null,
      groups: [],
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: pastTrip,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.isTripPast).toBe(true);
  });

  it("should determine if trip is not past", async () => {
    mockGetCachedTripById.mockResolvedValue(null);

    const futureTrip = {
      id: "trip-1",
      name: "Future Trip",
      description: "Description",
      startDate: "2024-06-01",
      endDate: "2024-06-10",
      backgroundImagePath: null,
      groups: [],
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: futureTrip,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(result.current.isLoadingTrip).toBe(false);
    });

    expect(result.current.isTripPast).toBe(false);
  });

  it("should call refetchTrip when requested", () => {
    mockGetCachedTripById.mockResolvedValue(null);
    const refetch = jest.fn();

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch,
      };
    });

    const { result } = renderHook(() => useTripDetails("trip-1"));

    result.current.refetchTrip();

    expect(refetch).toHaveBeenCalled();
  });

  it("should cache trip data when API returns data", async () => {
    mockGetCachedTripById.mockResolvedValue(null);

    const apiTrip = {
      id: "trip-1",
      name: "API Trip",
      description: "API Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: "/path/to/image.jpg",
      groups: [{ id: "group-1", name: "Group 1" }],
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: apiTrip,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(mockSetCachedTripById).toHaveBeenCalledWith("trip-1", apiTrip);
    });
  });

  it("should update trip list cache when API returns data", async () => {
    mockGetCachedTripById.mockResolvedValue(null);

    const apiTrip = {
      id: "trip-1",
      name: "API Trip",
      description: "API Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: "/path/to/image.jpg",
      groups: [{ id: "group-1", name: "Group 1" }],
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: apiTrip,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    renderHook(() => useTripDetails("trip-1"));

    await waitFor(() => {
      expect(mockUpsertCachedTripListItem).toHaveBeenCalledWith({
        id: "trip-1",
        name: "API Trip",
        description: "API Description",
        startDate: "2024-02-01",
        endDate: "2024-02-10",
        backgroundImagePath: "/path/to/image.jpg",
        groups: [{ id: "group-1", name: "Group 1" }],
      });
    });
  });

  it("should not load trip when tripId is empty string", () => {
    mockUseQuery.mockImplementation((options: { queryKey?: string[]; enabled?: boolean }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: null,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result } = renderHook(() => useTripDetails(""));

    expect(result.current.trip).toBeNull();
    expect(result.current.isLoadingTrip).toBe(false);
  });

  it("should handle tripId changes and reset cache", async () => {
    mockGetCachedTripById.mockResolvedValue(null);

    const trip1 = {
      id: "trip-1",
      name: "Trip 1",
      description: "Description",
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      backgroundImagePath: null,
      groups: [],
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      return {
        data: trip1,
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    const { result, rerender } = renderHook(({ tripId }) => useTripDetails(tripId), {
      initialProps: { tripId: "trip-1" },
    });

    await waitFor(() => {
      expect(result.current.trip?.id).toBe("trip-1");
    });

    // Change to different trip
    const trip2 = {
      id: "trip-2",
      name: "Trip 2",
      description: "Description",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      backgroundImagePath: null,
      groups: [],
    };

    mockGetCachedTripById.mockResolvedValue(trip2);
    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("user")) {
        return { data: null, isLoading: false };
      }
      if (options?.queryKey?.includes("trip-2")) {
        return {
          data: trip2,
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
        };
      }
      return {
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
      };
    });

    rerender({ tripId: "trip-2" });

    await waitFor(() => {
      expect(mockGetCachedTripById).toHaveBeenCalledWith("trip-2");
    });
  });
});
