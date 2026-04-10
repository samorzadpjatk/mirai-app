import { Trip, TripStatus } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../gateways/base/repository";
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
    const status = this.mapStatusFromDrizzle(record.status ?? "PLANNING");

    const result = Trip.create({
      id: record.id,
      name: record.name,
      description: record.description,
      startDate: record.startDate,
      endDate: record.endDate,
      backgroundImagePath: record.backgroundImagePath,
      status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(`Failed to map Trip from Drizzle: ${result.error}`);
    }

    return result.value;
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
      status: trip.status,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    };
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
      status: trip.status,
      updatedAt: new Date(),
    };
  }

  /**
   * Map Drizzle status string to TripStatus enum
   */
  private mapStatusFromDrizzle(status: string): TripStatus {
    switch (status) {
      case "ACTIVE":
        return TripStatus.ACTIVE;
      case "COMPLETED":
        return TripStatus.COMPLETED;
      case "CANCELLED":
        return TripStatus.CANCELLED;
      case "PLANNING":
      default:
        return TripStatus.PLANNING;
    }
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new TripDrizzleMapper();
}
