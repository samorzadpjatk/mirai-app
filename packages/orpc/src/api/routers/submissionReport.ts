import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  createORPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { type Prisma } from "@mirai-app/db";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";
import { ensureTripNotEnded } from "../../utils/tripGuards";

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
  context: { db: Prisma.TransactionClient; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await context.db.tripParticipant.findUnique({
    where: { userId_tripId: { userId: context.dbUser.id, tripId } },
  });
  if (!participant) {
    throw new ORPCError("FORBIDDEN", { message: "Brak dostepu do wyjazdu" });
  }
  return participant;
};

export const submissionReportRouter = createORPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        submissionId: z.string(),
        reason: z.string().min(1),
        details: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEnded(context.db, input.tripId);
      const participant = await ensureTripParticipant(context, input.tripId);

      const submission = await context.db.challengeSubmission.findFirst({
        where: { id: input.submissionId, challenge: { tripId: input.tripId } },
        select: { id: true },
      });

      if (!submission) {
        throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
      }

      const report = await context.db.submissionReport.create({
        data: {
          submissionId: input.submissionId,
          reporterId: participant.id,
          reason: input.reason,
          details: input.details,
        },
        select: reportSelect,
      });

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
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
    .handler(async ({ context, input }) => {
      const reports = await context.db.submissionReport.findMany({
        where: { submissionId: input.submissionId },
        select: reportSelect,
        orderBy: { createdAt: "desc" },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        context.supabase,
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
