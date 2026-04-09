/**
 * Pure validation utilities
 *
 * These functions perform validation without side effects.
 * They return booleans or validation results.
 */

import type { Result } from "./result";
import { ok, err } from "./result";

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
 * Validate email with Result type
 */
export function validateEmail(email: string): Result<string, string> {
  if (!email || email.trim() === "") {
    return err("Email is required");
  }
  if (!isValidEmail(email)) {
    return err("Invalid email format");
  }
  return ok(email.toLowerCase().trim());
}

/**
 * Validate string is not empty
 */
export function validateNotEmpty(
  value: string,
  fieldName: string,
): Result<string, string> {
  if (!value || value.trim() === "") {
    return err(`${fieldName} is required`);
  }
  return ok(value.trim());
}

/**
 * Validate minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string,
): Result<string, string> {
  if (!value || value.length < minLength) {
    return err(`${fieldName} must be at least ${minLength} characters`);
  }
  return ok(value);
}

/**
 * Validate maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string,
): Result<string, string> {
  if (value && value.length > maxLength) {
    return err(`${fieldName} must be at most ${maxLength} characters`);
  }
  return ok(value || "");
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
 * Validate UUID with Result type
 */
export function validateUUID(
  id: string,
  fieldName = "ID",
): Result<string, string> {
  if (!id || id.trim() === "") {
    return err(`${fieldName} is required`);
  }
  if (!isValidUUID(id)) {
    return err(`Invalid ${fieldName} format`);
  }
  return ok(id.toLowerCase());
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
