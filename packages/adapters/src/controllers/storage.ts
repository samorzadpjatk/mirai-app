import { z } from "zod";
import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import { normalizeSupabaseStoragePath } from "../utils/storage";
import { effectToControllerResult } from "../utils/controller-helpers";

/**
 * Storage path resolution result
 */
interface StoragePathInfo {
  bucket: string;
  path: string;
  storagePath: string;
}

/**
 * Upload URL result
 */
interface UploadUrlResult {
  resumableUrl: string;
  token: string;
  bucket: string;
  objectPath: string;
  storagePath: string;
}

/**
 * Download URL result
 */
interface DownloadUrlResult {
  signedUrl: string;
  expiresAt: string;
}

/**
 * Public URL result
 */
interface PublicUrlResult {
  publicUrl: string;
}

/**
 * Input validation schemas for storage controller
 */
const schemas = {
  createUploadUrl: z.object({
    storagePath: z.string().min(1, "Storage path is required"),
    upsert: z.boolean().optional(),
  }),

  createDownloadUrl: z.object({
    storagePath: z.string().min(1, "Storage path is required"),
    expiresInSeconds: z
      .number()
      .int()
      .min(60)
      .max(60 * 60)
      .optional(),
  }),

  createPublicUrl: z.object({
    storagePath: z.string().min(1, "Storage path is required"),
  }),
};

/**
 * StorageController
 *
 * Thin controller for storage operations.
 * Delegates to Supabase Storage for file operations.
 * No business logic here - just input validation and error handling.
 *
 * Updated to use Effect patterns for consistent error handling.
 */
export class StorageController {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get resumable upload endpoint URL
   */
  private getResumableEndpoint(): string {
    const baseUrl = process.env.SUPABASE_URL;
    if (!baseUrl) {
      throw new Error("Missing SUPABASE_URL");
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
  }

  /**
   * Get public URL base
   */
  private getPublicUrlBase(): string {
    const baseUrl = process.env.SUPABASE_PUBLIC_URL ?? process.env.SUPABASE_URL;
    if (!baseUrl) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLIC_URL");
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
  }

  /**
   * Create a signed upload URL for resumable uploads
   */
  async createUploadUrl(
    input: unknown,
  ): Promise<
    { success: true; data: UploadUrlResult } | { success: false; error: string }
  > {
    const parsed = schemas.createUploadUrl.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const objectInfo = normalizeSupabaseStoragePath(parsed.data.storagePath);
    if (!objectInfo) {
      return {
        success: false,
        error: "Unsupported storage reference",
      };
    }

    const supabase = this.supabase;

    const effect = Effect.gen(function* () {
      const resumableUrl = yield* Effect.try({
        try: () => {
          const baseUrl = process.env.SUPABASE_URL;
          if (!baseUrl) {
            throw new Error("Missing SUPABASE_URL");
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
        },
        catch: () => new Error("Missing SUPABASE_URL"),
      });

      const { data, error } = yield* Effect.tryPromise({
        try: () =>
          supabase.storage
            .from(objectInfo.bucket)
            .createSignedUploadUrl(objectInfo.path, {
              upsert: Boolean(parsed.data.upsert),
            }),
        catch: () => new Error("Unable to create signed upload URL"),
      });

      if (error || !data?.token) {
        return yield* Effect.fail(
          new Error("Unable to create signed upload URL"),
        );
      }

      return {
        resumableUrl,
        token: data.token,
        bucket: objectInfo.bucket,
        objectPath: objectInfo.path,
        storagePath: objectInfo.storagePath,
      };
    });

    return await effectToControllerResult(effect);
  }

  /**
   * Create a signed download URL with expiration
   */
  async createDownloadUrl(
    input: unknown,
  ): Promise<
    | { success: true; data: DownloadUrlResult }
    | { success: false; error: string; code?: "NOT_FOUND" }
  > {
    const parsed = schemas.createDownloadUrl.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const objectInfo = normalizeSupabaseStoragePath(parsed.data.storagePath);
    if (!objectInfo) {
      return {
        success: false,
        error: "Unsupported storage reference",
      };
    }

    const expiresIn = parsed.data.expiresInSeconds ?? 10 * 60;
    const supabase = this.supabase;

    const effect = Effect.gen(function* () {
      const { data, error } = yield* Effect.tryPromise({
        try: () =>
          supabase.storage
            .from(objectInfo.bucket)
            .createSignedUrl(objectInfo.path, expiresIn),
        catch: (e) => new Error(String(e)),
      });

      if (error || !data?.signedUrl) {
        const message =
          typeof error?.message === "string"
            ? error.message
            : "Unable to create signed URL";
        const looksLikeNotFound =
          message.toLowerCase().includes("not found") ||
          message.toLowerCase().includes("does not exist");

        return yield* Effect.fail(
          new Error(
            looksLikeNotFound
              ? "Storage object not found"
              : "Unable to create signed URL",
          ),
        );
      }

      return {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    });

    const result = await effectToControllerResult(effect);

    // Add code for NOT_FOUND case
    if (!result.success && result.error === "Storage object not found") {
      return { success: false, error: result.error, code: "NOT_FOUND" };
    }

    return result;
  }

  /**
   * Create a public URL for objects in the public bucket
   */
  async createPublicUrl(
    input: unknown,
  ): Promise<
    { success: true; data: PublicUrlResult } | { success: false; error: string }
  > {
    const parsed = schemas.createPublicUrl.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const objectInfo = normalizeSupabaseStoragePath(parsed.data.storagePath);
    if (!objectInfo) {
      return {
        success: false,
        error: "Unsupported storage reference",
      };
    }

    if (objectInfo.bucket !== "files-public") {
      return {
        success: false,
        error:
          "Public URLs are only available for files-public bucket. Use createDownloadUrl for other buckets.",
      };
    }

    const effect = Effect.gen(function* () {
      const publicUrlBase = yield* Effect.try({
        try: () => {
          const baseUrl =
            process.env.SUPABASE_PUBLIC_URL ?? process.env.SUPABASE_URL;
          if (!baseUrl) {
            throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLIC_URL");
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
        },
        catch: () => new Error("Missing SUPABASE_URL or SUPABASE_PUBLIC_URL"),
      });

      return {
        publicUrl: `${publicUrlBase}/${objectInfo.bucket}/${objectInfo.path}`,
      };
    });

    return await effectToControllerResult(effect);
  }
}
