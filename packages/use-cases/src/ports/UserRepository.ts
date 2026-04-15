import type { UserRepository } from "@mirai-app/domain/ports";
import { Context } from "effect";

/**
 * UserRepository Port
 *
 * This interface defines what operations the application needs
 * from any user repository implementation.
 *
 * All methods return Effect.Effect for composable error handling.
 * Use Effect.runPromise at system boundaries (controllers/framework layer).
 *
 * Implementations (in adapters layer):
 * - PrismaUserRepository: Uses Prisma ORM
 * - InMemoryUserRepository: For testing
 *
 * NOTE: Interface imported from @mirai-app/domain/ports.
 * Context.Tag defined here for Effect dependency injection.
 */
export type { UserRepository } from "@mirai-app/domain/ports";

/**
 * UserRepository Context.Tag for Effect dependency injection
 */
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  UserRepository
>() {}
