import { Effect } from "effect";
import { Group, GroupStatus } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type {
  groups,
  GroupSelect,
  GroupInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * GroupDrizzleMapper
 *
 * Maps between Drizzle database records and domain Group entities.
 */
export class GroupDrizzleMapper implements DrizzleEntityMapper<
  Group,
  GroupSelect,
  GroupInsert
> {
  /**
   * Convert a Drizzle Group record to a domain Group entity
   */
  toDomain(record: GroupSelect): Group {
    const status = this.mapStatusFromDrizzle(record.isDeleted);

    const effect = Group.create({
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

    // Run the Effect synchronously
    const exit = Effect.runSyncExit(effect);

    if (exit._tag === "Failure") {
      throw new Error(`Failed to map Group from Drizzle: ${exit.cause}`);
    }

    return exit.value;
  }

  /**
   * Convert a domain Group entity to Drizzle insert input
   */
  toDrizzleInsert(group: Group): GroupInsert {
    return {
      id: group.id,
      tripId: group.tripId,
      name: group.name,
      description: group.description,
      image: group.image,
      organizerId: group.organizerId,
      code: group.code,
      coins: group.coins,
      isDeleted: group.status === GroupStatus.DELETED,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  /**
   * Convert a domain Group entity to Drizzle update input
   */
  toDrizzleUpdate(group: Group): Partial<GroupInsert> {
    return {
      name: group.name,
      description: group.description,
      image: group.image,
      coins: group.coins,
      isDeleted: group.status === GroupStatus.DELETED,
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
