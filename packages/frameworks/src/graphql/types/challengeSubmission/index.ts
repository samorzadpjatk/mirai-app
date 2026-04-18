import { builder, SubmissionStatusEnum } from "../../builder.js";

export const ChallengeSubmissionType = builder.objectType("ChallengeSubmission", {
  description: "Challenge submission",
  fields: (t) => ({
    id: t.exposeID("id"),
    challengeId: t.exposeID("challengeId"),
    groupId: t.exposeID("groupId"),
    imageIds: t.field({ type: ["String"], resolve: (s) => s.imageIds || [] }),
    videoId: t.exposeString("videoId", { nullable: true }),
    textContent: t.exposeString("textContent", { nullable: true }),
    latitude: t.exposeFloat("latitude", { nullable: true }),
    longitude: t.exposeFloat("longitude", { nullable: true }),
    status: t.field({
      type: SubmissionStatusEnum,
      resolve: (s) => s.status as typeof SubmissionStatusEnum.$inferType,
    }),
    rejectionReason: t.exposeString("rejectionReason", { nullable: true }),
    awardedPoints: t.exposeInt("awardedPoints", { nullable: true }),
    bonusPoints: t.exposeInt("bonusPoints", { nullable: true }),
    ranking: t.exposeInt("ranking", { nullable: true }),
    voteCount: t.exposeInt("voteCount", { nullable: true }),
    voteScore: t.exposeInt("voteScore", { nullable: true }),
    createdAt: t.field({ type: "DateTime", resolve: (s) => s.createdAt }),
    reviewedAt: t.field({ type: "DateTime", nullable: true, resolve: (s) => s.reviewedAt }),
  }),
});

// Relay connection types for pagination
export const SubmissionConnectionType = builder.connectionObject(
  { name: "SubmissionConnection", type: ChallengeSubmissionType },
  { name: "SubmissionEdge" }
);

export const CreateSubmissionInput = builder.inputType("CreateSubmissionInput", {
  fields: (t) => ({
    challengeId: t.string({ required: true }),
    tripId: t.string({ required: true }),
    imageIds: t.stringList({ required: false }),
    videoId: t.string({ required: false }),
    textContent: t.string({ required: false }),
    latitude: t.float({ required: false }),
    longitude: t.float({ required: false }),
  }),
});

export const ReviewSubmissionInput = builder.inputType("ReviewSubmissionInput", {
  fields: (t) => ({
    submissionId: t.string({ required: true }),
    status: t.field({ type: SubmissionStatusEnum, required: true }),
    rejectionReason: t.string({ required: false }),
    awardedPoints: t.int({ required: false }),
    bonusPoints: t.int({ required: false }),
  }),
});

export const SubmissionResultType = builder.objectType("SubmissionResult", {
  fields: (t) => ({
    id: t.exposeID("id"),
    status: t.exposeString("status"),
  }),
});

import "./queries.js";
import "./mutations.js";
