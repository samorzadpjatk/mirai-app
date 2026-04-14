import { Schema } from "effect";

const CUID_REGEX = /^c[a-z0-9]{24}$/;

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

const GetByIdSchema = Schema.Struct({
  id: Schema.String.pipe(
    Schema.pattern(CUID_REGEX, { message: () => "Invalid sponsor ID format" }),
  ),
});
export type GetByIdInput = Schema.Schema.Type<typeof GetByIdSchema>;
export const validateGetByIdInput = (input: unknown) =>
  safeParse(GetByIdSchema, input);

const GetByTripIdSchema = Schema.Struct({
  tripId: Schema.String.pipe(
    Schema.pattern(CUID_REGEX, { message: () => "Invalid trip ID format" }),
  ),
});
export type GetByTripIdInput = Schema.Schema.Type<typeof GetByTripIdSchema>;
export const validateGetByTripIdInput = (input: unknown) =>
  safeParse(GetByTripIdSchema, input);

const CreateSponsorSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Name is required" }),
    Schema.maxLength(200, {
      message: () => "Name must be at most 200 characters",
    }),
  ),
  description: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Description is required" }),
    Schema.maxLength(2000, {
      message: () => "Description must be at most 2000 characters",
    }),
  ),
  logoPath: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Logo path is required" }),
  ),
  height: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  offsetX: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  offsetY: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  isActive: Schema.optional(Schema.Boolean),
});
export type CreateSponsorInput = Schema.Schema.Type<typeof CreateSponsorSchema>;
export const validateCreateSponsorInput = (input: unknown) =>
  safeParse(CreateSponsorSchema, input);

const UpdateSponsorSchema = Schema.Struct({
  sponsorId: Schema.String.pipe(
    Schema.pattern(CUID_REGEX, { message: () => "Invalid sponsor ID format" }),
  ),
  name: Schema.optional(
    Schema.String.pipe(
      Schema.minLength(1, { message: () => "Name is required" }),
      Schema.maxLength(200, {
        message: () => "Name must be at most 200 characters",
      }),
    ),
  ),
  description: Schema.optional(
    Schema.String.pipe(
      Schema.minLength(1, { message: () => "Description is required" }),
      Schema.maxLength(2000, {
        message: () => "Description must be at most 2000 characters",
      }),
    ),
  ),
  logoPath: Schema.optional(
    Schema.String.pipe(
      Schema.minLength(1, { message: () => "Logo path is required" }),
    ),
  ),
  height: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  offsetX: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  offsetY: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  isActive: Schema.optional(Schema.Boolean),
});
export type UpdateSponsorInput = Schema.Schema.Type<typeof UpdateSponsorSchema>;
export const validateUpdateSponsorInput = (input: unknown) =>
  safeParse(UpdateSponsorSchema, input);

const DeleteSponsorSchema = Schema.Struct({
  id: Schema.String.pipe(
    Schema.pattern(CUID_REGEX, { message: () => "Invalid sponsor ID format" }),
  ),
});
export type DeleteSponsorInput = Schema.Schema.Type<typeof DeleteSponsorSchema>;
export const validateDeleteSponsorInput = (input: unknown) =>
  safeParse(DeleteSponsorSchema, input);

const ListSchema = Schema.Struct({
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
  activeOnly: Schema.optional(Schema.Boolean),
});
export type ListInput = Schema.Schema.Type<typeof ListSchema>;
export const validateListInput = (input: unknown) =>
  safeParse(ListSchema, input);

const LinkToTripSchema = Schema.Struct({
  sponsorId: Schema.String.pipe(
    Schema.pattern(CUID_REGEX, { message: () => "Invalid sponsor ID format" }),
  ),
  tripId: Schema.String.pipe(
    Schema.pattern(CUID_REGEX, { message: () => "Invalid trip ID format" }),
  ),
});
export type LinkToTripInput = Schema.Schema.Type<typeof LinkToTripSchema>;
export const validateLinkToTripInput = (input: unknown) =>
  safeParse(LinkToTripSchema, input);

const UnlinkFromTripSchema = LinkToTripSchema;
export type UnlinkFromTripInput = LinkToTripInput;
export const validateUnlinkFromTripInput = (input: unknown) =>
  safeParse(UnlinkFromTripSchema, input);
