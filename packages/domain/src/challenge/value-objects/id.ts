import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * ChallengeId - Branded type for challenge identifiers
 *
 * Prevents mixing challenge IDs with other entity IDs.
 */
export const Id = createBrandedId("ChallengeId", { validate: isValidUUID });
export type Id = BrandedId<"ChallengeId">;
