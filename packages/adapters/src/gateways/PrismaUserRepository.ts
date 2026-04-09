import "reflect-metadata";

import type { UserRepository } from "@repo/use-cases";
import type { User, UserRole } from "@repo/domain";
import type { PrismaClient } from "@repo/frameworks/prisma/client";
import { TYPES } from "@repo/frameworks/di";
import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { UserMapper } from "../mappers/UserMapper";

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
 * Auto-registered with InversifyJS via @provide decorator.
 *
 * @example
 * ```typescript
 * // With DI container
 * const userRepo = container.get<UserRepository>(TYPES.UserRepository);
 *
 * // Manual instantiation (backward-compatible)
 * const userRepo = new PrismaUserRepository(prisma);
 * const user = await userRepo.findById("user-123");
 * ```
 */
@provide(TYPES.UserRepository)
export class PrismaUserRepository
  extends BasePrismaRepository<
    User,
    PrismaUser,
    UserCreateInput,
    UserUpdateInput
  >
  implements UserRepository
{
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
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
