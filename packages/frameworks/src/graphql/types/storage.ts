/**
 * Storage GraphQL Types
 *
 * Pothos type definitions for Storage domain.
 * Maps storage controller outputs to GraphQL schema types.
 *
 * ## Types
 *
 * - UploadUrlResult: Result from createUploadUrl mutation
 * - DownloadUrlResult: Result from createDownloadUrl query
 * - PublicUrlResult: Result from createPublicUrl query
 *
 * @module Storage/types
 */

import { builder } from "../builder";

// =============================================================================
// Upload URL Result Type
// =============================================================================

/**
 * Upload URL result type
 *
 * Contains all information needed for resumable file uploads to Supabase Storage.
 */
export const UploadUrlResultType = builder.objectType("UploadUrlResult", {
  description: "Result of creating a signed upload URL for resumable uploads",
  authScopes: { public: true },
  fields: (t) => ({
    resumableUrl: t.exposeString("resumableUrl", {
      description: "The resumable upload endpoint URL",
      nullable: false,
    }),
    token: t.exposeString("token", {
      description: "The signed upload token (X-Ups-Authorization header)",
      nullable: false,
    }),
    bucket: t.exposeString("bucket", {
      description: "The storage bucket name",
      nullable: false,
    }),
    objectPath: t.exposeString("objectPath", {
      description: "The path to the object within the bucket",
      nullable: false,
    }),
    storagePath: t.exposeString("storagePath", {
      description: "The full storage path (bucket/path)",
      nullable: false,
    }),
  }),
});

// =============================================================================
// Download URL Result Type
// =============================================================================

/**
 * Download URL result type
 *
 * Contains a signed URL for downloading files with expiration.
 */
export const DownloadUrlResultType = builder.objectType("DownloadUrlResult", {
  description: "Result of creating a signed download URL",
  authScopes: { public: true },
  fields: (t) => ({
    signedUrl: t.exposeString("signedUrl", {
      description: "The signed URL for downloading the file",
      nullable: false,
    }),
    expiresAt: t.field({
      type: "DateTime",
      description: "When the signed URL expires",
      nullable: false,
      resolve: (result: { expiresAt: string }) => new Date(result.expiresAt),
    }),
  }),
});

// =============================================================================
// Public URL Result Type
// =============================================================================

/**
 * Public URL result type
 *
 * Contains a public URL for files in the public bucket.
 */
export const PublicUrlResultType = builder.objectType("PublicUrlResult", {
  description: "Result of creating a public URL",
  authScopes: { public: true },
  fields: (t) => ({
    publicUrl: t.exposeString("publicUrl", {
      description: "The public URL for accessing the file",
      nullable: false,
    }),
  }),
});

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating an upload URL
 */
export const CreateUploadUrlInput = builder.inputType("CreateUploadUrlInput", {
  description: "Input for creating a signed upload URL",
  fields: (t) => ({
    storagePath: t.string({
      description: "The full storage path (bucket/path) for the file",
      required: true,
    }),
    upsert: t.boolean({
      description: "Whether to overwrite existing file (defaults to false)",
      required: false,
    }),
  }),
});

/**
 * Input for creating a download URL
 */
export const CreateDownloadUrlInput = builder.inputType(
  "CreateDownloadUrlInput",
  {
    description: "Input for creating a signed download URL",
    fields: (t) => ({
      storagePath: t.string({
        description: "The full storage path (bucket/path) for the file",
        required: true,
      }),
      expiresInSeconds: t.int({
        description:
          "URL expiration time in seconds (60-3600, defaults to 600)",
        required: false,
      }),
    }),
  },
);

/**
 * Input for creating a public URL
 */
export const CreatePublicUrlInput = builder.inputType("CreatePublicUrlInput", {
  description: "Input for creating a public URL",
  fields: (t) => ({
    storagePath: t.string({
      description:
        "The full storage path (bucket/path) for the file. Only 'files-public' bucket is supported.",
      required: true,
    }),
  }),
});

// =============================================================================
// Export
// =============================================================================

export default UploadUrlResultType;
