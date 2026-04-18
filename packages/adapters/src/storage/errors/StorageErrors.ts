import { Data } from "effect";
import type { IPortError } from "@mirai-app/domain";

/**
 * Storage-specific errors for file storage operations
 *
 * These errors are specific to storage operations and use Data.TaggedError
 * for type-safe error handling with Effect.
 *
 * All errors implement IPortError interface from the domain layer to ensure
 * compatibility with port interfaces.
 */

/**
 * Base storage error for general storage operation failures.
 * Used when no more specific error type applies.
 */
export class StorageError
  extends Data.TaggedError("StorageError")<{
    operation: string;
    bucket?: string;
    path?: string;
    cause?: unknown;
  }>
  implements IPortError
{
  override readonly message = "Storage operation failed";
}

/**
 * Error thrown when a file does not exist in storage.
 * Used for read, delete, or download operations targeting non-existent files.
 */
export class FileNotFoundError
  extends Data.TaggedError("FileNotFoundError")<{
    bucket: string;
    path: string;
  }>
  implements IPortError
{
  override get message(): string {
    return `File not found in bucket "${this.bucket}" at path "${this.path}"`;
  }
}

/**
 * Error thrown when an upload ticket has expired (TTL passed).
 * Used during tusd pre-create hook validation when a ticket's expiration
 * time has been exceeded.
 */
export class UploadTicketExpiredError
  extends Data.TaggedError("UploadTicketExpiredError")<{
    token: string;
    expiredAt: Date;
    currentTime: Date;
  }>
  implements IPortError
{
  override get message(): string {
    const elapsed = Math.floor(
      (this.currentTime.getTime() - this.expiredAt.getTime()) / 1000,
    );
    return `Upload ticket expired ${elapsed} seconds ago. Please request a new upload URL`;
  }
}

/**
 * Error thrown when attempting to use a single-use ticket that has
 * already been consumed for a successful upload.
 */
export class UploadTicketUsedError
  extends Data.TaggedError("UploadTicketUsedError")<{
    token: string;
    usedAt?: Date;
  }>
  implements IPortError
{
  override readonly message =
    "Upload ticket has already been used. Each ticket is valid for a single upload only";
}

/**
 * Error thrown when upload token validation fails.
 * Used when the token format is invalid, the token doesn't exist in Redis,
 * or the token metadata is malformed.
 */
export class InvalidUploadTokenError
  extends Data.TaggedError("InvalidUploadTokenError")<{
    token: string;
    reason: "not_found" | "malformed" | "mismatched";
    details?: string;
  }>
  implements IPortError
{
  override get message(): string {
    const reasonMap = {
      not_found: "Token not found or has been removed",
      malformed: "Token format is invalid",
      mismatched: "Token does not match expected bucket or user",
    };
    return `Invalid upload token: ${reasonMap[this.reason]}${this.details ? ` (${this.details})` : ""}`;
  }
}
