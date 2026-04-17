import { Effect } from "effect";
import type { StorageDownloadUrlDTO } from "../dto/StorageDTOs";
import { StoragePortTag } from "../ports/StoragePort";
import { StoragePathResolverPortTag } from "../ports/StoragePathResolverPort";
import {
  StoragePathResolutionError,
  StorageObjectNotFoundError,
  SignedUrlCreationError,
} from "../errors/StorageErrors";

/**
 * Input for CreateDownloadUrlUseCase
 */
export interface CreateDownloadUrlInput {
  storagePath: string;
  expiresInSeconds?: number;
}

/**
 * Default expiration time for signed URLs (10 minutes)
 */
const DEFAULT_EXPIRES_IN_SECONDS = 600;

/**
 * Maximum expiration time (1 hour)
 */
const MAX_EXPIRES_IN_SECONDS = 3600;

/**
 * Minimum expiration time (1 minute)
 */
const MIN_EXPIRES_IN_SECONDS = 60;

/**
 * Create Download URL Use Case
 *
 * Creates a signed download URL for temporary access to a storage object.
 */
export class CreateDownloadUrlUseCase {
  execute(input: CreateDownloadUrlInput) {
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

      // Calculate expiration time with bounds
      const expiresInSeconds = clampExpiresIn(
        input.expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS,
      );

      // Create signed download URL through storage port
      const downloadResult = yield* storagePort.createSignedDownloadUrl({
        bucket: resolvedPath.bucket,
        path: resolvedPath.path,
        expiresInSeconds,
      });

      // Calculate expiration timestamp
      const expiresAt = new Date(
        Date.now() + expiresInSeconds * 1000,
      ).toISOString();

      return {
        signedUrl: downloadResult.signedUrl,
        expiresAt,
      };
    });
  }
}

/**
 * Clamp expiration time to valid range
 */
function clampExpiresIn(seconds: number): number {
  return Math.max(
    MIN_EXPIRES_IN_SECONDS,
    Math.min(MAX_EXPIRES_IN_SECONDS, seconds),
  );
}
