import {
  DateTimeResolver,
  EmailAddressResolver,
  UUIDResolver,
  JSONObjectResolver,
  URLResolver,
  BigIntResolver,
} from "graphql-scalars";
import type { GraphQLScalarType } from "graphql";
import { builder } from "./builder";

/**
 * Available scalar names from graphql-scalars
 */
export type ScalarName =
  | "DateTime"
  | "EmailAddress"
  | "UUID"
  | "JSONObject"
  | "URL"
  | "BigInt";

/**
 * Scalar configuration type
 */
export interface ScalarsConfig {
  name: ScalarName;
  resolver: GraphQLScalarType;
  description?: string;
}

/**
 * Built-in scalars registration
 * These are automatically available in the schema
 */
export const scalars: Record<string, ScalarsConfig> = {
  DateTime: {
    name: "DateTime",
    resolver: DateTimeResolver,
    description: "ISO 8601 date time string",
  },
  EmailAddress: {
    name: "EmailAddress",
    resolver: EmailAddressResolver,
    description: "RFC 5322 compliant email address",
  },
  UUID: {
    name: "UUID",
    resolver: UUIDResolver,
    description: "Universally unique identifier",
  },
  JSONObject: {
    name: "JSONObject",
    resolver: JSONObjectResolver,
    description: "Arbitrary JSON object",
  },
  URL: {
    name: "URL",
    resolver: URLResolver,
    description: "RFC 3986 compliant URL",
  },
  BigInt: {
    name: "BigInt",
    resolver: BigIntResolver,
    description: "Arbitrary precision integer",
  },
};

/**
 * Register all default scalars with the builder
 *
 * This is called automatically when the builder is created.
 * You typically don't need to call this directly.
 */
export function registerScalars(): void {
  for (const scalar of Object.values(scalars)) {
    builder.addScalarType(scalar.name, scalar.resolver, {
      description: scalar.description,
    });
  }
}

/**
 * Parse a DateTime string to Date object
 *
 * @param value - The ISO 8601 date string to parse
 * @returns The parsed Date object
 * @throws Error if the value is invalid
 */
export function parseDateTime(value: unknown): Date {
  if (typeof value !== "string") {
    throw new TypeError("DateTime must be a string");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid DateTime: ${value}`);
  }
  return date;
}

/**
 * Serialize a Date object to ISO 8601 string
 *
 * @param value - The Date object to serialize
 * @returns The ISO 8601 string
 */
export function serializeDateTime(value: unknown): string {
  if (!(value instanceof Date)) {
    throw new TypeError("DateTime must be a Date object");
  }
  return value.toISOString();
}

// Register scalars when this module is imported
registerScalars();
