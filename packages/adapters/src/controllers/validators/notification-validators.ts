import { Schema } from "effect";
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

const NotificationStatus = Schema.Literal(
  "DRAFT",
  "READY",
  "SENT",
  "FAILED",
  "CANCELLED",
);
const NotificationPriority = Schema.Literal("LOW", "NORMAL", "HIGH", "URGENT");
const OptionalUrl = Schema.optional(
  Schema.Union(Schema.Null, Schema.String.pipe(Schema.pattern(URL_REGEX))),
);

const PaginationSchema = Schema.Struct({
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
});

export const validateGetByIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid notification ID format",
        }),
      ),
    }),
    input,
  );

export const validateGetByTripIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" }),
      ),
    }),
    input,
  );

export const validateCreateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
      body: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(2000)),
      url: OptionalUrl,
      tripId: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.String.pipe(Schema.pattern(UUID_REGEX)),
        ),
      ),
      createdById: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, { message: () => "Invalid user ID format" }),
      ),
      priority: Schema.optional(NotificationPriority),
      scheduledFor: Schema.optional(
        Schema.Union(Schema.Null, Schema.DateFromString),
      ),
    }),
    input,
  );

export const validateUpdateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      notificationId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid notification ID format",
        }),
      ),
      title: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
      ),
      body: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(2000)),
      ),
      url: OptionalUrl,
      priority: Schema.optional(NotificationPriority),
      scheduledFor: Schema.optional(
        Schema.Union(Schema.Null, Schema.DateFromString),
      ),
    }),
    input,
  );

export const validateUpdateStatusInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      notificationId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid notification ID format",
        }),
      ),
      newStatus: NotificationStatus,
    }),
    input,
  );

export const validateListInput = (input: unknown) =>
  safeParse(PaginationSchema, input);

export const validateListByStatusInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      status: NotificationStatus,
      ...PaginationSchema.fields,
    }),
    input,
  );

export const validateListByPriorityInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      priority: NotificationPriority,
      ...PaginationSchema.fields,
    }),
    input,
  );

export const validateScheduleInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      notificationId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid notification ID format",
        }),
      ),
      scheduledFor: Schema.DateFromString,
    }),
    input,
  );
