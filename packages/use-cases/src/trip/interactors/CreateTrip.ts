import { Effect } from "effect";
import { TripPortTag } from "../ports/TripPort";
import type { CreateTripResultDTO } from "../dto/TripDTOs";
import type { ValidationError } from "@mirai-app/domain";
import { Trip } from "@mirai-app/domain";

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
  execute(input: CreateTripInput) {
    return Effect.gen(function* () {
      const tripPort = yield* TripPortTag;

      const now = new Date();

      // Create trip entity - ID will be auto-generated
      const tripEffect = Trip.create({
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
