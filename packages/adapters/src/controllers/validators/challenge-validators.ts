import { Schema } from "effect";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/.+/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

const SubmissionType = Schema.Literal(
  "IMAGE",
  "MULTI_IMAGE",
  "VIDEO",
  "TEXT",
  "IMAGE_LOCATION",
  "LOCATION",
  "QR_CODE",
);
const ScoringCategory = Schema.Literal(
  "SPEED",
  "UNLIMITED",
  "JUDGED_STAFF",
  "PEER_VOTING",
);
const ChallengeStatus = Schema.Literal(
  "HIDDEN",
  "VISIBLE",
  "ACTIVE",
  "VOTING_PHASE",
  "COMPLETED",
  "CANCELLED",
);

const OptionalUrl = Schema.optional(
  Schema.Union(
    Schema.Null,
    Schema.String.pipe(
      Schema.pattern(URL_REGEX, { message: () => "Invalid image URL" }),
    ),
  ),
);
const OptionalTime = Schema.optional(
  Schema.Union(
    Schema.Null,
    Schema.String.pipe(
      Schema.pattern(TIME_REGEX, {
        message: () => "Invalid time format (HH:MM)",
      }),
    ),
  ),
);
const OptionalDate = Schema.optional(
  Schema.Union(Schema.Null, Schema.DateFromString),
);
const OptionalNumber = (min: number, max?: number) =>
  Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(
        min !== undefined
          ? Schema.greaterThanOrEqualTo(min)
          : (undefined as any),
        max !== undefined ? Schema.lessThanOrEqualTo(max) : (undefined as any),
      ),
    ),
  );

export const validateGetByIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid challenge ID format",
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
      tripId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" }),
      ),
      name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
      description: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(2000))),
      ),
      image: OptionalUrl,
      submissionType: SubmissionType,
      scoringCategory: ScoringCategory,
      isRecurring: Schema.optional(Schema.Boolean),
      dailyStartTime: OptionalTime,
      dailyEndTime: OptionalTime,
      basePoints: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThanOrEqualTo(0),
          Schema.lessThanOrEqualTo(10000),
        ),
      ),
      firstPlacePoints: OptionalNumber(0),
      secondPlacePoints: OptionalNumber(0),
      thirdPlacePoints: OptionalNumber(0),
      status: Schema.optional(ChallengeStatus),
      startTime: OptionalDate,
      endTime: OptionalDate,
      targetLatitude: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.Number.pipe(
            Schema.greaterThanOrEqualTo(-90),
            Schema.lessThanOrEqualTo(90),
          ),
        ),
      ),
      targetLongitude: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.Number.pipe(
            Schema.greaterThanOrEqualTo(-180),
            Schema.lessThanOrEqualTo(180),
          ),
        ),
      ),
      expectedValue: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(500))),
      ),
      autoApprove: Schema.optional(Schema.Boolean),
    }),
    input,
  );

export const validateUpdateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      challengeId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid challenge ID format",
        }),
      ),
      name: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
      ),
      description: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(2000))),
      ),
      image: OptionalUrl,
      basePoints: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThanOrEqualTo(0),
          Schema.lessThanOrEqualTo(10000),
        ),
      ),
      firstPlacePoints: OptionalNumber(0),
      secondPlacePoints: OptionalNumber(0),
      thirdPlacePoints: OptionalNumber(0),
      startTime: OptionalDate,
      endTime: OptionalDate,
      dailyStartTime: OptionalTime,
      dailyEndTime: OptionalTime,
      targetLatitude: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.Number.pipe(
            Schema.greaterThanOrEqualTo(-90),
            Schema.lessThanOrEqualTo(90),
          ),
        ),
      ),
      targetLongitude: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.Number.pipe(
            Schema.greaterThanOrEqualTo(-180),
            Schema.lessThanOrEqualTo(180),
          ),
        ),
      ),
      expectedValue: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(500))),
      ),
      autoApprove: Schema.optional(Schema.Boolean),
    }),
    input,
  );

export const validateUpdateStatusInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      challengeId: Schema.String.pipe(
        Schema.pattern(UUID_REGEX, {
          message: () => "Invalid challenge ID format",
        }),
      ),
      newStatus: ChallengeStatus,
    }),
    input,
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

export const validateListInput = (input: unknown) =>
  safeParse(PaginationSchema, input);

export const validateListByStatusInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      status: ChallengeStatus,
      ...PaginationSchema.fields,
    }),
    input,
  );
