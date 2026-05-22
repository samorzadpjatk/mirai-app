import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react-native";

const mockGetForegroundPermissionsAsync = jest.fn();
const mockRequestForegroundPermissionsAsync = jest.fn();

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: () => mockGetForegroundPermissionsAsync(),
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissionsAsync(),
}));

const mockAlert = jest.fn();

jest.doMock("react-native", () => {
  return {
    Alert: {
      alert: mockAlert,
    },
  };
});

const { useLocationPermission } = require("../../location/useLocationPermission");

describe("useLocationPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: "undetermined" });
  });

  it("initializes with undetermined permission", () => {
    const { result } = renderHook(() => useLocationPermission());

    expect(result.current.permissionStatus).toBe("undetermined");
  });

  it("fetches permission on mount", async () => {
    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useLocationPermission());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("granted");
    });
  });

  it("requests permission and updates state", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useLocationPermission());

    let returnedStatus: string;
    await act(async () => {
      returnedStatus = await result.current.requestLocationPermissions();
    });

    expect(returnedStatus!).toBe("granted");
    expect(result.current.permissionStatus).toBe("granted");
  });

  it("shows alert when permission denied", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: "denied" });

    const { result } = renderHook(() => useLocationPermission());

    await act(async () => {
      await result.current.requestLocationPermissions();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "Location Permission Required",
      "Please enable location permissions in your device settings to use location features.",
    );
  });

  it("handles request error", async () => {
    mockRequestForegroundPermissionsAsync.mockRejectedValue(new Error("Permission error"));

    const { result } = renderHook(() => useLocationPermission());

    let returnedStatus: string;
    await act(async () => {
      returnedStatus = await result.current.requestLocationPermissions();
    });

    expect(returnedStatus!).toBe("denied");
    expect(result.current.permissionStatus).toBe("denied");
    expect(mockAlert).toHaveBeenCalled();
  });
});
