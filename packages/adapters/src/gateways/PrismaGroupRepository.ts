import "reflect-metadata";

import type { GroupRepository } from "@repo/use-cases";
import { Group, GroupStatus } from "@repo/domain";
import type { PrismaClient } from "@repo/frameworks/prisma/client";
import { TYPES } from "@repo/frameworks/di";
import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { GroupMapper } from "../mappers/GroupMapper";

// Type definitions for Prisma inputs/outputs
type PrismaGroup = {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  isDeleted: boolean;
  organizerId: string;
  code: string;
  coins: number;
  createdAt: Date;
  updatedAt: Date;
};

type GroupCreateInput = {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  isDeleted: boolean;
  organizerId: string;
  code: string;
  coins: number;
};

type GroupUpdateInput = {
  name: string;
  description: string | null;
  image: string | null;
  isDeleted: boolean;
  organizerId: string;
  code: string;
  coins: number;
};

/**
 * Adapter to make GroupMapper compatible with EntityMapper interface
 */
const GroupMapperAdapter: EntityMapper<
  Group,
  PrismaGroup,
  GroupCreateInput,
  GroupUpdateInput
> = {
  toDomain: GroupMapper.toDomain,
  toPrismaCreate: GroupMapper.toPrismaCreate,
  toPrismaUpdate: GroupMapper.toPrismaUpdate,
};

/**
 * PrismaGroupRepository
 *
 * Implements the GroupRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * Auto-registered with InversifyJS via @provide decorator.
 *
 * @example
 * ```typescript
 * // With DI container
 * const groupRepo = container.get<GroupRepository>(TYPES.GroupRepository);
 *
 * // Manual instantiation (backward-compatible)
 * const groupRepo = new PrismaGroupRepository(prisma);
 * const group = await groupRepo.findById("group-123");
 * ```
 */
@provide(TYPES.GroupRepository)
export class PrismaGroupRepository
  extends BasePrismaRepository<
    Group,
    PrismaGroup,
    GroupCreateInput,
    GroupUpdateInput
  >
  implements GroupRepository
{
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {
    super(prisma, { model: prisma.group }, GroupMapperAdapter);
  }

  /**
   * Find groups by trip ID
   */
  async findByTripId(tripId: string): Promise<Group[]> {
    const records = await this.model.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find groups by status
   */
  async findByStatus(status: GroupStatus): Promise<Group[]> {
    const isDeleted = status === GroupStatus.DELETED;
    const records = await this.model.findMany({
      where: { isDeleted },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find groups by trip ID and status
   */
  async findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Promise<Group[]> {
    const isDeleted = status === GroupStatus.DELETED;
    const records = await this.model.findMany({
      where: { tripId, isDeleted },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find groups by organizer ID
   */
  async findByOrganizerId(organizerId: string): Promise<Group[]> {
    const records = await this.model.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find group by code
   */
  async findByCode(code: string): Promise<Group | null> {
    const record = await this.model.findUnique({
      where: { code },
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Count groups by trip ID
   */
  async countByTripId(tripId: string): Promise<number> {
    // Access count through the underlying model with type assertion
    return (
      this.model as unknown as {
        count(args?: { where?: Record<string, unknown> }): Promise<number>;
      }
    ).count({
      where: { tripId },
    });
  }
}
