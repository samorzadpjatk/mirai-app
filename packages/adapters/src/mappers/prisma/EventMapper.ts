import { Event } from "@mirai-app/domain";

/**
 * EventMapper
 *
 * Maps between Prisma database records and domain Event entities.
 * This is a pure function with no side effects.
 */
export class EventMapper {
  /**
   * Convert a Prisma Event record to a domain Event entity
   */
  static toDomain(record: {
    id: string;
    creatorId: string;
    organizerGroupId: string | null;
    title: string;
    startTime: Date;
    endTime: Date;
    location: string;
    description: string;
    files: string[] | null;
    createdAt: Date;
    updatedAt: Date;
  }): Event {
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

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(`Failed to map Event from database: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Convert a domain Event entity to Prisma create input
   */
  static toPrismaCreate(event: Event): {
    id: string;
    creatorId: string;
    organizerGroupId: string | null;
    title: string;
    startTime: Date;
    endTime: Date;
    location: string;
    description: string;
    files: string[];
  } {
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
    };
  }

  /**
   * Convert a domain Event entity to Prisma update input
   */
  static toPrismaUpdate(event: Event): {
    creatorId: string;
    organizerGroupId: string | null;
    title: string;
    startTime: Date;
    endTime: Date;
    location: string;
    description: string;
    files: string[];
  } {
    return {
      creatorId: event.creatorId,
      organizerGroupId: event.organizerGroupId,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      description: event.description,
      files: [...event.files],
    };
  }
}
