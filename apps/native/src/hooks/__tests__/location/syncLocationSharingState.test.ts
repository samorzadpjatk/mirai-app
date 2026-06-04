import { describe, expect, it } from "@jest/globals";
import {
  LOCATION_SETTINGS_KEY,
  syncLocationSharingState,
} from "~/hooks/location/useLocationPermissions";

describe("syncLocationSharingState", () => {
  it("should use server state when available", async () => {
    const getItem = jest.fn(async (_key: string): Promise<string | null> => null);
    getItem.mockResolvedValue("false");

    const result = await syncLocationSharingState({ isSharingLocation: true }, getItem);

    expect(result.enabled).toBe(true);
    expect(result.error).toBe(false);
  });

  it("should fall back to local state when server state is undefined", async () => {
    const getItem = jest.fn(async (_key: string): Promise<string | null> => null);
    getItem.mockResolvedValue("true");

    const result = await syncLocationSharingState(undefined, getItem);

    expect(result.enabled).toBe(true);
    expect(result.error).toBe(false);
    expect(getItem).toHaveBeenCalledWith(LOCATION_SETTINGS_KEY);
  });

  it("should return false when local state is not 'true'", async () => {
    const getItem = jest.fn(async (_key: string): Promise<string | null> => null);
    getItem.mockResolvedValue("false");

    const result = await syncLocationSharingState(undefined, getItem);

    expect(result.enabled).toBe(false);
    expect(result.error).toBe(false);
  });

  it("should return false when local state is null", async () => {
    const getItem = jest.fn(async (_key: string): Promise<string | null> => null);
    getItem.mockResolvedValue(null);

    const result = await syncLocationSharingState(undefined, getItem);

    expect(result.enabled).toBe(false);
    expect(result.error).toBe(false);
  });

  it("should handle storage errors gracefully", async () => {
    const getItem = jest.fn(async (_key: string): Promise<string | null> => null);
    getItem.mockRejectedValue(new Error("Storage error"));

    const result = await syncLocationSharingState(undefined, getItem);

    expect(result.enabled).toBe(false);
    expect(result.error).toBe(true);
  });
});
