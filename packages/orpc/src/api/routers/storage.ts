import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { createORPCRouter, protectedProcedure } from "../../api/trpc";
import { normalizeSupabaseStoragePath } from "../../utils/storage";
import { STANDARD_BUCKETS } from "@mirai-app/shared";

const KNOWN_BUCKETS = new Set<string>(Object.values(STANDARD_BUCKETS));

const resolveStoragePath = (value: string) => {
  const info = normalizeSupabaseStoragePath(value);
  if (!info) {
    throw new ORPCError("BAD_REQUEST", { message: "Unsupported storage reference" });
  }
  if (!KNOWN_BUCKETS.has(info.bucket)) {
    throw new ORPCError("BAD_REQUEST", { message: "Invalid storage bucket" });
  }
  return info;
};

const getResumableEndpoint = () => {
  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Missing SUPABASE_URL" });
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

const getPublicUrl = () => {
  const baseUrl = process.env.SUPABASE_PUBLIC_URL ?? process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Missing SUPABASE_URL or SUPABASE_PUBLIC_URL",
    });
  }

  try {
    const url = new URL(baseUrl);
    const host = url.host;
    if (host.endsWith(".supabase.co") && !host.includes(".storage.")) {
      url.host = host.replace(".supabase.co", ".storage.supabase.co");
    }
    url.pathname = "/storage/v1/object/public";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public`;
  }
};

export const storageRouter = createORPCRouter({
  createUploadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z
          .string()
          .min(1)
          .max(500)
          .regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_./-]+$/, "Must be in bucket/path format"),
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
    .handler(async ({ context, input }) => {
      const objectInfo = resolveStoragePath(input.storagePath);

      const { data, error } = await context.supabase.storage
        .from(objectInfo.bucket)
        .createSignedUploadUrl(objectInfo.path, { upsert: Boolean(input.upsert) });

      if (error || !data?.token) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
        expiresInSeconds: z
          .number()
          .int()
          .min(60)
          .max(60 * 60)
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const objectInfo = resolveStoragePath(input.storagePath);
      const expiresIn = input.expiresInSeconds ?? 10 * 60;

      const { data, error } = await context.supabase.storage
        .from(objectInfo.bucket)
        .createSignedUrl(objectInfo.path, expiresIn);

      if (error || !data?.signedUrl) {
        const message =
          typeof error?.message === "string" ? error.message : "Unable to create signed URL";
        const looksLikeNotFound =
          message.toLowerCase().includes("not found") ||
          message.toLowerCase().includes("does not exist");

        throw new ORPCError(looksLikeNotFound ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR", {
          message: looksLikeNotFound ? "Storage object not found" : "Unable to create signed URL",
        });
      }

      return {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    }),

  createPublicUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
      }),
    )
    .handler(({ input }) => {
      const objectInfo = resolveStoragePath(input.storagePath);

      if (objectInfo.bucket !== "files-public") {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Public URLs are only available for files-public bucket. Use createDownloadUrl for other buckets.",
        });
      }

      const publicUrlBase = getPublicUrl();

      return {
        publicUrl: `${publicUrlBase}/${objectInfo.bucket}/${objectInfo.path}`,
      };
    }),
});
