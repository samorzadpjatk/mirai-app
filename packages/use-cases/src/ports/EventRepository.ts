import type { EventRepository } from "@mirai-app/domain/ports";
import { Context } from "effect";

/**
 * EventRepository Port
 *
 * This interface defines what operations the application needs
 * from any event repository implementation.
 *
 * Events represent trip-level activities that users can express interest in
 * or enlist for. Events can be organized by groups or created independently.
 *
 * Implementations (in adapters layer):
 * - DrizzleEventRepository: Uses Drizzle ORM
 * - InMemoryEventRepository: For testing
 *
 * NOTE: Interface imported from @mirai-app/domain/ports.
 * Context.Tag defined here for Effect dependency injection.
 */
export type { EventRepository } from "@mirai-app/domain/ports";

/**
 * EventRepository Context.Tag for Effect dependency injection
 */
export class EventRepositoryTag extends Context.Tag("EventRepository")<
  EventRepositoryTag,
  EventRepository
>() {}
