import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useMapActions } from "../../map/useMapActions";

const mockMutateAsync = jest.fn();

const mockUseMutation = jest.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    location: {
      updateLocation: {
        mutationOptions: jest.fn(() => ({})),
      },
    },
  })),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

describe("useMapActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it("should return sendLocation function", () => {
    const { result } = renderHook(() => useMapActions());

    expect(typeof result.current.sendLocation).toBe("function");
  });

  it("should return isSendingLocation as false initially", () => {
    const { result } = renderHook(() => useMapActions());

    expect(result.current.isSendingLocation).toBe(false);
  });

  it("should call mutateAsync with correct location data", async () => {
    mockMutateAsync.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMapActions());

    await act(async () => {
      await result.current.sendLocation({
        latitude: 52.2297,
        longitude: 21.0122,
      });
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      latitude: 52.2297,
      longitude: 21.0122,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle negative coordinates", async () => {
    mockMutateAsync.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMapActions());

    await act(async () => {
      await result.current.sendLocation({
        latitude: -33.8688,
        longitude: -151.2093,
      });
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      latitude: -33.8688,
      longitude: -151.2093,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle zero coordinates", async () => {
    mockMutateAsync.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMapActions());

    await act(async () => {
      await result.current.sendLocation({
        latitude: 0,
        longitude: 0,
      });
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      latitude: 0,
      longitude: 0,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should return mutation result", async () => {
    const mockResult = { id: "location-1", timestamp: Date.now() };
    mockMutateAsync.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useMapActions());

    let returnedResult;
    await act(async () => {
      returnedResult = await result.current.sendLocation({
        latitude: 52.2297,
        longitude: 21.0122,
      });
    });

    expect(returnedResult).toEqual(mockResult);
  });

  it("should propagate mutation errors", async () => {
    const error = new Error("Network error");
    mockMutateAsync.mockRejectedValue(error);

    const { result } = renderHook(() => useMapActions());

    await expect(
      act(async () => {
        await result.current.sendLocation({
          latitude: 52.2297,
          longitude: 21.0122,
        });
      })
    ).rejects.toThrow("Network error");
  });

  it("should return isSendingLocation as true when mutation is pending", () => {
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });

    const { result } = renderHook(() => useMapActions());

    expect(result.current.isSendingLocation).toBe(true);
  });

  it("should handle high precision coordinates", async () => {
    mockMutateAsync.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMapActions());

    await act(async () => {
      await result.current.sendLocation({
        latitude: 52.22976666111,
        longitude: 21.01223333888,
      });
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      latitude: 52.22976666111,
      longitude: 21.01223333888,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle edge case coordinates near poles", async () => {
    mockMutateAsync.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMapActions());

    await act(async () => {
      await result.current.sendLocation({
        latitude: 89.9999,
        longitude: 180,
      });
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      latitude: 89.9999,
      longitude: 180,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("should handle edge case coordinates near date line", async () => {
    mockMutateAsync.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMapActions());

    await act(async () => {
      await result.current.sendLocation({
        latitude: 0,
        longitude: -180,
      });
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      latitude: 0,
      longitude: -180,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    });
  });
});
