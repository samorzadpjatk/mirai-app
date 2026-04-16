import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * UserId - Branded type for user identifiers
 *
 * Prevents mixing user IDs with other entity IDs.
 */
export const Id = createBrandedId("UserId", { validate: isValidUUID });
export type Id = BrandedId<"UserId">;
export type UserId = Id;
