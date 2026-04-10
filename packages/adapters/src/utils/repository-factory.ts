import type { PrismaClient } from "@mirai-app/frameworks/prisma";

/**
 * Repository factory for creating Prisma repository instances
 * Provides type-safe repository creation with Prisma client injection
 */
export interface RepositoryFactory {
  db: PrismaClient;
}

/**
 * Creates a repository instance with Prisma client
 *
 * @example
 * const repo = createRepository(ctx.db, DrizzleUserRepository);
 * const controller = new UserController(repo);
 */
export function createRepository<T>(
  db: PrismaClient,
  RepositoryClass: new (db: PrismaClient) => T,
): T {
  return new RepositoryClass(db);
}

/**
 * Creates multiple use case instances with the same repository
 *
 * @example
 * const [getUser, createUser] = createUseCases(repo, [
 *   GetUserUseCase,
 *   CreateUserUseCase,
 * ]);
 */
export function createUseCases<T extends Array<unknown>>(
  repository: unknown,
  UseCaseClasses: Array<{ new (repo: unknown): unknown }>,
): T {
  return UseCaseClasses.map(
    (UseCaseClass) => new UseCaseClass(repository),
  ) as T;
}

/**
 * Controller factory function type
 */
export type ControllerFactory<T> = (db: PrismaClient) => T;

/**
 * Creates a controller factory with dependency injection
 *
 * @example
 * const userControllerFactory = createControllerFactory(
 *   DrizzleUserRepository,
 *   UserController,
 *   [GetUserUseCase, CreateUserUseCase, UpdateUserUseCase]
 * );
 *
 * const controller = userControllerFactory(ctx.db);
 */
export function createControllerFactory<
  Repo,
  Controller,
  UseCaseClasses extends Array<{ new (repo: Repo): unknown }>,
>(
  RepositoryClass: new (db: PrismaClient) => Repo,
  ControllerClass: new (repo: Repo, ...useCases: unknown[]) => Controller,
  useCaseClasses: UseCaseClasses,
): ControllerFactory<Controller> {
  return (db: PrismaClient): Controller => {
    const repo = new RepositoryClass(db);
    const useCases = useCaseClasses.map(
      (UseCaseClass) => new UseCaseClass(repo),
    );
    return new ControllerClass(repo, ...useCases);
  };
}
