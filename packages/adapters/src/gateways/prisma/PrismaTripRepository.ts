import type { TripRepository } from "@mirai-app/use-cases";
import { Trip, TripStatus } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { TripMapper } from "../../mappers/prisma/TripMapper";

// Type definitions for Prisma inputs/outputs
type PrismaTrip = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  backgroundImagePath: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TripCreateInput = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  backgroundImagePath: string | null;
};

type TripUpdateInput = {
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  backgroundImagePath: string | null;
};

/**
 * Adapter to make TripMapper compatible with EntityMapper interface
 */
const TripMapperAdapter: EntityMapper<
  Trip,
  PrismaTrip,
  TripCreateInput,
  TripUpdateInput
> = {
  toDomain: TripMapper.toDomain,
  toPrismaCreate: TripMapper.toPrismaCreate,
  toPrismaUpdate: TripMapper.toPrismaUpdate,
};

/**
 * PrismaTripRepository
 *
 * Implements the TripRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const tripRepo = new PrismaTripRepository(prisma);
 * const trip = await tripRepo.findById("trip-123");
 * ```
 */
export class PrismaTripRepository
  extends BasePrismaRepository<
    Trip,
    PrismaTrip,
    TripCreateInput,
    TripUpdateInput
  >
  implements TripRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.trip }, TripMapperAdapter);
  }

  /**
   * Find trips by status
   */
  async findByStatus(status: TripStatus): Promise<Trip[]> {
    const now = new Date();
    let whereClause: unknown;

    switch (status) {
      case TripStatus.PLANNING:
        whereClause = {
          startDate: { gt: now },
        };
        break;
      case TripStatus.ACTIVE:
        whereClause = {
          startDate: { lte: now },
          endDate: { gte: now },
        };
        break;
      case TripStatus.COMPLETED:
        whereClause = {
          endDate: { lt: now },
        };
        break;
      case TripStatus.CANCELLED:
        // Since Prisma doesn't store status, we return empty for CANCELLED
        return [];
      default:
        whereClause = {};
    }

    const records = await this.model.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find active trips
   */
  async findActive(): Promise<Trip[]> {
    const now = new Date();
    const records = await this.model.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Update trip status
   */
  async updateStatus(id: string, _status: TripStatus): Promise<Trip> {
    // Note: Since Prisma doesn't have a status field, we just return the trip
    // Status is derived from dates
    const record = await this.model.findUnique({
      where: { id },
    });

    if (!record) {
      throw new Error(`Trip with id ${id} not found`);
    }

    return this.mapper.toDomain(record);
  }

  /**
   * Count trips by status
   */
  async countByStatus(status: TripStatus): Promise<number> {
    const now = new Date();
    let whereClause: unknown;

    switch (status) {
      case TripStatus.PLANNING:
        whereClause = {
          startDate: { gt: now },
        };
        break;
      case TripStatus.ACTIVE:
        whereClause = {
          startDate: { lte: now },
          endDate: { gte: now },
        };
        break;
      case TripStatus.COMPLETED:
        whereClause = {
          endDate: { lt: now },
        };
        break;
      case TripStatus.CANCELLED:
        return 0;
      default:
        whereClause = {};
    }

    // Access count through the underlying model with type assertion
    return (
      this.model as unknown as {
        count(args?: { where?: Record<string, unknown> }): Promise<number>;
      }
    ).count({
      where: whereClause,
    });
  }
}
