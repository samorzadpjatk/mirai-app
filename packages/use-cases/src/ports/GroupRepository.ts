import type { GroupRepository } from "@mirai-app/domain/ports";
import { Context } from "effect";

/**
 * GroupRepository Port
 *
 * This interface defines what operations the application needs
 * from any group repository implementation.
 *
 * All methods return Effect.Effect for composable error handling.
 * Use Effect.runPromise at system boundaries (controllers/framework layer).
 *
 * NOTE: Interface imported from @mirai-app/domain/ports.
 * Context.Tag defined here for Effect dependency injection.
 */
export type { GroupRepository } from "@mirai-app/domain/ports";

/**
 * GroupRepository Context.Tag for Effect dependency injection
 */
export class GroupRepositoryTag extends Context.Tag("GroupRepository")<
  GroupRepositoryTag,
  GroupRepository
>() {}
