import { Group, GroupStatus } from "@mirai-app/domain";

/**
 * GroupMapper
 *
 * Maps between Prisma database records and domain Group entities.
 * This is a pure function with no side effects.
 */
export class GroupMapper {
  /**
   * Convert a Prisma Group record to a domain Group entity
   */
  static toDomain(record: {
    id: string;
    tripId: string;
    name: string;
    description: string | null;
    image: string | null;
    isDeleted: boolean;
    organizerId: string;
    code: string;
    coins: number;
    createdAt: Date;
    updatedAt: Date;
  }): Group {
    // Map Prisma isDeleted boolean to GroupStatus enum
    const status = GroupMapper.mapStatusFromPrisma(record.isDeleted);

    const result = Group.create({
      id: record.id,
      tripId: record.tripId,
      name: record.name,
      description: record.description,
      image: record.image,
      organizerId: record.organizerId,
      code: record.code,
      coins: record.coins,
      status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(`Failed to map Group from database: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Group entity to Prisma create input
   */
  static toPrismaCreate(group: Group): {
    id: string;
    tripId: string;
    name: string;
    description: string | null;
    image: string | null;
    isDeleted: boolean;
    organizerId: string;
    code: string;
    coins: number;
  } {
    return {
      id: group.id,
      tripId: group.tripId,
      name: group.name,
      description: group.description,
      image: group.image,
      isDeleted: group.status === GroupStatus.DELETED,
      organizerId: group.organizerId,
      code: group.code,
      coins: group.coins,
    };
  }

  /**
   * Convert a domain Group entity to Prisma update input
   */
  static toPrismaUpdate(group: Group): {
    name: string;
    description: string | null;
    image: string | null;
    isDeleted: boolean;
    organizerId: string;
    code: string;
    coins: number;
  } {
    return {
      name: group.name,
      description: group.description,
      image: group.image,
      isDeleted: group.status === GroupStatus.DELETED,
      organizerId: group.organizerId,
      code: group.code,
      coins: group.coins,
    };
  }

  /**
   * Map Prisma isDeleted boolean to GroupStatus enum
   */
  private static mapStatusFromPrisma(isDeleted: boolean): GroupStatus {
    return isDeleted ? GroupStatus.DELETED : GroupStatus.ACTIVE;
  }
}
