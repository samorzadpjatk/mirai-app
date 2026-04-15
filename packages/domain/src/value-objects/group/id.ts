import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../../utils/branded-id";

/**
 * GroupId - Branded type for group identifiers
 *
 * Prevents mixing group IDs with other entity IDs.
 */
export const Id = createBrandedId("GroupId", { validate: isValidUUID });
export type Id = BrandedId<"GroupId">;
