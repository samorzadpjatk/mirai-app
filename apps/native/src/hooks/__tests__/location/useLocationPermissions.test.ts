import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useLocationPermissions } from "../../location/useLocationPermissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Alert } from "react-native";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: function (...args: unknown[]) {
    return mockUseQuery.apply(this, args) as unknown;
  },
  useMutation: function (...args: unknown[]) {
    return mockUseMutation.apply(this, args) as unknown;
  },
  useQueryClient: jest.fn(function () {
    return {
      invalidateQueries: mockInvalidateQueries,
    };
  }),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  useTRPC: jest.fn(() => ({
    location: {
      getMySharingSettings: {
        queryOptions: jest.fn(() => ({ queryKey: ["sharing-settings"] })),
      },
      updateSharingSettings: {
        mutationOptions: jest.fn(function (options: unknown) {
          return { options };
        }),
      },
    },
  })),
  orpc: {
    location: {
      getMySharingSettings: {
        queryOptions: jest.fn(() => ({ queryKey: ["sharing-settings"] })),
      },
      updateSharingSettings: {
        mutationOptions: jest.fn(function (options: unknown) {
          return { options };
        }),
      },
    },
  },
}));

jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateLocationQueries: jest.fn(async function (queryClient: {
    invalidateQueries: () => Promise<void>;
  }) {
    await queryClient.invalidateQueries();
  }),
}));

describe("useLocationPermissions", () => {
  const mockMutateAsync = jest.fn<(...args: unknown[]) => Promise<unknown>>();
  const mockGetForegroundPermissions = jest.mocked(Location.getForegroundPermissionsAsync);
  const mockRequestForeground = jest.mocked(Location.requestForegroundPermissionsAsync);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });

    mockGetForegroundPermissions.mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      expires: "never",
      canAskAgain: true,
    });
    mockRequestForeground.mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      expires: "never",
      canAskAgain: true,
    });
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useLocationPermissions());

    expect(result.current.isLocationSharingEnabled).toBe(false);
    expect(result.current.permissionStatus).toBe("undetermined");
    expect(result.current.isLoading).toBe(true);
    expect(result.current.canViewOthersLocations).toBe(false);
    expect(result.current.canShareOwnLocation).toBe(false);
  });

  it("should load location sharing state from AsyncStorage", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockResolvedValueOnce("true");

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLocationSharingEnabled).toBe(true);
  });

  it("should use server state when available", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockResolvedValueOnce("true");

    mockUseQuery.mockReturnValue({
      data: { isSharingLocation: false },
      isLoading: false,
    });

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLocationSharingEnabled).toBe(false);
  });

  it("should handle AsyncStorage errors gracefully", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockRejectedValueOnce(new Error("Storage error"));

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to load location settings:",
      expect.any(Error),
    );

    consoleWarnSpy.mockRestore();
  });

  it("should check permission status on mount", async () => {
    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("granted");
    });
  });

  it("should handle permission check errors", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });
    mockGetForegroundPermissions.mockRejectedValueOnce(new Error("Permission check failed"));

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("denied");
    });

    consoleWarnSpy.mockRestore();
  });

  it("should request location permissions", async () => {
    const { result } = renderHook(() => useLocationPermissions());

    let permissionResult: string | null = null;
    await act(async () => {
      permissionResult = await result.current.requestLocationPermissions();
    });

    expect(permissionResult).toBe("granted");
    expect(result.current.permissionStatus).toBe("granted");
  });

  it("should show alert when permission is denied", async () => {
    mockRequestForeground.mockResolvedValueOnce({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      expires: "never",
      canAskAgain: true,
    });

    const { result } = renderHook(() => useLocationPermissions());

    await act(async () => {
      await result.current.requestLocationPermissions();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Location Permission Required", expect.any(String));
  });

  it("should handle permission request errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });
    mockRequestForeground.mockRejectedValueOnce(new Error("Request failed"));

    const { result } = renderHook(() => useLocationPermissions());

    let permissionResult: string | null = null;
    await act(async () => {
      permissionResult = await result.current.requestLocationPermissions();
    });

    expect(permissionResult).toBe("denied");
    expect(result.current.permissionStatus).toBe("denied");

    consoleErrorSpy.mockRestore();
  });

  it("should toggle location sharing on", async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const mockSetItem = jest.mocked(AsyncStorage.setItem);

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleLocationSharing(true);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      isSharingLocation: true,
      userIdsToShareWith: [],
    });
    expect(mockSetItem).toHaveBeenCalledWith("location_sharing_enabled", "true");
    expect(result.current.isLocationSharingEnabled).toBe(true);
  });

  it("should toggle location sharing off", async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);
    const mockSetItem = jest.mocked(AsyncStorage.setItem);

    mockUseQuery.mockReturnValue({
      data: { isSharingLocation: true },
      isLoading: false,
    });

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleLocationSharing(false);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      isSharingLocation: false,
      userIdsToShareWith: [],
    });
    expect(mockSetItem).toHaveBeenCalledWith("location_sharing_enabled", "false");
  });

  it("should request permissions when enabling sharing and permission is undetermined", async () => {
    mockMutateAsync.mockResolvedValueOnce(undefined);

    mockGetForegroundPermissions.mockResolvedValue({
      status: Location.PermissionStatus.UNDETERMINED,
      granted: false,
      expires: "never",
      canAskAgain: true,
    });

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("undetermined");
    });

    await act(async () => {
      await result.current.toggleLocationSharing(true);
    });

    expect(mockRequestForeground).toHaveBeenCalled();
  });

  it("should handle toggle location sharing errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });
    mockMutateAsync.mockRejectedValueOnce(new Error("Server error"));

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleLocationSharing(true);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Authentication Error", expect.any(String));

    consoleErrorSpy.mockRestore();
  });

  it("should handle non-Error toggle failures", async () => {
    mockMutateAsync.mockRejectedValueOnce("string error");

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleLocationSharing(true);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to update location settings");
  });

  it("should compute canViewOthersLocations correctly", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockResolvedValueOnce("true");

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("granted");
    });

    expect(result.current.canViewOthersLocations).toBe(true);
  });

  it("should compute canViewOthersLocations as false when sharing disabled", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockResolvedValueOnce("false");

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("granted");
    });

    expect(result.current.canViewOthersLocations).toBe(false);
  });

  it("should compute canViewOthersLocations as false when permission denied", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockResolvedValueOnce("true");

    mockGetForegroundPermissions.mockResolvedValueOnce({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      expires: "never",
      canAskAgain: true,
    });

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("denied");
    });

    expect(result.current.canViewOthersLocations).toBe(false);
  });

  it("should compute canShareOwnLocation correctly", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockResolvedValueOnce("true");

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe("granted");
    });

    expect(result.current.canShareOwnLocation).toBe(true);
  });

  it("should include isLoading from settings query", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useLocationPermissions());

    expect(result.current.isLoading).toBe(true);
  });

  it("should not update local state before server confirmation when toggling", async () => {
    mockMutateAsync.mockImplementation(
      () =>
        new Promise<unknown>(() => {
          /* never resolves */
        }),
    );

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialState = result.current.isLocationSharingEnabled;

    // Fire toggle without awaiting - it should hang since mock never resolves
    act(() => {
      result.current.toggleLocationSharing(true);
    });

    // State should not have changed while waiting for server
    expect(result.current.isLocationSharingEnabled).toBe(initialState);
  });
});
