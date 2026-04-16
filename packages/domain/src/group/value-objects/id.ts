import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * GroupId - Branded type for group identifiers
 *
 * Prevents mixing group IDs with other entity IDs.
 */
export const Id = createBrandedId("GroupId", { validate: isValidUUID });
export type Id = BrandedId<"GroupId">;
export type GroupId = Id;
