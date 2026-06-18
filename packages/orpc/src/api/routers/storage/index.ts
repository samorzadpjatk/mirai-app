import { z } from "zod";
import { createORPCRouter, protectedProcedure } from "../../orpc";
import { createDownloadUrl, createPublicUrl, createUploadUrl } from "./queries";

const handleCreateUploadUrl = async ({
  context,
  input,
}: {
  context: Parameters<typeof createUploadUrl>[0];
  input: Parameters<typeof createUploadUrl>[1];
}) => createUploadUrl(context, input);

const handleCreateDownloadUrl = async ({
  context,
  input,
}: {
  context: Parameters<typeof createDownloadUrl>[0];
  input: Parameters<typeof createDownloadUrl>[1];
}) => createDownloadUrl(context, input);

const handleCreatePublicUrl = ({
  context,
  input,
}: {
  context: Parameters<typeof createPublicUrl>[0];
  input: Parameters<typeof createPublicUrl>[1];
}) => createPublicUrl(context, input);

export const storageRouter = createORPCRouter({
  createUploadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z
          .string()
          .min(1)
          .max(500)
          .regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./ -]+$/, "Must be in bucket/path format"),
        upsert: z.boolean().optional(),
        fileSize: z
          .number()
          .int()
          .max(10 * 1024 * 1024)
          .optional(),
        contentType: z
          .string()
          .regex(
            /^image\/(jpeg|png|webp|gif)|application\/pdf|video\/(mp4|mov|webm)$/,
            "Unsupported content type",
          )
          .optional(),
      }),
    )
    .handler(handleCreateUploadUrl),

  createDownloadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        expiresInSeconds: z
          .number()
          .int()
          .min(60)
          .max(60 * 60)
          .optional(),
      }),
    )
    .handler(handleCreateDownloadUrl),

  createPublicUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
      }),
    )
    .handler(handleCreatePublicUrl),
});
