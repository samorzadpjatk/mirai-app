import type { SponsorRepository } from "@mirai-app/use-cases";
import type { Sponsor } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { SponsorMapper } from "../mappers/SponsorMapper";

// Type definitions for Prisma inputs/outputs
type PrismaSponsor = {
  id: string;
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaSponsorCreateInput = {
  id: string;
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
};

type PrismaSponsorUpdateInput = {
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
};

/**
 * Adapter to make SponsorMapper compatible with EntityMapper interface
 */
const SponsorMapperAdapter: EntityMapper<
  Sponsor,
  PrismaSponsor,
  PrismaSponsorCreateInput,
  PrismaSponsorUpdateInput
> = {
  toDomain: SponsorMapper.toDomain,
  toPrismaCreate: SponsorMapper.toPrismaCreate,
  toPrismaUpdate: SponsorMapper.toPrismaUpdate,
};

/**
 * PrismaSponsorRepository
 *
 * Implements the SponsorRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 */
export class PrismaSponsorRepository
  extends BasePrismaRepository<
    Sponsor,
    PrismaSponsor,
    PrismaSponsorCreateInput,
    PrismaSponsorUpdateInput
  >
  implements SponsorRepository
{
  private tripSponsor: PrismaClient["tripSponsor"];

  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.sponsor }, SponsorMapperAdapter);
    this.tripSponsor = prisma.tripSponsor;
  }

  /**
   * Find all active sponsors
   */
  async findActive(): Promise<Sponsor[]> {
    const records = await this.model.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find sponsors by trip ID
   */
  async findByTripId(tripId: string): Promise<Sponsor[]> {
    const tripSponsors = await this.tripSponsor.findMany({
      where: {
        tripId,
        sponsor: { isActive: true },
      },
      include: {
        sponsor: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return tripSponsors.map((tripSponsor) =>
      this.mapper.toDomain(tripSponsor.sponsor as PrismaSponsor),
    );
  }

  /**
   * Check if a sponsor is associated with a trip
   */
  async isLinkedToTrip(sponsorId: string, tripId: string): Promise<boolean> {
    const count = await this.tripSponsor.count({
      where: {
        sponsorId,
        tripId,
      },
    });

    return count > 0;
  }

  /**
   * Link a sponsor to a trip
   */
  async linkToTrip(sponsorId: string, tripId: string): Promise<void> {
    await this.tripSponsor.create({
      data: {
        tripId,
        sponsorId,
      },
    });
  }

  /**
   * Unlink a sponsor from a trip
   */
  async unlinkFromTrip(sponsorId: string, tripId: string): Promise<void> {
    await this.tripSponsor.delete({
      where: {
        tripId_sponsorId: {
          tripId,
          sponsorId,
        },
      },
    });
  }
}
