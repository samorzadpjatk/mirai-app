import { Sponsor, SponsorId } from "@mirai-app/domain";

/**
 * SponsorMapper
 *
 * Maps between Prisma database records and domain Sponsor entities.
 */
export class SponsorMapper {
  /**
   * Convert a Prisma Sponsor record to a domain Sponsor entity
   */
  static toDomain(record: {
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
  }): Sponsor {
    const result = Sponsor.create({
      id: SponsorId.unsafeCreate(record.id),
      name: record.name,
      description: record.description,
      logoPath: record.logoPath,
      height: record.height,
      offsetX: record.offsetX,
      offsetY: record.offsetY,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(`Failed to map Sponsor from database: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Sponsor entity to Prisma create input
   */
  static toPrismaCreate(sponsor: Sponsor): {
    id: string;
    name: string;
    description: string;
    logoPath: string;
    height: number | null;
    offsetX: number | null;
    offsetY: number | null;
    isActive: boolean;
  } {
    return {
      id: sponsor.id,
      name: sponsor.name,
      description: sponsor.description,
      logoPath: sponsor.logoPath,
      height: sponsor.height,
      offsetX: sponsor.offsetX,
      offsetY: sponsor.offsetY,
      isActive: sponsor.isActive,
    };
  }

  /**
   * Convert a domain Sponsor entity to Prisma update input
   */
  static toPrismaUpdate(sponsor: Sponsor): {
    name: string;
    description: string;
    logoPath: string;
    height: number | null;
    offsetX: number | null;
    offsetY: number | null;
    isActive: boolean;
  } {
    return {
      name: sponsor.name,
      description: sponsor.description,
      logoPath: sponsor.logoPath,
      height: sponsor.height,
      offsetX: sponsor.offsetX,
      offsetY: sponsor.offsetY,
      isActive: sponsor.isActive,
    };
  }
}
