import type {
  SponsorSelect,
  SponsorInsert,
} from "@mirai-app/frameworks/drizzle";
import { Sponsor, SponsorId } from "@mirai-app/domain";
import type { Effect } from "effect";
import type { ValidationError } from "@mirai-app/domain";

/**
 * Sponsor Mapper
 *
 * Maps between database Sponsor records and domain Sponsor entities.
 */
export class SponsorMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbSponsor: SponsorSelect,
  ): Effect.Effect<Sponsor, ValidationError, never> {
    return Sponsor.create({
      id: SponsorId.unsafeCreate(dbSponsor.id),
      name: dbSponsor.name,
      description: dbSponsor.description,
      logoPath: dbSponsor.logoPath,
      height: dbSponsor.height ?? null,
      offsetX: dbSponsor.offsetX ?? null,
      offsetY: dbSponsor.offsetY ?? null,
      isActive: dbSponsor.isActive,
      createdAt: dbSponsor.createdAt,
      updatedAt: dbSponsor.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(sponsor: Sponsor): SponsorInsert {
    return {
      id: SponsorId.toString(sponsor.id),
      name: sponsor.name,
      description: sponsor.description,
      logoPath: sponsor.logoPath,
      height: sponsor.height,
      offsetX: sponsor.offsetX,
      offsetY: sponsor.offsetY,
      isActive: sponsor.isActive,
      createdAt: sponsor.createdAt,
      updatedAt: sponsor.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(sponsor: Sponsor): Omit<SponsorInsert, "id" | "createdAt"> {
    return {
      name: sponsor.name,
      description: sponsor.description,
      logoPath: sponsor.logoPath,
      height: sponsor.height,
      offsetX: sponsor.offsetX,
      offsetY: sponsor.offsetY,
      isActive: sponsor.isActive,
      updatedAt: new Date(),
    };
  }
}

export const sponsorMapper = new SponsorMapper();
