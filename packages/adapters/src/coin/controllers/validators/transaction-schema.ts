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

export const validateGetStatisticsInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
    }),
    input,
  );

export const validateGetMostActiveAdminStatsInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
    }),
    input,
  );

export const validateGetAllInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
      pagination: Schema.optional(PaginationSchema),
    }),
    input,
  );

export const validateGetQuickStatsInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
    }),
    input,
  );

export const validateGetAdditionalInsightsInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
    }),
    input,
  );

export const validateGetCoinTransactionsInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
      groupId: Schema.optional(Schema.String.pipe(Schema.pattern(UUID_REGEX))),
      limit: Schema.optional(
        Schema.Number.pipe(
          Schema.greaterThan(0),
          Schema.lessThanOrEqualTo(100),
        ),
      ),
    }),
    input,
  );
