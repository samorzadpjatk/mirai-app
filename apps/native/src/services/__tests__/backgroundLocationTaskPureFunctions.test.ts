import { describe, it, expect, jest } from "@jest/globals";

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
  toFiniteNumberOrNull,
  toNonNegativeOrNull,
  toHeadingOrNull,
} from "~/services/background/backgroundLocationTask";

describe("toFiniteNumberOrNull", () => {
  it("should return the number for valid finite values", () => {
    expect(toFiniteNumberOrNull(42)).toBe(42);
    expect(toFiniteNumberOrNull(0)).toBe(0);
    expect(toFiniteNumberOrNull(-10)).toBe(-10);
    expect(toFiniteNumberOrNull(3.14)).toBe(3.14);
  });

  it("should return null for non-finite values", () => {
    expect(toFiniteNumberOrNull(NaN)).toBeNull();
    expect(toFiniteNumberOrNull(Infinity)).toBeNull();
    expect(toFiniteNumberOrNull(-Infinity)).toBeNull();
  });

  it("should return null for null or undefined", () => {
    expect(toFiniteNumberOrNull(null)).toBeNull();
    expect(toFiniteNumberOrNull(undefined)).toBeNull();
  });

  it("should return null for non-number types", () => {
    expect(toFiniteNumberOrNull("42" as unknown as number)).toBeNull();
    expect(toFiniteNumberOrNull({} as unknown as number)).toBeNull();
  });
});

describe("toNonNegativeOrNull", () => {
  it("should return value for non-negative finite numbers", () => {
    expect(toNonNegativeOrNull(42)).toBe(42);
    expect(toNonNegativeOrNull(0)).toBe(0);
  });

  it("should return null for negative numbers", () => {
    expect(toNonNegativeOrNull(-1)).toBeNull();
    expect(toNonNegativeOrNull(-10)).toBeNull();
  });

  it("should return null for non-finite values", () => {
    expect(toNonNegativeOrNull(NaN)).toBeNull();
    expect(toNonNegativeOrNull(Infinity)).toBeNull();
  });

  it("should return null for null or undefined", () => {
    expect(toNonNegativeOrNull(null)).toBeNull();
    expect(toNonNegativeOrNull(undefined)).toBeNull();
  });
});

describe("toHeadingOrNull", () => {
  it("should return value for valid headings", () => {
    expect(toHeadingOrNull(0)).toBe(0);
    expect(toHeadingOrNull(180)).toBe(180);
    expect(toHeadingOrNull(360)).toBe(360);
  });

  it("should return null for out-of-range headings", () => {
    expect(toHeadingOrNull(-1)).toBeNull();
    expect(toHeadingOrNull(361)).toBeNull();
    expect(toHeadingOrNull(400)).toBeNull();
  });

  it("should return null for non-finite values", () => {
    expect(toHeadingOrNull(NaN)).toBeNull();
    expect(toHeadingOrNull(Infinity)).toBeNull();
  });

  it("should return null for null or undefined", () => {
    expect(toHeadingOrNull(null)).toBeNull();
    expect(toHeadingOrNull(undefined)).toBeNull();
  });
});

import type { LocationObject } from "expo-location";
import {
  handleBackgroundLocationTask,
  type BackgroundTaskState,
  type BackgroundTaskDeps,
} from "~/services/background/backgroundLocationTask";

describe("handleBackgroundLocationTask", () => {
  const createMockDeps = (): BackgroundTaskDeps => ({
    shouldSend: jest.fn<() => Promise<boolean>>(),
    sendUpdate: jest.fn<(location: LocationObject) => Promise<void>>(),
  });

  it("should return early when error is provided", async () => {
    const state: BackgroundTaskState = { isSending: false };
    const deps = createMockDeps();

    await handleBackgroundLocationTask(undefined, new Error("Task failed"), state, deps);

    expect(deps.shouldSend).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should return early when already sending", async () => {
    const state: BackgroundTaskState = { isSending: true };
    const deps = createMockDeps();

    await handleBackgroundLocationTask(
      { locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[] },
      null,
      state,
      deps,
    );

    expect(deps.shouldSend).not.toHaveBeenCalled();
    expect(state.isSending).toBe(true);
  });

  it("should return early when location sharing is disabled", async () => {
    const state: BackgroundTaskState = { isSending: false };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(false);

    await handleBackgroundLocationTask(
      { locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[] },
      null,
      state,
      deps,
    );

    expect(deps.shouldSend).toHaveBeenCalled();
    expect(deps.sendUpdate).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should return early when no locations provided", async () => {
    const state: BackgroundTaskState = { isSending: false };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);

    await handleBackgroundLocationTask({ locations: [] }, null, state, deps);

    expect(deps.sendUpdate).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should return early when data is undefined", async () => {
    const state: BackgroundTaskState = { isSending: false };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);

    await handleBackgroundLocationTask(undefined, null, state, deps);

    expect(deps.sendUpdate).not.toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should send location update for the latest location", async () => {
    const state: BackgroundTaskState = { isSending: false };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);
    deps.sendUpdate.mockResolvedValue(undefined);

    const locations = [
      { coords: { latitude: 52.0, longitude: 21.0 } },
      { coords: { latitude: 52.23, longitude: 21.01 } },
    ] as LocationObject[];

    await handleBackgroundLocationTask({ locations }, null, state, deps);

    expect(deps.sendUpdate).toHaveBeenCalledWith(locations[1]);
    expect(state.isSending).toBe(false);
  });

  it("should handle sendUpdate error gracefully", async () => {
    const state: BackgroundTaskState = { isSending: false };
    const deps = createMockDeps();
    deps.shouldSend.mockResolvedValue(true);
    deps.sendUpdate.mockRejectedValue(new Error("Network error"));

    await handleBackgroundLocationTask(
      { locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[] },
      null,
      state,
      deps,
    );

    expect(deps.sendUpdate).toHaveBeenCalled();
    expect(state.isSending).toBe(false);
  });

  it("should reset isSending even when shouldSend throws", async () => {
    const state: BackgroundTaskState = { isSending: false };
    const deps = createMockDeps();
    deps.shouldSend.mockRejectedValue(new Error("Storage error"));

    await handleBackgroundLocationTask(
      { locations: [{ coords: { latitude: 52.23, longitude: 21.01 } }] as LocationObject[] },
      null,
      state,
      deps,
    );

    expect(state.isSending).toBe(false);
  });
});
