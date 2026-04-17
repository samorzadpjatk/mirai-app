import { Context, Effect } from "effect";

/**
 * Valid storage buckets
 */
export type StorageBucket = "images" | "files" | "files-public" | "avatar";

/**
 * Result of resolving a storage path
 */
export interface ResolvedStoragePath {
  bucket: StorageBucket;
  path: string;
  storagePath: string;
}

/**
 * Storage Path Resolver Port - Interface with Context.Tag for Effect DI
 *
 * Parses and validates storage path references.
 */
export interface IStoragePathResolverPort {
  /**
   * Parse and validate a storage path reference
   * @returns Resolved path info or fails with error
   */
  resolvePath(
    storagePath: string,
  ): Effect.Effect<ResolvedStoragePath, never, never>;
}

/**
 * Context.Tag for IStoragePathResolverPort dependency injection
 */
export class StoragePathResolverPortTag extends Context.Tag(
  "StoragePathResolverPort",
)<StoragePathResolverPortTag, IStoragePathResolverPort>() {}
