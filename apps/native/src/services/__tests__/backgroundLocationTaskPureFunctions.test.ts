import { describe, expect, it, jest } from "@jest/globals";

jest.mock("~/config/runtimeEnv", () => ({
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-key",
  TRPC_HTTP_URL: "http://localhost:2022",
  TRPC_WS_URL: "ws://localhost:2022",
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("expo-task-manager", () => ({
  defineTask: jest.fn(),
}));

jest.mock("@mirai-app/supabase", () => ({
  createSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
  })),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  getORPCClient: jest.fn(),
}));

jest.mock("~/services/storage/storage", () => ({
  authStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import {
  toFiniteNumberOrUndefined,
  toHeadingOrUndefined,
  toNonNegativeOrUndefined,
} from "~/services/background/backgroundLocationTask";

describe("toFiniteNumberOrUndefined", () => {
  it("should return the number for valid finite values", () => {
    expect(toFiniteNumberOrUndefined(42)).toBe(42);
    expect(toFiniteNumberOrUndefined(0)).toBe(0);
    expect(toFiniteNumberOrUndefined(-10)).toBe(-10);
    expect(toFiniteNumberOrUndefined(3.14)).toBe(3.14);
  });

  it("should return undefined for non-finite values", () => {
    expect(toFiniteNumberOrUndefined(NaN)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(Infinity)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(-Infinity)).toBeUndefined();
  });

  it("should return undefined for null or undefined", () => {
    expect(toFiniteNumberOrUndefined(null)).toBeUndefined();
    expect(toFiniteNumberOrUndefined(undefined)).toBeUndefined();
  });

  it("should return undefined for non-number types", () => {
    expect(toFiniteNumberOrUndefined("42")).toBeUndefined();
    expect(toFiniteNumberOrUndefined({})).toBeUndefined();
  });
});

describe("toNonNegativeOrUndefined", () => {
  it("should return value for non-negative finite numbers", () => {
    expect(toNonNegativeOrUndefined(42)).toBe(42);
    expect(toNonNegativeOrUndefined(0)).toBe(0);
  });

  it("should return undefined for negative numbers", () => {
    expect(toNonNegativeOrUndefined(-1)).toBeUndefined();
    expect(toNonNegativeOrUndefined(-10)).toBeUndefined();
  });

  it("should return undefined for non-finite values", () => {
    expect(toNonNegativeOrUndefined(NaN)).toBeUndefined();
    expect(toNonNegativeOrUndefined(Infinity)).toBeUndefined();
  });

  it("should return undefined for null or undefined", () => {
    expect(toNonNegativeOrUndefined(null)).toBeUndefined();
    expect(toNonNegativeOrUndefined(undefined)).toBeUndefined();
  });
});

describe("toHeadingOrUndefined", () => {
  it("should return value for valid headings", () => {
    expect(toHeadingOrUndefined(0)).toBe(0);
    expect(toHeadingOrUndefined(180)).toBe(180);
    expect(toHeadingOrUndefined(360)).toBe(360);
  });

  it("should return undefined for out-of-range headings", () => {
    expect(toHeadingOrUndefined(-1)).toBeUndefined();
    expect(toHeadingOrUndefined(361)).toBeUndefined();
    expect(toHeadingOrUndefined(400)).toBeUndefined();
  });

  it("should return undefined for non-finite values", () => {
    expect(toHeadingOrUndefined(NaN)).toBeUndefined();
    expect(toHeadingOrUndefined(Infinity)).toBeUndefined();
  });

  it("should return undefined for null or undefined", () => {
    expect(toHeadingOrUndefined(null)).toBeUndefined();
    expect(toHeadingOrUndefined(undefined)).toBeUndefined();
  });
});

import type { LocationObject } from "expo-location";
import {
  type BackgroundTaskDeps,
  type BackgroundTaskState,
  handleBackgroundLocationTask,
} from "~/services/background/backgroundLocationTask";

const makeLocation = (latitude: number, longitude: number): LocationObject => ({
  coords: {
    latitude,
    longitude,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
});

describe("handleBackgroundLocationTask", () => {
  const createMockDeps = () => ({
    shouldSend: jest.fn<() => Promise<boolean>>(),
    sendUpdate: jest.fn<(location: LocationObject) => Promise<void>>(),
    getLastSentLocation: jest.fn<() => Promise<LocationObject | null>>(),
    setLastSentLocation: jest.fn<(location: LocationObject) => Promise<void>>(),
  });

  it("should return early when error is provided", async () => {
    const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };
    const deps = createMockDeps();

    await handleBackgroundLocationTask(undefined, new Error("Task failed"), state, deps);

    expect(deps.shouldSend).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should return early when already sending", async () => {
    const state: BackgroundTaskState = { isSending: true, lastSentLocation: null };
    const deps = createMockDeps();

    await handleBackgroundLocationTask(
      { locations: [makeLocation(52.23, 21.01)] },
      null,
      state,
      deps,
    );

    expect(deps.shouldSend).not.toHaveBeenCalled();
    expect(state.isSending).toBe(true);
  });

  it("should return early when location sharing is disabled", async () => {
    const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(false);

    await handleBackgroundLocationTask(
      { locations: [makeLocation(52.23, 21.01)] },
      null,
      state,
      deps,
    );

    expect(deps.shouldSend).toHaveBeenCalled();
    expect(deps.sendUpdate).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should return early when no locations provided", async () => {
    const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);

    await handleBackgroundLocationTask({ locations: [] }, null, state, deps);

    expect(deps.sendUpdate).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should return early when data is undefined", async () => {
    const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);

    await handleBackgroundLocationTask(undefined, null, state, deps);

    expect(deps.sendUpdate).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should send location update for the latest location", async () => {
    const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);
    deps.sendUpdate.mockResolvedValue(undefined);
    deps.getLastSentLocation.mockResolvedValue(null);

    const locations: [LocationObject, LocationObject] = [
      makeLocation(52.0, 21.0),
      makeLocation(52.23, 21.01),
    ];

    await handleBackgroundLocationTask({ locations }, null, state, deps);

    expect(deps.sendUpdate).toHaveBeenCalledWith(locations[1]);
    expect(state.isSending).toBe(false);
  });

  it("should handle sendUpdate error gracefully", async () => {
    const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);
    deps.sendUpdate.mockRejectedValue(new Error("Network error"));
    deps.getLastSentLocation.mockResolvedValue(null);

    await handleBackgroundLocationTask(
      { locations: [makeLocation(52.23, 21.01)] },
      null,
      state,
      deps,
    );

    expect(deps.sendUpdate).toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should reset isSending even when shouldSend throws", async () => {
    const state: BackgroundTaskState = { isSending: false, lastSentLocation: null };
    const deps = createMockDeps();
    deps.shouldSend.mockRejectedValue(new Error("Storage error"));

    await handleBackgroundLocationTask(
      { locations: [makeLocation(52.23, 21.01)] },
      null,
      state,
      deps,
    );

    expect(state.isSending).toBe(false);
  });
});
