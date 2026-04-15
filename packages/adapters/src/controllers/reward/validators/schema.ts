import { Schema } from "effect";
import { UserRole, RewardPurchaseStatus } from "@mirai-app/domain";

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

export const validateGetByIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      id: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Reward ID is required" }),
      ),
    }),
    input,
  );

export const validateGetByTripInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Trip ID is required" }),
      ),
      groupCoins: Schema.optional(Schema.Number),
    }),
    input,
  );

export const validateGetByTripAdminInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Trip ID is required" }),
      ),
      pagination: PaginationSchema,
    }),
    input,
  );

export const validateCreateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
      description: Schema.String.pipe(
        Schema.minLength(1),
        Schema.maxLength(2000),
      ),
      availableQuantity: Schema.Number.pipe(
        Schema.int(),
        Schema.greaterThanOrEqualTo(0),
        Schema.lessThanOrEqualTo(1000000),
      ),
      coinCostPercentage: Schema.Number.pipe(
        Schema.int(),
        Schema.greaterThanOrEqualTo(1),
        Schema.lessThanOrEqualTo(100),
      ),
      images: Schema.optional(
        Schema.Array(
          Schema.String.pipe(Schema.minLength(1), Schema.maxLength(2000)),
        ).pipe(Schema.maxLength(10)),
      ),
      isHidden: Schema.optional(Schema.Boolean),
      tripId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Trip ID is required" }),
      ),
      createdById: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Creator ID is required" }),
      ),
      creatorRole: Schema.Enums(UserRole),
    }),
    input,
  );

export const validateUpdateInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      rewardId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Reward ID is required" }),
      ),
      name: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
      ),
      description: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(2000)),
      ),
      availableQuantity: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThanOrEqualTo(0),
          Schema.lessThanOrEqualTo(1000000),
        ),
      ),
      images: Schema.optional(
        Schema.Array(
          Schema.String.pipe(Schema.minLength(1), Schema.maxLength(2000)),
        ).pipe(Schema.maxLength(10)),
      ),
      coinCostPercentage: Schema.optional(
        Schema.Number.pipe(
          Schema.int(),
          Schema.greaterThanOrEqualTo(1),
          Schema.lessThanOrEqualTo(100),
        ),
      ),
    }),
    input,
  );

export const validateSetHiddenInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      rewardId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Reward ID is required" }),
      ),
      isHidden: Schema.Boolean,
    }),
    input,
  );

export const validateDeleteInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      rewardId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Reward ID is required" }),
      ),
    }),
    input,
  );

export const validatePurchaseInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      rewardId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Reward ID is required" }),
      ),
      quantity: Schema.Number.pipe(
        Schema.int(),
        Schema.greaterThanOrEqualTo(1),
      ),
      userId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User ID is required" }),
      ),
    }),
    input,
  );

export const validateUpdatePurchaseStatusInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      purchaseId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Purchase ID is required" }),
      ),
      status: Schema.Enums(RewardPurchaseStatus),
      updatedById: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Updater ID is required" }),
      ),
      collectionMethod: Schema.optional(
        Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
      ),
    }),
    input,
  );

export const validateUpdateMyPurchaseStatusInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      purchaseId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Purchase ID is required" }),
      ),
      status: Schema.Enums(RewardPurchaseStatus),
      userId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User ID is required" }),
      ),
    }),
    input,
  );

export const validateGetPurchaseHistoryInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      tripId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Trip ID is required" }),
      ),
      userId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User ID is required" }),
      ),
      isStaff: Schema.optional(Schema.Boolean),
      pagination: PaginationSchema,
    }),
    input,
  );
