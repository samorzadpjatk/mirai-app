import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { LocationObject } from "expo-location";

// Mock function types
const mockDefineTask = jest.fn<(name: string, handler: (props: {
  data?: { locations?: LocationObject[] };
  error?: Error | null;
}) => Promise<void>) => void>();
const mockGetItem = jest.fn<(key: string) => Promise<string | null>>();
const mockGetSession = jest.fn<() => Promise<{ data: { session: { access_token: string } | null }; error: Error | null }>>();
const mockMutate = jest.fn<(input: { tripId: string; latitude: number; longitude: number }) => Promise<{ success: boolean }>>();
const mockCleanup = jest.fn<() => Promise<void>>();
const mockGetTRPCClient = jest.fn<(url: string, key: string, wsUrl: string) => { client: { location: { updateLocation: { mutate: typeof mockMutate } } }; cleanup: typeof mockCleanup }>();

// Require helper for the module under test (using require for Jest compatibility)
function loadBackgroundLocationTask(): unknown {
  return require("~/services/background/backgroundLocationTask");
}

jest.mock("expo-task-manager", () => ({
  defineTask: (...args: [string, (props: {
    data?: { locations?: LocationObject[] };
    error?: Error | null;
  }) => Promise<void>]) => mockDefineTask(...args),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args: [string]) => mockGetItem(...args),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("@mirai-app/supabase", () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: (...args: []) => mockGetSession(...args),
    },
  })),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  getTRPCClient: (...args: [string, string, string]) => mockGetTRPCClient(...args),
  orpc: {
    location: {
      updateLocation: {
        mutate: mockMutate,
      },
    },
  },
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
    it("should define the background location task on module import", () => {
      jest.resetModules();
      mockDefineTask.mockClear();

      loadBackgroundLocationTask();

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

    beforeEach(() => {
      jest.resetModules();
      mockDefineTask.mockClear();

      loadBackgroundLocationTask();

      const calls = mockDefineTask.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      taskHandler = calls[0]![1]!;
    });

    it("should handle task error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });

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
        if (key === "selected_trip_id") return Promise.resolve("trip-123");
        return Promise.resolve(null);
      });

      await taskHandler({
        data: { locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[] },
        error: null,
      });

      expect(mockGetSession).not.toHaveBeenCalled();
    });
  });
});
