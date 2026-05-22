import { describe, it, expect, jest } from "@jest/globals";
import {
  executeToggleLocationSharing,
  buildLocationSharingToggle,
} from "../../location/useLocationPermissions";

describe("executeToggleLocationSharing", () => {
  it("should call mutateAsync with correct params", async () => {
    const deps = {
      permissionStatus: "granted",
      requestLocationPermissions: jest.fn().mockResolvedValue("granted"),
      updateSharingMutation: { mutateAsync: jest.fn().mockResolvedValue(undefined) },
    };

    await executeToggleLocationSharing(true, deps);

    expect(deps.updateSharingMutation.mutateAsync).toHaveBeenCalledWith({
      isSharingLocation: true,
      userIdsToShareWith: [],
    });
  });

  it("should request permissions when enabled and undetermined", async () => {
    const deps = {
      permissionStatus: "undetermined",
      requestLocationPermissions: jest.fn().mockResolvedValue("granted"),
      updateSharingMutation: { mutateAsync: jest.fn().mockResolvedValue(undefined) },
    };

    await executeToggleLocationSharing(true, deps);

    expect(deps.requestLocationPermissions).toHaveBeenCalled();
  });

  it("should not request permissions when disabled", async () => {
    const deps = {
      permissionStatus: "undetermined",
      requestLocationPermissions: jest.fn().mockResolvedValue("granted"),
      updateSharingMutation: { mutateAsync: jest.fn().mockResolvedValue(undefined) },
    };

    await executeToggleLocationSharing(false, deps);

    expect(deps.requestLocationPermissions).not.toHaveBeenCalled();
  });
});

describe("buildLocationSharingToggle", () => {
  it("should build toggle that updates state and storage on success", async () => {
    const setIsLocationSharingEnabled = jest.fn();
    const deps = {
      permissionStatus: "granted",
      requestLocationPermissions: jest.fn().mockResolvedValue("granted"),
      updateSharingMutation: { mutateAsync: jest.fn().mockResolvedValue(undefined) },
    };

    const toggle = buildLocationSharingToggle(setIsLocationSharingEnabled, deps);
    await toggle(true);

    expect(setIsLocationSharingEnabled).toHaveBeenCalledWith(true);
  });

  it("should handle errors without updating state", async () => {
    const setIsLocationSharingEnabled = jest.fn();
    const deps = {
      permissionStatus: "granted",
      requestLocationPermissions: jest.fn(),
      updateSharingMutation: {
        mutateAsync: jest.fn().mockRejectedValue(new Error("Network error")),
      },
    };

    const toggle = buildLocationSharingToggle(setIsLocationSharingEnabled, deps);
    await toggle(true);

    expect(setIsLocationSharingEnabled).not.toHaveBeenCalled();
  });
});
