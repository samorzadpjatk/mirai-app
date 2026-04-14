import { Effect, Data } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

/**
 * Input for DeleteSponsor use case
 */
export interface DeleteSponsorInput {
  sponsorId: string;
}

/**
 * Output DTO for DeleteSponsor use case
 */
export interface DeleteSponsorOutput {
  id: string;
  deleted: boolean;
}

/**
 * Error type when sponsor is not found
 */
export class DeleteSponsorNotFoundError extends Data.TaggedError(
  "DeleteSponsorNotFoundError",
)<{}> {}

/**
 * DeleteSponsor Use Case (Effect-based)
 *
 * Deletes a sponsor by ID.
 * Returns error if sponsor not found.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = deleteSponsorUseCase(input).pipe(
 *   Effect.provideService(SponsorRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function deleteSponsorUseCase(
  input: DeleteSponsorInput,
): Effect.Effect<
  DeleteSponsorOutput,
  DeleteSponsorNotFoundError,
  SponsorRepositoryTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorRepositoryTag;

    // Check if sponsor exists
    const exists = yield* sponsorRepo.exists(input.sponsorId);

    if (!exists) {
      return yield* Effect.fail(new DeleteSponsorNotFoundError({}));
    }

    // Delete the sponsor
    yield* sponsorRepo.delete(input.sponsorId);

    return {
      id: input.sponsorId,
      deleted: true,
    };
  });
}
