import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../../utils/branded-id";

/**
 * SponsorId - Branded type for sponsor identifiers
 *
 * Prevents mixing sponsor IDs with other entity IDs.
 */
export const Id = createBrandedId("SponsorId", { validate: isValidUUID });
export type Id = BrandedId<"SponsorId">;
