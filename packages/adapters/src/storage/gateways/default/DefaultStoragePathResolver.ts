/**
 * Storage Path Resolver - Default implementation
 *
 * Implements the IStoragePathResolverPort for generating storage paths.
 */

import { Effect } from "effect";
import type {
  IStoragePathResolverPort,
  ResolvedStoragePath,
  StorageBucket,
} from "@mirai-app/use-cases/storage/ports";

/**
 * Default implementation of IStoragePathResolverPort
 */
export class DefaultStoragePathResolver implements IStoragePathResolverPort {
  /**
   * Parse and validate a storage path reference
   * @param storagePath Storage path reference (format: "bucket:path/to/file.ext")
   * @returns Resolved path info
   */
  resolvePath(
    storagePath: string,
  ): Effect.Effect<ResolvedStoragePath, never, never> {
    return Effect.sync(() => {
      const colonIndex = storagePath.indexOf(":");

      let bucket: StorageBucket;
      let path: string;

      if (colonIndex === -1) {
        path = storagePath;

        if (storagePath.startsWith("avatars/")) {
          bucket = "images";
        } else if (storagePath.startsWith("trips/")) {
          bucket = "images";
        } else if (storagePath.startsWith("challenges/")) {
          bucket = "images";
        } else if (storagePath.startsWith("activities/")) {
          bucket = "images";
        } else if (storagePath.startsWith("sponsors/")) {
          bucket = "images";
        } else if (storagePath.startsWith("files/")) {
          bucket = "files";
        } else if (storagePath.startsWith("files-public/")) {
          bucket = "files-public";
        } else {
          bucket = "files";
        }
      } else {
        const bucketPart = storagePath.substring(0, colonIndex);
        path = storagePath.substring(colonIndex + 1);

        switch (bucketPart) {
          case "images":
          case "avatar":
            bucket = bucketPart;
            break;
          case "files":
            bucket = "files";
            break;
          case "files-public":
            bucket = "files-public";
            break;
          default:
            bucket = "files";
        }
      }

      return {
        bucket,
        path,
        storagePath: `${bucket}:${path}`,
      };
    });
  }
  /**
   * Resolve a path for user avatars
   */
  resolveUserAvatarPath(userId: string, extension: string): string {
    return `avatars/${userId}.${extension}`;
  }

  /**
   * Resolve a path for trip resources
   */
  resolveTripResourcePath(
    tripId: string,
    resourceId: string,
    extension: string,
  ): string {
    return `trips/${tripId}/resources/${resourceId}.${extension}`;
  }

  /**
   * Resolve a path for challenge photos
   */
  resolveChallengePhotoPath(
    challengeId: string,
    userId: string,
    extension: string,
  ): string {
    return `challenges/${challengeId}/submissions/${userId}.${extension}`;
  }

  /**
   * Resolve a path for activity feed images
   */
  resolveActivityFeedImagePath(
    activityId: string,
    index: number,
    extension: string,
  ): string {
    return `activities/${activityId}/images/${index}.${extension}`;
  }

  /**
   * Resolve a path for sponsor logos
   */
  resolveSponsorLogoPath(sponsorId: string, extension: string): string {
    return `sponsors/${sponsorId}/logo.${extension}`;
  }

  /**
   * Resolve a path for trip sponsor images
   */
  resolveTripSponsorImagePath(
    tripId: string,
    sponsorId: string,
    extension: string,
  ): string {
    return `trips/${tripId}/sponsors/${sponsorId}.${extension}`;
  }

  /**
   * Resolve a path for general uploads
   */
  resolveUploadPath(
    bucket: string,
    entityId: string,
    filename: string,
  ): string {
    return `${bucket}/${entityId}/${filename}`;
  }
}
