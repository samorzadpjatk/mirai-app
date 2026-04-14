/**
 * SponsorId - Branded type for sponsor identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
import { createBrandedId, type BrandedId } from "../utils/branded-id";

export const SponsorId = createBrandedId("SponsorId", {
  validate: (id) => id?.trim() !== "",
  errorMessage: (id) => `Invalid SponsorId: empty or undefined`,
});
export type SponsorId = BrandedId<"SponsorId">;
