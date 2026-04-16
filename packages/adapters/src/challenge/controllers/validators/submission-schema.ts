import { Schema } from "effect";

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

const OrderByEnum = Schema.Literal("voteScore", "createdAt");
const OrderDirectionEnum = Schema.Literal("asc", "desc");
const ReviewActionEnum = Schema.Literal("APPROVE", "REJECT");

export const validateGetByIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      submissionId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Submission ID is required" }),
      ),
    }),
    input,
  );

export const validateGetByChallengeAndGroupInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      challengeId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Challenge ID is required" }),
      ),
      groupId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Group ID is required" }),
      ),
    }),
    input,
  );

export const validateGetByChallengeInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      challengeId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Challenge ID is required" }),
      ),
      orderBy: Schema.optional(OrderByEnum),
      orderDirection: Schema.optional(OrderDirectionEnum),
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
    input,
  );

export const validateCreateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      challengeId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Challenge ID is required" }),
      ),
      groupId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Group ID is required" }),
      ),
      imageIds: Schema.optional(
        Schema.Array(Schema.String.pipe(Schema.minLength(1))).pipe(
          Schema.maxLength(10),
        ),
      ),
      videoId: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
      textContent: Schema.optional(Schema.String.pipe(Schema.maxLength(10000))),
      latitude: Schema.optional(
        Schema.Number.pipe(
          Schema.greaterThanOrEqualTo(-90),
          Schema.lessThanOrEqualTo(90),
        ),
      ),
      longitude: Schema.optional(
        Schema.Number.pipe(
          Schema.greaterThanOrEqualTo(-180),
          Schema.lessThanOrEqualTo(180),
        ),
      ),
    }),
    input,
  );

export const validateUpdateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      submissionId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Submission ID is required" }),
      ),
      imageIds: Schema.optional(
        Schema.mutable(Schema.Array(Schema.String.pipe(Schema.minLength(1)))),
      ),
      videoId: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.minLength(1))),
      ),
      textContent: Schema.optional(
        Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(10000))),
      ),
      latitude: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.Number.pipe(
            Schema.greaterThanOrEqualTo(-90),
            Schema.lessThanOrEqualTo(90),
          ),
        ),
      ),
      longitude: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.Number.pipe(
            Schema.greaterThanOrEqualTo(-180),
            Schema.lessThanOrEqualTo(180),
          ),
        ),
      ),
      reviewAction: Schema.optional(ReviewActionEnum),
      reviewedById: Schema.optional(Schema.String),
      rejectionReason: Schema.optional(
        Schema.String.pipe(Schema.maxLength(1000)),
      ),
      awardedPoints: Schema.optional(
        Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
      ),
      bonusPoints: Schema.optional(
        Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
      ),
      ranking: Schema.optional(
        Schema.Union(
          Schema.Null,
          Schema.Number.pipe(
            Schema.int(),
            Schema.greaterThanOrEqualTo(1),
            Schema.lessThanOrEqualTo(3),
          ),
        ),
      ),
    }),
    input,
  );

export const validateDeleteInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      submissionId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Submission ID is required" }),
      ),
    }),
    input,
  );
