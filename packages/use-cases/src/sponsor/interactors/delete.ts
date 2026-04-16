import { Effect, Data } from "effect";
import { SponsorGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";

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
 *   Effect.provideService(SponsorGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function deleteSponsorUseCase(
  input: DeleteSponsorInput,
): Effect.Effect<
  DeleteSponsorOutput,
  DatabaseError | DeleteSponsorNotFoundError,
  SponsorGatewayTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorGatewayTag;

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
