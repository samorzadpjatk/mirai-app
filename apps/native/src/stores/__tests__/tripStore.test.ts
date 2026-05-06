import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { useTripStore, useTripSync } from "../tripStore";
import { renderHook } from "@testing-library/react-native";

// Mock the hooks that useTripSync depends on
const mockUseSelectedTrip = jest.fn();
const mockUseTripDetails = jest.fn();

jest.mock("~/hooks/trips", () => ({
  useSelectedTrip: () => mockUseSelectedTrip(),
  useTripDetails: (tripId: string | null) => mockUseTripDetails(tripId),
}));

describe("tripStore", () => {
  beforeEach(() => {
    useTripStore.setState({
      selectedTripId: null,
      isTripPast: undefined,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have null selectedTripId", () => {
      const state = useTripStore.getState();
      expect(state.selectedTripId).toBeNull();
    });

    it("should have undefined isTripPast", () => {
      const state = useTripStore.getState();
      expect(state.isTripPast).toBeUndefined();
    });

    it("should have false isLoading", () => {
      const state = useTripStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("state updates", () => {
    it("should update selectedTripId", () => {
      useTripStore.setState({ selectedTripId: "trip-123" });
      const state = useTripStore.getState();
      expect(state.selectedTripId).toBe("trip-123");
    });

    it("should update isTripPast to true", () => {
      useTripStore.setState({ isTripPast: true });
      const state = useTripStore.getState();
      expect(state.isTripPast).toBe(true);
    });

    it("should update isTripPast to false", () => {
      useTripStore.setState({ isTripPast: false });
      const state = useTripStore.getState();
      expect(state.isTripPast).toBe(false);
    });

    it("should update isLoading", () => {
      useTripStore.setState({ isLoading: true });
      const state = useTripStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it("should update multiple state properties at once", () => {
      useTripStore.setState({
        selectedTripId: "trip-456",
        isTripPast: true,
        isLoading: true,
      });
      const state = useTripStore.getState();
      expect(state.selectedTripId).toBe("trip-456");
      expect(state.isTripPast).toBe(true);
      expect(state.isLoading).toBe(true);
    });
  });

  describe("state transitions", () => {
    it("should handle trip selection flow", () => {
      expect(useTripStore.getState().selectedTripId).toBeNull();

      useTripStore.setState({ selectedTripId: "trip-789" });
      expect(useTripStore.getState().selectedTripId).toBe("trip-789");

      useTripStore.setState({ isLoading: true });
      expect(useTripStore.getState().isLoading).toBe(true);

      useTripStore.setState({
        isLoading: false,
        isTripPast: true,
      });
      expect(useTripStore.getState().isLoading).toBe(false);
      expect(useTripStore.getState().isTripPast).toBe(true);
    });

    it("should handle trip deselection", () => {
      useTripStore.setState({
        selectedTripId: "trip-123",
        isTripPast: false,
        isLoading: false,
      });

      useTripStore.setState({
        selectedTripId: null,
        isTripPast: undefined,
      });

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBeNull();
      expect(state.isTripPast).toBeUndefined();
    });

    it("should handle loading state transitions", () => {
      useTripStore.setState({ isLoading: true });
      expect(useTripStore.getState().isLoading).toBe(true);

      useTripStore.setState({ isLoading: false });
      expect(useTripStore.getState().isLoading).toBe(false);

      useTripStore.setState({ isLoading: true });
      expect(useTripStore.getState().isLoading).toBe(true);
    });

    it("should handle isTripPast state transitions", () => {
      useTripStore.setState({ isTripPast: undefined });
      expect(useTripStore.getState().isTripPast).toBeUndefined();

      useTripStore.setState({ isTripPast: false });
      expect(useTripStore.getState().isTripPast).toBe(false);

      useTripStore.setState({ isTripPast: true });
      expect(useTripStore.getState().isTripPast).toBe(true);

      useTripStore.setState({ isTripPast: undefined });
      expect(useTripStore.getState().isTripPast).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty string tripId", () => {
      useTripStore.setState({ selectedTripId: "" });
      expect(useTripStore.getState().selectedTripId).toBe("");
    });

    it("should handle tripId with special characters", () => {
      const specialId = "trip-123_abc@#$";
      useTripStore.setState({ selectedTripId: specialId });
      expect(useTripStore.getState().selectedTripId).toBe(specialId);
    });

    it("should handle tripId with unicode characters", () => {
      const unicodeId = "trip-日本語-emoji";
      useTripStore.setState({ selectedTripId: unicodeId });
      expect(useTripStore.getState().selectedTripId).toBe(unicodeId);
    });

    it("should handle very long tripId", () => {
      const longId = "trip-" + "a".repeat(500);
      useTripStore.setState({ selectedTripId: longId });
      expect(useTripStore.getState().selectedTripId).toBe(longId);
    });

    it("should maintain state independence between updates", () => {
      useTripStore.setState({ selectedTripId: "trip-1" });
      useTripStore.setState({ isTripPast: true });

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBe("trip-1");
      expect(state.isTripPast).toBe(true);
    });

    it("should handle partial state updates", () => {
      useTripStore.setState({
        selectedTripId: "trip-123",
        isTripPast: true,
        isLoading: false,
      });

      useTripStore.setState({ isLoading: true });

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBe("trip-123");
      expect(state.isTripPast).toBe(true);
      expect(state.isLoading).toBe(true);
    });

    it("should handle null values explicitly", () => {
      useTripStore.setState({
        selectedTripId: "trip-123",
        isTripPast: true,
      });

      useTripStore.setState({ selectedTripId: null });

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBeNull();
      expect(state.isTripPast).toBe(true);
    });
  });

  describe("useTripSync hook", () => {
    it("should sync store with selected trip data", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-123" });
      mockUseTripDetails.mockReturnValue({ isTripPast: false, isLoadingTrip: true });

      renderHook(() => useTripSync());

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBe("trip-123");
      expect(state.isTripPast).toBe(false);
      expect(state.isLoading).toBe(true);
    });

    it("should update store when trip data changes", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-123" });
      mockUseTripDetails.mockReturnValue({ isTripPast: false, isLoadingTrip: false });

      const { rerender } = renderHook(() => useTripSync());

      expect(useTripStore.getState().isLoading).toBe(false);

      mockUseTripDetails.mockReturnValue({ isTripPast: true, isLoadingTrip: false });
      rerender();

      expect(useTripStore.getState().isTripPast).toBe(true);
    });

    it("should handle null selectedTripId", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: null });
      mockUseTripDetails.mockReturnValue({ isTripPast: undefined, isLoadingTrip: false });

      renderHook(() => useTripSync());

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBeNull();
      expect(state.isTripPast).toBeUndefined();
    });

    it("should handle undefined isTripPast from useTripDetails", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-456" });
      mockUseTripDetails.mockReturnValue({ isTripPast: undefined, isLoadingTrip: false });

      renderHook(() => useTripSync());

      expect(useTripStore.getState().isTripPast).toBeUndefined();
    });

    it("should pass selectedTripId to useTripDetails", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-789" });
      mockUseTripDetails.mockReturnValue({ isTripPast: false, isLoadingTrip: false });

      renderHook(() => useTripSync());

      expect(mockUseTripDetails).toHaveBeenCalledWith("trip-789");
    });

    it("should handle loading state from useTripDetails", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-123" });
      mockUseTripDetails.mockReturnValue({ isTripPast: false, isLoadingTrip: true });

      renderHook(() => useTripSync());

      expect(useTripStore.getState().isLoading).toBe(true);
    });

    it("should handle multiple rerenders with same data", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-123" });
      mockUseTripDetails.mockReturnValue({ isTripPast: false, isLoadingTrip: false });

      const { rerender } = renderHook(() => useTripSync());

      rerender();
      rerender();
      rerender();

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBe("trip-123");
      expect(state.isTripPast).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("should handle tripId change", () => {
      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-123" });
      mockUseTripDetails.mockReturnValue({ isTripPast: false, isLoadingTrip: false });

      const { rerender } = renderHook(() => useTripSync());

      expect(useTripStore.getState().selectedTripId).toBe("trip-123");

      mockUseSelectedTrip.mockReturnValue({ selectedTripId: "trip-456" });
      mockUseTripDetails.mockReturnValue({ isTripPast: true, isLoadingTrip: false });
      rerender();

      const state = useTripStore.getState();
      expect(state.selectedTripId).toBe("trip-456");
      expect(state.isTripPast).toBe(true);
    });
  });

  describe("complex scenarios", () => {
    it("should handle complete trip lifecycle", () => {
      // Initial state
      expect(useTripStore.getState().selectedTripId).toBeNull();

      // Select trip
      useTripStore.setState({ selectedTripId: "trip-lifecycle" });
      expect(useTripStore.getState().selectedTripId).toBe("trip-lifecycle");

      // Loading starts
      useTripStore.setState({ isLoading: true });
      expect(useTripStore.getState().isLoading).toBe(true);

      // Trip data loaded - active trip
      useTripStore.setState({
        isLoading: false,
        isTripPast: false,
      });
      expect(useTripStore.getState().isTripPast).toBe(false);

      // Trip becomes past
      useTripStore.setState({ isTripPast: true });
      expect(useTripStore.getState().isTripPast).toBe(true);

      // Deselect trip
      useTripStore.setState({
        selectedTripId: null,
        isTripPast: undefined,
      });
      expect(useTripStore.getState().selectedTripId).toBeNull();
      expect(useTripStore.getState().isTripPast).toBeUndefined();
    });

    it("should handle rapid state changes", () => {
      for (let i = 0; i < 10; i++) {
        useTripStore.setState({ selectedTripId: `trip-${i}` });
      }
      expect(useTripStore.getState().selectedTripId).toBe("trip-9");
    });

    it("should maintain state consistency", () => {
      const states: ReturnType<typeof useTripStore.getState>[] = [];

      useTripStore.setState({ selectedTripId: "trip-1" });
      states.push(useTripStore.getState());

      useTripStore.setState({ isTripPast: true });
      states.push(useTripStore.getState());

      useTripStore.setState({ isLoading: true });
      states.push(useTripStore.getState());

      // Verify each state captured the correct values
      expect(states[0].selectedTripId).toBe("trip-1");
      expect(states[0].isTripPast).toBeUndefined();
      expect(states[0].isLoading).toBe(false);

      expect(states[1].selectedTripId).toBe("trip-1");
      expect(states[1].isTripPast).toBe(true);
      expect(states[1].isLoading).toBe(false);

      expect(states[2].selectedTripId).toBe("trip-1");
      expect(states[2].isTripPast).toBe(true);
      expect(states[2].isLoading).toBe(true);
    });
  });
});
