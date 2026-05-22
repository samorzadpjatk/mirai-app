import { z } from "zod";
import {
  createORPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../trpc";
import { createReport } from "./mutations";
import { fetchReportsBySubmission } from "./queries";

const handleCreateReport = async ({
  context,
  input,
}: Parameters<typeof createReport>[0]) => createReport({ context, input });

const handleFetchReportsBySubmission = async ({
  context,
  input,
}: Parameters<typeof fetchReportsBySubmission>[0]) =>
  fetchReportsBySubmission({ context, input });

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
    .handler(handleCreateReport),

  getBySubmission: moderatorProcedure
    .input(z.object({ submissionId: z.string() }))
    .handler(handleFetchReportsBySubmission),
});
