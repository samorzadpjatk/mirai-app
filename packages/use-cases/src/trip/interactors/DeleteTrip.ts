import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import type { ApplicationError, TripId } from "@mirai-app/domain";
import { TripNotFoundError } from "../errors/TripErrors";

/**
 * Input for DeleteTripUseCase
 */
export interface DeleteTripInput {
  tripId: TripId;
}

/**
 * Delete Trip result DTO
 */
export interface DeleteTripResultDTO {
  success: boolean;
  tripId: TripId;
}

/**
 * Delete Trip Use Case
 *
 * Deletes a trip by ID.
 */
export class DeleteTripUseCase {
  execute(
    input: DeleteTripInput,
  ): Effect.Effect<
    DeleteTripResultDTO,
    ApplicationError | TripNotFoundError,
    TripPortTag
  > {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;

      // Check if trip exists
      const exists = yield* tripPort.exists(input.tripId);

      if (!exists) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Delete trip
      yield* tripPort.delete(input.tripId);

      return {
        success: true,
        tripId: input.tripId,
      };
    });
  }
}
