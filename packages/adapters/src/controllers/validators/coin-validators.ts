import { Schema } from "effect";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const message = errorStr.includes(": ") ? errorStr.split(": ").pop()! : errorStr;
  return { success: false, error: { message } };
}

const AddCoinsSchema = Schema.Struct({
  tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
  groupId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
  amount: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(1, { message: () => "Amount must be at least 1" }),
  ),
  reason: Schema.optional(Schema.String),
});

export type AddCoinsInput = Schema.Schema.Type<typeof AddCoinsSchema>;
export const validateAddCoinsInput = (input: unknown) => safeParse(AddCoinsSchema, input);

const RemoveCoinsSchema = Schema.Struct({
  tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
  groupId: Schema.String.pipe(Schema.pattern(UUID_REGEX)),
  amount: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(1, { message: () => "Amount must be at least 1" }),
  ),
  reason: Schema.optional(Schema.String),
});

export type RemoveCoinsInput = Schema.Schema.Type<typeof RemoveCoinsSchema>;
export const validateRemoveCoinsInput = (input: unknown) => safeParse(RemoveCoinsSchema, input);
