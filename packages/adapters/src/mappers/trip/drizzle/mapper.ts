import { Effect } from "effect";
import { Trip, TripStatus } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/_shared/drizzle-base";
import type {
  trips,
  TripSelect,
  TripInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * TripDrizzleMapper
 *
 * Maps between Drizzle database records and domain Trip entities.
 */
export class TripDrizzleMapper implements DrizzleEntityMapper<
  Trip,
  TripSelect,
  TripInsert
> {
  /**
   * Convert a Drizzle Trip record to a domain Trip entity
   */
  toDomain(record: TripSelect): Trip {
    const effect = Trip.create({
      id: record.id,
      name: record.name,
      description: record.description,
      startDate: record.startDate,
      endDate: record.endDate,
      backgroundImagePath: record.backgroundImagePath,
      status: (record as any).status ?? TripStatus.PLANNING,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    // Run the Effect synchronously
    const exit = Effect.runSyncExit(effect);

    // This should never fail if database has valid data
    if (exit._tag === "Failure") {
      throw new Error(`Failed to map Trip from Drizzle: ${exit.cause}`);
    }

    return exit.value;
  }

  /**
   * Convert a domain Trip entity to Drizzle insert input
   */
  toDrizzleInsert(trip: Trip): TripInsert {
    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.backgroundImagePath,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    } as TripInsert;
  }

  /**
   * Convert a domain Trip entity to Drizzle update input
   */
  toDrizzleUpdate(trip: Trip): Partial<TripInsert> {
    return {
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.backgroundImagePath,
      updatedAt: new Date(),
    } as Partial<TripInsert>;
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new TripDrizzleMapper();
}
