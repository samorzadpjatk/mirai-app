import { Schema } from "effect";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

const StatusEnum = Schema.Literal(
  "pending",
  "success",
  "partial_failure",
  "failure",
);

// Input schemas - using optional fields instead of wrapping whole schema
const GetDeliveriesSchema = Schema.Struct({
  tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
  status: Schema.optional(StatusEnum),
  scheduleId: Schema.optional(Schema.String),
  startDate: Schema.optional(Schema.Date),
  endDate: Schema.optional(Schema.Date),
  limit: Schema.optional(
    Schema.Number.pipe(Schema.greaterThan(0), Schema.lessThanOrEqualTo(100)),
  ),
  offset: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(0))),
});
export const validateGetDeliveriesInput = (input: unknown) =>
  safeParse(GetDeliveriesSchema, input);

export const validateGetDeliveryByNotificationIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      notificationId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
      tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
    }),
    input,
  );

const GetDeliveryStatsSchema = Schema.Struct({
  tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
  startDate: Schema.optional(Schema.Date),
  endDate: Schema.optional(Schema.Date),
  scheduleId: Schema.optional(Schema.String),
});
export const validateGetDeliveryStatsInput = (input: unknown) =>
  safeParse(GetDeliveryStatsSchema, input);

const GetFailedDeliveriesSchema = Schema.Struct({
  tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
  limit: Schema.optional(
    Schema.Number.pipe(Schema.greaterThan(0), Schema.lessThanOrEqualTo(100)),
  ),
  offset: Schema.optional(Schema.Number.pipe(Schema.greaterThanOrEqualTo(0))),
});
export const validateGetFailedDeliveriesInput = (input: unknown) =>
  safeParse(GetFailedDeliveriesSchema, input);
