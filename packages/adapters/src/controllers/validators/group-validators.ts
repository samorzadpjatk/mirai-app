import { Schema } from "effect";

// UUID pattern for validation
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// URL pattern validation
const URL_REGEX = /^https?:\/\/.+/;

/**
 * Helper to run validation and return zod-like result
 */
function safeParse<T>(
  schema: Schema.Schema<T>,
  input: unknown,
): { success: true; data: T } | { success: false; error: { message: string } } {
  const result = Schema.decodeUnknownEither(schema)(input);
  if (result._tag === "Right") {
    return { success: true, data: result.right };
  }
  // Format Effect error into readable message
  const errorStr = String(result.left);
  const message = errorStr.includes(": ")
    ? errorStr.split(": ").pop()!
    : errorStr;
  return { success: false, error: { message } };
}

/**
 * Pagination schema (shared)
 */
const PaginationSchema = Schema.optional(
  Schema.Struct({
    limit: Schema.optional(
      Schema.Number.pipe(
        Schema.int({ message: () => "Limit must be an integer" }),
        Schema.greaterThan(0, { message: () => "Limit must be at least 1" }),
        Schema.lessThanOrEqualTo(100, {
          message: () => "Limit must be at most 100",
        }),
      ),
    ),
    offset: Schema.optional(
      Schema.Number.pipe(
        Schema.int({ message: () => "Offset must be an integer" }),
        Schema.greaterThanOrEqualTo(0, {
          message: () => "Offset must be at least 0",
        }),
      ),
    ),
  }),
);

/**
 * GetById schema and validator
 */
const GetByIdSchema = Schema.Struct({
  id: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid group ID format" }),
  ),
});

export type GetByIdInput = Schema.Schema.Type<typeof GetByIdSchema>;

export function validateGetByIdInput(input: unknown) {
  return safeParse(GetByIdSchema, input);
}

/**
 * GetByCode schema and validator
 */
const GetByCodeSchema = Schema.Struct({
  code: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Group code is required" }),
    Schema.maxLength(50, {
      message: () => "Code must be at most 50 characters",
    }),
  ),
});

export type GetByCodeInput = Schema.Schema.Type<typeof GetByCodeSchema>;

export function validateGetByCodeInput(input: unknown) {
  return safeParse(GetByCodeSchema, input);
}

/**
 * GetByTripId schema and validator
 */
const GetByTripIdSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" }),
  ),
});

export type GetByTripIdInput = Schema.Schema.Type<typeof GetByTripIdSchema>;

export function validateGetByTripIdInput(input: unknown) {
  return safeParse(GetByTripIdSchema, input);
}

/**
 * Create group schema and validator
 */
const NameSchema = Schema.String.pipe(
  Schema.minLength(1, { message: () => "Name is required" }),
  Schema.maxLength(100, {
    message: () => "Name must be at most 100 characters",
  }),
);

const OptionalDescriptionSchema = Schema.optional(
  Schema.Union(
    Schema.Null,
    Schema.String.pipe(
      Schema.maxLength(500, {
        message: () => "Description must be at most 500 characters",
      }),
    ),
  ),
);

const OptionalUrlSchema = Schema.optional(
  Schema.Union(
    Schema.Null,
    Schema.String.pipe(
      Schema.pattern(URL_REGEX, { message: () => "Invalid image URL" }),
    ),
  ),
);

const CreateGroupSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" }),
  ),
  name: NameSchema,
  description: OptionalDescriptionSchema,
  image: OptionalUrlSchema,
  organizerId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, {
      message: () => "Invalid organizer ID format",
    }),
  ),
  code: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Group code is required" }),
    Schema.maxLength(50, {
      message: () => "Code must be at most 50 characters",
    }),
  ),
  coins: Schema.optional(
    Schema.Number.pipe(
      Schema.int({ message: () => "Coins must be an integer" }),
      Schema.greaterThanOrEqualTo(0, {
        message: () => "Coins must be at least 0",
      }),
    ),
  ),
});

export type CreateGroupInput = Schema.Schema.Type<typeof CreateGroupSchema>;

export function validateCreateGroupInput(input: unknown) {
  return safeParse(CreateGroupSchema, input);
}

/**
 * Update group schema and validator
 */
const UpdateGroupSchema = Schema.Struct({
  groupId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid group ID format" }),
  ),
  name: Schema.optional(NameSchema),
  description: OptionalDescriptionSchema,
  image: OptionalUrlSchema,
});

export type UpdateGroupInput = Schema.Schema.Type<typeof UpdateGroupSchema>;

export function validateUpdateGroupInput(input: unknown) {
  return safeParse(UpdateGroupSchema, input);
}

/**
 * AddCoins schema and validator
 */
const AddCoinsSchema = Schema.Struct({
  groupId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid group ID format" }),
  ),
  amount: Schema.Number.pipe(
    Schema.int({ message: () => "Amount must be an integer" }),
    Schema.greaterThanOrEqualTo(1, {
      message: () => "Amount must be at least 1",
    }),
  ),
});

export type AddCoinsInput = Schema.Schema.Type<typeof AddCoinsSchema>;

export function validateAddCoinsInput(input: unknown) {
  return safeParse(AddCoinsSchema, input);
}

/**
 * List schema and validator
 */
const ListSchema = Schema.Struct({
  limit: Schema.optional(
    Schema.Number.pipe(
      Schema.int({ message: () => "Limit must be an integer" }),
      Schema.greaterThan(0, { message: () => "Limit must be at least 1" }),
      Schema.lessThanOrEqualTo(100, {
        message: () => "Limit must be at most 100",
      }),
    ),
  ),
  offset: Schema.optional(
    Schema.Number.pipe(
      Schema.int({ message: () => "Offset must be an integer" }),
      Schema.greaterThanOrEqualTo(0, {
        message: () => "Offset must be at least 0",
      }),
    ),
  ),
});

export type ListInput = Schema.Schema.Type<typeof ListSchema>;

export function validateListInput(input: unknown) {
  return safeParse(ListSchema, input);
}

/**
 * GetByOrganizer schema and validator
 */
const GetByOrganizerSchema = Schema.Struct({
  organizerId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Organizer ID is required" }),
  ),
});

export type GetByOrganizerInput = Schema.Schema.Type<
  typeof GetByOrganizerSchema
>;

export function validateGetByOrganizerInput(input: unknown) {
  return safeParse(GetByOrganizerSchema, input);
}

/**
 * AssignUserToGroup schema and validator
 */
const AssignUserToGroupSchema = Schema.Struct({
  groupId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid group ID format" }),
  ),
  userId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid user ID format" }),
  ),
});

export type AssignUserToGroupInput = Schema.Schema.Type<
  typeof AssignUserToGroupSchema
>;

export function validateAssignUserToGroupInput(input: unknown) {
  return safeParse(AssignUserToGroupSchema, input);
}

/**
 * RemoveUserFromGroup schema and validator
 */
const RemoveUserFromGroupSchema = Schema.Struct({
  groupId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid group ID format" }),
  ),
  userId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid user ID format" }),
  ),
});

export type RemoveUserFromGroupInput = Schema.Schema.Type<
  typeof RemoveUserFromGroupSchema
>;

export function validateRemoveUserFromGroupInput(input: unknown) {
  return safeParse(RemoveUserFromGroupSchema, input);
}
