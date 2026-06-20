import { z } from "zod";
import { createORPCRouter, protectedProcedure } from "../../orpc";
import { getHomeFull } from "./queries";

const handleGetHomeFull = async ({
  context,
  input,
}: {
  context: Parameters<typeof getHomeFull>[0];
  input: Parameters<typeof getHomeFull>[1];
}) => getHomeFull(context, input);

export const homeRouter = createORPCRouter({
  getHomeFull: protectedProcedure
    .input(
      z
        .object({
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(30),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .handler(handleGetHomeFull),
});
