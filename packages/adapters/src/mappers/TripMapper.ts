import { Trip, TripStatus } from "@mirai-app/domain";

/**
 * TripMapper
 *
 * Maps between Prisma database records and domain Trip entities.
 * This is a pure function with no side effects.
 */
export class TripMapper {
  /**
   * Convert a Prisma Trip record to a domain Trip entity
   */
  static toDomain(record: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    backgroundImagePath: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Trip {
    // Map the status from database to domain
    // Note: Trip doesn't store status in Prisma model currently,
    // we'll derive it from dates if needed or default to PLANNING
    const status = TripMapper.deriveStatusFromDates(
      record.startDate,
      record.endDate,
    );

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

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(`Failed to map Trip from database: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Trip entity to Prisma create input
   */
  static toPrismaCreate(trip: Trip): {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    backgroundImagePath: string | null;
  } {
    return {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.backgroundImagePath,
    };
  }

  /**
   * Convert a domain Trip entity to Prisma update input
   */
  static toPrismaUpdate(trip: Trip): {
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    backgroundImagePath: string | null;
  } {
    return {
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      backgroundImagePath: trip.backgroundImagePath,
    };
  }

  /**
   * Derive TripStatus from date ranges
   * This is used because the Prisma model doesn't have a status field
   */
  private static deriveStatusFromDates(
    startDate: Date,
    endDate: Date,
  ): TripStatus {
    const now = new Date();

    if (now > endDate) {
      return TripStatus.COMPLETED;
    }

    if (now >= startDate && now <= endDate) {
      return TripStatus.ACTIVE;
    }

    return TripStatus.PLANNING;
  }
}
