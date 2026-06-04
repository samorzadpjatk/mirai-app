import { challengeSubmissions, challenges, submissionReports } from "@mirai-app/db";
import { buildReportWithEmail } from "@mirai-app/shared/reports";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { ensureTripNotEnded } from "../../../utils/tripGuards";
import type { ReportContext } from "./queries";
import { ensureTripParticipant } from "./utils";

export const createReport = async ({
  context,
  input,
}: {
  context: ReportContext;
  input: {
    tripId: string;
    submissionId: string;
    reason: string;
    details?: string;
  };
}) => {
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

  return buildReportWithEmail(report, emailByAuthUserId);
};
