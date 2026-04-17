import {
  createBrandedId,
  type BrandedId,
  isValidUUID,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// User uses UUID
export const UserId = createBrandedId("UserId", { validate: isValidUUID });
export type UserId = BrandedId<"UserId">;

// AuthUserId is from Supabase (UUID)
export const AuthUserId = createBrandedId("AuthUserId", {
  validate: isValidUUID,
});
export type AuthUserId = BrandedId<"AuthUserId">;
