import type { TripRepository } from "@mirai-app/domain/ports";
import { Context } from "effect";

/**
 * TripRepository Port
 *
 * This interface defines what operations the application needs
 * from any trip repository implementation.
 *
 * NOTE: Interface imported from @mirai-app/domain/ports.
 * Context.Tag defined here for Effect dependency injection.
 */
export type { TripRepository } from "@mirai-app/domain/ports";

/**
 * TripRepository Context.Tag for Effect dependency injection
 */
export class TripRepositoryTag extends Context.Tag("TripRepository")<
  TripRepositoryTag,
  TripRepository
>() {}
