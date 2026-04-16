import { GroupStatus } from "@mirai-app/domain";
import type { GroupDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  groups,
  GroupSelect,
  GroupInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * GroupDrizzleMapper
 *
 * Maps between Drizzle database records and GroupDTOs.
 * Uses DTO pattern - toDomain is not needed for this mapper.
 */
export class GroupDrizzleMapper implements DrizzleEntityMapper<
  GroupDTO,
  GroupSelect,
  GroupInsert
> {
  /**
   * Convert a Drizzle Group record to a GroupDTO
   */
  toDTO(record: GroupSelect): GroupDTO {
    return {
      id: record.id,
      tripId: record.tripId,
      name: record.name,
      code: record.code,
      description: record.description ?? null,
      imageUrl: record.image ?? null,
      status: this.mapStatusFromDrizzle(record.isDeleted),
      coins: record.coins,
      maxMembers: null, // Not in schema
      createdById: record.organizerId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: null, // Not in schema
      deletedById: null, // Not in schema
    };
  }

  /**
   * Convert a GroupDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: GroupDTO): GroupInsert {
    return {
      id: dto.id,
      tripId: dto.tripId,
      name: dto.name,
      description: dto.description,
      image: dto.imageUrl,
      isDeleted: dto.status === GroupStatus.DELETED,
      organizerId: dto.createdById,
      code: dto.code,
      coins: dto.coins,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert a GroupDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: GroupDTO): Partial<GroupInsert> {
    return {
      name: dto.name,
      description: dto.description,
      image: dto.imageUrl,
      isDeleted: dto.status === GroupStatus.DELETED,
      organizerId: dto.createdById,
      code: dto.code,
      coins: dto.coins,
      updatedAt: new Date(),
    };
  }

  /**
   * Map Drizzle isDeleted boolean to GroupStatus enum
   */
  private mapStatusFromDrizzle(isDeleted: boolean): GroupStatus {
    return isDeleted ? GroupStatus.DELETED : GroupStatus.ACTIVE;
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new GroupDrizzleMapper();
}
