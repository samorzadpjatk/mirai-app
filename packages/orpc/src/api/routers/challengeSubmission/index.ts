import { z } from "zod";
import {
  createORPCRouter,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "../../trpc";
import {
  fetchSubmissionsByChallenge,
  fetchSubmissionsByChallengeForParticipant,
  fetchSubmissionById,
  fetchMySubmissionForChallenge,
} from "./queries";
import {
  createSubmission,
  updateMineSubmission,
  deleteMineSubmission,
  reviewSubmission,
  adminDeleteSubmission,
} from "./mutations";

const handleGetByChallengeForAdmin = async ({
  context,
  input,
}: {
  context: Parameters<typeof fetchSubmissionsByChallenge>[0]["context"];
  input: Pick<Parameters<typeof fetchSubmissionsByChallenge>[0], "challengeId" | "tripId">;
}) =>
  fetchSubmissionsByChallenge({
    context,
    challengeId: input.challengeId,
    tripId: input.tripId,
  });

const handleGetByChallenge = async ({
  context,
  input,
}: {
  context: Parameters<typeof fetchSubmissionsByChallengeForParticipant>[0]["context"];
  input: Pick<Parameters<typeof fetchSubmissionsByChallengeForParticipant>[0], "challengeId" | "tripId">;
}) =>
  fetchSubmissionsByChallengeForParticipant({
    context,
    challengeId: input.challengeId,
    tripId: input.tripId,
  });

const handleGetById = async ({
  context,
  input,
}: {
  context: Parameters<typeof fetchSubmissionById>[0]["context"];
  input: Pick<Parameters<typeof fetchSubmissionById>[0], "id" | "tripId">;
}) =>
  fetchSubmissionById({
    context,
    id: input.id,
    tripId: input.tripId,
  });

const handleGetMyForChallenge = async ({
  context,
  input,
}: {
  context: Parameters<typeof fetchMySubmissionForChallenge>[0]["context"];
  input: Pick<Parameters<typeof fetchMySubmissionForChallenge>[0], "challengeId" | "tripId">;
}) =>
  fetchMySubmissionForChallenge({
    context,
    challengeId: input.challengeId,
    tripId: input.tripId,
  });

const handleCreateSubmission = async ({
  context,
  input,
}: {
  context: Parameters<typeof createSubmission>[0];
  input: Parameters<typeof createSubmission>[1];
}) => createSubmission(context, input);

const handleUpdateMineSubmission = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateMineSubmission>[0];
  input: Parameters<typeof updateMineSubmission>[1];
}) => updateMineSubmission(context, input);

const handleDeleteMineSubmission = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteMineSubmission>[0];
  input: Parameters<typeof deleteMineSubmission>[1];
}) => deleteMineSubmission(context, input);

const handleReviewSubmission = async ({
  context,
  input,
}: {
  context: Parameters<typeof reviewSubmission>[0];
  input: Parameters<typeof reviewSubmission>[1];
}) => reviewSubmission(context, input);

const handleAdminDeleteSubmission = async ({
  context,
  input,
}: {
  context: Parameters<typeof adminDeleteSubmission>[0];
  input: Parameters<typeof adminDeleteSubmission>[1];
}) => adminDeleteSubmission(context, input);

export const challengeSubmissionRouter = createORPCRouter({
  getByChallengeForAdmin: moderatorProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(handleGetByChallengeForAdmin),

  getByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(handleGetByChallenge),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(handleGetById),

  getMyForChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(handleGetMyForChallenge),

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        imageIds: z.array(z.string().min(1)).optional(),
        videoId: z.string().min(1).optional(),
        textContent: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .handler(handleCreateSubmission),

  updateMine: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        imageIds: z.array(z.string().min(1)).optional(),
        videoId: z.string().min(1).optional(),
        textContent: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .handler(handleUpdateMineSubmission),

  deleteMine: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(handleDeleteMineSubmission),

  review: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["APPROVED", "REJECTED"]),
        rejectionReason: z.string().optional(),
        awardedPoints: z.number().int().min(0).optional(),
        bonusPoints: z.number().int().min(0).optional(),
        ranking: z.number().int().min(1).max(3).optional(),
      }),
    )
    .handler(handleReviewSubmission),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(handleAdminDeleteSubmission),
});
