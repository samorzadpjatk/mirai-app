import { Event } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type {
  events,
  EventSelect,
  EventInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * EventDrizzleMapper
 *
 * Maps between Drizzle database records and domain Event entities.
 */
export class EventDrizzleMapper implements DrizzleEntityMapper<
  Event,
  EventSelect,
  EventInsert
> {
  /**
   * Convert a Drizzle Event record to a domain Event entity
   */
  toDomain(record: EventSelect): Event {
    const result = Event.create({
      id: record.id,
      creatorId: record.creatorId,
      organizerGroupId: record.organizerGroupId,
      title: record.title,
      startTime: record.startTime,
      endTime: record.endTime,
      location: record.location,
      description: record.description,
      files: record.files ?? [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(`Failed to map Event from Drizzle: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Event entity to Drizzle insert input
   */
  toDrizzleInsert(event: Event): EventInsert {
    return {
      id: event.id,
      creatorId: event.creatorId,
      organizerGroupId: event.organizerGroupId,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      description: event.description,
      files: [...event.files], // Convert readonly array to mutable
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  /**
   * Convert a domain Event entity to Drizzle update input
   */
  toDrizzleUpdate(event: Event): Partial<EventInsert> {
    return {
      creatorId: event.creatorId,
      organizerGroupId: event.organizerGroupId,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      description: event.description,
      files: [...event.files],
      updatedAt: new Date(),
    };
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new EventDrizzleMapper();
}
