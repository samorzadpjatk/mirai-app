import { Effect, Data } from "effect";
import { LocationGatewayTag } from "../../ports/gateway";
import type { LocationDTO, SharingUserInfo } from "../../dto";

/**
 * Input for AddSharingUser use case
 */
export interface AddSharingUserInput {
  ownerUserId: string;
  userToAddId: string;
  userFirstName: string | null;
  userLastName: string | null;
}

/**
 * Output DTO for AddSharingUser use case
 */
export interface AddSharingUserOutput {
  id: string;
  userId: string;
  isSharingLocation: boolean;
  usersToShareWith: SharingUserInfo[];
}

/**
 * Error when trying to add self
 */
export class CannotShareWithSelfError extends Data.TaggedError(
  "CannotShareWithSelfError",
)<{}> {}

/**
 * Error when domain validation fails
 */
export class AddSharingUserValidationError extends Data.TaggedError(
  "AddSharingUserValidationError",
)<{
  readonly message: string;
}> {}

/**
 * Error when repository operation fails
 */
export class AddSharingUserRepositoryError extends Data.TaggedError(
  "AddSharingUserRepositoryError",
)<{
  readonly operation: string;
  readonly cause?: unknown;
}> {}

/**
 * AddSharingUser Use Case (Effect-based)
 *
 * Adds a user to the location sharing list.
 * Creates location record if it doesn't exist.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = addSharingUserUseCase(input).pipe(
 *   Effect.provideService(LocationGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function addSharingUserUseCase(
  input: AddSharingUserInput,
): Effect.Effect<
  AddSharingUserOutput,
  | CannotShareWithSelfError
  | AddSharingUserValidationError
  | AddSharingUserRepositoryError,
  LocationGatewayTag
> {
  return Effect.gen(function* () {
    const locationRepo = yield* LocationGatewayTag;

    // Prevent self-sharing
    if (input.ownerUserId === input.userToAddId) {
      return yield* Effect.fail(new CannotShareWithSelfError({}));
    }

    // Find existing location
    let location = yield* locationRepo.findByUserId(input.ownerUserId).pipe(
      Effect.mapError(
        (cause) =>
          new AddSharingUserRepositoryError({
            operation: "find location by user",
            cause,
          }),
      ),
    );

    if (!location) {
      // Create new location with sharing enabled
      const now = new Date();
      const newLocation: LocationDTO = {
        id: crypto.randomUUID(),
        userId: input.ownerUserId,
        latitude: 0,
        longitude: 0,
        accuracy: null,
        altitude: null,
        speed: null,
        heading: null,
        recordedAt: now,
        createdAt: now,
        isSharingLocation: true,
        usersToShareWith: [
          {
            id: input.userToAddId,
            firstName: input.userFirstName,
            lastName: input.userLastName,
          },
        ],
      };

      const saved = yield* locationRepo.create(newLocation).pipe(
        Effect.mapError(
          (cause) =>
            new AddSharingUserRepositoryError({
              operation: "create location",
              cause,
            }),
        ),
      );
      return toOutput(saved);
    }

    // Add user to sharing list
    const userExists = location.usersToShareWith.some(
      (u) => u.id === input.userToAddId,
    );
    if (userExists) {
      return yield* Effect.fail(
        new AddSharingUserValidationError({
          message: "User is already in sharing list",
        }),
      );
    }

    const updatedLocation: LocationDTO = {
      ...location,
      isSharingLocation: true,
      usersToShareWith: [
        ...location.usersToShareWith,
        {
          id: input.userToAddId,
          firstName: input.userFirstName,
          lastName: input.userLastName,
        },
      ],
    };

    // Persist changes
    const saved = yield* locationRepo.save(updatedLocation).pipe(
      Effect.mapError(
        (cause) =>
          new AddSharingUserRepositoryError({
            operation: "save location",
            cause,
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(location: LocationDTO): AddSharingUserOutput {
  return {
    id: location.id,
    userId: location.userId,
    isSharingLocation: location.isSharingLocation,
    usersToShareWith: location.usersToShareWith,
  };
}
