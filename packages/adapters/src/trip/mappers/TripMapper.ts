import type { TripSelect } from "../../infrastructure/drizzle";
import { Trip, TripId } from "@mirai-app/domain";
import type { ValidationError } from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * Trip Mapper
 *
 * Maps between database Trip records and domain Trip entities.
 */
export class TripMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(dbTrip: TripSelect): Effect.Effect<Trip, ValidationError, never> {
    return Trip.create({
      id: TripId.unsafeCreate(dbTrip.id),
      name: dbTrip.name,
      description: dbTrip.description ?? null,
      startDate: dbTrip.startDate,
      endDate: dbTrip.endDate,
      backgroundImagePath: dbTrip.backgroundImagePath ?? null,
      createdAt: dbTrip.createdAt,
      updatedAt: dbTrip.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(trip: Trip): {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    backgroundImagePath: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: TripId.toString(trip.id),
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.backgroundImagePath,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(trip: Trip): {
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    backgroundImagePath: string | null;
    updatedAt: Date;
  } {
    return {
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.backgroundImagePath,
      updatedAt: new Date(),
    };
  }
}

export const tripMapper = new TripMapper();
