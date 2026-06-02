import type { SubmissionReport } from "@mirai-app/db";

type ReportWithAuthUserId = SubmissionReport & {
  reporter: {
    id: string;
    user: {
      id: string;
      authUserId: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

type ReportWithEmail = SubmissionReport & {
  reporter: {
    id: string;
    user: {
      id: string;
      email: string | null;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
};

/**
 * Builds a report response with resolved email from an auth email lookup.
 * Transforms the report's reporter user to include the resolved email.
 */
export function buildReportWithEmail(
  report: ReportWithAuthUserId,
  emailByAuthUserId: Map<string, string | null>,
): ReportWithEmail {
  if (!report.reporter?.user) {
    return report as ReportWithEmail;
  }

  const { authUserId, ...reporterUser } = report.reporter.user;
  const email = emailByAuthUserId.get(authUserId) ?? null;

  return {
    ...report,
    reporter: {
      ...report.reporter,
      user: {
        ...reporterUser,
        email,
      },
    },
  };
}

/**
 * Maps an array of reports with their reporter emails resolved.
 */
export function mapReportsWithEmails(
  reports: ReportWithAuthUserId[],
  emailByAuthUserId: Map<string, string | null>,
): ReportWithEmail[] {
  return reports.map((report) => buildReportWithEmail(report, emailByAuthUserId));
}
