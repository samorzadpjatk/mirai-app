/**
 * Entity Validation Framework
 *
 * Composable validators for entity properties.
 * Returns Result<T, ValidationError> for explicit error handling.
 *
 * @module entity-validation
 */

import type { Result } from "./result";
import { ok, err } from "./result";
import { ValidationError } from "../errors/effect-errors";

/**
 * Validation rules for string fields
 */
export interface StringRule {
  /** Whether the field is required (non-empty) */
  readonly required?: boolean;
  /** Minimum length constraint */
  readonly minLength?: number;
  /** Maximum length constraint */
  readonly maxLength?: number;
  /** Whether to trim whitespace before validation */
  readonly trim?: boolean;
}

/**
 * Validation rules for number fields
 */
export interface NumberRule {
  /** Whether the field is required */
  readonly required?: boolean;
  /** Minimum value constraint */
  readonly min?: number;
  /** Maximum value constraint */
  readonly max?: number;
  /** Whether the value must be an integer */
  readonly integer?: boolean;
}

/**
 * Validation rules for array fields
 */
export interface ArrayRule {
  /** Whether the field is required (non-empty) */
  readonly required?: boolean;
  /** Maximum number of items */
  readonly maxItems?: number;
}

/**
 * Check if a value is null or undefined
 */
function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a string is empty or whitespace-only
 */
function isEmptyString(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Validate a string field.
 *
 * @param value - The string to validate
 * @param field - Field name for error messages
 * @param rule - Validation rules
 * @returns Result with trimmed value or ValidationError
 *
 * @example
 * ```typescript
 * const result = validate.string(name, "name", { required: true, minLength: 3 });
 * if (result.kind === "err") return result;
 * // result.value is the validated (and possibly trimmed) string
 * ```
 */
function validateString(
  value: string,
  field: string,
  rule: StringRule,
): Result<string, ValidationError> {
  // Handle required check
  if (rule.required && isEmptyString(value)) {
    return err(ValidationError.required(field));
  }

  // Apply trim if requested
  let processed = value;
  if (rule.trim) {
    processed = value.trim();
  }

  // Skip further validation if not required and empty
  if (!rule.required && isEmptyString(value)) {
    return ok(processed);
  }

  // Check minLength
  if (rule.minLength !== undefined && processed.length < rule.minLength) {
    return err(ValidationError.minLength(field, rule.minLength));
  }

  // Check maxLength
  if (rule.maxLength !== undefined && processed.length > rule.maxLength) {
    return err(ValidationError.maxLength(field, rule.maxLength));
  }

  return ok(processed);
}

/**
 * Validate a number field.
 *
 * @param value - The number to validate
 * @param field - Field name for error messages
 * @param rule - Validation rules
 * @returns Result with number or ValidationError
 *
 * @example
 * ```typescript
 * const result = validate.number(count, "count", { required: true, min: 0, integer: true });
 * if (result.kind === "err") return result;
 * // result.value is the validated number
 * ```
 */
function validateNumber(
  value: number,
  field: string,
  rule: NumberRule,
): Result<number, ValidationError> {
  // Handle required check
  if (rule.required && isNullOrUndefined(value)) {
    return err(ValidationError.required(field));
  }

  // Skip further validation if not required and null/undefined
  if (!rule.required && isNullOrUndefined(value)) {
    return ok(value);
  }

  // Check NaN
  if (typeof value !== "number" || Number.isNaN(value)) {
    return err(
      new ValidationError({
        message: `${field} must be a valid number`,
        field,
      }),
    );
  }

  // Check integer constraint
  if (rule.integer && !Number.isInteger(value)) {
    return err(
      new ValidationError({ message: `${field} must be an integer`, field }),
    );
  }

  // Check min
  if (rule.min !== undefined && value < rule.min) {
    return err(ValidationError.minValue(field, rule.min));
  }

  // Check max
  if (rule.max !== undefined && value > rule.max) {
    return err(ValidationError.maxValue(field, rule.max));
  }

  return ok(value);
}

/**
 * Validate an ID field.
 * Ensures the value is a non-empty string.
 *
 * @param value - The ID to validate
 * @param field - Field name for error messages
 * @returns Result with ID string or ValidationError
 *
 * @example
 * ```typescript
 * const result = validate.id(tripId, "tripId");
 * if (result.kind === "err") return result;
 * ```
 */
function validateId(
  value: string,
  field: string,
): Result<string, ValidationError> {
  if (typeof value !== "string" || isEmptyString(value)) {
    return err(
      new ValidationError({ message: `${field} must be a valid ID`, field }),
    );
  }

  return ok(value);
}

/**
 * Validate an array field.
 *
 * @param value - The array to validate
 * @param field - Field name for error messages
 * @param rule - Validation rules
 * @returns Result with array or ValidationError
 *
 * @example
 * ```typescript
 * const result = validate.array(items, "items", { required: true, maxItems: 10 });
 * if (result.kind === "err") return result;
 * ```
 */
function validateArray<T>(
  value: T[],
  field: string,
  rule: ArrayRule,
): Result<T[], ValidationError> {
  // Handle required check
  if (rule.required) {
    if (!Array.isArray(value) || value.length === 0) {
      return err(
        new ValidationError({ message: `${field} is required`, field }),
      );
    }
  }

  // Ensure it's an array
  if (!Array.isArray(value)) {
    return err(
      new ValidationError({ message: `${field} must be an array`, field }),
    );
  }

  // Check maxItems
  if (rule.maxItems !== undefined && value.length > rule.maxItems) {
    return err(
      new ValidationError({
        message: `${field} cannot exceed ${rule.maxItems} items`,
        field,
      }),
    );
  }

  return ok(value);
}

/**
 * Validate a date range (start before or equal to end).
 *
 * @param start - The start date
 * @param end - The end date
 * @returns Result with void or ValidationError
 *
 * @example
 * ```typescript
 * const result = validate.dateRange(startDate, endDate);
 * if (result.kind === "err") return result;
 * ```
 */
function validateDateRange(
  start: Date,
  end: Date,
): Result<void, ValidationError> {
  const startTime = start.getTime();
  const endTime = end.getTime();

  if (Number.isNaN(startTime)) {
    return err(
      new ValidationError({
        message: "start date must be a valid date",
        field: "start",
      }),
    );
  }

  if (Number.isNaN(endTime)) {
    return err(
      new ValidationError({
        message: "end date must be a valid date",
        field: "end",
      }),
    );
  }

  if (startTime > endTime) {
    return err(
      new ValidationError({
        message: "start date must be before or equal to end date",
        field: "dateRange",
      }),
    );
  }

  return ok(void 0);
}

/**
 * Validation namespace with all validators
 */
export const validate = {
  string: validateString,
  number: validateNumber,
  id: validateId,
  array: validateArray,
  dateRange: validateDateRange,
} as const;
