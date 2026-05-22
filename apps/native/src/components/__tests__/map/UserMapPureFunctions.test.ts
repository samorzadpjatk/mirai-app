import { describe, it, expect } from "@jest/globals";
import {
  processUserLocationUpdate,
  buildMapStyleConfig,
  getActivityOpacity,
  buildFilteredUsers,
} from "~/components/map/UserMap";

describe("processUserLocationUpdate", () => {
  it("returns no actions when coords are missing", () => {
    const result = processUserLocationUpdate({}, "user-1", true, false);
    expect(result.shouldUpdateLocation).toBe(false);
    expect(result.coordinate).toBeNull();
    expect(result.shouldCenter).toBe(false);
    expect(result.shouldNotify).toBe(false);
  });

  it("returns no actions when longitude or latitude is null", () => {
    const result = processUserLocationUpdate(
      { coords: { longitude: null, latitude: 10 } },
      "user-1",
      true,
      false,
    );
    expect(result.coordinate).toBeNull();
  });

  it("returns update location when current user and sharing enabled", () => {
    const result = processUserLocationUpdate(
      { coords: { longitude: 10, latitude: 20 } },
      "user-1",
      true,
      false,
    );
    expect(result.shouldUpdateLocation).toBe(true);
    expect(result.coordinate).toEqual([10, 20]);
    expect(result.shouldCenter).toBe(true);
    expect(result.shouldNotify).toBe(true);
  });

  it("does not update location when no current user id", () => {
    const result = processUserLocationUpdate(
      { coords: { longitude: 10, latitude: 20 } },
      undefined,
      true,
      false,
    );
    expect(result.shouldUpdateLocation).toBe(false);
  });

  it("does not update location when sharing disabled", () => {
    const result = processUserLocationUpdate(
      { coords: { longitude: 10, latitude: 20 } },
      "user-1",
      false,
      false,
    );
    expect(result.shouldUpdateLocation).toBe(false);
  });

  it("does not center when already centered", () => {
    const result = processUserLocationUpdate(
      { coords: { longitude: 10, latitude: 20 } },
      "user-1",
      true,
      true,
    );
    expect(result.shouldCenter).toBe(false);
  });
});

describe("buildMapStyleConfig", () => {
  it("returns custom URL when provided", () => {
    const result = buildMapStyleConfig("https://custom.map/style.json", "dark");
    expect(result.style).toBe("https://custom.map/style.json");
  });

  it("returns dark theme config when no custom URL", () => {
    const result = buildMapStyleConfig(undefined, "dark");
    expect(result.style).toBe("https://tiles.openfreemap.org/styles/fiord");
    expect(result.rasterOverlays).toBeDefined();
  });

  it("returns light theme config when no custom URL", () => {
    const result = buildMapStyleConfig(undefined, "light");
    expect(result.style).toBe("https://tiles.openfreemap.org/styles/liberty");
    expect(result.rasterOverlays).toBeDefined();
  });
});
