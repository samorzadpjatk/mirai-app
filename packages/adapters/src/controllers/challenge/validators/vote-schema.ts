import { Schema } from "effect";

function safeParse<T>(schema: Schema.Schema<T>, input: unknown) {
  const result = Schema.decodeUnknownEither(schema)(input);
  if (result._tag === "Right") return { success: true as const, data: result.right };
  const errorStr = String(result.left);
  const message = errorStr.includes(": ") ? errorStr.split(": ").pop()! : errorStr;
  return { success: false as const, error: { message } };
}

const VoteSchema = Schema.Struct({
  submissionId: Schema.String.pipe(Schema.minLength(1)),
  position: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(3)),
  points: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0))),
  normalizedWeight: Schema.optional(Schema.Number.pipe(Schema.greaterThan(0))),
});

export const validateGetMyVotesInput = (input: unknown) => safeParse(Schema.Struct({
  challengeId: Schema.String.pipe(Schema.minLength(1)),
  voterId: Schema.String.pipe(Schema.minLength(1)),
}), input);

export const validateGetByChallengeInput = (input: unknown) => safeParse(Schema.Struct({
  challengeId: Schema.String.pipe(Schema.minLength(1)),
}), input);

export const validateGetVotingProgressInput = (input: unknown) => safeParse(Schema.Struct({
  challengeId: Schema.String.pipe(Schema.minLength(1)),
}), input);

export const validateGetJudgedStaffProgressInput = (input: unknown) => safeParse(Schema.Struct({
  challengeId: Schema.String.pipe(Schema.minLength(1)),
  tripId: Schema.String.pipe(Schema.minLength(1)),
  adminParticipantIds: Schema.Array(Schema.String).pipe(Schema.minLength(1)),
  requiredPositions: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(3)),
  eligibleSubmissionsCount: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
}), input);

export const validateSubmitVoteInput = (input: unknown) => safeParse(Schema.Struct({
  challengeId: Schema.String.pipe(Schema.minLength(1)),
  submissionId: Schema.String.pipe(Schema.minLength(1)),
  voterId: Schema.String.pipe(Schema.minLength(1)),
  position: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(3)),
  points: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0))),
  normalizedWeight: Schema.optional(Schema.Number.pipe(Schema.greaterThan(0))),
  allowPartial: Schema.optional(Schema.Boolean),
}), input);

export const validateSubmitVotesInput = (input: unknown) => safeParse(Schema.Struct({
  challengeId: Schema.String.pipe(Schema.minLength(1)),
  voterId: Schema.String.pipe(Schema.minLength(1)),
  votes: Schema.Array(VoteSchema).pipe(Schema.minLength(1)),
  requiredPositions: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1), Schema.lessThanOrEqualTo(3)),
}), input);

export const validateForceEndVotingInput = (input: unknown) => safeParse(Schema.Struct({
  challengeId: Schema.String.pipe(Schema.minLength(1)),
  tripId: Schema.String.pipe(Schema.minLength(1)),
  adminId: Schema.String.pipe(Schema.minLength(1)),
}), input);
