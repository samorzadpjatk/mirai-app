import { z } from "zod";
import { createORPCRouter, protectedProcedure } from "../../orpc";
import { activityCursorSchema } from "../activityFeed/types";
import { getCommunityFull } from "./queries";

const handleGetCommunityFull = async ({
  context,
  input,
}: {
  context: Parameters<typeof getCommunityFull>[0];
  input: Parameters<typeof getCommunityFull>[1];
}) => getCommunityFull(context, input);

export const communityRouter = createORPCRouter({
  getCommunityFull: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        pageSize: z.number().int().min(1).max(100).default(30),
        cursor: activityCursorSchema.nullable().optional(),
      }),
    )
    .handler(handleGetCommunityFull),
});
