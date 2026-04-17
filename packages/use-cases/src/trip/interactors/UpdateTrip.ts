import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import type { UpdateTripResultDTO } from "../dto/TripDTOs";
import type { ApplicationError, ValidationError, TripId } from "@mirai-app/domain";
import { TripNotFoundError } from "../errors/TripErrors";

/**
 * Input for UpdateTripUseCase
 */
export interface UpdateTripInput {
  tripId: TripId;
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  backgroundImagePath?: string;
}

/**
 * Update Trip Use Case
 *
 * Updates an existing trip.
 */
export class UpdateTripUseCase {
  execute(
    input: UpdateTripInput,
  ): Effect.Effect<
    UpdateTripResultDTO,
    ApplicationError | ValidationError | TripNotFoundError,
    TripPortTag
  > {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;

      // Find existing trip
      const existingTrip = yield* tripPort.findById(input.tripId);

      if (!existingTrip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Update trip using withDetails for name/description/image
      let updatedTrip = existingTrip;

      if (
        input.name !== undefined ||
        input.description !== undefined ||
        input.backgroundImagePath !== undefined
      ) {
        const detailsEffect = updatedTrip.withDetails({
          name: input.name,
          description: input.description,
          backgroundImagePath: input.backgroundImagePath,
        });
        updatedTrip = yield* detailsEffect;
      }

      // Update dates if provided
      if (input.startDate !== undefined || input.endDate !== undefined) {
        const datesEffect = updatedTrip.withDates({
          startDate: input.startDate,
          endDate: input.endDate,
        });
        updatedTrip = yield* datesEffect;
      }

      // Save trip
      const savedTrip = yield* tripPort.update(updatedTrip);

      return {
        id: savedTrip.id,
        name: savedTrip.name,
        description: savedTrip.description,
        startDate: savedTrip.startDate,
        endDate: savedTrip.endDate,
        location: null,
        image: savedTrip.backgroundImagePath,
        isActive: savedTrip.isActive(new Date()),
      };
    });
  }
}
