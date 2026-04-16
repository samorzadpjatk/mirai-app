import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type {
  ActivityFeedSelect,
  ActivityFeedInsert,
  ActivityReactionSelect,
  ActivityReactionInsert,
} from "@mirai-app/frameworks/drizzle";
import type {
  ActivityFeedDTO,
  ActivityReactionDTO,
} from "@mirai-app/use-cases";

/**
 * ActivityFeedDrizzleMapper
 *
 * Maps between Drizzle database records and ActivityFeedDTOs.
 */
export class ActivityFeedDrizzleMapper implements DrizzleEntityMapper<
  ActivityFeedDTO,
  ActivityFeedSelect,
  ActivityFeedInsert
> {
  /**
   * Convert a Drizzle ActivityFeed record to an ActivityFeedDTO
   */
  toDTO(record: ActivityFeedSelect): ActivityFeedDTO {
    return {
      id: record.id,
      tripId: record.tripId,
      // Note: Schema doesn't have userId column, using empty string as placeholder
      userId: "",
      activityType: record.activityType,
      // Combine title and description for content
      content: record.description ?? record.title,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      isPinned: record.isPinned,
      isHidden: record.isHidden,
      hiddenByAdmin: record.hiddenByAdmin,
      hiddenAt: record.hiddenAt,
      hiddenReason: record.hiddenReason,
      metadata: undefined,
    };
  }
  /**
   * Convert a Drizzle ActivityFeed record to an ActivityFeedDTO
   * Note: This returns a DTO (not domain entity) since the mapper implements DrizzleEntityMapper<ActivityFeedDTO, ...>
   */
  toDomain(record: ActivityFeedSelect): ActivityFeedDTO {
    return this.toDTO(record);
  }

  /**
   * Convert an ActivityFeedDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: ActivityFeedDTO): ActivityFeedInsert {
    return {
      id: dto.id,
      tripId: dto.tripId,
      activityType: dto.activityType,
      // Use content for both title and description
      title: dto.content,
      description: dto.content,
      isPinned: dto.isPinned,
      isHidden: dto.isHidden,
      hiddenByAdmin: dto.hiddenByAdmin ?? null,
      hiddenAt: dto.hiddenAt ?? null,
      hiddenReason: dto.hiddenReason ?? null,
      createdByAdmin: null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert an ActivityFeedDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: ActivityFeedDTO): Partial<ActivityFeedInsert> {
    return {
      title: dto.content,
      description: dto.content,
      isPinned: dto.isPinned,
      isHidden: dto.isHidden,
      hiddenByAdmin: dto.hiddenByAdmin ?? null,
      hiddenAt: dto.hiddenAt ?? null,
      hiddenReason: dto.hiddenReason ?? null,
      updatedAt: new Date(),
    };
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new ActivityFeedDrizzleMapper();
}

/**
 * ActivityReactionDrizzleMapper
 *
 * Maps between Drizzle database records and ActivityReactionDTOs.
 */
export class ActivityReactionDrizzleMapper implements DrizzleEntityMapper<
  ActivityReactionDTO,
  ActivityReactionSelect,
  ActivityReactionInsert
> {
  /**
   * Convert a Drizzle ActivityReaction record to an ActivityReactionDTO
   */
  toDTO(record: ActivityReactionSelect): ActivityReactionDTO {
    return {
      id: record.id,
      activityId: record.activityId,
      userId: record.userId,
      reactionType: record.reactionType,
      createdAt: record.createdAt,
    };
  }

  /**
   * Convert a Drizzle ActivityReaction record to an ActivityReactionDTO
   * Note: This returns a DTO (not domain entity) since the mapper implements DrizzleEntityMapper<ActivityReactionDTO, ...>
   */
  toDomain(record: ActivityReactionSelect): ActivityReactionDTO {
    return this.toDTO(record);
  }

  /**
   * Convert an ActivityReactionDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: ActivityReactionDTO): ActivityReactionInsert {
    return {
      id: dto.id,
      activityId: dto.activityId,
      userId: dto.userId,
      reactionType: dto.reactionType,
      createdAt: dto.createdAt,
    };
  }

  /**
   * Convert an ActivityReactionDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: ActivityReactionDTO): Partial<ActivityReactionInsert> {
    return {
      reactionType: dto.reactionType,
    };
  }

  static readonly instance = new ActivityReactionDrizzleMapper();
}
