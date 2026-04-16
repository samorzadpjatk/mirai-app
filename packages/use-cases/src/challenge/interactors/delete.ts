import { Challenge, ChallengeStatus } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";

/**
 * Input for DeleteChallenge use case
 */
export interface DeleteChallengeInput {
  challengeId: string;
}

/**
 * Output DTO for DeleteChallenge use case
 */
export interface DeleteChallengeOutput {
  success: boolean;
  message: string;
}

/**
 * Error types for DeleteChallenge use case
 */
export class ChallengeNotFoundError extends Data.TaggedError(
  "ChallengeNotFoundError",
)<{
  message: string;
}> {}

export class ChallengeAlreadyActiveError extends Data.TaggedError(
  "ChallengeAlreadyActiveError",
)<{
  message: string;
}> {}

export class ChallengeDeleteRepositoryError extends Data.TaggedError(
  "ChallengeDeleteRepositoryError",
)<{
  message: string;
}> {}

/**
 * DeleteChallenge Use Case
 *
 * Deletes a challenge by ID.
 * Returns error if challenge not found or is in an active state.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteChallengeUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function deleteChallengeUseCase(
  input: DeleteChallengeInput,
): Effect.Effect<
  DeleteChallengeOutput,
  | ChallengeNotFoundError
  | ChallengeAlreadyActiveError
  | ChallengeDeleteRepositoryError,
  ChallengeGatewayTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeGatewayTag;

    // Check if challenge exists
    const challenge = yield* challengeRepo.findById(input.challengeId).pipe(
      Effect.mapError(
        () =>
          new ChallengeDeleteRepositoryError({
            message: "Failed to load challenge",
          }),
      ),
    );

    if (!challenge) {
      return yield* Effect.fail(
        new ChallengeNotFoundError({ message: "Challenge not found" }),
      );
    }

    // Cannot delete active challenges (business rule)
    if (challenge.status === ChallengeStatus.ACTIVE) {
      return yield* Effect.fail(
        new ChallengeAlreadyActiveError({
          message: "Cannot delete an active challenge",
        }),
      );
    }

    // Delete from repository
    yield* challengeRepo.delete(input.challengeId).pipe(
      Effect.mapError(
        () =>
          new ChallengeDeleteRepositoryError({
            message: "Failed to delete challenge",
          }),
      ),
    );

    return {
      success: true,
      message: "Challenge deleted successfully",
    };
  });
}
