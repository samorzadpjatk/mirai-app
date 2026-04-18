import type { GroupSelect } from "../../infrastructure/drizzle";
import { Group, GroupId, TripId, UserId } from "@mirai-app/domain";
import { Effect } from "effect";

/**
 * Group Mapper
 *
 * Maps between database Group records and domain Group entities.
 */
export class GroupMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(dbGroup: GroupSelect) {
    return Group.create({
      id: GroupId.unsafeCreate(dbGroup.id),
      tripId: TripId.unsafeCreate(dbGroup.tripId),
      name: dbGroup.name,
      description: dbGroup.description,
      image: dbGroup.image,
      organizerId: UserId.unsafeCreate(dbGroup.organizerId),
      code: dbGroup.code,
      coins: dbGroup.coins,
      isDeleted: dbGroup.isDeleted,
      createdAt: dbGroup.createdAt,
      updatedAt: dbGroup.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(group: Group): {
    id: string;
    tripId: string;
    name: string;
    description: string | null;
    image: string | null;
    organizerId: string;
    code: string;
    coins: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: GroupId.toString(group.id),
      tripId: TripId.toString(group.tripId),
      name: group.name,
      description: group.description,
      image: group.image,
      organizerId: UserId.toString(group.organizerId),
      code: group.code,
      coins: group.coins,
      isDeleted: group.isDeleted,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(group: Group): {
    name: string;
    description: string | null;
    image: string | null;
    code: string;
    coins: number;
    isDeleted: boolean;
    updatedAt: Date;
  } {
    return {
      name: group.name,
      description: group.description,
      image: group.image,
      code: group.code,
      coins: group.coins,
      isDeleted: group.isDeleted,
      updatedAt: new Date(),
    };
  }
}

export const groupMapper = new GroupMapper();
