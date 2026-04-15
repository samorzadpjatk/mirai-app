import { Schema } from "effect";

/**
 * Helper to create a schema for mutable arrays
 */
function MutableArray<A>(itemSchema: Schema.Schema<A>) {
  return Schema.mutable(Schema.Array(itemSchema));
}

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

const LatitudeSchema = Schema.optional(
  Schema.Union(
    Schema.Null,
    Schema.Number.pipe(
      Schema.greaterThanOrEqualTo(-90),
      Schema.lessThanOrEqualTo(90),
    ),
  ),
);
const LongitudeSchema = Schema.optional(
  Schema.Union(
    Schema.Null,
    Schema.Number.pipe(
      Schema.greaterThanOrEqualTo(-180),
      Schema.lessThanOrEqualTo(180),
    ),
  ),
);

// Base location fields
const LocationFieldsSchema = Schema.Struct({
  userId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "User ID is required" }),
  ),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  accuracy: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  altitude: Schema.optional(Schema.Union(Schema.Null, Schema.Number)),
  altitudeAccuracy: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  heading: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(
        Schema.greaterThanOrEqualTo(0),
        Schema.lessThanOrEqualTo(360),
      ),
    ),
  ),
  speed: Schema.optional(
    Schema.Union(
      Schema.Null,
      Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),
    ),
  ),
  isSharingLocation: Schema.optional(Schema.Boolean),
});

// Schema for center coordinates (number only, no null)
const CenterCoordinateSchema = Schema.optional(
  Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(-90),
    Schema.lessThanOrEqualTo(90),
  ),
);

const CenterLongitudeSchema = Schema.optional(
  Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(-180),
    Schema.lessThanOrEqualTo(180),
  ),
);

// List schema with custom cross-field validation
const ListSchema = Schema.Struct({
  viewerUserId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Viewer user ID is required" }),
  ),
  targetUserIds: Schema.optional(MutableArray(Schema.String)),
  radiusKm: Schema.optional(
    Schema.Number.pipe(Schema.greaterThan(0), Schema.lessThanOrEqualTo(1000)),
  ),
  centerLatitude: CenterCoordinateSchema,
  centerLongitude: CenterLongitudeSchema,
}).pipe(
  Schema.filter((data) => {
    if (data.radiusKm !== undefined) {
      if (
        data.centerLatitude === undefined ||
        data.centerLongitude === undefined
      ) {
        return "centerLatitude and centerLongitude are required when radiusKm is provided";
      }
    }
    return true;
  }),
);

export const validateGetByUserIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      userId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User ID is required" }),
      ),
    }),
    input,
  );

export const validateCreateInput = (input: unknown) =>
  safeParse(LocationFieldsSchema, input);
export const validateUpdateInput = (input: unknown) =>
  safeParse(LocationFieldsSchema, input);
export const validateListInput = (input: unknown) =>
  safeParse(ListSchema, input);

export const validateUpdateSharingSettingsInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      userId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User ID is required" }),
      ),
      isSharingLocation: Schema.Boolean,
      usersToShareWith: Schema.optional(
        MutableArray(
          Schema.Struct({
            id: Schema.String,
            firstName: Schema.Union(Schema.Null, Schema.String),
            lastName: Schema.Union(Schema.Null, Schema.String),
          }),
        ),
      ),
    }),
    input,
  );

export const validateAddSharingUserInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      ownerUserId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Owner user ID is required" }),
      ),
      userToAddId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User to add ID is required" }),
      ),
      userFirstName: Schema.Union(Schema.Null, Schema.String),
      userLastName: Schema.Union(Schema.Null, Schema.String),
    }),
    input,
  );

export const validateRemoveSharingUserInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      ownerUserId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "Owner user ID is required" }),
      ),
      userToRemoveId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User to remove ID is required" }),
      ),
    }),
    input,
  );

export const validateGetSharingSettingsInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      userId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User ID is required" }),
      ),
    }),
    input,
  );

export const validateDeleteByUserIdInput = (input: unknown) =>
  safeParse(
    Schema.Struct({
      userId: Schema.String.pipe(
        Schema.minLength(1, { message: () => "User ID is required" }),
      ),
    }),
    input,
  );
