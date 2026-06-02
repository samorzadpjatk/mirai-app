import type { LocationCoordinate } from "./LocationPicker";

export function isPointFeature(feature: GeoJSON.Feature): boolean {
  return feature.geometry.type === "Point";
}

export function extractCoordinateFromFeature(
  feature: GeoJSON.Feature,
): LocationCoordinate | null {
  if (!isPointFeature(feature)) return null;
  const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
  return { latitude, longitude };
}
