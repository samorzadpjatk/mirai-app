import { z } from "zod";
import { Data } from "effect";

/**
 * Upload ticket for authenticated file uploads.
 * Tickets are single-use, expire after 1 hour, and scoped to specific users and buckets.
 */
export interface UploadTicket {
  /** UUID v4 token used for authentication */
  readonly token: string;
  /** User ID who owns this upload */
  readonly userId: string;
  /** Target bucket for the upload */
  readonly bucket: string;
  /** Object key (path) where file will be stored */
  readonly path: string;
  /** Expiration timestamp (TTL, typically 1 hour from creation) */
  readonly expiresAt: Date;
  /** Single-use flag - true if ticket has been consumed */
  readonly used: boolean;
}

/**
 * Zod schema for runtime validation of UploadTicket.
 */
export const UploadTicketSchema = z.object({
  token: z.string().uuid(),
  userId: z.string().min(1),
  bucket: z.string().min(1),
  path: z.string().min(1),
  expiresAt: z.coerce.date(),
  used: z.boolean(),
});

/**
 * Type guard for UploadTicket.
 * Validates that a value conforms to the UploadTicket interface.
 */
export function isUploadTicket(value: unknown): value is UploadTicket {
  const result = UploadTicketSchema.safeParse(value);
  return result.success;
}

/**
 * Parse and validate an UploadTicket from unknown data.
 * Returns the validated ticket or null if validation fails.
 */
