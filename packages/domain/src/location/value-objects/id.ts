import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * LocationId - Branded type for location identifiers
 *
 * Prevents mixing location IDs with other entity IDs.
 */
export const Id = createBrandedId("LocationId", { validate: isValidUUID });
export type Id = BrandedId<"LocationId">;
export type LocationId = Id;
