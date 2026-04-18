import { Effect, Data } from "effect";
import { ChallengeId } from "@mirai-app/domain";
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
      const challengeId = ChallengeId.unsafeCreate(input.challengeId);

      // Check if challenge exists
      const existing = yield* challengePort.findById(challengeId);
      if (!existing) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Delete challenge
      yield* challengePort.delete(challengeId);

      return { success: true };
    });
  }
}
