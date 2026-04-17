import { Effect, Data } from "effect";
import { ChallengePortTag } from "../ports/ChallengePort";
import { ChallengeNotFoundError } from "../errors/ChallengeErrors";

/**
 * Input for DeleteChallengeUseCase
 */
export interface DeleteChallengeInput {
  challengeId: string;
  tripId: string;
}

/**
 * Delete Challenge Result
 */
export interface DeleteChallengeResult {
  success: boolean;
}

/**
 * Delete Challenge Use Case
 *
 * Deletes a challenge by ID.
 */
export class DeleteChallengeUseCase {
  execute(input: DeleteChallengeInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;

      // Check if challenge exists
      const existing = yield* challengePort.findById(input.challengeId);
      if (!existing) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Delete challenge
      yield* challengePort.delete(input.challengeId);

      return { success: true };
    });
  }
}
