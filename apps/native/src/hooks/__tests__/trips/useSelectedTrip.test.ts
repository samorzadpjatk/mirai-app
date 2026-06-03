import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { act, waitFor } from "@testing-library/react-native";
import { useSelectedTrip } from "../../trips/useSelectedTrip";

const mockGetSelectedTripIdFromStorage = jest.fn<() => Promise<string | null>>();
const mockSetSelectedTripIdInStorage = jest.fn<(id: string | null) => Promise<void>>();
const mockClearSelectedTripIdInStorage = jest.fn<() => Promise<void>>();

jest.mock("~/services/storage/selectedTripStorage", () => ({
  getSelectedTripIdFromStorage: (...args: []) => mockGetSelectedTripIdFromStorage(...args),
  setSelectedTripIdInStorage: (...args: [string | null]) => mockSetSelectedTripIdInStorage(...args),
  clearSelectedTripIdInStorage: (...args: []) => mockClearSelectedTripIdInStorage(...args),
}));

describe("useSelectedTrip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSelectedTripIdFromStorage.mockResolvedValue(null);
  });

  it("should return null when no trip is selected", async () => {
    const { result } = renderHookWithMSW(() => useSelectedTrip());
    await waitFor(() => expect(result.current.isLoadingSelectedTrip).toBe(false));
    expect(result.current.selectedTripId).toBeNull();
  });

  it("should return selected trip id from storage", async () => {
    mockGetSelectedTripIdFromStorage.mockResolvedValue("trip-123");
    const { result } = renderHookWithMSW(() => useSelectedTrip());
    await waitFor(() => expect(result.current.selectedTripId).toBe("trip-123"));
    expect(result.current.isLoadingSelectedTrip).toBe(false);
  });

  it("should indicate loading while fetching from storage", () => {
    mockGetSelectedTripIdFromStorage.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );
    const { result } = renderHookWithMSW(() => useSelectedTrip());
    expect(result.current.isLoadingSelectedTrip).toBe(true);
  });

  it("should set selected trip id and update cache", async () => {
    mockSetSelectedTripIdInStorage.mockResolvedValue(undefined);
    const { result } = renderHookWithMSW(() => useSelectedTrip());
    await waitFor(() => expect(result.current.isLoadingSelectedTrip).toBe(false));

    act(() => {
      result.current.setSelectedTripId("trip-456");
    });
    await waitFor(() => expect(mockSetSelectedTripIdInStorage).toHaveBeenCalledWith("trip-456"));
    await waitFor(() => expect(result.current.selectedTripId).toBe("trip-456"));
  });

  it("should clear selected trip id when null is passed", async () => {
    mockGetSelectedTripIdFromStorage.mockResolvedValue("trip-123");
    mockClearSelectedTripIdInStorage.mockResolvedValue(undefined);
    const { result } = renderHookWithMSW(() => useSelectedTrip());
    await waitFor(() => expect(result.current.selectedTripId).toBe("trip-123"));

    act(() => {
      result.current.setSelectedTripId(null);
    });
    await waitFor(() => expect(mockClearSelectedTripIdInStorage).toHaveBeenCalled());
    await waitFor(() => expect(result.current.selectedTripId).toBeNull());
  });

  it("should handle mutation error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockSetSelectedTripIdInStorage.mockRejectedValue(new Error("Storage write failed"));
    const { result } = renderHookWithMSW(() => useSelectedTrip());
    await waitFor(() => expect(result.current.isLoadingSelectedTrip).toBe(false));

    act(() => {
      result.current.setSelectedTripId("trip-error");
    });
    // Should not throw; error is silently caught
    await waitFor(() => expect(result.current.isLoadingSelectedTrip).toBe(false));
    consoleSpy.mockRestore();
  });
});
