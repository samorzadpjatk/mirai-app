import { Context } from "effect";
import type {
  IStoragePathResolverPort,
  IStoragePort,
  ResolvedStoragePath,
  StorageBucket,
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
} from "@mirai-app/domain";

/**
 * StoragePathResolver Port - Context.Tag for Effect DI
 */
export class StoragePathResolverPortTag extends Context.Tag(
  "StoragePathResolverPort",
)<StoragePathResolverPortTag, IStoragePathResolverPort>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type {
  IStoragePathResolverPort,
  IStoragePort,
  ResolvedStoragePath,
  StorageBucket,
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
};

/**
 * @deprecated Use StoragePathResolverPortTag instead. Kept for backward compatibility.
 */
export const StoragePathResolverPort = StoragePathResolverPortTag;

/**
 * @deprecated Use IStoragePathResolverPort instead. Kept for backward compatibility.
 */
export type StoragePathResolverPort = typeof StoragePathResolverPortTag;
