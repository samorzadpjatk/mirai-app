import { Schema } from "effect";
import { Effect } from "effect";

// UUID pattern for validation
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
 * GetById schema and validator
 */
const GetByIdSchema = Schema.Struct({
  id: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid user ID format" }),
  ),
});

export type GetByIdInput = Schema.Schema.Type<typeof GetByIdSchema>;

export function validateGetByIdInput(input: unknown) {
  return safeParse(GetByIdSchema, input);
}

/**
 * GetByAuthId schema and validator
 */
const GetByAuthIdSchema = Schema.Struct({
  authUserId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Auth user ID is required" }),
  ),
});

export type GetByAuthIdInput = Schema.Schema.Type<typeof GetByAuthIdSchema>;

export function validateGetByAuthIdInput(input: unknown) {
  return safeParse(GetByAuthIdSchema, input);
}

/**
 * Create user schema and validator
 */
const NameSchema = Schema.String.pipe(
  Schema.minLength(2, {
    message: () => "First name must be at least 2 characters",
  }),
  Schema.maxLength(100, {
    message: () => "First name must be at most 100 characters",
  }),
  Schema.filter((val) => !/\d/.test(val), {
    message: () => "First name cannot contain digits",
  }),
);

const CreateUserSchema = Schema.Struct({
  authUserId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Auth user ID is required" }),
  ),
  firstName: NameSchema,
  lastName: NameSchema,
  role: Schema.optional(
    Schema.Literal("USER", "MODERATOR", "ADMIN", "SERVICE"),
  ),
});

export type CreateUserInput = Schema.Schema.Type<typeof CreateUserSchema>;

export function validateCreateUserInput(input: unknown) {
  return safeParse(CreateUserSchema, input);
}

/**
 * Update user schema and validator
 */
const UpdateUserSchema = Schema.Struct({
  userId: Schema.String.pipe(
    Schema.pattern(UUID_REGEX, { message: () => "Invalid user ID format" }),
  ),
  firstName: Schema.optional(NameSchema),
  lastName: Schema.optional(NameSchema),
  hasAvatar: Schema.optional(Schema.Boolean),
});

export type UpdateUserInput = Schema.Schema.Type<typeof UpdateUserSchema>;

export function validateUpdateUserInput(input: unknown) {
  return safeParse(UpdateUserSchema, input);
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
