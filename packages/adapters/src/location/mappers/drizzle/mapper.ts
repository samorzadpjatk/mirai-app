import type { LocationDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  locations,
  LocationSelect,
  LocationInsert,
} from "@mirai-app/frameworks/drizzle";
import { Effect } from "effect";

/**
 * LocationDrizzleMapper
 *
 * Maps between Drizzle database records and domain Location entities or LocationDTOs.
 */
export class LocationDrizzleMapper implements DrizzleEntityMapper<
  LocationDTO,
  LocationSelect,
  LocationInsert
> {
  /**
   * Convert a Drizzle Location record to a LocationDTO
   */
  toDTO(record: LocationSelect): LocationDTO {
    return {
      id: record.id,
      userId: record.userId,
      latitude: record.latitude ?? 0,
      longitude: record.longitude ?? 0,
      accuracy: record.accuracy ?? null,
      altitude: record.altitude ?? null,
      speed: record.speed ?? null,
      heading: record.heading ?? null,
      recordedAt: record.timestamp,
      createdAt: record.timestamp,
    };
  }
  /**
   * Convert a Drizzle Location record to a LocationDTO
   * (Part of DrizzleEntityMapper interface - delegates to toDTO)
   */
  toDomain(record: LocationSelect): LocationDTO {
    return this.toDTO(record);
  }

  /**
   * Convert a LocationDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: LocationDTO): LocationInsert {
    return {
      id: dto.id,
      userId: dto.userId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy,
      altitude: dto.altitude,
      altitudeAccuracy: null,
      heading: dto.heading,
      speed: dto.speed,
      isSharingLocation: false,
      timestamp: dto.recordedAt,
      lastInactivityNotification: null,
    } as LocationInsert;
  }

  /**
   * Convert a LocationDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: LocationDTO): Partial<LocationInsert> {
    return {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy,
      altitude: dto.altitude,
      heading: dto.heading,
      speed: dto.speed,
      timestamp: dto.recordedAt,
    } as Partial<LocationInsert>;
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new LocationDrizzleMapper();
}
