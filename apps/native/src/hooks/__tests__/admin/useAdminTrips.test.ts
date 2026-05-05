import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminTrips } from "../../admin/useAdminTrips";

// Mock useTrips hook
const mockUseTrips = jest.fn();

jest.mock("~/hooks/trips", () => ({
  useTrips: () => mockUseTrips(),
}));

describe("useAdminTrips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseTrips.mockReturnValue({
      trips: [],
      isLoading: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    expect(result.current.tripsLoading).toBe(true);
    expect(result.current.trips).toEqual([]);
    expect(result.current.hasTrip).toBe(false);
  });

  it("should return trips from useTrips", async () => {
    const mockTrips = [
      {
        id: "trip-1",
        name: "Spring Trip 2024",
        startDate: "2024-03-01",
        endDate: "2024-03-10",
        isActive: true,
      },
      {
        id: "trip-2",
        name: "Summer Trip 2024",
        startDate: "2024-07-01",
        endDate: "2024-07-10",
        isActive: false,
      },
    ];

    mockUseTrips.mockReturnValue({
      trips: mockTrips,
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    await waitFor(() => {
      expect(result.current.tripsLoading).toBe(false);
    });

    expect(result.current.trips).toHaveLength(2);
    expect(result.current.trips[0].id).toBe("trip-1");
    expect(result.current.trips[1].name).toBe("Summer Trip 2024");
  });

  it("should select first trip by default", async () => {
    const mockTrips = [
      {
        id: "trip-1",
        name: "Spring Trip 2024",
        startDate: "2024-03-01",
        endDate: "2024-03-10",
      },
    ];

    mockUseTrips.mockReturnValue({
      trips: mockTrips,
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    await waitFor(() => {
      expect(result.current.selectedTripId).toBe("trip-1");
    });

    expect(result.current.selectedTrip?.id).toBe("trip-1");
    expect(result.current.hasTrip).toBe(true);
  });

  it("should allow selecting a specific trip", async () => {
    const mockTrips = [
      {
        id: "trip-1",
        name: "Spring Trip 2024",
        startDate: "2024-03-01",
        endDate: "2024-03-10",
      },
      {
        id: "trip-2",
        name: "Summer Trip 2024",
        startDate: "2024-07-01",
        endDate: "2024-07-10",
      },
    ];

    mockUseTrips.mockReturnValue({
      trips: mockTrips,
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    await waitFor(() => {
      expect(result.current.selectedTripId).toBe("trip-1");
    });

    act(() => {
      result.current.selectTrip("trip-2");
    });

    await waitFor(() => {
      expect(result.current.selectedTripId).toBe("trip-2");
    });

    expect(result.current.selectedTrip?.id).toBe("trip-2");
    expect(result.current.selectedTrip?.name).toBe("Summer Trip 2024");
  });

  it("should handle empty trips list", async () => {
    mockUseTrips.mockReturnValue({
      trips: [],
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    await waitFor(() => {
      expect(result.current.tripsLoading).toBe(false);
    });

    expect(result.current.selectedTripId).toBeNull();
    expect(result.current.selectedTrip).toBeNull();
    expect(result.current.hasTrip).toBe(false);
  });

  it("should handle pagination state", () => {
    mockUseTrips.mockReturnValue({
      trips: [],
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isFetchingNextPage).toBe(true);
  });

  it("should call fetchNextPage when requested", () => {
    const mockFetchNextPage = jest.fn();

    mockUseTrips.mockReturnValue({
      trips: [],
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    act(() => {
      result.current.fetchNextPage();
    });

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should call refetch when requested", () => {
    const mockRefetch = jest.fn();

    mockUseTrips.mockReturnValue({
      trips: [],
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useAdminTrips());

    act(() => {
      result.current.refetch();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should maintain selected trip when trips update", async () => {
    const mockTrips = [
      {
        id: "trip-1",
        name: "Spring Trip 2024",
        startDate: "2024-03-01",
        endDate: "2024-03-10",
      },
      {
        id: "trip-2",
        name: "Summer Trip 2024",
        startDate: "2024-07-01",
        endDate: "2024-07-10",
      },
    ];

    mockUseTrips.mockReturnValue({
      trips: mockTrips,
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result, rerender } = renderHook(() => useAdminTrips());

    await waitFor(() => {
      expect(result.current.selectedTripId).toBe("trip-1");
    });

    act(() => {
      result.current.selectTrip("trip-2");
    });

    await waitFor(() => {
      expect(result.current.selectedTripId).toBe("trip-2");
    });

    const updatedTrips = [
      ...mockTrips,
      {
        id: "trip-3",
        name: "Fall Trip 2024",
        startDate: "2024-10-01",
        endDate: "2024-10-10",
      },
    ];

    mockUseTrips.mockReturnValue({
      trips: updatedTrips,
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(result.current.selectedTripId).toBe("trip-2");
    });
  });

  it("should handle trip with missing dates", async () => {
    const mockTrips = [
      {
        id: "trip-1",
        name: "Trip Without Dates",
        startDate: null,
        endDate: null,
      },
    ];

    mockUseTrips.mockReturnValue({
      trips: mockTrips,
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useAdminTrips());

    await waitFor(() => {
      expect(result.current.selectedTrip?.startDate).toBeNull();
    });

    expect(result.current.selectedTrip?.endDate).toBeNull();
  });
});
