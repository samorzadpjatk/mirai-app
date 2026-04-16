import { Effect } from "effect";
import { Sponsor } from "@mirai-app/domain";
import type { SponsorDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  sponsors,
  SponsorSelect,
  SponsorInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * SponsorDrizzleMapper
 *
 * Maps between Drizzle database records and SponsorDTOs.
 * Follows the UserDrizzleMapper pattern for consistency.
 */
export class SponsorDrizzleMapper implements DrizzleEntityMapper<
  SponsorDTO,
  SponsorSelect,
  SponsorInsert
> {
  /**
   * Convert a Drizzle Sponsor record to a SponsorDTO
   */
  toDTO(record: SponsorSelect): SponsorDTO {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      logoUrl: record.logoPath,
      websiteUrl: null,
      contactEmail: null,
      contactPhone: null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert a Drizzle Sponsor record to a domain Sponsor entity
   */
  toDomain(record: SponsorSelect): Sponsor {
    const effect = Sponsor.create({
      id: record.id,
      name: record.name,
      description: record.description,
      logoPath: record.logoPath,
      height: record.height ?? null,
      offsetX: record.offsetX ?? null,
      offsetY: record.offsetY ?? null,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    // Run the Effect synchronously
    const exit = Effect.runSyncExit(effect);

    // This should never fail if database has valid data
    if (exit._tag === "Failure") {
      throw new Error(`Failed to map Sponsor from Drizzle: ${exit.cause}`);
    }

    return exit.value;
  }

  /**
   * Convert a SponsorDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: SponsorDTO): SponsorInsert {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? "",
      logoPath: dto.logoUrl ?? "",
      height: null,
      offsetX: null,
      offsetY: null,
      isActive: true,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert a SponsorDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: SponsorDTO): Partial<SponsorInsert> {
    return {
      name: dto.name,
      description: dto.description ?? "",
      logoPath: dto.logoUrl ?? "",
      updatedAt: new Date(),
    };
  }

  static readonly instance = new SponsorDrizzleMapper();
}
