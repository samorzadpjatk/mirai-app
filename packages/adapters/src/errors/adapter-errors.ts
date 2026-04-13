/**
 * AdapterErrors - Infrastructure layer error classes
 *
 * These errors represent failures that occur when interacting with external
 * systems like databases, APIs, file storage, and other infrastructure.
 * They use Effect's Data.TaggedError pattern for type-safe error handling.
 *
 * ## Error Types
 *
 * - DatabaseError - Prisma/database operation failures
 * - ExternalAPIError - Third-party API failures
 * - StorageError - File/storage operation failures
 * - MappingError - Data transformation failures
 * - ConfigurationError - Missing/invalid configuration
 *
 * ## Usage
 *
 * ```typescript
 * import { DatabaseError } from "@mirai-app/adapters/errors";
 * import { Effect, Data } from "effect";
 *
 * const findUser = (id: string): Effect.Effect<User | null, DatabaseError, never> =>
 *   Effect.tryPromise({
 *     try: () => prisma.user.findUnique({ where: { id } }),
 *     catch: (error) => new DatabaseError({
 *       operation: "findUser",
 *       message: "Failed to find user",
 *       cause: error
 *     }),
 *   });
 * ```
 *
 * @module AdapterErrors
 */

import { Data } from "effect";

// =============================================================================
// Service Errors
// =============================================================================

/**
 * Error thrown when a service operation fails
 *
 * Used by service layer classes that interact with external systems
 * or perform complex business operations.
 *
 * @example
 * ```typescript
 * const error = new ServiceError({
 *   operation: "sendNotification",
 *   message: "Failed to send push notification",
 *   cause: expoError,
 * });
 * ```
 */
export class ServiceError extends Data.TaggedError("ServiceError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "SERVICE_ERROR" as const;
}

// =============================================================================
// Database Errors
// =============================================================================

/**
 * Error thrown when a database operation fails
 *
 * Uses Effect's Data.TaggedError for type-safe error handling.
 *
 * @example
 * ```typescript
 * const error = new DatabaseError({
 *   operation: "createUser",
 *   message: "Unique constraint violation on email",
 *   cause: prismaError,
 * });
 * ```
 */
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "DATABASE_ERROR" as const;
}

/**
 * Error thrown when a database connection fails
 *
 * @example
 * ```typescript
 * const error = new DatabaseConnectionError({
 *   message: "Connection timeout after 30s",
 *   cause: connectionError,
 * });
 * ```
 */
export class DatabaseConnectionError extends Data.TaggedError(
  "DatabaseConnectionError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "CONNECTION_ERROR" as const;
}

/**
 * Error thrown when a database transaction fails
 *
 * @example
 * ```typescript
 * const error = new DatabaseTransactionError({
 *   operation: "purchaseReward",
 *   message: "Transaction rolled back due to deadlock",
 *   cause: txError,
 * });
 * ```
 */
export class DatabaseTransactionError extends Data.TaggedError(
  "DatabaseTransactionError",
)<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "TRANSACTION_ERROR" as const;
}

// =============================================================================
// External API Errors
// =============================================================================

/**
 * Error thrown when an external API call fails
 *
 * @example
 * ```typescript
 * const error = new ExternalAPIError({
 *   service: "SupabaseStorage",
 *   endpoint: "/upload",
 *   statusCode: 413,
 *   message: "File size exceeds limit",
 *   code: "API_ERROR"
 * });
 * ```
 */
export class ExternalAPIError extends Error {
  readonly _tag = "ExternalAPIError" as const;
  readonly code = "API_ERROR" as const;
  readonly service: string;
  readonly endpoint: string;
  readonly statusCode?: number;
  override readonly message: string;

  constructor(props: {
    service: string;
    endpoint: string;
    statusCode?: number;
    message: string;
  }) {
    super(
      `API error from '${props.service}' (${props.endpoint}): ${props.message}${
        props.statusCode ? ` (status: ${props.statusCode})` : ""
      }`,
    );
    this.service = props.service;
    this.endpoint = props.endpoint;
    this.statusCode = props.statusCode;
    this.message = props.message;
  }
}

/**
 * Error thrown when an external API times out
 *
 * @example
 * ```typescript
 * const error = new ExternalAPITimeoutError({
 *   service: "PushNotificationAPI",
 *   endpoint: "/send",
 *   timeoutMs: 5000,
 *   code: "API_TIMEOUT"
 * });
 * ```
 */
export class ExternalAPITimeoutError extends Error {
  readonly _tag = "ExternalAPITimeoutError" as const;
  readonly code = "API_TIMEOUT" as const;
  readonly service: string;
  readonly endpoint: string;
  readonly timeoutMs: number;

