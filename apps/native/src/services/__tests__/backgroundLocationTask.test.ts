import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { LocationObject } from "expo-location";

const mockDefineTask = jest.fn();
const mockGetItem = jest.fn();
const mockGetSession = jest.fn();
const mockMutate = jest.fn();
const mockCleanup = jest.fn();
const mockGetTRPCClient = jest.fn();

jest.mock("expo-task-manager", () => ({
  defineTask: (...args: unknown[]) => mockDefineTask(...args),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("@mirai-app/supabase", () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  })),
}));

jest.mock("@mirai-app/trpc/client", () => ({
  getTRPCClient: (...args: unknown[]) => mockGetTRPCClient(...args),
}));

jest.mock("~/services/storage/storage", () => ({
  authStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("~/config/runtimeEnv", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-key",
  TRPC_HTTP_URL: "http://localhost:2022",
  TRPC_WS_URL: "ws://localhost:2022",
}));

describe("Background Location Task", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCleanup.mockResolvedValue(undefined);
    mockGetTRPCClient.mockReturnValue({
      client: {
        location: {
          updateLocation: {
            mutate: mockMutate,
          },
        },
      },
      cleanup: mockCleanup,
    });
  });

  describe("Task Definition", () => {
    it("should define the background location task on module import", async () => {
      jest.resetModules();
      mockDefineTask.mockClear();

      require("~/services/background/backgroundLocationTask");

      expect(mockDefineTask).toHaveBeenCalledWith(
        "integral.background-location-updates",
        expect.any(Function)
      );
    });
  });

  describe("Task Handler", () => {
    let taskHandler: (props: {
      data?: { locations?: LocationObject[] };
      error?: Error | null;
    }) => Promise<void>;

    beforeEach(async () => {
      jest.resetModules();
      mockDefineTask.mockClear();

      require("~/services/background/backgroundLocationTask");

      const calls = mockDefineTask.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      taskHandler = calls[0][1];
    });

    it("should handle task error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await taskHandler({
        data: undefined,
        error: new Error("Task failed"),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[BackgroundLocationTask] Task failed:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should skip when location sharing is disabled", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("false");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });

      await taskHandler({
        data: { locations: [createMockLocation()] },
        error: null,
      });

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should skip when background location is disabled", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("false");
        return Promise.resolve(null);
      });

      await taskHandler({
        data: { locations: [createMockLocation()] },
        error: null,
      });

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should skip when no locations provided", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });

      await taskHandler({
        data: { locations: [] },
        error: null,
      });

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should skip when data is undefined", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });

      await taskHandler({
        data: undefined,
        error: null,
      });

      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should skip when no access token available", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      await taskHandler({
        data: { locations: [createMockLocation()] },
        error: null,
      });

      expect(mockGetTRPCClient).not.toHaveBeenCalled();
    });

    it("should handle session error gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session error"),
      });

      await taskHandler({
        data: { locations: [createMockLocation()] },
        error: null,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[BackgroundLocationTask] Failed to load session:",
        expect.any(Error)
      );
      expect(mockGetTRPCClient).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should skip when latitude is invalid", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });

      const location = createMockLocation();
      location.coords.latitude = NaN;

      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[BackgroundLocationTask] Skipping update due to invalid coordinates.",
        expect.any(Object)
      );
      expect(mockGetTRPCClient).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should skip when longitude is invalid", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });

      const location = createMockLocation();
      location.coords.longitude = Infinity;

      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[BackgroundLocationTask] Skipping update due to invalid coordinates.",
        expect.any(Object)
      );
      expect(mockGetTRPCClient).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should send location update with valid coordinates", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockResolvedValue(undefined);

      const location = createMockLocation();
      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(mockGetTRPCClient).toHaveBeenCalledWith(
        "http://localhost:2022",
        "ws://localhost:2022",
        "test-token"
      );
      expect(mockMutate).toHaveBeenCalledWith({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: 5,
        altitude: 100,
        altitudeAccuracy: 1,
        heading: 90,
        speed: 10,
      });
      expect(mockCleanup).toHaveBeenCalled();
    });

    it("should handle null optional values", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockResolvedValue(undefined);

      const location = createMockLocation();
      location.coords.accuracy = null;
      location.coords.altitude = null;
      location.coords.altitudeAccuracy = null;
      location.coords.heading = null;
      location.coords.speed = null;

      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(mockMutate).toHaveBeenCalledWith({
        latitude: 52.2297,
        longitude: 21.0122,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      });
    });

    it("should handle negative accuracy as null", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockResolvedValue(undefined);

      const location = createMockLocation();
      location.coords.accuracy = -1;
      location.coords.altitudeAccuracy = -5;
      location.coords.speed = -10;

      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: null,
          altitudeAccuracy: null,
          speed: null,
        })
      );
    });

    it("should handle heading out of range as null", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockResolvedValue(undefined);

      const location = createMockLocation();
      location.coords.heading = 400;

      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: null,
        })
      );
    });

    it("should handle negative heading as null", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockResolvedValue(undefined);

      const location = createMockLocation();
      location.coords.heading = -10;

      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: null,
        })
      );
    });

    it("should handle valid heading at boundaries", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockResolvedValue(undefined);

      let location = createMockLocation();
      location.coords.heading = 0;
      await taskHandler({
        data: { locations: [location] },
        error: null,
      });
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: 0,
        })
      );

      mockMutate.mockClear();
      location = createMockLocation();
      location.coords.heading = 360;
      await taskHandler({
        data: { locations: [location] },
        error: null,
      });
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: 360,
        })
      );
    });

    it("should handle mutation error gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockRejectedValue(new Error("Network error"));

      const location = createMockLocation();
      await taskHandler({
        data: { locations: [location] },
        error: null,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[BackgroundLocationTask] Failed to send location update:",
        expect.any(Error)
      );
      expect(mockCleanup).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should use the latest location from array", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockResolvedValue(undefined);

      const location1 = createMockLocation();
      location1.coords.latitude = 51.0;
      location1.coords.longitude = 20.0;

      const location2 = createMockLocation();
      location2.coords.latitude = 52.0;
      location2.coords.longitude = 21.0;

      await taskHandler({
        data: { locations: [location1, location2] },
        error: null,
      });

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 52.0,
          longitude: 21.0,
        })
      );
    });

    it("should prevent concurrent sends with isSending flag", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 10);
          })
      );

      const location1 = createMockLocation();
      const promise1 = taskHandler({
        data: { locations: [location1] },
        error: null,
      });

      const location2 = createMockLocation();
      location2.coords.latitude = 53.0;
      await taskHandler({
        data: { locations: [location2] },
        error: null,
      });

      await promise1;

      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid successive location updates", async () => {
      mockGetItem.mockImplementation((key: string) => {
        if (key === "location_sharing_enabled") return Promise.resolve("true");
        if (key === "background_location_updates_enabled")
          return Promise.resolve("true");
        return Promise.resolve(null);
      });
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      });
      mockMutate.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 10);
          })
      );

      const locations = [
        createMockLocation(),
        createMockLocation(),
        createMockLocation(),
      ];
      locations[1].coords.latitude = 53.0;
      locations[2].coords.latitude = 54.0;

      await Promise.all([
        taskHandler({ data: { locations: [locations[0]] }, error: null }),
        taskHandler({ data: { locations: [locations[1]] }, error: null }),
        taskHandler({ data: { locations: [locations[2]] }, error: null }),
      ]);

      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Task Registration Error Handling", () => {
    it("should handle task already defined error gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Mock defineTask to throw "already defined" error
      mockDefineTask.mockImplementation(() => {
        const error = new Error("Task 'integral.background-location-updates' has already been defined");
        throw error;
      });

      // Reset modules to trigger re-registration
      jest.resetModules();

      // Require the module again - should not throw
      expect(() => {
        require("~/services/background/backgroundLocationTask");
      }).not.toThrow();

      // Should not log error for "already defined" case
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log error for non-already-defined registration errors", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Mock defineTask to throw a different error
      mockDefineTask.mockImplementation(() => {
        const error = new Error("Some other registration error");
        throw error;
      });

      // Reset modules to trigger re-registration
      jest.resetModules();

      // Require the module again - should not throw but should log
      expect(() => {
        require("~/services/background/backgroundLocationTask");
      }).not.toThrow();

      // Should log the error
      expect(consoleSpy).toHaveBeenCalledWith(
        "[BackgroundLocationTask] Failed to define task:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle non-Error objects in registration failure", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Mock defineTask to throw a non-Error object
      mockDefineTask.mockImplementation(() => {
        throw "String error";
      });

      // Reset modules to trigger re-registration
      jest.resetModules();

      // Require the module again - should not throw but should log
      expect(() => {
        require("~/services/background/backgroundLocationTask");
      }).not.toThrow();

      // Should log the error since it's not an Error instance with "already defined"
      expect(consoleSpy).toHaveBeenCalledWith(
        "[BackgroundLocationTask] Failed to define task:",
        "String error"
      );

      consoleSpy.mockRestore();
    });
  });
});

function createMockLocation(): LocationObject {
  return {
    coords: {
      latitude: 52.2297,
      longitude: 21.0122,
      altitude: 100,
      accuracy: 5,
      altitudeAccuracy: 1,
      heading: 90,
      speed: 10,
    },
    timestamp: Date.now(),
  };
}
