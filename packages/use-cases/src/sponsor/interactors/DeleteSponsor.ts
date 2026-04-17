import { Effect } from "effect";
import { SponsorPort } from "../ports/SponsorPort";
import { SponsorNotFoundError } from "../errors/SponsorErrors";
import type { ApplicationError, SponsorId } from "@mirai-app/domain";

/**
 * Input for DeleteSponsorUseCase
 */
export interface DeleteSponsorInput {
  sponsorId: SponsorId;
}

/**
 * Delete Sponsor Use Case
 *
 * Permanently deletes a sponsor from the system.
 */
export class DeleteSponsorUseCase {
  execute(
    input: DeleteSponsorInput,
  ): Effect.Effect<void, ApplicationError | SponsorNotFoundError, SponsorPort> {
    return Effect.gen(function* () {
      const sponsorPort = yield* SponsorPort;

      // Check if sponsor exists
      const existingSponsor = yield* sponsorPort.findById(input.sponsorId);

      if (!existingSponsor) {
        return yield* Effect.fail(
          new SponsorNotFoundError({ sponsorId: input.sponsorId }),
        );
      }

      // Delete from repository
      yield* sponsorPort.delete(input.sponsorId);
    });
  }
}
