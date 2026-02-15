import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../../api/trpc";
import { normalizeSupabaseStoragePath } from "../../utils/storage";

const resolveStoragePath = (value: string) => {
  const info = normalizeSupabaseStoragePath(value);
  if (!info) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unsupported storage reference",
    });
  }
  return info;
};

const getResumableEndpoint = () => {
  const baseUrl =
    process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Missing SUPABASE_URL",
    });
  }

  try {
    const url = new URL(baseUrl);
    const host = url.host;
    if (host.endsWith(".supabase.co") && !host.includes(".storage.")) {
      url.host = host.replace(".supabase.co", ".storage.supabase.co");
    }
    url.pathname = "/storage/v1/upload/resumable/sign";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return `${baseUrl.replace(/\/$/, "")}/storage/v1/upload/resumable/sign`;
  }
};

export const storageRouter = createTRPCRouter({
  createUploadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        upsert: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const objectInfo = resolveStoragePath(input.storagePath);

      const { data, error } = await ctx.supabase.storage
        .from(objectInfo.bucket)
        .createSignedUploadUrl(objectInfo.path, { upsert: Boolean(input.upsert) });

      if (error || !data?.token) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create signed upload URL",
        });
      }

      return {
        resumableUrl: getResumableEndpoint(),
        token: data.token,
        bucket: objectInfo.bucket,
        objectPath: objectInfo.path,
        storagePath: objectInfo.storagePath,
      };
    }),

  createDownloadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        expiresInSeconds: z.number().int().min(60).max(60 * 60).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const objectInfo = resolveStoragePath(input.storagePath);
      const expiresIn = input.expiresInSeconds ?? 10 * 60;

      // Pre-check existence to return a clean 404 instead of relying on createSignedUrl errors
      const dir = objectInfo.path.includes("/")
        ? objectInfo.path.slice(0, objectInfo.path.lastIndexOf("/"))
        : "";
      const fileName = objectInfo.path.split("/").pop();

      const { data: listData, error: listError } = await ctx.supabase.storage
        .from(objectInfo.bucket)
        .list(dir || undefined, {
          search: fileName,
          limit: 1,
        });

      if (listError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify storage object existence",
        });
      }

      const exists = Array.isArray(listData) && listData.some((item) => item.name === fileName);
      if (!exists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Storage object not found",
        });
      }

      const { data, error } = await ctx.supabase.storage
        .from(objectInfo.bucket)
        .createSignedUrl(objectInfo.path, expiresIn);

      if (error || !data?.signedUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create signed URL",
        });
      }

      return {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    }),
});
