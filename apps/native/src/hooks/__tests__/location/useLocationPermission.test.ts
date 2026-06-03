import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

const mockGetForegroundPermissionsAsync = jest.fn(async () => ({ status: "undetermined" }));
const mockRequestForegroundPermissionsAsync = jest.fn(async () => ({ status: "undetermined" }));

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: () => mockGetForegroundPermissionsAsync(),
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissionsAsync(),
}));

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
}));

import { useLocationPermission } from "../../location/useLocationPermission";

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
      expect(returnedStatus).toBe("granted");
    });

    expect(result.current.permissionStatus).toBe("granted");
  });

  it("shows alert when permission denied", async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: "denied" });

    const { result } = renderHook(() => useLocationPermission());

    await act(async () => {
      await result.current.requestLocationPermissions();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
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
      expect(returnedStatus).toBe("denied");
    });

    expect(result.current.permissionStatus).toBe("denied");
    expect(Alert.alert).toHaveBeenCalled();
  });
});
