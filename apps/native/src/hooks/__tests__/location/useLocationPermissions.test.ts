import { describe, it, expect } from "@jest/globals";
import {
  calculateCanViewOthersLocations,
  calculateCanShareOwnLocation,
  shouldShowLocationPermissionAlert,
  buildLocationPermissionAlert,
} from "../../location/useLocationPermissions";

describe("calculateCanViewOthersLocations", () => {
  it("should return true when sharing is enabled and permission is granted", () => {
    expect(calculateCanViewOthersLocations(true, "granted")).toBe(true);
  });

  it("should return false when sharing is disabled", () => {
    expect(calculateCanViewOthersLocations(false, "granted")).toBe(false);
  });

  it("should return false when permission is denied", () => {
    expect(calculateCanViewOthersLocations(true, "denied")).toBe(false);
  });

  it("should return false when permission is undetermined", () => {
    expect(calculateCanViewOthersLocations(true, "undetermined")).toBe(false);
  });

  it("should return false when both conditions are false", () => {
    expect(calculateCanViewOthersLocations(false, "denied")).toBe(false);
  });
});

describe("calculateCanShareOwnLocation", () => {
  it("should return true when sharing is enabled and permission is granted", () => {
    expect(calculateCanShareOwnLocation(true, "granted")).toBe(true);
  });

  it("should return false when sharing is disabled", () => {
    expect(calculateCanShareOwnLocation(false, "granted")).toBe(false);
  });

  it("should return false when permission is denied", () => {
    expect(calculateCanShareOwnLocation(true, "denied")).toBe(false);
  });

  it("should return false when permission is undetermined", () => {
    expect(calculateCanShareOwnLocation(true, "undetermined")).toBe(false);
  });

  it("should return false when both conditions are false", () => {
    expect(calculateCanShareOwnLocation(false, "denied")).toBe(false);
  });
});

describe("shouldShowLocationPermissionAlert", () => {
  it("should return true when status is not granted", () => {
    expect(shouldShowLocationPermissionAlert("denied")).toBe(true);
    expect(shouldShowLocationPermissionAlert("undetermined")).toBe(true);
  });

  it("should return false when status is granted", () => {
    expect(shouldShowLocationPermissionAlert("granted")).toBe(false);
  });
});

describe("buildLocationPermissionAlert", () => {
  it("should return alert config", () => {
    const alert = buildLocationPermissionAlert();
    expect(alert.title).toBe("Location Permission Required");
    expect(alert.message).toContain("device settings");
  });
});
