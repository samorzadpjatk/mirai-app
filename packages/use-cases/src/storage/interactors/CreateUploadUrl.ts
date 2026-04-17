import { Effect, Data } from "effect";
import type { StorageUploadUrlDTO } from "../dto/StorageDTOs";
import { StoragePortTag } from "../ports/StoragePort";
import {
  StoragePathResolverPortTag,
  type StorageBucket,
} from "../ports/StoragePathResolverPort";
import {
  StoragePathResolutionError,
  SignedUrlCreationError,
  StorageConfigurationError,
} from "../errors/StorageErrors";

/**
 * Input for CreateUploadUrlUseCase
 */
export interface CreateUploadUrlInput {
  storagePath: string;
  upsert?: boolean;
}

/**
 * Create Upload URL Use Case
 *
 * Creates a signed upload URL for resumable file uploads.
 */
export class CreateUploadUrlUseCase {
  execute(input: CreateUploadUrlInput) {
    return Effect.gen(function* () {
      const storagePort = yield* StoragePortTag;
      const pathResolver = yield* StoragePathResolverPortTag;

      // Resolve the storage path to bucket and object path
      const resolvedPath = yield* Effect.try({
        try: () => pathResolver.resolvePath(input.storagePath),
        catch: (error) =>
          new StoragePathResolutionError({
            storagePath: input.storagePath,
            reason: error instanceof Error ? error.message : "Unknown error",
          }),
      }).pipe(Effect.flatten);

      // Get resumable endpoint URL
      const resumableUrl = yield* getResumableEndpoint();

      // Create signed upload URL through storage port
      const uploadResult = yield* storagePort.createSignedUploadUrl({
        bucket: resolvedPath.bucket,
        path: resolvedPath.path,
        upsert: input.upsert ?? false,
      });

      return {
        resumableUrl,
        token: uploadResult.token,
        bucket: resolvedPath.bucket,
        objectPath: resolvedPath.path,
        storagePath: resolvedPath.storagePath,
      };
    });
  }
}

/**
 * Get resumable upload endpoint URL
 */
function getResumableEndpoint(): Effect.Effect<
  string,
  StorageConfigurationError,
  never
> {
  return Effect.gen(function* () {
    const baseUrl = process.env.SUPABASE_URL;

    if (!baseUrl) {
      return yield* Effect.fail(
        new StorageConfigurationError({ configKey: "SUPABASE_URL" }),
      );
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
  });
}
