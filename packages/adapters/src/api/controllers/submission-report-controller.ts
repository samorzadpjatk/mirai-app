/**
 * Submission Report Controller
 *
 * tRPC-ready controller wrapping SubmissionReportController with proper procedure types.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, moderatorProcedure } from "../trpc";
import { SubmissionReportController } from "../../controllers/submissionReport-controller";
import { PrismaSubmissionReportRepository } from "../../gateways/PrismaSubmissionReportRepository";

async function buildAuthEmailLookup(
  supabase: {
    auth: {
      admin: {
        getUserById: (
          id: string,
        ) => Promise<{ data: { user: { email?: string } | null } | null }>;
      };
    };
  },
  authUserIds: string[],
): Promise<Record<string, string | null>> {
  const emailByAuthUserId: Record<string, string | null> = {};
  await Promise.all(
    authUserIds.map(async (authUserId) => {
      const { data } = await supabase.auth.admin.getUserById(authUserId);
      emailByAuthUserId[authUserId] = data?.user?.email ?? null;
    }),
  );
  return emailByAuthUserId;
}

function resolveAuthEmail(
  emailByAuthUserId: Record<string, string | null>,
  authUserId: string,
): string | null {
  return emailByAuthUserId[authUserId] ?? null;
}

export const submissionReportController = {
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
      // Verify trip not ended
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
        select: { endDate: true },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const endDate = new Date(trip.endDate);
      const gracePeriodEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
      if (new Date().getTime() > gracePeriodEnd.getTime()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Trip has ended",
        });
      }

      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak dostepu do wyjazdu",
        });
      }

      // Verify submission exists
      const submission = await ctx.db.challengeSubmission.findFirst({
        where: { id: input.submissionId, challenge: { tripId: input.tripId } },
        select: { id: true },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      // Create report using controller
      const repo = new PrismaSubmissionReportRepository(ctx.db);
      const controller = new SubmissionReportController(repo);
      const result = await controller.create(
        {
          tripId: input.tripId,
          submissionId: input.submissionId,
          reason: input.reason,
          details: input.details,
        },
        participant.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("already reported")
            ? "CONFLICT"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      // Fetch reporter info with email
      const reporterRecord = await ctx.db.tripParticipant.findUnique({
        where: { id: participant.id },
        include: {
          user: true,
        },
      });

      if (!reporterRecord?.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reporter info",
        });
      }

      // Get email from auth
      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        reporterRecord.user.authUserId,
      ]);

      return {
        ...result.data,
        reporter: {
          id: participant.id,
          user: {
            id: reporterRecord.user.id,
            firstName: reporterRecord.user.firstName,
            lastName: reporterRecord.user.lastName,
            email: resolveAuthEmail(
              emailByAuthUserId,
              reporterRecord.user.authUserId,
            ),
            hasAvatar: reporterRecord.user.hasAvatar,
          },
        },
      };
    }),

  getBySubmission: moderatorProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaSubmissionReportRepository(ctx.db);
      const controller = new SubmissionReportController(repo);
      const result = await controller.getBySubmission({
        submissionId: input.submissionId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      // Get emails for all reporters
      const reporterIds = result.data.reports.map((r) => r.reporter.id);
      const reporters = await ctx.db.tripParticipant.findMany({
        where: { id: { in: reporterIds } },
        include: { user: true },
      });

      const authUserIds = reporters
        .map((r) => r.user.authUserId)
        .filter(Boolean);
      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        authUserIds,
      );

      // Map to include emails
      return result.data.reports.map((report) => {
        const reporter = reporters.find((r) => r.id === report.reporter.id);
        const email = reporter?.user.authUserId
          ? resolveAuthEmail(emailByAuthUserId, reporter.user.authUserId)
          : null;

        return {
          ...report,
          reporter: {
            ...report.reporter,
            user: {
              ...report.reporter.user,
              email,
            },
          },
        };
      });
    }),
};
