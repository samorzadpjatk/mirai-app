import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocationObject } from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";

jest.mock("expo-task-manager", () => ({ defineTask: jest.fn() }));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly",
}));

import { getORPCClient } from "@mirai-app/orpc/client";
import {
  type BackgroundTaskDeps,
  type BackgroundTaskFactoryDeps,
  type BackgroundTaskState,
  createBackgroundTaskDeps,
  handleBackgroundLocationTask,
  initBackgroundLocationTask,
} from "~/services/background/backgroundLocationTask";
import {
  BACKGROUND_LOCATION_SETTINGS_KEY,
  BACKGROUND_LOCATION_TASK_NAME,
  LAST_SENT_LOCATION_KEY,
  LAST_SENT_LOCATION_TIMESTAMP_KEY,
  LOCATION_SHARING_SETTINGS_KEY,
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
      getLastSentLocation: jest.fn(() => Promise.resolve(null)),
      setLastSentLocation: jest.fn(() => Promise.resolve()),
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
      getLastSentLocation: jest.fn(() => Promise.resolve(null)),
      setLastSentLocation: jest.fn(() => Promise.resolve()),
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
      getLastSentLocation: jest.fn(() => Promise.resolve(null)),
      setLastSentLocation: jest.fn(() => Promise.resolve()),
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
      getLastSentLocation: jest.fn(() => Promise.resolve(null)),
      setLastSentLocation: jest.fn(() => Promise.resolve()),
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
      getLastSentLocation: jest.fn(() => Promise.resolve(null)),
      setLastSentLocation: jest.fn(() => Promise.resolve()),
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
      getLastSentLocation: jest.fn(() => Promise.resolve(null)),
      setLastSentLocation: jest.fn(() => Promise.resolve()),
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

describe("handleBackgroundLocationTask", () => {
  const createMockDeps = (): jest.Mocked<BackgroundTaskDeps> => ({
    shouldSend: jest.fn(() => Promise.resolve(true)),
    sendUpdate: jest.fn(() => Promise.resolve()),
    getLastSentLocation: jest.fn(() => Promise.resolve(null)),
    setLastSentLocation: jest.fn(() => Promise.resolve()),
  });

  const createMockState = (
    lastSentLocation: LocationObject | null = null,
  ): BackgroundTaskState => ({
    isSending: false,
    lastSentLocation,
  });

  it("uses state.lastSentLocation when available and skips send when filtered", async () => {
    const mockDeps = createMockDeps();
    const lastSentLocation = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject;
    const state = createMockState(lastSentLocation);

    const newLocation = { coords: { latitude: 52.2297, longitude: 21.0122 } } as LocationObject;

    await handleBackgroundLocationTask({ locations: [newLocation] }, null, state, mockDeps);

    expect(mockDeps.getLastSentLocation).not.toHaveBeenCalled();
    expect(mockDeps.sendUpdate).not.toHaveBeenCalled();
    expect(mockDeps.setLastSentLocation).not.toHaveBeenCalled();
  });

  it("calls getLastSentLocation when state.lastSentLocation is null", async () => {
    const mockDeps = createMockDeps();
    mockDeps.getLastSentLocation.mockResolvedValue({
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject);

    const state = createMockState(null);
    const newLocation = { coords: { latitude: 52.2297, longitude: 21.0122 } } as LocationObject;

    await handleBackgroundLocationTask({ locations: [newLocation] }, null, state, mockDeps);

    expect(mockDeps.getLastSentLocation).toHaveBeenCalled();
    expect(mockDeps.sendUpdate).not.toHaveBeenCalled();
  });

  it("calls setLastSentLocation after successful send", async () => {
    const mockDeps = createMockDeps();
    const state = createMockState(null);
    const newLocation = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject;

    await handleBackgroundLocationTask({ locations: [newLocation] }, null, state, mockDeps);

    expect(mockDeps.sendUpdate).toHaveBeenCalledWith(newLocation);
    expect(mockDeps.setLastSentLocation).toHaveBeenCalledWith(newLocation);
    expect(state.lastSentLocation).toBe(newLocation);
  });

  it("does not call setLastSentLocation when filtered", async () => {
    const mockDeps = createMockDeps();
    const lastSentLocation = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject;
    const state = createMockState(lastSentLocation);
    const newLocation = { coords: { latitude: 52.2297, longitude: 21.0122 } } as LocationObject;

    await handleBackgroundLocationTask({ locations: [newLocation] }, null, state, mockDeps);

    expect(mockDeps.sendUpdate).not.toHaveBeenCalled();
    expect(mockDeps.setLastSentLocation).not.toHaveBeenCalled();
  });

  it("first update after restart always sends when getLastSentLocation returns null", async () => {
    const mockDeps = createMockDeps();
    mockDeps.getLastSentLocation.mockResolvedValue(null);

    const state = createMockState(null);
    const newLocation = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject;

    await handleBackgroundLocationTask({ locations: [newLocation] }, null, state, mockDeps);

    expect(mockDeps.sendUpdate).toHaveBeenCalledWith(newLocation);
    expect(mockDeps.setLastSentLocation).toHaveBeenCalledWith(newLocation);
  });

  it("does not call getLastSentLocation when state.lastSentLocation is available", async () => {
    const mockDeps = createMockDeps();
    const lastSentLocation = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject;
    const state = createMockState(lastSentLocation);
    const newLocation = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject;

    await handleBackgroundLocationTask({ locations: [newLocation] }, null, state, mockDeps);

    expect(mockDeps.getLastSentLocation).not.toHaveBeenCalled();
  });

  it("sends update when distance exceeds threshold", async () => {
    const mockDeps = createMockDeps();
    const lastSentLocation = {
      coords: { latitude: 52.2297, longitude: 21.0122 },
    } as LocationObject;
    const state = createMockState(lastSentLocation);
    const newLocation = {
      coords: { latitude: 50.0647, longitude: 19.945 },
    } as LocationObject;

    await handleBackgroundLocationTask({ locations: [newLocation] }, null, state, mockDeps);

    expect(mockDeps.sendUpdate).toHaveBeenCalledWith(newLocation);
    expect(mockDeps.setLastSentLocation).toHaveBeenCalledWith(newLocation);
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

  it("getLastSentLocation returns parsed LocationObject from SecureStore when not expired", async () => {
    const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
    const storedLocation = { coords: { latitude: 52.2297, longitude: 21.0122 } };
    mockGetItemAsync.mockImplementation((key) => {
      if (key === LAST_SENT_LOCATION_KEY) return Promise.resolve(JSON.stringify(storedLocation));
      if (key === LAST_SENT_LOCATION_TIMESTAMP_KEY) return Promise.resolve(String(Date.now()));
      return Promise.resolve(null);
    });

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.getLastSentLocation();

    expect(mockGetItemAsync).toHaveBeenCalledWith(LAST_SENT_LOCATION_KEY);
    expect(result).toEqual(storedLocation);
  });

  it("getLastSentLocation returns null when SecureStore is empty", async () => {
    const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
    mockGetItemAsync.mockResolvedValue(null);

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.getLastSentLocation();

    expect(result).toBeNull();
  });

  it("getLastSentLocation returns null when SecureStore throws", async () => {
    const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
    mockGetItemAsync.mockRejectedValue(new Error("SecureStore error"));

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.getLastSentLocation();

    expect(result).toBeNull();
  });

  it("getLastSentLocation returns null when stored location is expired", async () => {
    const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
    const storedLocation = { coords: { latitude: 52.2297, longitude: 21.0122 } };
    const expiredTimestamp = String(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    mockGetItemAsync.mockImplementation((key) => {
      if (key === LAST_SENT_LOCATION_KEY) return Promise.resolve(JSON.stringify(storedLocation));
      if (key === LAST_SENT_LOCATION_TIMESTAMP_KEY) return Promise.resolve(expiredTimestamp);
      return Promise.resolve(null);
    });

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.getLastSentLocation();

    expect(result).toBeNull();
  });

  it("getLastSentLocation returns location when stored location is within TTL", async () => {
    const mockGetItemAsync = jest.mocked(SecureStore.getItemAsync);
    const storedLocation = { coords: { latitude: 52.2297, longitude: 21.0122 } };
    const recentTimestamp = String(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    mockGetItemAsync.mockImplementation((key) => {
      if (key === LAST_SENT_LOCATION_KEY) return Promise.resolve(JSON.stringify(storedLocation));
      if (key === LAST_SENT_LOCATION_TIMESTAMP_KEY) return Promise.resolve(recentTimestamp);
      return Promise.resolve(null);
    });

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const result = await deps.getLastSentLocation();

    expect(result).toEqual(storedLocation);
  });

  it("setLastSentLocation stores JSON and timestamp in SecureStore with correct keychain settings", async () => {
    const mockSetItemAsync = jest.mocked(SecureStore.setItemAsync);
    mockSetItemAsync.mockResolvedValue();

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const location = { coords: { latitude: 52.2297, longitude: 21.0122 } } as LocationObject;
    await deps.setLastSentLocation(location);

    expect(mockSetItemAsync).toHaveBeenCalledWith(
      LAST_SENT_LOCATION_KEY,
      JSON.stringify(location),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
    );
    expect(mockSetItemAsync).toHaveBeenCalledWith(
      LAST_SENT_LOCATION_TIMESTAMP_KEY,
      expect.any(String),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
    );
  });

  it("setLastSentLocation does not throw when SecureStore fails", async () => {
    const mockSetItemAsync = jest.mocked(SecureStore.setItemAsync);
    mockSetItemAsync.mockRejectedValue(new Error("SecureStore error"));

    const factoryDeps = createMockFactoryDeps();
    const deps = createBackgroundTaskDeps(factoryDeps);

    const location = { coords: { latitude: 52.2297, longitude: 21.0122 } } as LocationObject;
    await expect(deps.setLastSentLocation(location)).resolves.toBeUndefined();
  });
});
