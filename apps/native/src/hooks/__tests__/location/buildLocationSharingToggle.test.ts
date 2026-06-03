import { describe, it, expect, jest } from "@jest/globals";
import {
  executeToggleLocationSharing,
  buildLocationSharingToggle,
  type LocationSharingToggleDeps,
} from "../../location/useLocationPermissions";

describe("executeToggleLocationSharing", () => {
  it("should call mutateAsync with correct params", async () => {
    const deps: LocationSharingToggleDeps = {
      permissionStatus: "granted",
      requestLocationPermissions: jest.fn<() => Promise<string>>().mockResolvedValue("granted"),
      updateSharingMutation: {
        mutateAsync: jest
          .fn<
            (data: { isSharingLocation: boolean; userIdsToShareWith: string[] }) => Promise<unknown>
          >()
          .mockResolvedValue(undefined),
      },
    };

    await executeToggleLocationSharing(true, deps);

    expect(deps.updateSharingMutation.mutateAsync).toHaveBeenCalledWith({
      isSharingLocation: true,
      userIdsToShareWith: [],
    });
  });

  it("should request permissions when enabled and undetermined", async () => {
    const deps: LocationSharingToggleDeps = {
      permissionStatus: "undetermined",
      requestLocationPermissions: jest.fn<() => Promise<string>>().mockResolvedValue("granted"),
      updateSharingMutation: {
        mutateAsync: jest
          .fn<
            (data: { isSharingLocation: boolean; userIdsToShareWith: string[] }) => Promise<unknown>
          >()
          .mockResolvedValue(undefined),
      },
    };

    await executeToggleLocationSharing(true, deps);

    expect(deps.requestLocationPermissions).toHaveBeenCalled();
  });

  it("should not request permissions when disabled", async () => {
    const deps: LocationSharingToggleDeps = {
      permissionStatus: "undetermined",
      requestLocationPermissions: jest.fn<() => Promise<string>>().mockResolvedValue("granted"),
      updateSharingMutation: {
        mutateAsync: jest
          .fn<
            (data: { isSharingLocation: boolean; userIdsToShareWith: string[] }) => Promise<unknown>
          >()
          .mockResolvedValue(undefined),
      },
    };

    await executeToggleLocationSharing(false, deps);

    expect(deps.requestLocationPermissions).not.toHaveBeenCalled();
  });
});

describe("buildLocationSharingToggle", () => {
  it("should build toggle that updates state and storage on success", async () => {
    const setIsLocationSharingEnabled = jest.fn<(enabled: boolean) => void>();
    const deps: LocationSharingToggleDeps = {
      permissionStatus: "granted",
      requestLocationPermissions: jest.fn<() => Promise<string>>().mockResolvedValue("granted"),
      updateSharingMutation: {
        mutateAsync: jest
          .fn<
            (data: { isSharingLocation: boolean; userIdsToShareWith: string[] }) => Promise<unknown>
          >()
          .mockResolvedValue(undefined),
      },
    };

    const toggle = buildLocationSharingToggle(setIsLocationSharingEnabled, deps);
    await toggle(true);

    expect(setIsLocationSharingEnabled).toHaveBeenCalledWith(true);
  });

  it("should handle errors without updating state", async () => {
    const setIsLocationSharingEnabled = jest.fn<(enabled: boolean) => void>();
    const deps: LocationSharingToggleDeps = {
      permissionStatus: "granted",
      requestLocationPermissions: jest.fn<() => Promise<string>>(),
      updateSharingMutation: {
        mutateAsync: jest
          .fn<
            (data: { isSharingLocation: boolean; userIdsToShareWith: string[] }) => Promise<unknown>
          >()
          .mockRejectedValue(new Error("Network error")),
      },
    };

    const toggle = buildLocationSharingToggle(setIsLocationSharingEnabled, deps);
    await toggle(true);

    expect(setIsLocationSharingEnabled).not.toHaveBeenCalled();
  });
});
