// =============================================================================
// Challenge Types
// =============================================================================

import { builder } from "../../builder.js";
import {
  SubmissionTypeEnum,
  ScoringCategoryEnum,
  ChallengeStatusEnum,
} from "../../builder.js";
import {
  encodeCursor,
  buildConnection,
} from "../../utils/connections.js";
import type { Connection } from "../../utils/connections.js";

// =============================================================================
// Object Types
// =============================================================================

export const ChallengeType = builder.objectType("Challenge", {
  description: "Challenge entity",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    image: t.exposeString("image", { nullable: true }),
    submissionType: t.field({
      type: SubmissionTypeEnum,
      nullable: true,
      resolve: (c) => c.submissionType as typeof SubmissionTypeEnum.$inferType,
    }),
    scoringCategory: t.field({
      type: ScoringCategoryEnum,
      resolve: (c) => c.scoringCategory as typeof ScoringCategoryEnum.$inferType,
    }),
    isRecurring: t.exposeBoolean("isRecurring"),
    dailyStartTime: t.exposeString("dailyStartTime", { nullable: true }),
    dailyEndTime: t.exposeString("dailyEndTime", { nullable: true }),
    basePoints: t.exposeInt("basePoints", { nullable: true }),
    firstPlacePoints: t.exposeInt("firstPlacePoints", { nullable: true }),
    secondPlacePoints: t.exposeInt("secondPlacePoints", { nullable: true }),
    thirdPlacePoints: t.exposeInt("thirdPlacePoints", { nullable: true }),
    status: t.field({
      type: ChallengeStatusEnum,
      resolve: (c) => c.status as typeof ChallengeStatusEnum.$inferType,
    }),
    startTime: t.field({ type: "DateTime", nullable: true, resolve: (c) => c.startTime }),
    endTime: t.field({ type: "DateTime", nullable: true, resolve: (c) => c.endTime }),
    votingStartTime: t.field({ type: "DateTime", nullable: true, resolve: (c) => c.votingStartTime }),
    votingEndTime: t.field({ type: "DateTime", nullable: true, resolve: (c) => c.votingEndTime }),
    targetLatitude: t.exposeFloat("targetLatitude", { nullable: true }),
    targetLongitude: t.exposeFloat("targetLongitude", { nullable: true }),
    expectedValue: t.exposeString("expectedValue", { nullable: true }),
    autoApprove: t.exposeBoolean("autoApprove"),
    createdAt: t.field({ type: "DateTime", resolve: (c) => c.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (c) => c.updatedAt }),
    // qrCodeValue is only available on ChallengeWithClientFieldsDTO
    qrCodeValue: t.field({
      type: "String",
      nullable: true,
      resolve: (c) => ("qrCodeValue" in c ? (c as { qrCodeValue: string | null }).qrCodeValue : null),
    }),
    // Computed fields
    participantGroupsCount: t.field({
      type: "Int",
      nullable: true,
      resolve: () => null,
    }),
    pendingSubmissionsCount: t.field({
      type: "Int",
      nullable: true,
      resolve: () => null,
    }),
    myGroupSubmissionStatus: t.field({
      type: "String",
      nullable: true,
      resolve: () => null,
    }),
  }),
});

// =============================================================================
// Relay Connection Types
// =============================================================================

/**
 * Challenge Relay Connection Type
 *
 * Implements the Relay connection specification for cursor-based pagination.
 * Use this for new queries and resolvers.
 */
export const ChallengeConnectionType = builder.connectionObject(
  { name: "ChallengeConnection", type: ChallengeType },
  { name: "ChallengeEdge" }
);

// =============================================================================
// Input Types
// =============================================================================

export const CreateChallengeInput = builder.inputType("CreateChallengeInput", {
  fields: (t) => ({
    tripId: t.string({ required: true }),
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    qrCodeValue: t.string({ required: false }),
    textExpectedPhrase: t.string({ required: false }),
    image: t.string({ required: false }),
    submissionType: t.field({ type: SubmissionTypeEnum, required: true }),
    scoringCategory: t.field({ type: ScoringCategoryEnum, required: true }),
    isRecurring: t.boolean({ required: false }),
    recurringDays: t.int({ required: false }),
    dailyStartTime: t.string({ required: false }),
    dailyEndTime: t.string({ required: false }),
    basePoints: t.int({ required: false }),
    firstPlacePoints: t.int({ required: false }),
    secondPlacePoints: t.int({ required: false }),
    thirdPlacePoints: t.int({ required: false }),
    status: t.field({ type: ChallengeStatusEnum, required: false }),
    startTime: t.field({ type: "DateTime", required: false }),
    endTime: t.field({ type: "DateTime", required: false }),
    votingDurationHours: t.int({ required: false }),
    votingStartTime: t.field({ type: "DateTime", required: false }),
    votingEndTime: t.field({ type: "DateTime", required: false }),
    targetLatitude: t.float({ required: false }),
    targetLongitude: t.float({ required: false }),
    autoApprove: t.boolean({ required: false }),
  }),
});

export const UpdateChallengeInput = builder.inputType("UpdateChallengeInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    tripId: t.string({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    qrCodeValue: t.string({ required: false }),
    textExpectedPhrase: t.string({ required: false }),
    image: t.string({ required: false }),
    submissionType: t.field({ type: SubmissionTypeEnum, required: false }),
    scoringCategory: t.field({ type: ScoringCategoryEnum, required: false }),
    isRecurring: t.boolean({ required: false }),
    recurringDays: t.int({ required: false }),
    dailyStartTime: t.string({ required: false }),
    dailyEndTime: t.string({ required: false }),
    basePoints: t.int({ required: false }),
    firstPlacePoints: t.int({ required: false }),
    secondPlacePoints: t.int({ required: false }),
    thirdPlacePoints: t.int({ required: false }),
    status: t.field({ type: ChallengeStatusEnum, required: false }),
    startTime: t.field({ type: "DateTime", required: false }),
    endTime: t.field({ type: "DateTime", required: false }),
    votingDurationHours: t.int({ required: false }),
    votingStartTime: t.field({ type: "DateTime", required: false }),
    votingEndTime: t.field({ type: "DateTime", required: false }),
    targetLatitude: t.float({ required: false }),
    targetLongitude: t.float({ required: false }),
    autoApprove: t.boolean({ required: false }),
  }),
});

export const DeleteChallengeInput = builder.inputType("DeleteChallengeInput", {
  fields: (t) => ({
    id: t.string({ required: true }),
    tripId: t.string({ required: true }),
  }),
});

// =============================================================================
// Result Types
// =============================================================================

export const ChallengeResultType = builder.objectType("ChallengeResult", {
  description: "Challenge operation result",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    status: t.field({
      type: ChallengeStatusEnum,
      resolve: (c) => c.status as typeof ChallengeStatusEnum.$inferType,
    }),
  }),
});

export const ForceCloseVotingResultType = builder.objectType("ForceCloseVotingResult", {
  description: "Force close voting result",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    status: t.exposeString("status"),
  }),
});
