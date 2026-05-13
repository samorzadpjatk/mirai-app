import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock expo-location
const mockHasStartedLocationUpdatesAsync = jest.fn<(taskName: string) => Promise<boolean>>();
const mockStartLocationUpdatesAsync =
  jest.fn<(taskName: string, options: Record<string, unknown>) => Promise<void>>();
const mockStopLocationUpdatesAsync = jest.fn<(taskName: string) => Promise<void>>();

jest.mock("expo-location", () => ({
  Accuracy: {
    Balanced: 2,
  },
  ActivityType: {
    Other: 0,
  },
  hasStartedLocationUpdatesAsync: (...args: [string]) =>
    mockHasStartedLocationUpdatesAsync(...args),
  startLocationUpdatesAsync: (...args: [string, Record<string, unknown>]) =>
    mockStartLocationUpdatesAsync(...args),
  stopLocationUpdatesAsync: (...args: [string]) => mockStopLocationUpdatesAsync(...args),
}));

// Mock AsyncStorage
const mockGetItem = jest.fn<(key: string) => Promise<string | null>>();
const mockSetItem = jest.fn<(key: string, value: string) => Promise<void>>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args: [string]) => mockGetItem(...args),
  setItem: (...args: [string, string]) => mockSetItem(...args),
}));

import {
  getBackgroundLocationPreference,
  setBackgroundLocationPreference,
  hasBackgroundLocationTaskStarted,
  startBackgroundLocationTask,
  stopBackgroundLocationTask,
} from "~/services/location/backgroundLocation";

describe("Background Location Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBackgroundLocationPreference", () => {
    it("should return true when preference is enabled", async () => {
      mockGetItem.mockResolvedValue("true");

      const result = await getBackgroundLocationPreference();

      expect(result).toBe(true);
      expect(mockGetItem).toHaveBeenCalledWith("background_location_updates_enabled");
    });

    it("should return false when preference is disabled", async () => {
      mockGetItem.mockResolvedValue("false");

      const result = await getBackgroundLocationPreference();

      expect(result).toBe(false);
    });

    it("should return false when preference is not set", async () => {
      mockGetItem.mockResolvedValue(null);

      const result = await getBackgroundLocationPreference();

      expect(result).toBe(false);
    });

    it("should return false on error and log warning", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const error = new Error("Storage error");
      mockGetItem.mockRejectedValue(error);

      const result = await getBackgroundLocationPreference();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to read background location preference:",
        error,
      );
      consoleSpy.mockRestore();
    });
  });

  describe("setBackgroundLocationPreference", () => {
    it("should set preference to true", async () => {
      await setBackgroundLocationPreference(true);

      expect(mockSetItem).toHaveBeenCalledWith("background_location_updates_enabled", "true");
    });

    it("should set preference to false", async () => {
      await setBackgroundLocationPreference(false);

      expect(mockSetItem).toHaveBeenCalledWith("background_location_updates_enabled", "false");
    });
  });

  describe("hasBackgroundLocationTaskStarted", () => {
    it("should return true when task has started", async () => {
      mockHasStartedLocationUpdatesAsync.mockResolvedValue(true);

      const result = await hasBackgroundLocationTaskStarted();

      expect(result).toBe(true);
      expect(mockHasStartedLocationUpdatesAsync).toHaveBeenCalledWith(
        "integral.background-location-updates",
      );
    });

    it("should return false when task has not started", async () => {
      mockHasStartedLocationUpdatesAsync.mockResolvedValue(false);

      const result = await hasBackgroundLocationTaskStarted();

      expect(result).toBe(false);
    });

    it("should return false on error and log warning", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const error = new Error("Location error");
      mockHasStartedLocationUpdatesAsync.mockRejectedValue(error);

      const result = await hasBackgroundLocationTaskStarted();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to check background location task state:",
        error,
      );
      consoleSpy.mockRestore();
    });
  });

  describe("startBackgroundLocationTask", () => {
    it("should start task when not already started", async () => {
      mockHasStartedLocationUpdatesAsync.mockResolvedValue(false);
      mockStartLocationUpdatesAsync.mockResolvedValue(undefined);

      await startBackgroundLocationTask();

      expect(mockHasStartedLocationUpdatesAsync).toHaveBeenCalled();
      expect(mockStartLocationUpdatesAsync).toHaveBeenCalledWith(
        "integral.background-location-updates",
        expect.objectContaining({
          accuracy: 2,
          distanceInterval: 25,
          deferredUpdatesInterval: 60000,
          deferredUpdatesDistance: 25,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          activityType: 0,
          foregroundService: expect.objectContaining({
            notificationTitle: "MIRAI is sharing your location",
            notificationBody: "Background location updates are active.",
            notificationColor: "#00ced1",
            killServiceOnDestroy: false,
          }),
        }),
      );
    });

    it("should not start task when already started", async () => {
      mockHasStartedLocationUpdatesAsync.mockResolvedValue(true);

      await startBackgroundLocationTask();

      expect(mockHasStartedLocationUpdatesAsync).toHaveBeenCalled();
      expect(mockStartLocationUpdatesAsync).not.toHaveBeenCalled();
    });
  });

  describe("stopBackgroundLocationTask", () => {
    it("should stop task when started", async () => {
      mockHasStartedLocationUpdatesAsync.mockResolvedValue(true);
      mockStopLocationUpdatesAsync.mockResolvedValue(undefined);

      await stopBackgroundLocationTask();

      expect(mockHasStartedLocationUpdatesAsync).toHaveBeenCalled();
      expect(mockStopLocationUpdatesAsync).toHaveBeenCalledWith(
        "integral.background-location-updates",
      );
    });

    it("should not stop task when not started", async () => {
      mockHasStartedLocationUpdatesAsync.mockResolvedValue(false);

      await stopBackgroundLocationTask();

      expect(mockHasStartedLocationUpdatesAsync).toHaveBeenCalled();
      expect(mockStopLocationUpdatesAsync).not.toHaveBeenCalled();
    });
  });
});
