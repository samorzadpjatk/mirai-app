import type { TripResourceSelect } from "../../infrastructure/drizzle";

/**
 * TripResource DTO interface (from TripPort)
 */
interface TripResource {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  iconName: string | null;
  content: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TripResource Mapper
 *
 * Maps between database TripResource records and TripResource DTOs.
 */
export class TripResourceMapper {
  /**
   * Convert database record to TripResource DTO
   */
  toDTO(dbResource: TripResourceSelect): TripResource {
    return {
      id: dbResource.id,
      tripId: dbResource.tripId,
      title: dbResource.label,
      description: dbResource.description ?? null,
      iconName: dbResource.iconName ?? null,
      content: dbResource.value ?? "",
      sortOrder: dbResource.sortOrder,
      createdAt: dbResource.createdAt,
      updatedAt: dbResource.updatedAt,
    };
  }

  /**
   * Convert multiple database records to TripResource DTOs
   */
  toDTOs(dbResources: TripResourceSelect[]): TripResource[] {
    return dbResources.map((r) => this.toDTO(r));
  }
}

export const tripResourceMapper = new TripResourceMapper();
