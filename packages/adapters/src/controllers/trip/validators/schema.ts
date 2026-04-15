import { Schema } from "effect";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/.+/;

function safeParse<T>(
  schema: Schema.Schema<T>,
  input: unknown,
): { success: true; data: T } | { success: false; error: { message: string } } {
  const result = Schema.decodeUnknownEither(schema)(input);
  if (result._tag === "Right") {
    return { success: true, data: result.right };
  }
  // Format error from ParseError tree
  const errorStr = String(result.left);
  const message = errorStr.includes(": ")
    ? errorStr.split(": ").pop()!
    : errorStr;
  return { success: false, error: { message } };
}

const TripStatus = Schema.Literal(
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
);

const GetByIdSchema = Schema.Struct({
  id: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" }),
  ),
});
export type GetByIdInput = Schema.Schema.Type<typeof GetByIdSchema>;
export const validateGetByIdInput = (input: unknown) =>
  safeParse(GetByIdSchema, input);

const CreateTripSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Name is required" }),
    Schema.maxLength(200, {
      message: () => "Name must be at most 200 characters",
    }),
  ),
  description: Schema.optional(
    Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(2000))),
  ),
  startDate: Schema.DateFromString,
  endDate: Schema.DateFromString,
  backgroundImagePath: Schema.optional(
    Schema.Union(Schema.Null, Schema.String.pipe(Schema.pattern(URL_REGEX))),
  ),
  status: Schema.optional(TripStatus),
});
export type CreateTripInput = Schema.Schema.Type<typeof CreateTripSchema>;
export const validateCreateTripInput = (input: unknown) =>
  safeParse(CreateTripSchema, input);

const UpdateTripSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" }),
  ),
  name: Schema.optional(
    Schema.String.pipe(
      Schema.minLength(1, { message: () => "Name is required" }),
      Schema.maxLength(200, {
        message: () => "Name must be at most 200 characters",
      }),
    ),
  ),
  description: Schema.optional(
    Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(2000))),
  ),
  startDate: Schema.optional(Schema.DateFromString),
  endDate: Schema.optional(Schema.DateFromString),
  backgroundImagePath: Schema.optional(
    Schema.Union(Schema.Null, Schema.String.pipe(Schema.pattern(URL_REGEX))),
  ),
});
export type UpdateTripInput = Schema.Schema.Type<typeof UpdateTripSchema>;
export const validateUpdateTripInput = (input: unknown) =>
  safeParse(UpdateTripSchema, input);

const UpdateStatusSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" }),
  ),
  newStatus: TripStatus,
});
export type UpdateStatusInput = Schema.Schema.Type<typeof UpdateStatusSchema>;
export const validateUpdateStatusInput = (input: unknown) =>
  safeParse(UpdateStatusSchema, input);

const ListSchema = Schema.Struct({
  limit: Schema.optional(
    Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThan(0),
      Schema.lessThanOrEqualTo(100),
    ),
    { default: () => 20 },
  ),
  offset: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    { default: () => 0 },
  ),
});
export type ListInput = Schema.Schema.Type<typeof ListSchema>;
export const validateListInput = (input: unknown) =>
  safeParse(ListSchema, input);

const ListByStatusSchema = Schema.Struct({
  status: TripStatus,
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
export type ListByStatusInput = Schema.Schema.Type<typeof ListByStatusSchema>;
export const validateListByStatusInput = (input: unknown) =>
  safeParse(ListByStatusSchema, input);
