import { Effect } from "effect";
import type { StoragePublicUrlDTO } from "../dto/StorageDTOs";
import { StoragePathResolverPortTag } from "../ports/StoragePathResolverPort";
import {
  StoragePathResolutionError,
  InvalidStorageBucketError,
  StorageConfigurationError,
} from "../errors/StorageErrors";

/**
 * Input for CreatePublicUrlUseCase
 */
export interface CreatePublicUrlInput {
  storagePath: string;
}

/**
 * Create Public URL Use Case
 *
 * Creates a public URL for objects in the files-public bucket.
 * Public URLs are only available for the files-public bucket.
 */
export class CreatePublicUrlUseCase {
  execute(input: CreatePublicUrlInput) {
    return Effect.gen(function* () {
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

      // Validate that the bucket is files-public
      if (resolvedPath.bucket !== "files-public") {
        return yield* Effect.fail(
          new InvalidStorageBucketError({
            bucket: resolvedPath.bucket,
            allowedBuckets: ["files-public"],
          }),
        );
      }

      // Get public URL base
      const publicUrlBase = yield* getPublicUrlBase();

      // Construct the full public URL
      const publicUrl = `${publicUrlBase}/${resolvedPath.bucket}/${resolvedPath.path}`;

      return {
        publicUrl,
      };
    });
  }
}

/**
 * Get public URL base endpoint
 */
function getPublicUrlBase(): Effect.Effect<
  string,
  StorageConfigurationError,
  never
> {
  return Effect.gen(function* () {
    const baseUrl = process.env.SUPABASE_PUBLIC_URL ?? process.env.SUPABASE_URL;

    if (!baseUrl) {
      return yield* Effect.fail(
        new StorageConfigurationError({
          configKey: "SUPABASE_URL or SUPABASE_PUBLIC_URL",
        }),
      );
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
  });
}
