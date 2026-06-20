import { z } from "zod";
import {
  adminProcedure,
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../orpc";
import { forceEndJudgedStaffVoting, submitVote, submitVotes } from "./mutations";
import {
  getByChallenge,
  getJudgedStaffProgress,
  getJudgedStaffProgressByTrip,
  getMyByChallenge,
} from "./queries";

const handleGetMyByChallenge = async ({
  context,
  input,
}: {
  context: Parameters<typeof getMyByChallenge>[0];
  input: Parameters<typeof getMyByChallenge>[1];
}) => getMyByChallenge(context, input);

const handleGetByChallenge = async ({
  context,
  input,
}: {
  context: Parameters<typeof getByChallenge>[0];
  input: Parameters<typeof getByChallenge>[1];
}) => getByChallenge(context, input);

const handleGetJudgedStaffProgress = async ({
  context,
  input,
}: {
  context: Parameters<typeof getJudgedStaffProgress>[0];
  input: Parameters<typeof getJudgedStaffProgress>[1];
}) => getJudgedStaffProgress(context, input);

const handleGetJudgedStaffProgressByTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof getJudgedStaffProgressByTrip>[0];
  input: Parameters<typeof getJudgedStaffProgressByTrip>[1];
}) => getJudgedStaffProgressByTrip(context, input);

const handleForceEndJudgedStaffVoting = async ({
  context,
  input,
}: {
  context: Parameters<typeof forceEndJudgedStaffVoting>[0];
  input: Parameters<typeof forceEndJudgedStaffVoting>[1];
}) => forceEndJudgedStaffVoting(context, input);

const handleSubmitVotes = async ({
  context,
  input,
}: {
  context: Parameters<typeof submitVotes>[0];
  input: Parameters<typeof submitVotes>[1];
}) => submitVotes(context, input);

const handleSubmitVote = async ({
  context,
  input,
}: {
  context: Parameters<typeof submitVote>[0];
  input: Parameters<typeof submitVote>[1];
}) => submitVote(context, input);

export const challengeVoteRouter = createORPCRouter({
  getMyByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(handleGetMyByChallenge),

  getByChallenge: moderatorProcedure
    .input(z.object({ challengeId: z.string() }))
    .handler(handleGetByChallenge),

  getJudgedStaffProgress: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(handleGetJudgedStaffProgress),

  getJudgedStaffProgressByTrip: adminProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetJudgedStaffProgressByTrip),

  forceEndJudgedStaffVoting: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(handleForceEndJudgedStaffVoting),

  submitVotes: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        votes: z
          .array(
            z.object({
              submissionId: z.string(),
              votePosition: z.number().int().min(1).max(3),
              votePoints: z.number().int().min(0),
              normalizedWeight: z.number().positive().optional(),
            }),
          )
          .min(1),
      }),
    )
    .handler(handleSubmitVotes),

  submitVote: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        submissionId: z.string(),
        votePosition: z.number().int().min(1).max(3),
        votePoints: z.number().int().min(0),
        normalizedWeight: z.number().positive().optional(),
      }),
    )
    .handler(handleSubmitVote),
});
