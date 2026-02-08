import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { type Prisma } from "@integral-2025-app/db";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";

const reportSelect = {
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
          authUserId: true,
        },
      },
    },
  },
} as const satisfies Prisma.SubmissionReportSelect;

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

      const report = await ctx.db.submissionReport.create({
        data: {
          submissionId: input.submissionId,
          reporterId: participant.id,
          reason: input.reason,
          details: input.details,
        },
        select: reportSelect,
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        report.reporter.user.authUserId,
      ]);

      const { authUserId, ...reporterUser } = report.reporter.user;

      return {
        ...report,
        reporter: {
          ...report.reporter,
          user: {
            ...reporterUser,
            email: resolveAuthEmail(emailByAuthUserId, authUserId),
          },
        },
      };
    }),

  getBySubmission: moderatorProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.submissionReport.findMany({
        where: { submissionId: input.submissionId },
        select: reportSelect,
        orderBy: { createdAt: "desc" },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        reports.map((report) => report.reporter.user.authUserId),
      );

      return reports.map((report) => {
        const { authUserId, ...reporterUser } = report.reporter.user;
        return {
          ...report,
          reporter: {
            ...report.reporter,
            user: {
              ...reporterUser,
              email: resolveAuthEmail(emailByAuthUserId, authUserId),
            },
          },
        };
      });
    }),
});
