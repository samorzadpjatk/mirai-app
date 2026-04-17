import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import type { CreateTripResultDTO } from "../dto/TripDTOs";
import type { ApplicationError, ValidationError, TripId } from "@mirai-app/domain";
import { Trip, TripId as TripIdFactory } from "@mirai-app/domain";

/**
 * Input for CreateTripUseCase
 */
export interface CreateTripInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  backgroundImagePath?: string;
}

/**
 * Create Trip Use Case
 *
 * Creates a new trip.
 */
export class CreateTripUseCase {
  execute(
    input: CreateTripInput,
  ): Effect.Effect<
    CreateTripResultDTO,
    ApplicationError | ValidationError,
    TripPortTag
  > {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;

      const now = new Date();
      const tripId = TripIdFactory.generate();

      // Create trip entity
      const tripEffect = Trip.create({
        id: tripId,
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        backgroundImagePath: input.backgroundImagePath ?? null,
        createdAt: now,
        updatedAt: now,
      });

      const trip = yield* tripEffect;

      // Save trip
      const savedTrip = yield* tripPort.create(trip);

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
