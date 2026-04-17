import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// UserAgent uses CUID
export const UserAgentId = createBrandedId("UserAgentId", {
  validate: isValidCUID,
});
export type UserAgentId = BrandedId<"UserAgentId">;
