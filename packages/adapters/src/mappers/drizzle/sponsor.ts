import type { Sponsor } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
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
  toDrizzleInsert(entity: Sponsor): Partial<typeof sponsors.$inferInsert> {
    return {
      id: entity.id as string,
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
    } as Partial<typeof sponsors.$inferInsert>;
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(record: Partial<typeof sponsors.$inferSelect>): Partial<Sponsor> {
    const partial: Record<string, unknown> = {};
    if (record.id) partial.id = record.id;
    if (record.name) partial.name = record.name;
    if (record.description) partial.description = record.description;
    if (record.logoPath) partial.logoPath = record.logoPath;
    if (record.height !== undefined) partial.height = record.height;
    if (record.offsetX !== undefined) partial.offsetX = record.offsetX;
    if (record.offsetY !== undefined) partial.offsetY = record.offsetY;
    if (record.isActive !== undefined) partial.isActive = record.isActive;
    return partial as Partial<Sponsor>;
  }

  static readonly instance = new SponsorDrizzleMapper();
}
