import { Schema } from "effect";
import { NotificationScheduleType } from "@mirai-app/domain";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/.+/;

/**
 * Helper to run validation and return zod-like result
 */
function safeParse<T>(
  schema: Schema.Schema<T>,
  input: unknown,
): { success: true; data: T } | { success: false; error: { message: string } } {
  const result = Schema.decodeUnknownEither(schema)(input);
  if (result._tag === "Right") {
    return { success: true, data: result.right };
  }
  const errorStr = String(result.left);
  const message = errorStr.includes(": ")
    ? errorStr.split(": ").pop()!
    : errorStr;
  return { success: false, error: { message } };
}

// Base schemas
const UUIDString = Schema.String.pipe(
  Schema.pattern(UUID_REGEX, { message: () => "Invalid UUID format" }),
);

const OptionalUUID = Schema.optional(Schema.Union(Schema.Null, UUIDString));

const PaginationSchema = Schema.Struct({
  limit: Schema.optional(
    Schema.Number.pipe(
      Schema.int({ message: () => "Limit must be an integer" }),
      Schema.greaterThan(0, { message: () => "Limit must be at least 1" }),
      Schema.lessThanOrEqualTo(100, {
        message: () => "Limit must be at most 100",
      }),
    ),
  ),
  offset: Schema.optional(
    Schema.Number.pipe(
      Schema.int({ message: () => "Offset must be an integer" }),
      Schema.greaterThanOrEqualTo(0, {
        message: () => "Offset must be at least 0",
      }),
    ),
  ),
});

const FilterSchema = Schema.Struct({
  tripId: Schema.optional(Schema.Union(Schema.Null, Schema.String)),
  notificationType: Schema.optional(Schema.Enums(NotificationScheduleType)),
  isActive: Schema.optional(Schema.Boolean),
  startDateFrom: Schema.optional(Schema.DateFromString),
  startDateTo: Schema.optional(Schema.DateFromString),
  search: Schema.optional(Schema.String),
});

// Validators
export const validateGetAllInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      pagination: Schema.optional(PaginationSchema),
      filter: Schema.optional(FilterSchema),
    }),
    input,
  );

export const validateGetByIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: UUIDString,
    }),
    input,
  );

export const validateGetUpcomingInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      days: Schema.optional(
        Schema.Number.pipe(
          Schema.int({ message: () => "Days must be an integer" }),
          Schema.greaterThanOrEqualTo(1, {
            message: () => "Days must be at least 1",
          }),
          Schema.lessThanOrEqualTo(30, {
            message: () => "Days must be at most 30",
          }),
        ),
      ),
    }),
    input,
  );

export const validateCreateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      name: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Name is required" }),
        Schema.maxLength(100, {
          message: () => "Name must be at most 100 characters",
        }),
      ),
      tripId: OptionalUUID,
      notificationType: Schema.Enums(NotificationScheduleType),
      notificationTitle: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.maxLength(200, {
              message: () => "Title must be at most 200 characters",
            }),
          ),
        ),
      ),
      notificationBody: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.maxLength(2000, {
              message: () => "Body must be at most 2000 characters",
            }),
          ),
        ),
      ),
      notificationUrl: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.pattern(URL_REGEX, { message: () => "Invalid URL format" }),
            Schema.maxLength(500, {
              message: () => "URL must be at most 500 characters",
            }),
          ),
        ),
      ),
      startDate: Schema.DateFromString,
      endDate: Schema.DateFromString,
      hour: Schema.Number.pipe(
        Schema.int({ message: () => "Hour must be an integer" }),
        Schema.greaterThanOrEqualTo(0, {
          message: () => "Hour must be at least 0",
        }),
        Schema.lessThanOrEqualTo(23, {
          message: () => "Hour must be at most 23",
        }),
      ),
      minute: Schema.Number.pipe(
        Schema.int({ message: () => "Minute must be an integer" }),
        Schema.greaterThanOrEqualTo(0, {
          message: () => "Minute must be at least 0",
        }),
        Schema.lessThanOrEqualTo(59, {
          message: () => "Minute must be at most 59",
        }),
      ),
      isActive: Schema.optional(Schema.Boolean),
      createdById: UUIDString,
    }),
    input,
  );

export const validateUpdateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: UUIDString,
      name: Schema.optional(
        Schema.String.pipe(
          Schema.minLength(1, { message: () => "Name is required" }),
          Schema.maxLength(100, {
            message: () => "Name must be at most 100 characters",
          }),
        ),
      ),
      notificationTitle: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.maxLength(200, {
              message: () => "Title must be at most 200 characters",
            }),
          ),
        ),
      ),
      notificationBody: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.maxLength(2000, {
              message: () => "Body must be at most 2000 characters",
            }),
          ),
        ),
      ),
      notificationUrl: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.pattern(URL_REGEX, { message: () => "Invalid URL format" }),
            Schema.maxLength(500, {
              message: () => "URL must be at most 500 characters",
            }),
          ),
        ),
      ),
      startDate: Schema.optional(Schema.DateFromString),
      endDate: Schema.optional(Schema.DateFromString),
      hour: Schema.optional(
        Schema.Number.pipe(
          Schema.int({ message: () => "Hour must be an integer" }),
          Schema.greaterThanOrEqualTo(0, {
            message: () => "Hour must be at least 0",
          }),
          Schema.lessThanOrEqualTo(23, {
            message: () => "Hour must be at most 23",
          }),
        ),
      ),
      minute: Schema.optional(
        Schema.Number.pipe(
          Schema.int({ message: () => "Minute must be an integer" }),
          Schema.greaterThanOrEqualTo(0, {
            message: () => "Minute must be at least 0",
          }),
          Schema.lessThanOrEqualTo(59, {
            message: () => "Minute must be at most 59",
          }),
        ),
      ),
      isActive: Schema.optional(Schema.Boolean),
    }),
    input,
  );

export const validateDeleteInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: UUIDString,
    }),
    input,
  );

export const validateBulkDeleteInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      ids: Schema.NonEmptyArray(UUIDString),
    }),
    input,
  );

export const validateToggleActiveInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: UUIDString,
    }),
    input,
  );

export const validateBulkToggleActiveInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      ids: Schema.NonEmptyArray(UUIDString),
      isActive: Schema.Boolean,
    }),
    input,
  );

export const validateDuplicateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: UUIDString,
      name: Schema.optional(
        Schema.String.pipe(
          Schema.minLength(1, { message: () => "Name is required" }),
          Schema.maxLength(100, {
            message: () => "Name must be at most 100 characters",
          }),
        ),
      ),
      startDate: Schema.optional(Schema.DateFromString),
      endDate: Schema.optional(Schema.DateFromString),
      newCreatedById: UUIDString,
    }),
    input,
  );

export const validateUpdateLastRunInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: UUIDString,
      lastRun: Schema.DateFromString,
    }),
    input,
  );

export const validateGetExecutionHistoryInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      scheduleId: UUIDString,
      limit: Schema.optional(
        Schema.Number.pipe(
          Schema.int({ message: () => "Limit must be an integer" }),
          Schema.greaterThan(0, { message: () => "Limit must be at least 1" }),
          Schema.lessThanOrEqualTo(100, {
            message: () => "Limit must be at most 100",
          }),
        ),
      ),
    }),
    input,
  );
