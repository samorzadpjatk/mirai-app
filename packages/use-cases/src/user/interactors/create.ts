import { User, UserRole } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { UserGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Input for CreateUser use case
 */
export interface CreateUserInput {
  authUserId: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * Output DTO for CreateUser use case
 */
export interface CreateUserOutput {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  hasAvatar: boolean;
  createdAt: Date;
}

/**
 * Error types for CreateUser use case
 */
export class UserAlreadyExistsError extends Data.TaggedError(
  "UserAlreadyExistsError",
)<{
  message: string;
}> {}

export class UserCreationError extends Data.TaggedError("UserCreationError")<{
  message: string;
}> {}

/**
 * CreateUser Use Case
 *
 * Creates a new user in the system.
 * Returns error if user with same authUserId already exists.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = Effect.gen(function* () {
 *   const result = yield* createUserUseCase(input);
 *   return result;
 * });
 *
 * // Provide repository implementation
 * const runnable = program.pipe(
 *   Effect.provideService(UserGatewayTag, repository)
 * );
 *
 * // Run the effect
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createUserUseCase(
  input: CreateUserInput,
): Effect.Effect<
  CreateUserOutput,
  DatabaseError | UserAlreadyExistsError | UserCreationError,
  UserGatewayTag
> {
  return Effect.gen(function* () {
    const userRepo = yield* UserGatewayTag;

    // Check if user already exists
    const exists = yield* userRepo.existsByAuthUserId(input.authUserId);

    if (exists) {
      return yield* Effect.fail(
        new UserAlreadyExistsError({
          message: "User with this auth ID already exists",
        }),
      );
    }

    // Create domain entity
    const user = yield* User.create({
      authUserId: input.authUserId,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? UserRole.USER,
    }).pipe(
      Effect.mapError(
        (validationError) =>
          new UserCreationError({ message: validationError.message }),
      ),
    );

    // Save to repository
    const saved = yield* userRepo.create(user);

    return toOutput(saved);
  });
}

function toOutput(user: User): CreateUserOutput {
  return {
    id: user.id,
    authUserId: user.authUserId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.getFullName(),
    role: user.role,
    hasAvatar: user.hasAvatar,
    createdAt: user.createdAt,
  };
}