export function parseUploadTicket(value: unknown): UploadTicket | null {
  const result = UploadTicketSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * Error thrown when upload ticket validation fails.
 */
export class UploadTicketValidationError extends Data.TaggedError(
  "UploadTicketValidationError",
)<{
  readonly cause: unknown;
  readonly message: string;
}> {}

/**
 * Safely parse an UploadTicket with detailed error information.
 * Returns an Effect that fails with UploadTicketValidationError on invalid data.
 */
export function safeParseUploadTicket(
  value: unknown,
): UploadTicket | UploadTicketValidationError {
  const result = UploadTicketSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return new UploadTicketValidationError({
    cause: result.error,
    message: `Invalid upload ticket: ${result.error.message}`,
  });
}

// =============================================================================
// Tus Hook Payload Types
// =============================================================================

/**
 * Tus hook event types from tusd webhook.
 */
export type TusHookType = "pre-create" | "post-finish" | "post-terminate";

/**
 * Zod schema for TusHookType.
 */
export const TusHookTypeSchema = z.enum([
  "pre-create",
  "post-finish",
  "post-terminate",
]);

/**
 * Type guard for TusHookType.
 */
export function isTusHookType(value: unknown): value is TusHookType {
  return TusHookTypeSchema.safeParse(value).success;
}

/**
 * Metadata included in tusd upload requests.
 */
export interface TusUploadMetadata {
  /** Original filename */
  readonly filename: string;
  /** User ID performing the upload */
  readonly userId: string;
  /** Authentication token for the upload */
  readonly token: string;
}

/**
 * Zod schema for TusUploadMetadata.
 */
export const TusUploadMetadataSchema = z.object({
  filename: z.string().min(1),
  userId: z.string().min(1),
  token: z.string().min(1),
});

/**
 * Type guard for TusUploadMetadata.
 */
export function isTusUploadMetadata(value: unknown): value is TusUploadMetadata {
  return TusUploadMetadataSchema.safeParse(value).success;
}

/**
 * Upload information in tusd webhook payload.
 */
export interface TusUpload {
  /** Unique upload ID assigned by tusd */
  readonly ID: string;
  /** Total size of the upload in bytes */
  readonly Size: number;
  /** Metadata associated with the upload */
  readonly MetaData: TusUploadMetadata;
}

/**
 * Zod schema for TusUpload with defensive parsing.
 * Handles version compatibility by allowing optional fields.
 */
export const TusUploadSchema = z.object({
  ID: z.string().min(1),
  Size: z.number().int().nonnegative(),
  MetaData: TusUploadMetadataSchema,
});

/**
 * Type guard for TusUpload.
 */
export function isTusUpload(value: unknown): value is TusUpload {
  return TusUploadSchema.safeParse(value).success;
}

/**
 * HTTP request information in tusd webhook payload.
 */
export interface TusHttpRequest {
  /** HTTP headers from the request (multi-value map) */
  readonly Header: Record<string, string[]>;
}

/**
 * Zod schema for TusHttpRequest with defensive parsing.
 */
export const TusHttpRequestSchema = z.object({
  Header: z.record(z.array(z.string())),
});

/**
 * Type guard for TusHttpRequest.
 */
export function isTusHttpRequest(value: unknown): value is TusHttpRequest {
  return TusHttpRequestSchema.safeParse(value).success;
}

/**
 * Event details in tusd webhook payload.
 */
export interface TusEvent {
  /** Upload information */
  readonly Upload: TusUpload;
  /** HTTP request details */
  readonly HTTPRequest: TusHttpRequest;
}

/**
 * Zod schema for TusEvent.
 */
export const TusEventSchema = z.object({
  Upload: TusUploadSchema,
  HTTPRequest: TusHttpRequestSchema,
});

/**
 * Type guard for TusEvent.
 */
export function isTusEvent(value: unknown): value is TusEvent {
  return TusEventSchema.safeParse(value).success;
}

/**
 * Complete webhook payload from tusd.
 * Sent to the backend for authentication and processing.
 */
export interface TusHookPayload {
  /** Type of hook event */
  readonly Type: TusHookType;
  /** Event details */
  readonly Event: TusEvent;
}

/**
 * Zod schema for TusHookPayload with defensive parsing.
 * Uses passthrough for forward compatibility with newer tusd versions.
 */
export const TusHookPayloadSchema = z.object({
  Type: TusHookTypeSchema,
  Event: TusEventSchema,
});

/**
 * Type guard for TusHookPayload.
 */
export function isTusHookPayload(value: unknown): value is TusHookPayload {
  return TusHookPayloadSchema.safeParse(value).success;
}

/**
 * Parse and validate a TusHookPayload from unknown data.
 * Returns the validated payload or null if validation fails.
 */
export function parseTusHookPayload(value: unknown): TusHookPayload | null {
  const result = TusHookPayloadSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * Error thrown when tus hook payload validation fails.
 */
export class TusHookPayloadValidationError extends Data.TaggedError(
  "TusHookPayloadValidationError",
)<{
  readonly cause: unknown;
  readonly message: string;
}> {}

/**
 * Safely parse a TusHookPayload with detailed error information.
 * Returns an Effect-compatible error on invalid data.
 */
export function safeParseTusHookPayload(
  value: unknown,
): TusHookPayload | TusHookPayloadValidationError {
  const result = TusHookPayloadSchema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  return new TusHookPayloadValidationError({
    cause: result.error,
    message: `Invalid tus hook payload: ${result.error.message}`,
  });
}

// =============================================================================
// Tus Hook Response Types
// =============================================================================

/**
 * Response to tusd pre-create hook when allowing upload.
 * Allows modifying file info before upload begins.
 */
export interface TusHookAllowResponse {
  /** File info modifications */
  readonly ChangeFileInfo: {
    /** Upload ID (can be modified) */
    readonly ID: string;
    /** Metadata modifications (optional) */
    readonly MetaData?: Record<string, string>;
  };
}

/**
 * Zod schema for TusHookAllowResponse.
 */
export const TusHookAllowResponseSchema = z.object({
  ChangeFileInfo: z.object({
    ID: z.string().min(1),
    MetaData: z.record(z.string()).optional(),
  }),
});

/**
 * HTTP response details for rejection.
 */
export interface TusHttpResponse {
  /** HTTP status code */
  readonly StatusCode: number;
  /** Response headers */
  readonly Headers?: Record<string, string>;
  /** Response body */
  readonly Body?: string;
}

/**
 * Zod schema for TusHttpResponse.
 */
export const TusHttpResponseSchema = z.object({
  StatusCode: z.number().int().min(100).max(599),
  Headers: z.record(z.string()).optional(),
  Body: z.string().optional(),
});

/**
 * Response to tusd hook when rejecting upload.
 */
export interface TusHookRejectResponse {
  /** HTTP response details */
  readonly HTTPResponse: TusHttpResponse;
  /** Flag indicating upload should be rejected */
  readonly RejectUpload: boolean;
}

/**
 * Zod schema for TusHookRejectResponse.
 */
export const TusHookRejectResponseSchema = z.object({
  HTTPResponse: TusHttpResponseSchema,
  RejectUpload: z.literal(true),
});

/**
 * Union type for all tusd hook responses.
 */
export type TusHookResponse = TusHookAllowResponse | TusHookRejectResponse;

/**
 * Zod schema for TusHookResponse (discriminated union).
 */
export const TusHookResponseSchema = z.union([
  TusHookAllowResponseSchema,
  TusHookRejectResponseSchema,
]);

/**
 * Type guard for TusHookResponse.
 */
export function isTusHookResponse(value: unknown): value is TusHookResponse {
  return TusHookResponseSchema.safeParse(value).success;
}

/**
 * Type guard specifically for allow responses.
 */
export function isTusHookAllowResponse(
  value: unknown,
): value is TusHookAllowResponse {
  return TusHookAllowResponseSchema.safeParse(value).success;
}

/**
 * Type guard specifically for reject responses.
 */
export function isTusHookRejectResponse(
  value: unknown,
): value is TusHookRejectResponse {
  return TusHookRejectResponseSchema.safeParse(value).success;
}

/**
 * Create an allow response for tusd pre-create hook.
 */
export function createAllowResponse(
  uploadId: string,
  metadata?: Record<string, string>,
): TusHookAllowResponse {
  return {
    ChangeFileInfo: {
      ID: uploadId,
      ...(metadata && { MetaData: metadata }),
    },
  };
}

/**
 * Create a reject response for tusd hooks.
 * Defaults to 401 Unauthorized for authentication failures.
 */
export function createRejectResponse(
  statusCode: number = 401,
  body?: string,
): TusHookRejectResponse {
  return {
    HTTPResponse: {
      StatusCode: statusCode,
      ...(body && { Body: body }),
    },
    RejectUpload: true,
  };
}

// =============================================================================
// Version Compatibility
// =============================================================================

/**
 * Defensive parser for tusd payloads that handles version differences.
 * Accepts payloads with additional unknown fields (forward compatibility).
 */
export function parseTusHookPayloadDefensive(
  value: unknown,
): TusHookPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields exist
  if (!isTusHookType(obj.Type)) {
    return null;
  }

  if (typeof obj.Event !== "object" || obj.Event === null) {
    return null;
  }

  const event = obj.Event as Record<string, unknown>;

  // Validate Upload structure defensively
  if (typeof event.Upload !== "object" || event.Upload === null) {
    return null;
  }

  const upload = event.Upload as Record<string, unknown>;

  if (typeof upload.ID !== "string" || !upload.ID) {
    return null;
  }

  if (typeof upload.Size !== "number" || upload.Size < 0) {
    return null;
  }

  if (typeof upload.MetaData !== "object" || upload.MetaData === null) {
    return null;
  }

  const metadata = upload.MetaData as Record<string, unknown>;

  if (
    typeof metadata.filename !== "string" ||
    typeof metadata.userId !== "string" ||
    typeof metadata.token !== "string"
  ) {
    return null;
  }

  // Validate HTTPRequest defensively (optional in some versions)
  let httpRequest: TusHttpRequest = { Header: {} };
  if (typeof event.HTTPRequest === "object" && event.HTTPRequest !== null) {
    const req = event.HTTPRequest as Record<string, unknown>;
    if (
      typeof req.Header === "object" &&
      req.Header !== null &&
      !Array.isArray(req.Header)
    ) {
      httpRequest = { Header: req.Header as Record<string, string[]> };
    }
  }

  return {
    Type: obj.Type,
    Event: {
      Upload: {
        ID: upload.ID,
        Size: upload.Size,
        MetaData: {
          filename: metadata.filename,
          userId: metadata.userId,
          token: metadata.token,
        },
      },
      HTTPRequest: httpRequest,
    },
  };
}