  constructor(props: { service: string; endpoint: string; timeoutMs: number }) {
    super(
      `API timeout from '${props.service}' (${props.endpoint}) after ${props.timeoutMs}ms`,
    );
    this.service = props.service;
    this.endpoint = props.endpoint;
    this.timeoutMs = props.timeoutMs;
  }
}

// =============================================================================
// Storage Errors
// =============================================================================

/**
 * Error thrown when a storage operation fails
 *
 * @example
 * ```typescript
 * const error = new StorageError({
 *   operation: "uploadFile",
 *   path: "/avatars/user-123.jpg",
 *   message: "Insufficient permissions",
 *   cause: storageError,
 *   code: "STORAGE_ERROR"
 * });
 * ```
 */
export class StorageError extends Error {
  readonly _tag = "StorageError" as const;
  readonly code = "STORAGE_ERROR" as const;
  readonly operation: string;
  readonly path: string;
  override readonly message: string;
  override readonly cause?: unknown;

  constructor(props: {
    operation: string;
    path: string;
    message: string;
    cause?: unknown;
  }) {
    super(
      `Storage error in '${props.operation}' at '${props.path}': ${props.message}`,
    );
    this.operation = props.operation;
    this.path = props.path;
    this.message = props.message;
    this.cause = props.cause;
  }
}

/**
 * Error thrown when a file is not found in storage
 *
 * @example
 * ```typescript
 * const error = new StorageFileNotFoundError({
 *   path: "/documents/report-123.pdf",
 *   code: "FILE_NOT_FOUND"
 * });
 * ```
 */
export class StorageFileNotFoundError extends Error {
  readonly _tag = "StorageFileNotFoundError" as const;
  readonly code = "FILE_NOT_FOUND" as const;
  readonly path: string;

  constructor(props: { path: string }) {
    super(`File not found at '${props.path}'`);
    this.path = props.path;
  }
}

// =============================================================================
// Mapping/Data Transformation Errors
// =============================================================================

/**
 * Error thrown when data mapping/transformation fails
 *
 * @example
 * ```typescript
 * const error = new MappingError({
 *   source: "PrismaUser",
 *   target: "UserDomain",
 *   field: "email",
 *   message: "Invalid email format in database",
 *   code: "MAPPING_ERROR"
 * });
 * ```
 */
export class MappingError extends Error {
  readonly _tag = "MappingError" as const;
  readonly code = "MAPPING_ERROR" as const;
  readonly source: string;
  readonly target: string;
  readonly field?: string;
  override readonly message: string;

  constructor(props: {
    source: string;
    target: string;
    field?: string;
    message: string;
  }) {
    super(
      `Mapping error from '${props.source}' to '${props.target}'${
        props.field ? ` on field '${props.field}'` : ""
      }: ${props.message}`,
    );
    this.source = props.source;
    this.target = props.target;
    this.field = props.field;
    this.message = props.message;
  }
}

// =============================================================================
// Configuration Errors
// =============================================================================

/**
 * Error thrown when a required configuration is missing or invalid
 *
 * @example
 * ```typescript
 * const error = new ConfigurationError({
 *   key: "SUPABASE_URL",
 *   message: "Environment variable not set",
 *   code: "CONFIG_ERROR"
 * });
 * ```
 */
export class ConfigurationError extends Error {
  readonly _tag = "ConfigurationError" as const;
  readonly code = "CONFIG_ERROR" as const;
  readonly key: string;
  override readonly message: string;

  constructor(props: { key: string; message: string }) {
    super(`Configuration error for '${props.key}': ${props.message}`);
    this.key = props.key;
    this.message = props.message;
  }
}

// =============================================================================
// Union Type and Type Guards
// =============================================================================

/**
 * Union type of all adapter errors
 */
export type AdapterError =
  | ServiceError
  | DatabaseError
  | DatabaseConnectionError
  | DatabaseTransactionError
  | ExternalAPIError
  | ExternalAPITimeoutError
  | StorageError
  | StorageFileNotFoundError
  | MappingError
  | ConfigurationError;

/**
 * Type guard to check if an error is an AdapterError
 */
export function isAdapterError(error: unknown): error is AdapterError {
  return (
    error instanceof ServiceError ||
    error instanceof DatabaseError ||
    error instanceof DatabaseConnectionError ||
    error instanceof DatabaseTransactionError ||
    error instanceof ExternalAPIError ||
    error instanceof ExternalAPITimeoutError ||
    error instanceof StorageError ||
    error instanceof StorageFileNotFoundError ||
    error instanceof MappingError ||
    error instanceof ConfigurationError
  );
}

/**
 * Get a human-readable error message from any adapter error
 */
export function getAdapterErrorMessage(error: AdapterError): string {
  return error.message;
}

/**
 * Get error code from any adapter error
 */
export function getAdapterErrorCode(error: AdapterError): string {
  return error.code;
}
