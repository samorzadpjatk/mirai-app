import { z } from "zod";

/**
 * Validates latitude is within valid range (-90 to 90)
 */
export const latitudeSchema = z
  .number()
  .min(-90, "Szerokość geograficzna musi być między -90 a 90")
  .max(90, "Szerokość geograficzna musi być między -90 a 90");

/**
 * Validates longitude is within valid range (-180 to 180)
 */
export const longitudeSchema = z
  .number()
  .min(-180, "Długość geograficzna musi być między -180 a 180")
  .max(180, "Długość geograficzna musi być między -180 a 180");

/**
 * Schema for geographic coordinates
 */
export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

/**
 * Schema for optional geographic coordinates
 */
export const optionalCoordinatesSchema = z.object({
  latitude: latitudeSchema.optional().nullable(),
  longitude: longitudeSchema.optional().nullable(),
});

/**
 * Schema for location data with all optional fields
 */
export const locationDataSchema = z.object({
  latitude: latitudeSchema.optional().nullable(),
  longitude: longitudeSchema.optional().nullable(),
  accuracy: z.number().nonnegative().optional().nullable(),
  altitude: z.number().optional().nullable(),
  altitudeAccuracy: z.number().nonnegative().optional().nullable(),
  heading: z.number().min(0).max(360).optional().nullable(),
  speed: z.number().nonnegative().optional().nullable(),
});

/**
 * Calculates distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
