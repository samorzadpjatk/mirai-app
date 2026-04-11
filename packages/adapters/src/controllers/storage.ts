import { z } from "zod";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import { normalizeSupabaseStoragePath } from "../utils/storage";

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
 */
export class StorageController {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Resolve and validate storage path
   */
  private resolveStoragePath(value: string): StoragePathInfo {
    const info = normalizeSupabaseStoragePath(value);
    if (!info) {
      return {
        success: false,
        error: "Unsupported storage reference",
      } as unknown as StoragePathInfo;
    }
    return info;
  }

  /**
   * Get resumable upload endpoint URL
   */
  private getResumableEndpoint(): string {
    const baseUrl = process.env.SUPABASE_URL;
    if (!baseUrl) {
      return {
        success: false,
        error: "Missing SUPABASE_URL",
      } as unknown as string;
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
      return {
        success: false,
        error: "Missing SUPABASE_URL or SUPABASE_PUBLIC_URL",
      } as unknown as string;
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

    const { data, error } = await this.supabase.storage
      .from(objectInfo.bucket)
      .createSignedUploadUrl(objectInfo.path, {
        upsert: Boolean(parsed.data.upsert),
      });

    if (error || !data?.token) {
      return {
        success: false,
        error: "Unable to create signed upload URL",
      };
    }

    const resumableUrl = this.getResumableEndpoint();
    if (typeof resumableUrl !== "string") {
      return {
        success: false,
        error: "Missing SUPABASE_URL",
      };
    }

    return {
      success: true,
      data: {
        resumableUrl,
        token: data.token,
        bucket: objectInfo.bucket,
        objectPath: objectInfo.path,
        storagePath: objectInfo.storagePath,
      },
    };
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

    const { data, error } = await this.supabase.storage
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

      return {
        success: false,
        error: looksLikeNotFound
          ? "Storage object not found"
          : "Unable to create signed URL",
        code: looksLikeNotFound ? "NOT_FOUND" : undefined,
      };
    }

    return {
      success: true,
      data: {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    };
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

    const publicUrlBase = this.getPublicUrlBase();
    if (typeof publicUrlBase !== "string") {
      return {
        success: false,
        error: "Missing SUPABASE_URL or SUPABASE_PUBLIC_URL",
      };
    }

    return {
      success: true,
      data: {
        publicUrl: `${publicUrlBase}/${objectInfo.bucket}/${objectInfo.path}`,
      },
    };
  }
}
