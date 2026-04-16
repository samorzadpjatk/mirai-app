import { Effect } from "effect";
import { Trip, TripStatus } from "@mirai-app/domain";
import type { TripDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  trips,
  TripSelect,
  TripInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * TripDrizzleMapper
 *
 * Maps between Drizzle database records and TripDTOs.
 */
export class TripDrizzleMapper implements DrizzleEntityMapper<
  TripDTO,
  TripSelect,
  TripInsert
> {
  /**
   * Convert a Drizzle Trip record to a TripDTO
   */
  toDTO(record: TripSelect): TripDTO {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      imageUrl: record.backgroundImagePath,
      destination: (record as any).destination ?? "",
      startDate: record.startDate,
      endDate: record.endDate,
      status: (record as any).status ?? TripStatus.PLANNING,
      basePrice: (record as any).basePrice ?? null,
      totalSpots: (record as any).totalSpots ?? null,
      availableSpots: (record as any).availableSpots ?? null,
      registrationDeadline: (record as any).registrationDeadline ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

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
   * Convert a TripDTO to Drizzle insert input
   */
  toDrizzleInsert(trip: TripDTO): TripInsert {
    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.imageUrl,
      status: trip.status,
      destination: trip.destination,
      basePrice: trip.basePrice,
      totalSpots: trip.totalSpots,
      availableSpots: trip.availableSpots,
      registrationDeadline: trip.registrationDeadline,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    } as TripInsert;
  }

  /**
   * Convert a TripDTO to Drizzle update input
   */
  toDrizzleUpdate(trip: TripDTO): Partial<TripInsert> {
    return {
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.imageUrl,
      status: trip.status,
      destination: trip.destination,
      basePrice: trip.basePrice,
      totalSpots: trip.totalSpots,
      availableSpots: trip.availableSpots,
      registrationDeadline: trip.registrationDeadline,
      updatedAt: new Date(),
    } as Partial<TripInsert>;
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new TripDrizzleMapper();
}
