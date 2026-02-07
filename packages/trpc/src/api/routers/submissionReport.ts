import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { type Prisma } from "@integral-2025-app/db";

const reportSelect: Prisma.SubmissionReportSelect = {
  id: true,
  submissionId: true,
  reporterId: true,
  reason: true,
  details: true,
  createdAt: true,
  reporter: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
} as const;

const ensureTripParticipant = async (
  ctx: { db: Prisma.TransactionClient; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await ctx.db.tripParticipant.findUnique({
    where: { userId_tripId: { userId: ctx.dbUser.id, tripId } },
  });
  if (!participant) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostepu do wyjazdu" });
  }
  return participant;
};

export const submissionReportRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        submissionId: z.string(),
        reason: z.string().min(1),
        details: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);

      const submission = await ctx.db.challengeSubmission.findFirst({
        where: { id: input.submissionId, challenge: { tripId: input.tripId } },
        select: { id: true },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      return ctx.db.submissionReport.create({
        data: {
          submissionId: input.submissionId,
          reporterId: participant.id,
          reason: input.reason,
          details: input.details,
        },
        select: reportSelect,
      });
    }),

  getBySubmission: moderatorProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.submissionReport.findMany({
        where: { submissionId: input.submissionId },
        select: reportSelect,
        orderBy: { createdAt: "desc" },
      });
    }),
});
