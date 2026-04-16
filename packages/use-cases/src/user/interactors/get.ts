import { Data, Effect } from "effect";
import { UserGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { UserDTO } from "../dto";

/**
 * Input for GetUser use case
 */
export interface GetUserInput {
  readonly userId: string;
}

/**
 * Output for GetUser use case
 */
export interface GetUserOutput {
  readonly id: string;
  readonly authUserId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly role: string;
  readonly hasAvatar: boolean;
  readonly createdAt: Date;
  readonly lastSeenOn: Date | null;
}

/**
 * Error type for GetUser use case
 */
export class GetUserNotFoundError extends Data.TaggedError(
  "GetUserNotFoundError",
)<{
  readonly userId: string;
}> {}

/**
 * GetUser Use Case
 *
 * Retrieves a user by ID.
 * Returns error if user not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const useCase = new GetUserUseCase();
 * const program = useCase.execute({ userId: "123" });
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
export class GetUserUseCase {
  execute(
    input: GetUserInput,
  ): Effect.Effect<
    GetUserOutput,
    GetUserNotFoundError | DatabaseError,
    UserGatewayTag
  > {
    return Effect.gen(function* () {
      const userRepo = yield* UserGatewayTag;
      const user = yield* userRepo.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new GetUserNotFoundError({ userId: input.userId }),
        );
      }

      return toOutput(user);
    });
  }
}

function toOutput(user: UserDTO): GetUserOutput {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return {
    id: user.id,
    authUserId: user.authUserId,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    fullName: fullName || user.nickname || "",
    role: user.role,
    hasAvatar: !!user.avatarUrl,
    createdAt: user.createdAt,
    lastSeenOn: null,
  };
}
