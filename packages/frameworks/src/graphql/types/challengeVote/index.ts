import { builder, VoteTypeEnum } from "../../builder.js";

export const ChallengeVoteType = builder.objectType("ChallengeVote", {
  description: "Vote on a challenge submission",
  fields: (t) => ({
    id: t.exposeID("id"),
    submissionId: t.exposeID("submissionId"),
    userId: t.exposeID("userId"),
    score: t.exposeInt("score"),
    createdAt: t.field({ type: "DateTime", resolve: (v) => v.createdAt }),
  }),
});

export const CastVoteInput = builder.inputType("CastVoteInput", {
  fields: (t) => ({
    submissionId: t.string({ required: true }),
    tripId: t.string({ required: true }),
    challengeId: t.string({ required: true }),
    voteType: t.field({ type: VoteTypeEnum, required: true }),
  }),
});

export const VoteResultType = builder.objectType("VoteResult", {
  fields: (t) => ({
    id: t.exposeID("id"),
    submissionId: t.exposeID("submissionId"),
    score: t.exposeInt("score"),
  }),
});

import "./queries.js";
import "./mutations.js";
