import type { EventDTO } from "@mirai-app/use-cases";
import { EventType, EventStatus } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type { EventSelect, EventInsert } from "@mirai-app/frameworks/drizzle";

/**
 * EventDrizzleMapper
 *
 * Maps between Drizzle database records and EventDTOs.
 */
export class EventDrizzleMapper implements DrizzleEntityMapper<
  EventDTO,
  EventSelect,
  EventInsert
> {
  /**
   * Convert a Drizzle Event record to an EventDTO
   */
  toDTO(record: EventSelect): EventDTO {
    return {
      id: record.id,
      tripId: record.creatorId,
      groupId: record.organizerGroupId,
      title: record.title,
      description: record.description,
      location: record.location,
      startTime: record.startTime,
      endTime: record.endTime,
      type: EventType.OTHER,
      status: EventStatus.DRAFT,
      maxParticipants: null,
      createdById: record.creatorId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert an EventDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: EventDTO): EventInsert {
    return {
      id: dto.id,
      creatorId: dto.createdById,
      organizerGroupId: dto.groupId,
      title: dto.title,
      startTime: dto.startTime,
      endTime: dto.endTime ?? new Date(dto.startTime.getTime() + 3600000),
      location: dto.location ?? "",
      description: dto.description ?? "",
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert an EventDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: EventDTO): Partial<EventInsert> {
    return {
      organizerGroupId: dto.groupId,
      title: dto.title,
      startTime: dto.startTime,
      endTime: dto.endTime ?? new Date(dto.startTime.getTime() + 3600000),
      location: dto.location ?? "",
      description: dto.description ?? "",
      updatedAt: new Date(),
    };
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new EventDrizzleMapper();
}
