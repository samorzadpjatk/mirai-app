import type { UserRepository } from "@mirai-app/use-cases";
import type { User, UserRole } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { UserMapper } from "../../mappers/prisma/UserMapper";

// Type definitions for Prisma inputs/outputs
type PrismaUser = {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  role: string;
  hasAvatar: boolean;
  lastSeenOn: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserCreateInput = {
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  role: string;
  hasAvatar: boolean;
  lastSeenOn: Date | null;
};

type UserUpdateInput = {
  firstName: string;
  lastName: string;
  role: string;
  hasAvatar: boolean;
  lastSeenOn: Date | null;
};

/**
 * Adapter to make UserMapper compatible with EntityMapper interface
 */
const UserMapperAdapter: EntityMapper<
  User,
  PrismaUser,
  UserCreateInput,
  UserUpdateInput
> = {
  toDomain: UserMapper.toDomain,
  toPrismaCreate: UserMapper.toPrismaCreate,
  toPrismaUpdate: UserMapper.toPrismaUpdate,
};

/**
 * PrismaUserRepository
 *
 * Implements the UserRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * Compatible with awilix-modular dependency injection.
 * Registered in RepositoryModule with singleton lifetime.
 *
 * @example
 * ```typescript
 * // With DI container (awilix-modular)
 * const userRepo = container.resolve("userRepository");
 *
 * // Manual instantiation (backward-compatible)
 * const userRepo = new PrismaUserRepository(prisma);
 * const user = await userRepo.findById("user-123");
 * ```
 */
export class PrismaUserRepository
  extends BasePrismaRepository<
    User,
    PrismaUser,
    UserCreateInput,
    UserUpdateInput
  >
  implements UserRepository
{
  /**
   * Creates a new PrismaUserRepository
   *
   * @param prisma - PrismaClient instance (injected by awilix or passed manually)
   */
  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.user }, UserMapperAdapter);
  }

  /**
   * Find user by auth provider ID (e.g., Supabase auth ID)
   */
  async findByAuthUserId(authUserId: string): Promise<User | null> {
    const record = await this.model.findUnique({
      where: { authUserId },
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    const records = await this.model.findMany({
      where: { role },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Check if user exists by auth provider ID
   */
  async existsByAuthUserId(authUserId: string): Promise<boolean> {
    const user = await this.findByAuthUserId(authUserId);
    return user !== null;
  }
}
