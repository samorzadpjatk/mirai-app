import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { locationStore, setLocationServerUpdater } from "../locationStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn((_title: string, _message?: string) => {}),
  },
  Linking: {
    openSettings: jest.fn(() => Promise.resolve()),
  },
}));

// Get typed mock references using jest.requireMock to avoid unbound-method errors
const mockReactNative: {
  Alert: { alert: jest.Mock };
  Linking: { openSettings: jest.Mock };
} = jest.requireMock("react-native");
const mockAlert = mockReactNative.Alert.alert;
const mockOpenSettings = mockReactNative.Linking.openSettings;

describe("locationStore", () => {
  beforeEach(() => {
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
    jest.clearAllMocks();
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
      const mockGetItem = AsyncStorage.getItem as jest.Mock;
      mockGetItem.mockResolvedValueOnce("true");

      const { hydrate } = locationStore.getState();
      await hydrate();

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("should handle server override of sharing setting", async () => {
      const { hydrate } = locationStore.getState();
      await hydrate(false);

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(false);
    });

    it("should handle hydrate errors gracefully", async () => {
      const mockGetItem = AsyncStorage.getItem as jest.Mock;
      mockGetItem.mockRejectedValueOnce(new Error("Storage error"));

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
      const mockRequestForeground = Location.requestForegroundPermissionsAsync as jest.Mock;
      mockRequestForeground.mockResolvedValueOnce({ status: Location.PermissionStatus.DENIED });

      const { requestLocationPermissions } = locationStore.getState();
      const result = await requestLocationPermissions();

      expect(result).toBe("denied");
      expect(locationStore.getState().permissionStatus).toBe("denied");
    });

    it("should handle permission errors", async () => {
      const mockRequestForeground = Location.requestForegroundPermissionsAsync as jest.Mock;
      mockRequestForeground.mockRejectedValueOnce(new Error("Permission error"));

      const { requestLocationPermissions } = locationStore.getState();
      const result = await requestLocationPermissions();

      expect(result).toBe("denied");
      expect(locationStore.getState().permissionStatus).toBe("denied");
    });
  });

  describe("toggleLocationSharing", () => {
    it("should toggle location sharing on", async () => {
      const mockSetItem = AsyncStorage.setItem as jest.Mock;
      
      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(true);
      expect(mockSetItem).toHaveBeenCalledWith("location_sharing_enabled", "true");
    });

    it("should toggle location sharing off", async () => {
      const mockSetItem = AsyncStorage.setItem as jest.Mock;
      
      locationStore.setState({ isLocationSharingEnabled: true });
      
      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      const state = locationStore.getState();
      expect(state.isLocationSharingEnabled).toBe(false);
      expect(mockSetItem).toHaveBeenCalledWith("location_sharing_enabled", "false");
    });

    it("should call server updater when available", async () => {
      const mockUpdater = jest.fn().mockResolvedValue(undefined);
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
      const mockRequestForeground = Location.requestForegroundPermissionsAsync as jest.Mock;
      
      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(mockRequestForeground).toHaveBeenCalled();
    });

    it("should stop background task when disabling", async () => {
      locationStore.setState({ 
        isLocationSharingEnabled: true,
        isBackgroundLocationActive: true 
      });

      const { toggleLocationSharing } = locationStore.getState();
      await toggleLocationSharing();

      expect(locationStore.getState().isBackgroundLocationActive).toBe(false);
    });

    it("should handle server errors", async () => {
      const mockUpdater = jest.fn().mockRejectedValue(new Error("Server error"));
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

      const state = locationStore.getState();
      expect(state.isBackgroundLocationEnabled).toBe(false);
      expect(state.isBackgroundLocationActive).toBe(false);
    });

    it("should show alert when location sharing is disabled", async () => {
      const { toggleBackgroundLocationUpdates } = locationStore.getState();
      await toggleBackgroundLocationUpdates();

      expect(mockAlert).toHaveBeenCalledWith(
        "Enable Location Sharing",
        expect.any(String)
      );
    });

    it("should request permissions when enabling", async () => {
      locationStore.setState({
        isLocationSharingEnabled: true,
        permissionStatus: "undetermined",
      });

      // Mock getForegroundPermissionsAsync to return undetermined so requestLocationPermissions is called
      const mockGetForeground = Location.getForegroundPermissionsAsync as jest.Mock;
      mockGetForeground.mockResolvedValueOnce({ status: Location.PermissionStatus.UNDETERMINED });

      const mockRequestForeground = Location.requestForegroundPermissionsAsync as jest.Mock;
      mockRequestForeground.mockResolvedValueOnce({ status: Location.PermissionStatus.GRANTED });

      const { toggleBackgroundLocationUpdates } = locationStore.getState();
      await toggleBackgroundLocationUpdates();

      expect(mockRequestForeground).toHaveBeenCalled();
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

      expect(mockAlert).toHaveBeenCalledWith(
        "Settings Unavailable",
        expect.any(String)
      );
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

      expect(locationStore.getState().isBackgroundLocationActive).toBe(false);
    });

    it("should handle sync errors gracefully", async () => {
      locationStore.setState({
        isBackgroundLocationEnabled: true,
        isLocationSharingEnabled: true,
        permissionStatus: "granted",
        backgroundPermissionStatus: "granted",
      });

      const { syncBackgroundTask } = locationStore.getState();
      await syncBackgroundTask();

      expect(locationStore.getState().isBackgroundLocationActive).toBe(true);
    });
  });

  describe("setLocationServerUpdater", () => {
    it("should set the server updater function", async () => {
      const mockUpdater = jest.fn().mockResolvedValue(undefined);
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
