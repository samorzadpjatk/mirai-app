import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type { TripId } from "@mirai-app/domain";
import type { UserId } from "@mirai-app/domain";
import {
  TripNotFoundError,
  NotTripParticipantError,
} from "../errors/TripErrors";
import type { TripResource, TripInsurance } from "../ports/TripPort";

/**
 * Input for GetTripResourcesUseCase
 */
export interface GetTripResourcesInput {
  tripId: TripId;
  userId: UserId;
}

/**
 * Trip resources result DTO
 */
export interface TripResourcesDTO {
  resources: TripResource[];
  insurance: TripInsurance | null;
}

/**
 * Get Trip Resources Use Case
 *
 * Retrieves resources and insurance for a trip.
 */
export class GetTripResourcesUseCase {
  execute(input: GetTripResourcesInput) {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;
      const participantPort = yield* TripParticipantPortTag;

      // Check if user is a participant
      const isParticipant = yield* participantPort.isParticipant(
        input.userId,
        input.tripId,
      );

      if (!isParticipant) {
        return yield* Effect.fail(
          new NotTripParticipantError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // Check if trip exists
      const trip = yield* tripPort.findById(input.tripId);

      if (!trip) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: input.tripId }),
        );
      }

      // Get resources and insurance in parallel
      const [resources, insurance] = yield* Effect.all([
        tripPort.findResourcesByTripId(input.tripId),
        tripPort.findInsuranceByTripId(input.tripId),
      ]);

      return {
        resources,
        insurance,
      } as TripResourcesDTO;
    });
  }
}
