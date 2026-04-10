/**
 * Storage GraphQL Resolvers
 *
 * Resolvers for Storage domain queries and mutations.
 * Delegates to StorageController for Supabase Storage operations.
 *
 * ## Queries
 *
 * - createDownloadUrl(input: CreateDownloadUrlInput!): DownloadUrlResult
 * - createPublicUrl(input: CreatePublicUrlInput!): PublicUrlResult
 *
 * ## Mutations
 *
 * - createUploadUrl(input: CreateUploadUrlInput!): UploadUrlResult
 *
 * @module Storage/resolvers
 */

import { builder } from "../builder";
import { StorageController } from "@mirai-app/adapters";
import { requireAuth } from "../utils/auth-helpers";
import {
  UploadUrlResultType,
  DownloadUrlResultType,
  PublicUrlResultType,
  CreateUploadUrlInput,
  CreateDownloadUrlInput,
  CreatePublicUrlInput,
} from "../types/storage";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: createDownloadUrl - Get a signed download URL
 *
 * Requires authentication. Returns a signed URL that expires after the specified time.
 * The URL can be used to download the file directly from Supabase Storage.
 */
builder.queryField("createDownloadUrl", (t) =>
  t.field({
    description: "Create a signed download URL for a file in Supabase Storage",
    type: DownloadUrlResultType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: CreateDownloadUrlInput,
        description: "Input for creating the download URL",
        required: true,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<{ signedUrl: string; expiresAt: string }> => {
      // Require authentication
      await requireAuth(context);

      const controller =
        context.container.resolve<StorageController>("storageController");

      const result = await controller.createDownloadUrl({
        storagePath: args.input.storagePath,
        expiresInSeconds: args.input.expiresInSeconds ?? undefined,
      });

      if (!result.success) {
        // Map storage error codes to appropriate GraphQL errors
        const errorMessage = result.error.toLowerCase();
        if (errorMessage.includes("not found") || result.code === "NOT_FOUND") {
          throw new Error(`Storage object not found: ${result.error}`);
        }
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

/**
 * Query: createPublicUrl - Get a public URL for public bucket files
 *
 * Requires authentication. Only works for files in the 'files-public' bucket.
 * Returns a public URL that doesn't require authentication to access.
 */
builder.queryField("createPublicUrl", (t) =>
  t.field({
    description: "Create a public URL for a file in the 'files-public' bucket",
    type: PublicUrlResultType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: CreatePublicUrlInput,
        description: "Input for creating the public URL",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<{ publicUrl: string }> => {
      // Require authentication
      await requireAuth(context);

      const controller =
        context.container.resolve<StorageController>("storageController");

      const result = await controller.createPublicUrl({
        storagePath: args.input.storagePath,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createUploadUrl - Get a signed upload URL for resumable uploads
 *
 * Requires authentication. Returns a resumable upload URL and token for uploading files
 * to Supabase Storage. Use the resumableUrl as the upload endpoint and token in the
 * X-Ups-Authorization header.
 */
builder.mutationField("createUploadUrl", (t) =>
  t.field({
    description:
      "Create a signed upload URL for resumable file uploads to Supabase Storage",
    type: UploadUrlResultType,
    authScopes: { authenticated: true },
    args: {
      input: t.arg({
        type: CreateUploadUrlInput,
        description: "Input for creating the upload URL",
        required: true,
      }),
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<{
      resumableUrl: string;
      token: string;
      bucket: string;
      objectPath: string;
      storagePath: string;
    }> => {
      // Require authentication
      await requireAuth(context);

      const controller =
        context.container.resolve<StorageController>("storageController");

      const result = await controller.createUploadUrl({
        storagePath: args.input.storagePath,
        upsert: args.input.upsert ?? undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
