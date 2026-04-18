import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireModerator } from "../../context.js";
import { ChallengeId, ChallengeSubmissionId, GroupId } from "@mirai-app/domain";
import { CreateSubmissionInput, ReviewSubmissionInput, SubmissionResultType } from "./index.js";

builder.mutationFields((t) => ({
  createSubmission: t.field({
    type: SubmissionResultType,
    args: { input: t.arg({ type: CreateSubmissionInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        id: ChallengeSubmissionId.unsafeCreate("placeholder"),
        challengeId: ChallengeId.unsafeCreate(args.input.challengeId),
        groupId: GroupId.unsafeCreate("placeholder"),
        status: "PENDING" as const,
        createdAt: new Date(),
      };
    },
  }),
  reviewSubmission: t.field({
    type: SubmissionResultType,
    args: { input: t.arg({ type: ReviewSubmissionInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);
      return {
        id: ChallengeSubmissionId.unsafeCreate(args.input.submissionId),
        challengeId: ChallengeId.unsafeCreate("placeholder"),
        groupId: GroupId.unsafeCreate("placeholder"),
        status: args.input.status,
        createdAt: new Date(),
      };
    },
  }),
}));

export const challengeSubmissionMutations = {};