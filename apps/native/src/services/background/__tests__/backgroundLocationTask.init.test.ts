import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { LocationObject } from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as TaskManager from "expo-task-manager";

jest.mock("expo-task-manager", () => ({ defineTask: jest.fn() }));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { getORPCClient } from "@mirai-app/orpc/client";
import {
  initBackgroundLocationTask,
  createBackgroundTaskDeps,
  type BackgroundTaskDeps,
  type BackgroundTaskFactoryDeps,
} from "~/services/background/backgroundLocationTask";
import {
  BACKGROUND_LOCATION_TASK_NAME,
  LOCATION_SHARING_SETTINGS_KEY,
  BACKGROUND_LOCATION_SETTINGS_KEY,
} from "~/services/location/constants";

type LocationTaskHandler = (body: {
  data: { locations?: LocationObject[] };
  error: Error | null;
}) => Promise<void>;

describe("initBackgroundLocationTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls TaskManager.defineTask with the correct task name", () => {
    const mockDeps: BackgroundTaskDeps = {
      shouldSend: jest.fn(() => Promise.resolve(true)),
      sendUpdate: jest.fn(() => Promise.resolve()),
    };

    initBackgroundLocationTask(mockDeps);

    expect(TaskManager.defineTask).toHaveBeenCalledWith(
      BACKGROUND_LOCATION_TASK_NAME,
      expect.any(Function),
    );
  });

  it("handler calls deps.shouldSend() when executed", async () => {
    const mockDeps: BackgroundTaskDeps = {
      shouldSend: jest.fn(() => Promise.resolve(true)),
      sendUpdate: jest.fn(() => Promise.resolve()),
    };

    initBackgroundLocationTask(mockDeps);

    const handler = (TaskManager.defineTask as jest.Mock).mock.calls[0]![1] as LocationTaskHandler;

    await handler({
      data: { locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[] },
      error: null,
    });

    expect(mockDeps.shouldSend).toHaveBeenCalled();
  });

  it("handler calls deps.sendUpdate with the latest location when shouldSend returns true", async () => {
    const mockDeps: BackgroundTaskDeps = {
      shouldSend: jest.fn(() => Promise.resolve(true)),
      sendUpdate: jest.fn(() => Promise.resolve()),
    };

    initBackgroundLocationTask(mockDeps);

    const handler = (TaskManager.defineTask as jest.Mock).mock.calls[0]![1] as LocationTaskHandler;

    const locations = [
      { coords: { latitude: 52.0, longitude: 21.0 } },
      { coords: { latitude: 52.23, longitude: 21.01 } },
    ] as LocationObject[];

    await handler({
      data: { locations },
      error: null,
    });

    expect(mockDeps.sendUpdate).toHaveBeenCalledWith(locations[1]!);
  });

  it("handler does NOT call sendUpdate when shouldSend returns false", async () => {
    const mockDeps: BackgroundTaskDeps = {
      shouldSend: jest.fn(() => Promise.resolve(false)),
      sendUpdate: jest.fn(() => Promise.resolve()),
    };

    initBackgroundLocationTask(mockDeps);

    const handler = (TaskManager.defineTask as jest.Mock).mock.calls[0]![1] as LocationTaskHandler;

    await handler({
      data: { locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[] },
      error: null,
    });

    expect(mockDeps.sendUpdate).not.toHaveBeenCalled();
  });

  it("handler does NOT call sendUpdate when there are no locations", async () => {
    const mockDeps: BackgroundTaskDeps = {
      shouldSend: jest.fn(() => Promise.resolve(true)),
      sendUpdate: jest.fn(() => Promise.resolve()),
    };

    initBackgroundLocationTask(mockDeps);

    const handler = (TaskManager.defineTask as jest.Mock).mock.calls[0]![1] as LocationTaskHandler;

    await handler({
      data: { locations: [] },
      error: null,
    });

    expect(mockDeps.sendUpdate).not.toHaveBeenCalled();
  });

  it("handler handles errors gracefully", async () => {
    const mockDeps: BackgroundTaskDeps = {
      shouldSend: jest.fn(() => Promise.resolve(true)),
      sendUpdate: jest.fn(() => Promise.reject(new Error("Network error"))),
    };

    initBackgroundLocationTask(mockDeps);

    const handler = (TaskManager.defineTask as jest.Mock).mock.calls[0]![1] as LocationTaskHandler;

    await expect(
      handler({
        data: {
          locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[],
        },
        error: null,
      }),
    ).resolves.toBeUndefined();
  });
});

