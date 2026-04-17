import {
  createBrandedId,
  type BrandedId,
  isValidUUID,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// ActivityFeed uses UUID
export const ActivityFeedIdFactory = createBrandedId("ActivityFeedId", {
  validate: isValidUUID,
});
export type ActivityFeedId = BrandedId<"ActivityFeedId">;

// ActivityReaction uses UUID
export const ActivityReactionIdFactory = createBrandedId("ActivityReactionId", {
  validate: isValidUUID,
});
export type ActivityReactionId = BrandedId<"ActivityReactionId">;

// UserPost uses CUID (references ActivityFeed as ID)
export const UserPostIdFactory = createBrandedId("UserPostId", {
  validate: isValidUUID,
});
export type UserPostId = BrandedId<"UserPostId">;
