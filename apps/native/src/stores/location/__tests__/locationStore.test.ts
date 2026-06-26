import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Alert, Linking } from "react-native";
import * as backgroundLocation from "~/services/location/backgroundLocation";
import {
  locationStore,
  type ServerSharingUpdater,
  setLocationServerUpdater,
} from "../locationStore";

jest.mock("~/services/location/backgroundLocation");
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetForegroundPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockRequestForegroundPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockGetBackgroundPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockRequestBackgroundPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: () => mockGetForegroundPermissionsAsync(),
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissionsAsync(),
  getBackgroundPermissionsAsync: () => mockGetBackgroundPermissionsAsync(),
  requestBackgroundPermissionsAsync: () => mockRequestBackgroundPermissionsAsync(),
  PermissionStatus: {
    DENIED: "denied",
    GRANTED: "granted",
    UNDETERMINED: "undetermined",
  },
}));

describe("locationStore", () => {
  let mockAlert: ReturnType<typeof jest.spyOn>;
  let mockOpenSettings: ReturnType<typeof jest.spyOn>;
  let mockGetBackgroundLocationPreference: jest.Mock<() => Promise<boolean>>;
  let mockSetBackgroundLocationPreference: jest.Mock<(enabled: boolean) => Promise<void>>;
  let mockHasBackgroundLocationTaskStarted: jest.Mock<() => Promise<boolean>>;
  let mockStartBackgroundLocationTask: jest.Mock<() => Promise<void>>;
  let mockStopBackgroundLocationTask: jest.Mock<() => Promise<void>>;

  beforeEach(() => {
    jest.clearAllMocks();

    locationStore.setState({
      isLocationSharingEnabled: false,
      permissionStatus: "undetermined",
      backgroundPermissionStatus: "undetermined",
      isBackgroundLocationEnabled: false,
      isBackgroundLocationActive: false,
      isLoading: true,
      isUpdatingSharing: false,
      isUpdatingBackgroundLocation: false,
    });
    setLocationServerUpdater(null);

    mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    mockOpenSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);

    mockGetBackgroundLocationPreference =
      backgroundLocation.getBackgroundLocationPreference as jest.Mock<() => Promise<boolean>>;
    mockSetBackgroundLocationPreference =
      backgroundLocation.setBackgroundLocationPreference as jest.Mock<
        (enabled: boolean) => Promise<void>
      >;
    mockHasBackgroundLocationTaskStarted =
      backgroundLocation.hasBackgroundLocationTaskStarted as jest.Mock<() => Promise<boolean>>;
    mockStartBackgroundLocationTask = backgroundLocation.startBackgroundLocationTask as jest.Mock<
      () => Promise<void>
    >;
    mockStopBackgroundLocationTask = backgroundLocation.stopBackgroundLocationTask as jest.Mock<
      () => Promise<void>
    >;

    mockGetBackgroundLocationPreference.mockResolvedValue(false);
    mockSetBackgroundLocationPreference.mockResolvedValue(undefined);
    mockHasBackgroundLocationTaskStarted.mockResolvedValue(false);
    mockStartBackgroundLocationTask.mockResolvedValue(undefined);
    mockStopBackgroundLocationTask.mockResolvedValue(undefined);

    mockGetForegroundPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetBackgroundPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestBackgroundPermissionsAsync.mockResolvedValue({ status: "granted" });
  });

  describe("initial state", () => {
    it("should have isLocationSharingEnabled as false", () => {
      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(false);
    });

    it("should have permissionStatus as undetermined", () => {
      const state = locationStore.getState();
      expect(state.permissionStatus).toBe("undetermined");
    });

    it("should have backgroundPermissionStatus as undetermined", () => {
      const state = locationStore.getState();
      expect(state.backgroundPermissionStatus).toBe("undetermined");
    });

    it("should have isBackgroundLocationEnabled as false", () => {
      const state = locationStore.getState();
      expect(state.isBackgroundLocationEnabled).toBe(false);
    });

    it("should have isBackgroundLocationActive as false", () => {
      const state = locationStore.getState();
      expect(state.isBackgroundLocationActive).toBe(false);
    });

    it("should have isLoading as true", () => {
      const state = locationStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it("should have isUpdatingSharing as false", () => {
      const state = locationStore.getState();
      expect(state.isUpdatingSharing).toBe(false);
    });

    it("should have isUpdatingBackgroundLocation as false", () => {
      const state = locationStore.getState();
      expect(state.isUpdatingBackgroundLocation).toBe(false);
    });
  });

  describe("hydrate", () => {
    it("should hydrate from local storage", async () => {
      const mockGetItem = AsyncStorage.getItem as jest.Mock<() => Promise<string | null>>;
      mockGetItem.mockResolvedValueOnce("true");
      mockGetBackgroundLocationPreference.mockResolvedValueOnce(true);
      mockHasBackgroundLocationTaskStarted.mockResolvedValueOnce(true);
      mockGetForegroundPermissionsAsync.mockResolvedValueOnce({ status: "granted" });
      mockGetBackgroundPermissionsAsync.mockResolvedValueOnce({ status: "granted" });

      const { hydrate } = locationStore.getState();
      await hydrate();

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("should handle server override of sharing setting", async () => {
      mockGetBackgroundLocationPreference.mockResolvedValueOnce(false);
      mockHasBackgroundLocationTaskStarted.mockResolvedValueOnce(false);
      mockGetForegroundPermissionsAsync.mockResolvedValueOnce({ status: "undetermined" });
      mockGetBackgroundPermissionsAsync.mockResolvedValueOnce({ status: "undetermined" });

      const { hydrate } = locationStore.getState();
      await hydrate(false);

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(false);
    });

    it("should handle hydrate errors gracefully", async () => {
      mockGetBackgroundLocationPreference.mockRejectedValueOnce(new Error("Storage error"));

      const { hydrate } = locationStore.getState();
      await hydrate();

      const state = locationStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("requestLocationPermissions", () => {
    it("should request foreground permissions", async () => {
      const { requestLocationPermissions } = locationStore.getState();
      const result = await requestLocationPermissions();

      expect(result).toBe("granted");
      expect(locationStore.getState().permissionStatus).toBe("granted");
    });

    it("should handle permission denied", async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: Location.PermissionStatus.DENIED,
      });

      const { requestLocationPermissions } = locationStore.getState();
      const result = await requestLocationPermissions();

      expect(result).toBe("denied");
      expect(locationStore.getState().permissionStatus).toBe("denied");
    });

    it("should handle permission errors", async () => {
      mockRequestForegroundPermissionsAsync.mockRejectedValueOnce(new Error("Permission error"));

      const { requestLocationPermissions } = locationStore.getState();
      const result = await requestLocationPermissions();

      expect(result).toBe("denied");
      expect(locationStore.getState().permissionStatus).toBe("denied");
    });
  });

  describe("toggleLocationSharing", () => {
    it("should toggle location sharing on", async () => {
      const mockSetItem = AsyncStorage.setItem;

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(true);
      expect(mockSetItem).toHaveBeenCalledWith("location_sharing_enabled", "true");
    });

    it("should toggle location sharing off", async () => {
      const mockSetItem = AsyncStorage.setItem;

      locationStore.setState({ isLocationSharingEnabled: true });

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(false);
      expect(mockSetItem).toHaveBeenCalledWith("location_sharing_enabled", "false");
    });

    it("should call server updater when available", async () => {
      const mockUpdater = jest.fn<ServerSharingUpdater>();
      mockUpdater.mockResolvedValue(undefined);
      setLocationServerUpdater(mockUpdater);

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(mockUpdater).toHaveBeenCalledWith({
        isSharingLocation: true,
        userIdsToShareWith: [],
      });
    });

    it("should set isUpdatingSharing during toggle", async () => {
      const { toggleLocationSharing } = locationStore.getState();

      const promise = toggleLocationSharing();
      expect(locationStore.getState().isUpdatingSharing).toBe(true);

      await promise;
      expect(locationStore.getState().isUpdatingSharing).toBe(false);
    });

    it("should request permissions when enabling and undetermined", async () => {
      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it("should stop background task when disabling", async () => {
      locationStore.setState({
        isLocationSharingEnabled: true,
        isBackgroundLocationActive: true,
      });

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(mockStopBackgroundLocationTask).toHaveBeenCalled();
      expect(locationStore.getState().isBackgroundLocationActive).toBe(false);
    });

    it("should handle server errors", async () => {
      const mockUpdater: ServerSharingUpdater = () => Promise.reject(new Error("Server error"));
      setLocationServerUpdater(mockUpdater);

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(mockAlert).toHaveBeenCalled();
    });
  });

  describe("toggleBackgroundLocationUpdates", () => {
    it("should enable background location when all conditions met", async () => {
      locationStore.setState({
        isLocationSharingEnabled: true,
        permissionStatus: "granted",
        backgroundPermissionStatus: "granted",
      });

      const { toggleBackgroundLocationUpdates } = locationStore.getState();
      await toggleBackgroundLocationUpdates();

      expect(mockSetBackgroundLocationPreference).toHaveBeenCalledWith(true);
      expect(mockStartBackgroundLocationTask).toHaveBeenCalled();

      const state = locationStore.getState();
      expect(state.isBackgroundLocationEnabled).toBe(true);
      expect(state.isBackgroundLocationActive).toBe(true);
    });

    it("should disable background location", async () => {
      locationStore.setState({
        isLocationSharingEnabled: true,
        isBackgroundLocationEnabled: true,
        isBackgroundLocationActive: true,
      });

      const { toggleBackgroundLocationUpdates } = locationStore.getState();
      await toggleBackgroundLocationUpdates();

      expect(mockSetBackgroundLocationPreference).toHaveBeenCalledWith(false);
      expect(mockStopBackgroundLocationTask).toHaveBeenCalled();

      const state = locationStore.getState();
      expect(state.isBackgroundLocationEnabled).toBe(false);
      expect(state.isBackgroundLocationActive).toBe(false);
    });

    it("should show alert when location sharing is disabled", async () => {
      const { toggleBackgroundLocationUpdates } = locationStore.getState();
      await toggleBackgroundLocationUpdates();

      expect(mockAlert).toHaveBeenCalledWith("Enable Location Sharing", expect.any(String));
    });

    it("should request permissions when enabling", async () => {
      locationStore.setState({
        isLocationSharingEnabled: true,
        permissionStatus: "undetermined",
      });

      mockGetForegroundPermissionsAsync.mockResolvedValueOnce({
        status: Location.PermissionStatus.UNDETERMINED,
      });
      mockRequestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: Location.PermissionStatus.GRANTED,
      });
      mockGetBackgroundPermissionsAsync.mockResolvedValueOnce({
        status: Location.PermissionStatus.GRANTED,
      });

      const { toggleBackgroundLocationUpdates } = locationStore.getState();
      await toggleBackgroundLocationUpdates();

      expect(mockRequestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    it("should set isUpdatingBackgroundLocation during toggle", async () => {
      locationStore.setState({
        isLocationSharingEnabled: true,
        permissionStatus: "granted",
        backgroundPermissionStatus: "granted",
      });

      const { toggleBackgroundLocationUpdates } = locationStore.getState();

      const promise = toggleBackgroundLocationUpdates();
      expect(locationStore.getState().isUpdatingBackgroundLocation).toBe(true);

      await promise;
      expect(locationStore.getState().isUpdatingBackgroundLocation).toBe(false);
    });
  });

  describe("openSystemLocationSettings", () => {
    it("should open system settings", async () => {
      const { openSystemLocationSettings } = locationStore.getState();
      await openSystemLocationSettings();

      expect(mockOpenSettings).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      mockOpenSettings.mockRejectedValueOnce(new Error("Cannot open settings"));

      const { openSystemLocationSettings } = locationStore.getState();
      await openSystemLocationSettings();

      expect(mockAlert).toHaveBeenCalledWith("Settings Unavailable", expect.any(String));
    });
  });

  describe("syncBackgroundTask", () => {
    it("should start background task when conditions are met", async () => {
      locationStore.setState({
        isBackgroundLocationEnabled: true,
        isLocationSharingEnabled: true,
        permissionStatus: "granted",
        backgroundPermissionStatus: "granted",
      });

      const { syncBackgroundTask } = locationStore.getState();
      await syncBackgroundTask();

      expect(mockStartBackgroundLocationTask).toHaveBeenCalled();
      expect(locationStore.getState().isBackgroundLocationActive).toBe(true);
    });

    it("should stop background task when sharing is disabled", async () => {
      locationStore.setState({
        isBackgroundLocationEnabled: true,
        isLocationSharingEnabled: false,
        isBackgroundLocationActive: true,
      });

      const { syncBackgroundTask } = locationStore.getState();
      await syncBackgroundTask();

      expect(mockStopBackgroundLocationTask).toHaveBeenCalled();
      expect(locationStore.getState().isBackgroundLocationActive).toBe(false);
    });

    it("should stop background task when permissions not granted", async () => {
      locationStore.setState({
        isBackgroundLocationEnabled: true,
        isLocationSharingEnabled: true,
        permissionStatus: "denied",
        isBackgroundLocationActive: true,
      });

      const { syncBackgroundTask } = locationStore.getState();
      await syncBackgroundTask();

      expect(mockStopBackgroundLocationTask).toHaveBeenCalled();
      expect(locationStore.getState().isBackgroundLocationActive).toBe(false);
    });

    it("should handle sync errors gracefully", async () => {
      locationStore.setState({
        isBackgroundLocationEnabled: true,
        isLocationSharingEnabled: true,
        permissionStatus: "granted",
        backgroundPermissionStatus: "granted",
      });

      mockStartBackgroundLocationTask.mockRejectedValueOnce(new Error("Task error"));

      const { syncBackgroundTask } = locationStore.getState();
      await syncBackgroundTask();

      expect(locationStore.getState().isBackgroundLocationActive).toBe(false);
    });
  });

  describe("setLocationServerUpdater", () => {
    it("should set the server updater function", async () => {
      const mockUpdater = jest.fn<ServerSharingUpdater>();
      mockUpdater.mockResolvedValue(undefined);
      setLocationServerUpdater(mockUpdater);

      locationStore.setState({ isLocationSharingEnabled: false });

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(mockUpdater).toHaveBeenCalled();
    });

    it("should handle null updater", async () => {
      setLocationServerUpdater(null);

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(locationStore.getState().isLocationSharingEnabled).toBe(true);
    });
  });
});
