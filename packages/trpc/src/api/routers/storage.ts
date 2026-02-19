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

const getPublicBaseUrl = (headers: Headers) => {
  const kongPort = process.env.KONG_HTTP_PORT ?? "8000";
  const explicitPublicUrl = process.env.SUPABASE_PUBLIC_URL?.trim();

  const inferredPublicUrl = (() => {
    const forwardedHost = headers.get("x-forwarded-host");
    const host = (forwardedHost ?? headers.get("host"))?.trim();
    if (!host) return null;

    const proto = (headers.get("x-forwarded-proto") ?? "http").trim();
    try {
      const url = new URL(`${proto}://${host}`);
      url.port = kongPort;
      return url.toString().replace(/\/$/, "");
    } catch {
      return null;
    }
  })();

  return explicitPublicUrl || inferredPublicUrl || process.env.SUPABASE_URL;
};

const getResumableEndpoint = (headers: Headers) => {
  const baseUrl = getPublicBaseUrl(headers);
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

const rewriteSignedUrlHost = (signedUrl: string, headers: Headers) => {
  const publicBaseUrl = getPublicBaseUrl(headers);
  if (!publicBaseUrl) return signedUrl;

  try {
    const target = new URL(signedUrl);
    const publicUrl = new URL(publicBaseUrl);
    target.protocol = publicUrl.protocol;
    target.host = publicUrl.host;
    return target.toString();
  } catch {
    return signedUrl;
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
        resumableUrl: getResumableEndpoint(ctx.headers),
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

      const { data, error } = await ctx.supabase.storage
        .from(objectInfo.bucket)
        .createSignedUrl(objectInfo.path, expiresIn);

      if (error || !data?.signedUrl) {
        const message =
          typeof error?.message === "string"
            ? error.message
            : "Unable to create signed URL";
        const looksLikeNotFound =
          message.toLowerCase().includes("not found") ||
          message.toLowerCase().includes("does not exist");

        throw new TRPCError({
          code: looksLikeNotFound ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: looksLikeNotFound
            ? "Storage object not found"
            : "Unable to create signed URL",
        });
      }

      return {
        signedUrl: rewriteSignedUrlHost(data.signedUrl, ctx.headers),
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    }),
});
