import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// GroupJoinRequest uses CUID
export const GroupJoinRequestId = createBrandedId("GroupJoinRequestId", {
  validate: isValidCUID,
});
export type GroupJoinRequestId = BrandedId<"GroupJoinRequestId">;
