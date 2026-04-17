import {
  createBrandedId,
  type BrandedId,
  isValidUUID,
} from "../../shared/value-objects/branded-id";

// Group uses UUID
export const GroupId = createBrandedId("GroupId", { validate: isValidUUID });
export type GroupId = BrandedId<"GroupId">;
