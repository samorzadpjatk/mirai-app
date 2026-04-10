import type { Sponsor } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../gateways/BaseDrizzleRepository";
import type { sponsors } from "@mirai-app/frameworks/drizzle/schema/sponsor";

/**
 * SponsorDrizzleMapper
 *
 * Maps between Drizzle database records and domain Sponsor entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class SponsorDrizzleMapper implements DrizzleEntityMapper<
  Sponsor,
  typeof sponsors.$inferSelect,
  Partial<typeof sponsors.$inferInsert>,
  Partial<typeof sponsors.$inferInsert>
> {
  /**
   * Convert a Drizzle Sponsor record to a domain entity
   */
  toDomain(record: typeof sponsors.$inferSelect): Sponsor {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      logoPath: record.logoPath,
      height: record.height,
      offsetX: record.offsetX,
      offsetY: record.offsetY,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    } as unknown as Sponsor;
  }

  /**
   * Convert a domain Sponsor entity to Drizzle insert input
   */
  toDrizzleCreate(entity: Sponsor): Partial<typeof sponsors.$inferInsert> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      logoPath: entity.logoPath,
      height: entity.height ?? null,
      offsetX: entity.offsetX ?? null,
      offsetY: entity.offsetY ?? null,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert a domain Sponsor entity to Drizzle update input
   */
  toDrizzleUpdate(entity: Sponsor): Partial<typeof sponsors.$inferInsert> {
    return {
      name: entity.name,
      description: entity.description,
      logoPath: entity.logoPath,
      height: entity.height ?? null,
      offsetX: entity.offsetX ?? null,
      offsetY: entity.offsetY ?? null,
      isActive: entity.isActive,
      updatedAt: new Date(),
    };
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(record: Partial<typeof sponsors.$inferSelect>): Partial<Sponsor> {
    return {
      ...(record.id && { id: record.id }),
      ...(record.name && { name: record.name }),
      ...(record.description && { description: record.description }),
      ...(record.logoPath && { logoPath: record.logoPath }),
      ...(record.height !== undefined && { height: record.height }),
      ...(record.offsetX !== undefined && { offsetX: record.offsetX }),
      ...(record.offsetY !== undefined && { offsetY: record.offsetY }),
      ...(record.isActive !== undefined && { isActive: record.isActive }),
    };
  }

  static readonly instance = new SponsorDrizzleMapper();
}
