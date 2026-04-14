import { Schema } from "effect";

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

const CreateUploadUrlSchema = Schema.Struct({
  storagePath: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Storage path is required" }),
  ),
  upsert: Schema.optional(Schema.Boolean),
});

export type CreateUploadUrlInput = Schema.Schema.Type<typeof CreateUploadUrlSchema>;
export const validateCreateUploadUrlInput = (input: unknown) => safeParse(CreateUploadUrlSchema, input);

const CreateDownloadUrlSchema = Schema.Struct({
  storagePath: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Storage path is required" }),
  ),
  expiresInSeconds: Schema.optional(
    Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThanOrEqualTo(60),
      Schema.lessThanOrEqualTo(60 * 60),
    ),
  ),
});

export type CreateDownloadUrlInput = Schema.Schema.Type<typeof CreateDownloadUrlSchema>;
export const validateCreateDownloadUrlInput = (input: unknown) => safeParse(CreateDownloadUrlSchema, input);

const CreatePublicUrlSchema = Schema.Struct({
  storagePath: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Storage path is required" }),
  ),
});

export type CreatePublicUrlInput = Schema.Schema.Type<typeof CreatePublicUrlSchema>;
export const validateCreatePublicUrlInput = (input: unknown) => safeParse(CreatePublicUrlSchema, input);
