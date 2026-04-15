import type { ChallengeRepository } from "@mirai-app/domain/ports";
import { Context } from "effect";

/**
 * ChallengeRepository Port
 *
 * This interface defines what operations the application needs
 * from any challenge repository implementation.
 *
 * NOTE: Interface imported from @mirai-app/domain/ports.
 * Context.Tag defined here for Effect dependency injection.
 */
export type { ChallengeRepository } from "@mirai-app/domain/ports";

/**
 * ChallengeRepository Context.Tag for Effect dependency injection
 */
export class ChallengeRepositoryTag extends Context.Tag("ChallengeRepository")<
  ChallengeRepositoryTag,
  ChallengeRepository
>() {}
