import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * TripId - Branded type for trip identifiers
 *
 * Prevents mixing trip IDs with other entity IDs.
 */
export const Id = createBrandedId("TripId", { validate: isValidUUID });
export type Id = BrandedId<"TripId">;
export type TripId = Id;
