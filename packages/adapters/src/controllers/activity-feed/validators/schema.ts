import { Schema } from "effect";

/**
 * Helper to create a schema for mutable arrays
 * Effect Schema's Schema.Array produces readonly arrays by default
 */
function MutableArray<A>(itemSchema: Schema.Schema<A>) {
  return Schema.mutable(Schema.Array(itemSchema));
}

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

const CursorSchema = Schema.optional(
  Schema.Struct({
    id: Schema.String,
    createdAt: Schema.DateFromString,
    isPinned: Schema.Boolean,
  }),
);

const GetByTripSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Trip ID is required" }),
  ),
  pageSize: Schema.optional(
    Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThan(0),
      Schema.lessThanOrEqualTo(100),
    ),
  ),
  cursor: CursorSchema,
});
export type GetByTripInput = Schema.Schema.Type<typeof GetByTripSchema>;
export const validateGetByTripInput = (input: unknown) =>
  safeParse(GetByTripSchema, input);

const GetByIdSchema = Schema.Struct({
  id: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Activity ID is required" }),
  ),
});
export type GetByIdInput = Schema.Schema.Type<typeof GetByIdSchema>;
export const validateGetByIdInput = (input: unknown) =>
  safeParse(GetByIdSchema, input);

const CreateCustomSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Trip ID is required" }),
  ),
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
  ),
  description: Schema.optional(Schema.String),
  imageUrl: Schema.optional(Schema.String),
  isPinned: Schema.optional(Schema.Boolean),
  createdByAdmin: Schema.optional(Schema.String),
});
export type CreateCustomInput = Schema.Schema.Type<typeof CreateCustomSchema>;
export const validateCreateCustomInput = (input: unknown) =>
  safeParse(CreateCustomSchema, input);

const UserPostSchema = Schema.Struct({
  authorId: Schema.String,
  authorUserId: Schema.String,
  authorFirstName: Schema.String,
  authorLastName: Schema.String,
  authorHasAvatar: Schema.Boolean,
  groupId: Schema.Union(Schema.Null, Schema.String),
  groupName: Schema.Union(Schema.Null, Schema.String),
  additionalImages: MutableArray(Schema.String),
});

const CreateUserPostSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Trip ID is required" }),
  ),
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
  ),
  description: Schema.optional(Schema.String),
  imageUrl: Schema.optional(Schema.String),
  userPost: UserPostSchema,
});
export type CreateUserPostInput = Schema.Schema.Type<
  typeof CreateUserPostSchema
>;
export const validateCreateUserPostInput = (input: unknown) =>
  safeParse(CreateUserPostSchema, input);

const SubmissionActivitySchema = Schema.Struct({
  submissionId: Schema.String,
  challengeId: Schema.String,
  groupId: Schema.String,
  hasVideo: Schema.optional(Schema.Boolean),
  isWinner: Schema.optional(Schema.Union(Schema.Null, Schema.Boolean)),
  ranking: Schema.optional(Schema.Union(Schema.Null, Schema.Number)),
  pointsAwarded: Schema.optional(Schema.Union(Schema.Null, Schema.Number)),
});

const CreateSubmissionSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Trip ID is required" }),
  ),
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
  ),
  description: Schema.optional(Schema.String),
  imageUrl: Schema.optional(Schema.String),
  isPinned: Schema.optional(Schema.Boolean),
  createdByAdmin: Schema.optional(Schema.String),
  submissionActivity: SubmissionActivitySchema,
});
export type CreateSubmissionInput = Schema.Schema.Type<
  typeof CreateSubmissionSchema
>;
export const validateCreateSubmissionInput = (input: unknown) =>
  safeParse(CreateSubmissionSchema, input);

const EventTypeEnum = Schema.Literal(
  "challenge_started",
  "voting_started",
  "completed",
);

