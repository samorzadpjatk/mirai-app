import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * ActivityId - Branded type for activity feed identifiers
 *
 * Prevents mixing activity IDs with other entity IDs.
 */
export const Id = createBrandedId("ActivityId", { validate: isValidUUID });
export type Id = BrandedId<"ActivityId">;
export type ActivityId = Id;
