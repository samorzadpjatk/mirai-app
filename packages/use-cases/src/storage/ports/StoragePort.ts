import { Context, Effect } from "effect";
import type {
  IStoragePort,
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
} from "@mirai-app/domain";

/**
 * Re-export domain storage types for convenience
 */
export type {
  IStoragePort,
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
};

/**
 * Storage Port Tag - Context.Tag for IStoragePort dependency injection
 *
 * Use this tag to access the IStoragePort implementation in Effect workflows:
 *   const storage = yield* StoragePortTag;
 */
export class StoragePortTag extends Context.Tag("StoragePort")<
  StoragePortTag,
  IStoragePort
>() {}