const ChallengeActivitySchema = Schema.Struct({
  challengeId: Schema.String,
  eventType: EventTypeEnum,
  endTime: Schema.optional(Schema.Union(Schema.Null, Schema.DateFromString)),
  submissionType: Schema.optional(Schema.Union(Schema.Null, Schema.String)),
  basePoints: Schema.optional(Schema.Union(Schema.Null, Schema.Number)),
  submissionCount: Schema.optional(Schema.Union(Schema.Null, Schema.Number)),
});

const CreateChallengeEventSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Trip ID is required" }),
  ),
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
  ),
  description: Schema.optional(Schema.String),
  imageUrl: Schema.optional(Schema.String),
  isPinned: Schema.optional(Schema.Boolean),
  createdByAdmin: Schema.optional(Schema.String),
  challengeActivity: ChallengeActivitySchema,
});
export type CreateChallengeEventInput = Schema.Schema.Type<
  typeof CreateChallengeEventSchema
>;
export const validateCreateChallengeEventInput = (input: unknown) =>
  safeParse(CreateChallengeEventSchema, input);

const RankChangeActivitySchema = Schema.Struct({
  groupId: Schema.String,
  newRank: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1)),
  totalCoins: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
  coinsGained: Schema.Number.pipe(Schema.int()),
});

const CreateRankChangeSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Trip ID is required" }),
  ),
  title: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Title is required" }),
  ),
  description: Schema.optional(Schema.String),
  imageUrl: Schema.optional(Schema.String),
  isPinned: Schema.optional(Schema.Boolean),
  createdByAdmin: Schema.optional(Schema.String),
  rankChangeActivity: RankChangeActivitySchema,
});
export type CreateRankChangeInput = Schema.Schema.Type<
  typeof CreateRankChangeSchema
>;
export const validateCreateRankChangeInput = (input: unknown) =>
  safeParse(CreateRankChangeSchema, input);

const UpdateSchema = Schema.Struct({
  activityId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Activity ID is required" }),
  ),
  title: Schema.optional(
    Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  ),
  description: Schema.optional(
    Schema.Union(Schema.Null, Schema.String.pipe(Schema.maxLength(2000))),
  ),
  isPinned: Schema.optional(Schema.Boolean),
});
export type UpdateInput = Schema.Schema.Type<typeof UpdateSchema>;
export const validateUpdateInput = (input: unknown) =>
  safeParse(UpdateSchema, input);

const SetPinnedSchema = Schema.Struct({
  activityId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Activity ID is required" }),
  ),
  isPinned: Schema.Boolean,
});
export type SetPinnedInput = Schema.Schema.Type<typeof SetPinnedSchema>;
export const validateSetPinnedInput = (input: unknown) =>
  safeParse(SetPinnedSchema, input);

const HideSchema = Schema.Struct({
  activityId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Activity ID is required" }),
  ),
  hiddenByAdmin: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Admin ID is required" }),
  ),
  reason: Schema.optional(Schema.String),
});
export type HideInput = Schema.Schema.Type<typeof HideSchema>;
export const validateHideInput = (input: unknown) =>
  safeParse(HideSchema, input);

const UnhideSchema = Schema.Struct({
  activityId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Activity ID is required" }),
  ),
});
export type UnhideInput = Schema.Schema.Type<typeof UnhideSchema>;
export const validateUnhideInput = (input: unknown) =>
  safeParse(UnhideSchema, input);

const ReactionTypeEnum = Schema.Literal("heart", "fire", "clap", "star");

const AddReactionSchema = Schema.Struct({
  activityId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Activity ID is required" }),
  ),
  userId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "User ID is required" }),
  ),
  reactionType: ReactionTypeEnum,
});
export type AddReactionInput = Schema.Schema.Type<typeof AddReactionSchema>;
export const validateAddReactionInput = (input: unknown) =>
  safeParse(AddReactionSchema, input);

const DeleteSchema = Schema.Struct({
  activityId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Activity ID is required" }),
  ),
});
export type DeleteInput = Schema.Schema.Type<typeof DeleteSchema>;
export const validateDeleteInput = (input: unknown) =>
  safeParse(DeleteSchema, input);
