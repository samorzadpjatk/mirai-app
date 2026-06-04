import type { DB } from "@mirai-app/db";
import { mapReportsWithEmails } from "@mirai-app/shared/reports";
import type { SupabaseClient } from "@mirai-app/supabase";
import { buildAuthEmailLookup } from "../../../utils/authEmails";

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

  return mapReportsWithEmails(reports, emailByAuthUserId);
};
