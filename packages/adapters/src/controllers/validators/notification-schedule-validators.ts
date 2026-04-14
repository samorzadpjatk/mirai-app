import { Schema } from "effect";
import { NotificationScheduleType } from "@mirai-app/domain";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/.+/;

function safeParse<T>(schema: Schema.Schema<T>, input: unknown) {
  const result = Schema.decodeUnknownEither(schema)(input);
  if (result._tag === "Right")
    return { success: true as const, data: result.right };
  const errorStr = String(result.left);
  const message = errorStr.includes(": ")
    ? errorStr.split(": ").pop()!
    : errorStr;
  return { success: false as const, error: { message } };
}

const PaginationSchema = Schema.optional(
  Schema.Struct({
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.int(),
        Schema.greaterThan(0),
        Schema.lessThanOrEqualTo(100),
      ),
    ),
    offset: Schema.optional(
      Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    ),
  }),
);

const FilterSchema = Schema.optional(
  Schema.Struct({
    tripId: Schema.optional(Schema.Union(Schema.Null, Schema.String)),
    notificationType: Schema.optional(Schema.Enums(NotificationScheduleType)),
    isActive: Schema.optional(Schema.Boolean),
    startDateFrom: Schema.optional(Schema.DateFromString),
    startDateTo: Schema.optional(Schema.DateFromString),
    search: Schema.optional(Schema.String),
  }),
);

export const validateGetAllInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      pagination: PaginationSchema,
      filter: FilterSchema,
    }),
    input,
  );

export const validateGetByIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid schedule ID format",
        }),
      ),
    }),
    input,
  );

export const validateGetUpcomingInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      days: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThanOrEqualTo(1),
          Schema.lessThanOrEqualTo(30),
        ),
      ),
    }),
    input,
  );

export const validateCreateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
      tripId: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(Schema.pattern(UUID_REGEX)),
        ),
      ),
      notificationType: Schema.Enums(NotificationScheduleType),
      notificationTitle: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(200))),
      ),
      notificationBody: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(2000))),
      ),
      notificationUrl: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.pattern(URL_REGEX, { message: () => "Invalid URL" }),
            Schema.maxLength(500),
          ),
        ),
      ),
      startDate: Schema.DateFromString,
      endDate: Schema.DateFromString,
      hour: Schema.Number.pipe(
        Schema.int(),
        Schema.greaterThanOrEqualTo(0),
        Schema.lessThanOrEqualTo(23),
      ),
      minute: Schema.Number.pipe(
        Schema.int(),
        Schema.greaterThanOrEqualTo(0),
        Schema.lessThanOrEqualTo(59),
      ),
      isActive: Schema.optional(Schema.Boolean),
      createdById: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
    }),
    input,
  );

export const validateUpdateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid schedule ID format",
        }),
      ),
      name: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
      ),
      notificationTitle: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(200))),
      ),
      notificationBody: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(2000))),
      ),
      notificationUrl: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(
            Schema.pattern(URL_REGEX, { message: () => "Invalid URL" }),
            Schema.maxLength(500),
          ),
        ),
      ),
      startDate: Schema.optional(Schema.DateFromString),
      endDate: Schema.optional(Schema.DateFromString),
      hour: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThanOrEqualTo(0),
          Schema.lessThanOrEqualTo(23),
        ),
      ),
      minute: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThanOrEqualTo(0),
          Schema.lessThanOrEqualTo(59),
        ),
      ),
      isActive: Schema.optional(Schema.Boolean),
    }),
    input,
  );

export const validateDeleteInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid schedule ID format",
        }),
      ),
    }),
    input,
  );

export const validateBulkDeleteInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      ids: Schema.Array(Schema.String.pipe(Schema.pattern(UUID_REGEX))).pipe(
        Schema.minLength(1),
      ),
    }),
    input,
  );

export const validateToggleActiveInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid schedule ID format",
        }),
      ),
    }),
    input,
  );

export const validateBulkToggleActiveInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      ids: Schema.Array(Schema.String.pipe(Schema.pattern(UUID_REGEX))).pipe(
        Schema.minLength(1),
      ),
      isActive: Schema.Boolean,
    }),
    input,
  );

export const validateDuplicateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid schedule ID format",
        }),
      ),
      name: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
      ),
      startDate: Schema.optional(Schema.DateFromString),
      endDate: Schema.optional(Schema.DateFromString),
      newCreatedById: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
    }),
    input,
  );

export const validateUpdateLastRunInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid schedule ID format",
        }),
      ),
      lastRun: Schema.DateFromString,
    }),
    input,
  );

export const validateGetExecutionHistoryInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      scheduleId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid schedule ID format",
        }),
      ),
      limit: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThan(0),
          Schema.lessThanOrEqualTo(100),
        ),
      ),
    }),
    input,
  );
