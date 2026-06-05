import { calculateDistance } from "@mirai-app/shared/utils";
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
 * Schema for location data with all optional fields
 */
export const locationDataSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  accuracy: z.number().nonnegative().optional(),
  altitude: z.number().optional(),
  altitudeAccuracy: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
});

export { calculateDistance };
