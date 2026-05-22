import { describe, it, expect } from "@jest/globals";
import {
  isPointFeature,
  extractCoordinateFromFeature,
} from "../map/LocationPicker";

describe("isPointFeature", () => {
  it("should return true for Point geometry", () => {
    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [21, 52] },
      properties: {},
    };
    expect(isPointFeature(feature)).toBe(true);
  });

  it("should return false for non-Point geometry", () => {
    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [] },
      properties: {},
    };
    expect(isPointFeature(feature)).toBe(false);
  });
});

describe("extractCoordinateFromFeature", () => {
  it("should extract coordinates from Point feature", () => {
    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [21.01, 52.23] },
      properties: {},
    };
    expect(extractCoordinateFromFeature(feature)).toEqual({
      latitude: 52.23,
      longitude: 21.01,
    });
  });

  it("should return null for non-Point feature", () => {
    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: [] },
      properties: {},
    };
    expect(extractCoordinateFromFeature(feature)).toBeNull();
  });
});