describe("createBackgroundTaskDeps", () => {
  const createMockFactoryDeps = () => {
    const mockUpdateLocation = jest.fn(() => Promise.resolve());

    return {
      supabaseClient: {
        auth: {
          getSession: jest.fn<BackgroundTaskFactoryDeps["supabaseClient"]["auth"]["getSession"]>(),
        },
      },
      getORPCClient: jest.fn<BackgroundTaskFactoryDeps["getORPCClient"]>(() => ({
        client: {
          location: {
            updateLocation: mockUpdateLocation,
          },
        },
        cleanup: jest.fn(() => Promise.resolve()),
      })),
      httpUrl: "http://localhost:2022",
      wsUrl: "ws://localhost:2022",
    };
  };

  it("sendUpdate calls supabaseClient.auth.getSession() to get access token", async () => {
    const factoryDeps = createMockFactoryDeps();
    factoryDeps.supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });

    const deps = createBackgroundTaskDeps(factoryDeps);

    const location = { coords: { latitude: 52.23, longitude: 21.01 } } as LocationObject;
    await deps.sendUpdate(location);

    expect(factoryDeps.supabaseClient.auth.getSession).toHaveBeenCalled();
  });

  it("sendUpdate calls getORPCClient(httpUrl, wsUrl, accessToken) with the correct args", async () => {
    const factoryDeps = createMockFactoryDeps();
    factoryDeps.supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });

    const deps = createBackgroundTaskDeps(factoryDeps);

    const location = { coords: { latitude: 52.23, longitude: 21.01 } } as LocationObject;
    await deps.sendUpdate(location);

    expect(factoryDeps.getORPCClient).toHaveBeenCalledWith(
      "http://localhost:2022",
      "ws://localhost:2022",
      "test-token",
    );
  });

  it("sendUpdate returns early (no orpc call) when getSession returns null", async () => {
    const factoryDeps = createMockFactoryDeps();
    factoryDeps.supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const deps = createBackgroundTaskDeps(factoryDeps);

    const location = { coords: { latitude: 52.23, longitude: 21.01 } } as LocationObject;
    await deps.sendUpdate(location);

    expect(factoryDeps.getORPCClient).not.toHaveBeenCalled();
  });

  it("sendUpdate returns early (no orpc call) when latitude is null", async () => {
    const factoryDeps = createMockFactoryDeps();
    factoryDeps.supabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });

    const deps = createBackgroundTaskDeps(factoryDeps);

    const location = {
      coords: {
        latitude: null as unknown as number,
        longitude: 21.01,
        altitude: null as unknown as number,
        accuracy: null as unknown as number,
        altitudeAccuracy: null as unknown as number,
        heading: null as unknown as number,
        speed: null as unknown as number,
      },
      timestamp: Date.now(),
    } as LocationObject;
    await deps.sendUpdate(location);

    expect(factoryDeps.getORPCClient).not.toHaveBeenCalled();
  });

  it("shouldSend returns true when both AsyncStorage items are 'true'", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === LOCATION_SHARING_SETTINGS_KEY) return Promise.resolve("true");
      if (key === BACKGROUND_LOCATION_SETTINGS_KEY) return Promise.resolve("true");
      return Promise.resolve(null);
    });

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.shouldSend();

    expect(result).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(LOCATION_SHARING_SETTINGS_KEY);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(BACKGROUND_LOCATION_SETTINGS_KEY);
  });

  it("shouldSend returns false when either AsyncStorage item is not 'true'", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === LOCATION_SHARING_SETTINGS_KEY) return Promise.resolve("true");
      if (key === BACKGROUND_LOCATION_SETTINGS_KEY) return Promise.resolve("false");
      return Promise.resolve(null);
    });

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.shouldSend();

    expect(result).toBe(false);
  });

  it("shouldSend returns false when sharingEnabled is not 'true'", async () => {
    const mockGetItem = jest.mocked(AsyncStorage.getItem);
    mockGetItem.mockImplementation((key) => {
      if (key === LOCATION_SHARING_SETTINGS_KEY) return Promise.resolve("false");
      if (key === BACKGROUND_LOCATION_SETTINGS_KEY) return Promise.resolve("true");
      return Promise.resolve(null);
    });

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.shouldSend();

    expect(result).toBe(false);
  });
});
