import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react-native";

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();

jest.mock("expo-notifications", () => ({
  PermissionStatus: {
    UNDETERMINED: "undetermined",
    GRANTED: "granted",
    DENIED: "denied",
  },
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
}));

const mockOpenSettings = jest.fn(() => Promise.resolve());

jest.doMock("react-native", () => {
  return {
    Linking: {
      openSettings: mockOpenSettings,
    },
    Alert: {
      alert: jest.fn(),
    },
  };
});

const { useNotificationPermission } = require("../../notifications/useNotificationPermission");

describe("useNotificationPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockOpenSettings.mockResolvedValue(undefined);
  });

  it("initializes with undetermined permission", () => {
    const { result } = renderHook(() => useNotificationPermission());

    expect(result.current.permission).toBe("undetermined");
  });

  it("fetches permission on mount", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(result.current.permission).toBe("granted");
    });
  });

  it("requests permission when undetermined", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotificationPermission());

    let returnedStatus: string;
    await act(async () => {
      returnedStatus = await result.current.requestPermission();
    });

    expect(returnedStatus!).toBe("granted");
    expect(result.current.permission).toBe("granted");
    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("does not request when already granted", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

    const { result } = renderHook(() => useNotificationPermission());

    let returnedStatus: string;
    await act(async () => {
      returnedStatus = await result.current.requestPermission();
    });

    expect(returnedStatus!).toBe("granted");
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("opens app settings", () => {
    const { result } = renderHook(() => useNotificationPermission());

    act(() => {
      result.current.openAppSettings();
    });

    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("handles open settings error", async () => {
    mockOpenSettings.mockRejectedValue(new Error("Cannot open settings"));

    const { result } = renderHook(() => useNotificationPermission());

    act(() => {
      result.current.openAppSettings();
    });

    await waitFor(() => {
      expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    });
  });
});
