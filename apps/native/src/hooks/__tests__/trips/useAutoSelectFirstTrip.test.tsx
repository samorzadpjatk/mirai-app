import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAutoSelectFirstTrip } from "../../trips/useAutoSelectFirstTrip";

const mockGetSelectedTripIdFromStorage = jest.fn<() => Promise<string | null>>();
const mockSetSelectedTripIdInStorage = jest.fn<(id: string) => Promise<void>>();
const mockClearSelectedTripIdInStorage = jest.fn<() => Promise<void>>();

jest.mock("~/services/storage/selectedTripStorage", () => ({
  getSelectedTripIdFromStorage: (...args: []) => mockGetSelectedTripIdFromStorage(...args),
  setSelectedTripIdInStorage: (...args: [string]) => mockSetSelectedTripIdInStorage(...args),
  clearSelectedTripIdInStorage: (...args: []) => mockClearSelectedTripIdInStorage(...args),
}));

const SELECTED_TRIP_QUERY_KEY = ["selected-trip-id"];

const trips = [
  { id: "trip-a", name: "Trip A", startDate: new Date(), endDate: new Date() },
  { id: "trip-b", name: "Trip B", startDate: new Date(), endDate: new Date() },
];

function createWrapper(initialSelectedTripId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  queryClient.setQueryData(SELECTED_TRIP_QUERY_KEY, initialSelectedTripId);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider
          initialMetrics={{
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
            frame: { x: 0, y: 0, width: 390, height: 844 },
          }}
        >
          {children}
        </SafeAreaProvider>
      </QueryClientProvider>
    );
  };
}

describe("useAutoSelectFirstTrip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSelectedTripIdFromStorage.mockResolvedValue(null);
  });

  it("sets selected trip to first trip when none is selected", async () => {
    mockSetSelectedTripIdInStorage.mockResolvedValue(undefined);

    renderHook(() => useAutoSelectFirstTrip(trips, false), {
      wrapper: createWrapper(null),
    });

    await waitFor(() => expect(mockSetSelectedTripIdInStorage).toHaveBeenCalledWith("trip-a"));
    expect(mockSetSelectedTripIdInStorage).toHaveBeenCalledTimes(1);
  });

  it("does nothing when user dismissed the picker", async () => {
    renderHook(() => useAutoSelectFirstTrip(trips, true), {
      wrapper: createWrapper(null),
    });

    await waitFor(() => expect(mockSetSelectedTripIdInStorage).not.toHaveBeenCalled());
  });

  it("does nothing when a valid trip is already selected", async () => {
    renderHook(() => useAutoSelectFirstTrip(trips, false), {
      wrapper: createWrapper("trip-a"),
    });

    await waitFor(() => expect(mockSetSelectedTripIdInStorage).not.toHaveBeenCalled());
  });

  it("re-selects first trip when selected id is stale", async () => {
    mockSetSelectedTripIdInStorage.mockResolvedValue(undefined);

    renderHook(() => useAutoSelectFirstTrip(trips, false), {
      wrapper: createWrapper("stale-id"),
    });

    await waitFor(() => expect(mockSetSelectedTripIdInStorage).toHaveBeenCalledWith("trip-a"));
    expect(mockSetSelectedTripIdInStorage).toHaveBeenCalledTimes(1);
  });
});
