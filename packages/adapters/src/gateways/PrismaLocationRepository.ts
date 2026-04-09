import type { LocationRepository } from "@mirai-app/use-cases";
import type { Location, LocationId } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { LocationMapper } from "../mappers/LocationMapper";

// Type definitions for Prisma inputs/outputs
type PrismaLocation = {
  id: string;
  userId: string;
  timestamp: Date;
  isSharingLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  lastInactivityNotification: Date | null;
};

type LocationCreateInput = {
  id: string;
  userId: string;
  timestamp: Date;
  isSharingLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  lastInactivityNotification: Date | null;
};

type LocationUpdateInput = {
  timestamp: Date;
  isSharingLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  lastInactivityNotification: Date | null;
};

/**
 * Adapter to make LocationMapper compatible with EntityMapper interface
 */
const LocationMapperAdapter: EntityMapper<
  Location,
  PrismaLocation,
  LocationCreateInput,
  LocationUpdateInput
> = {
  toDomain: LocationMapper.toDomain,
  toPrismaCreate: LocationMapper.toPrismaCreate,
  toPrismaUpdate: LocationMapper.toPrismaUpdate,
};

/**
 * PrismaLocationRepository
 *
 * Implements the LocationRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const locationRepo = new PrismaLocationRepository(prisma);
 * const location = await locationRepo.findById("location-123");
 * ```
 */
export class PrismaLocationRepository
  extends BasePrismaRepository<
    Location,
    PrismaLocation,
    LocationCreateInput,
    LocationUpdateInput
  >
  implements LocationRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.location }, LocationMapperAdapter);
  }

  /**
   * Find location by user ID
   */
  async findByUserId(userId: string): Promise<Location | null> {
    const record = await this.model.findUnique({
      where: { userId },
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find all locations where location sharing is enabled and shared with a specific user
   */
  async findSharingWithUser(userId: string): Promise<Location[]> {
    const records = await this.model.findMany({
      where: {
        isSharingLocation: true,
        usersToShareWith: {
          some: { id: userId },
        },
      },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find locations by multiple user IDs
   */
  async findByUserIds(userIds: string[]): Promise<Location[]> {
    if (userIds.length === 0) {
      return [];
    }

    const records = await this.model.findMany({
      where: {
        userId: { in: userIds },
      },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Save location (create or update by userId)
   */
  async save(location: Location): Promise<Location> {
    // Check if location exists for this user
    const existing = await this.model.findUnique({
      where: { userId: location.userId },
    });

    if (existing) {
      // Update existing
      const record = await this.model.update({
        where: { userId: location.userId },
        data: this.mapper.toPrismaUpdate(location),
      });
      return this.mapper.toDomain(record);
    }

    // Create new
    const record = await this.model.create({
      data: this.mapper.toPrismaCreate(location),
    });
    return this.mapper.toDomain(record);
  }

  /**
   * Delete location by user ID
   */
  async deleteByUserId(userId: string): Promise<void> {
    // @ts-expect-error - deleteMany not in base type but available on Prisma model
    await this.model.deleteMany({
      where: { userId },
    });
  }

  /**
   * Check if location exists for a specific user
   */
  async existsForUser(userId: string): Promise<boolean> {
    // @ts-expect-error - count method not in base type but available on Prisma model
    const count = await this.model.count({
      where: { userId },
    });
    return count > 0;
  }
}
