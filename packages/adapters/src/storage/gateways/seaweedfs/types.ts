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
