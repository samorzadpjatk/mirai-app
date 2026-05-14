import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { createORPCRouter, protectedProcedure, moderatorProcedure } from "../../api/trpc";
import { type DB, challengeSubmissions, challenges, submissionReports } from "@mirai-app/db";
import { eq, and } from "drizzle-orm";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";
import { ensureTripNotEnded } from "../../utils/tripGuards";

const ensureTripParticipant = async (
  context: { db: DB; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, tripId)),
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

      const submission = await context.db
        .select({ id: challengeSubmissions.id })
        .from(challengeSubmissions)
        .innerJoin(challenges, eq(challengeSubmissions.challengeId, challenges.id))
        .where(
          and(eq(challengeSubmissions.id, input.submissionId), eq(challenges.tripId, input.tripId)),
        )
        .then((rows) => rows[0] ?? null);

      if (!submission) {
        throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
      }

      const [inserted] = await context.db
        .insert(submissionReports)
        .values({
          submissionId: input.submissionId,
          reporterId: participant.id,
          reason: input.reason,
          details: input.details,
        })
        .returning();

      if (!inserted) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create report" });
      }

      const report = await context.db.query.submissionReports.findFirst({
        where: (sr, { eq }) => eq(sr.id, inserted.id),
        with: {
          reporter: {
            with: {
              user: true,
            },
          },
        },
      });

      if (!report?.reporter?.user) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to load report relations",
        });
      }

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
      const reports = await context.db.query.submissionReports.findMany({
        where: (sr, { eq }) => eq(sr.submissionId, input.submissionId),
        with: {
          reporter: {
            with: {
              user: true,
            },
          },
        },
        orderBy: (sr, { desc }) => desc(sr.createdAt),
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        context.supabase,
        reports.map((report) => report.reporter?.user?.authUserId).filter(Boolean),
      );

      return reports.map((report) => {
        if (!report.reporter?.user) {
          return report;
        }
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
