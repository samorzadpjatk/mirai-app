import { Effect } from "effect";
import { ValidationError } from "../errors";

/**
 * Pure validation utilities
 *
 * These functions perform validation without side effects.
 * They return booleans or validation results.
 */

/**
 * Email validation regex (simplified, covers most common cases)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate email with Effect type
 */
export function validateEmail(
  email: string,
): Effect.Effect<string, ValidationError, never> {
  if (!email || email.trim() === "") {
    return Effect.fail(
      new ValidationError({
        message: "Email is required",
        field: "email",
      }),
    );
  }
  if (!isValidEmail(email)) {
    return Effect.fail(
      new ValidationError({
        message: "Invalid email format",
        field: "email",
      }),
    );
  }
  return Effect.succeed(email.toLowerCase().trim());
}

/**
 * Validate string is not empty
 */
export function validateNotEmpty(
  value: string,
  fieldName: string,
): Effect.Effect<string, ValidationError, never> {
  if (!value || value.trim() === "") {
    return Effect.fail(
      new ValidationError({
        message: `${fieldName} is required`,
        field: fieldName,
      }),
    );
  }
  return Effect.succeed(value.trim());
}

/**
 * Validate minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string,
): Effect.Effect<string, ValidationError, never> {
  if (!value || value.length < minLength) {
    return Effect.fail(
      new ValidationError({
        message: `${fieldName} must be at least ${minLength} characters`,
        field: fieldName,
      }),
    );
  }
  return Effect.succeed(value);
}

/**
 * Validate maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string,
): Effect.Effect<string, ValidationError, never> {
  if (value && value.length > maxLength) {
    return Effect.fail(
      new ValidationError({
        message: `${fieldName} must be at most ${maxLength} characters`,
        field: fieldName,
      }),
    );
  }
  return Effect.succeed(value || "");
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}

/**
 * Validate UUID with Effect type
 */
export function validateUUID(
  id: string,
  fieldName = "ID",
): Effect.Effect<string, ValidationError, never> {
  if (!id || id.trim() === "") {
    return Effect.fail(
      new ValidationError({
        message: `${fieldName} is required`,
        field: fieldName,
      }),
    );
  }
  if (!isValidUUID(id)) {
    return Effect.fail(
      new ValidationError({
        message: `Invalid ${fieldName} format`,
        field: fieldName,
      }),
    );
  }
  return Effect.succeed(id.toLowerCase());
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Validate date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Validate date range (start before end)
 */
export function isValidDateRange(start: Date, end: Date): boolean {
  return start.getTime() < end.getTime();
}
