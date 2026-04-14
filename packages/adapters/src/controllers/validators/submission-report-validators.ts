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

const CreateReportSchema = Schema.Struct({
  tripId: Schema.String.pipe(Schema.pattern(UUID_REGEX, { message: () => "Invalid trip ID format" })),
  submissionId: Schema.String.pipe(Schema.minLength(1, { message: () => "Submission ID is required" })),
  reason: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Reason is required" }),
    Schema.maxLength(100, { message: () => "Reason must be at most 100 characters" }),
  ),
  details: Schema.optional(Schema.String.pipe(Schema.maxLength(2000, { message: () => "Details must be at most 2000 characters" }))),
});
export type CreateReportInput = Schema.Schema.Type<typeof CreateReportSchema>;
export const validateCreateReportInput = (input: unknown) => safeParse(CreateReportSchema, input);

const GetBySubmissionSchema = Schema.Struct({
  submissionId: Schema.String.pipe(Schema.minLength(1, { message: () => "Submission ID is required" })),
});
export type GetBySubmissionInput = Schema.Schema.Type<typeof GetBySubmissionSchema>;
export const validateGetBySubmissionInput = (input: unknown) => safeParse(GetBySubmissionSchema, input);
