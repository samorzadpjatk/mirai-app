import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["USER", "ADMIN", "MODERATOR", "SERVICE"]);
export const submissionTypeEnum = pgEnum("submission_type", [
  "IMAGE",
  "MULTI_IMAGE",
  "VIDEO",
  "TEXT",
  "IMAGE_LOCATION",
  "LOCATION",
  "QR_CODE",
]);
export const scoringCategoryEnum = pgEnum("scoring_category", [
  "SPEED",
  "UNLIMITED",
  "JUDGED_STAFF",
  "PEER_VOTING",
]);
export const challengeStatusEnum = pgEnum("challenge_status", [
  "HIDDEN",
  "VISIBLE",
  "ACTIVE",
  "VOTING_PHASE",
  "COMPLETED",
  "CANCELLED",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const locationSharingRequestStatusEnum = pgEnum("location_sharing_request_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);
export const rewardPurchaseStatusEnum = pgEnum("reward_purchase_status", [
  "BOUGHT",
  "ACCEPTED",
  "IN_DELIVERY",
  "CANCELLED",
  "DELIVERED",
]);
