import { buildAuthEmailLookup, resolveAuthEmail } from "../../../utils/authEmails";
import type { DB } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";

export type ReportContext = {
  db: DB;
  supabase: SupabaseClient;
  dbUser: { id: string };
};

export const fetchReportsBySubmission = async ({
  context,
  input,
}: {
  context: ReportContext;
  input: { submissionId: string };
}) => {
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
};
