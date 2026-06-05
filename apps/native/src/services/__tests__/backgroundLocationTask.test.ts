import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { LocationObject } from "expo-location";

// Mock function types
const mockDefineTask =
  jest.fn<
    (
      name: string,
      handler: (props: {
        data?: { locations?: LocationObject[] };
        error?: Error | null;
      }) => Promise<void>,
    ) => void
  >();

jest.mock("expo-task-manager", () => ({
  defineTask: (
    ...args: [
      string,
      (props: { data?: { locations?: LocationObject[] }; error?: Error | null }) => Promise<void>,
    ]
  ) => mockDefineTask(...args),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  getORPCClient: jest.fn(),
  orpc: {
    location: {
      updateLocation: {
        mutate: jest.fn(),
      },
    },
  },
}));

import {
  type BackgroundTaskDeps,
  initBackgroundLocationTask,
} from "~/services/background/backgroundLocationTask";

describe("Background Location Task", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Task Definition", () => {
    it("should define the background location task when init is called", () => {
      jest.resetModules();
      mockDefineTask.mockClear();

      const mockDeps: BackgroundTaskDeps = {
        shouldSend: jest.fn(() => Promise.resolve(true)),
        sendUpdate: jest.fn(() => Promise.resolve()),
        getLastSentLocation: jest.fn(() => Promise.resolve(null)),
        setLastSentLocation: jest.fn(() => Promise.resolve()),
      };

      initBackgroundLocationTask(mockDeps);

      expect(mockDefineTask).toHaveBeenCalledWith(
        "integral.background-location-updates",
        expect.any(Function),
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

      const mockDeps: BackgroundTaskDeps = {
        shouldSend: jest.fn(() => Promise.resolve(true)),
        sendUpdate: jest.fn(() => Promise.resolve()),
        getLastSentLocation: jest.fn(() => Promise.resolve(null)),
        setLastSentLocation: jest.fn(() => Promise.resolve()),
      };

      initBackgroundLocationTask(mockDeps);

      const calls = mockDefineTask.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      taskHandler = calls[0]![1]!;
    });

    it("should handle task error", async () => {
      await taskHandler({
        data: undefined,
        error: new Error("Task failed"),
      });
    });

    it("should skip when location sharing is disabled", async () => {
      jest.resetModules();
      mockDefineTask.mockClear();

      const mockDeps: BackgroundTaskDeps = {
        shouldSend: jest.fn(() => Promise.resolve(false)),
        sendUpdate: jest.fn(() => Promise.resolve()),
        getLastSentLocation: jest.fn(() => Promise.resolve(null)),
        setLastSentLocation: jest.fn(() => Promise.resolve()),
      };

      initBackgroundLocationTask(mockDeps);

      const calls = mockDefineTask.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const handler = calls[0]![1]!;

      await handler({
        data: {
          locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[],
        },
        error: null,
      });

      expect(mockDeps.sendUpdate).not.toHaveBeenCalled();
    });
  });
});
