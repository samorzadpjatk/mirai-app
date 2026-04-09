import type { ActivityFeedRepository } from "@repo/use-cases";
import type { ActivityFeed, ActivityReaction, ActivityId } from "@repo/domain";
import type { PrismaClient } from "@repo/frameworks/prisma";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { ActivityFeedMapper } from "../mappers/ActivityFeedMapper";

// Type definitions for Prisma inputs/outputs
type PrismaActivityFeed = {
  id: string;
  tripId: string;
  activityType: string;
  isPinned: boolean;
  isHidden: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  adminId?: string | null;
  submissionActivity?: unknown;
  challengeActivity?: unknown;
  rankChangeActivity?: unknown;
  userPost?: unknown;
  admin?: unknown;
  hiddenBy?: unknown[];
};

type PrismaActivityFeedCreateInput = {
  id: string;
  tripId: string;
  activityType: string;
  isPinned?: boolean;
  isHidden?: boolean;
  priority?: number;
  createdAt?: Date;
  updatedAt?: Date;
  adminId?: string | null;
};

type PrismaActivityFeedUpdateInput = {
  tripId?: string;
  activityType?: string;
  isPinned?: boolean;
  isHidden?: boolean;
  priority?: number;
  updatedAt: Date;
  adminId?: string | null;
};

/**
 * Adapter to make ActivityFeedMapper compatible with EntityMapper interface
 */
const ActivityFeedMapperAdapter: EntityMapper<
  ActivityFeed,
  PrismaActivityFeed,
  PrismaActivityFeedCreateInput,
  PrismaActivityFeedUpdateInput
> = {
  toDomain: ActivityFeedMapper.toDomain,
  toPrismaCreate: ActivityFeedMapper.toPrismaCreate,
  toPrismaUpdate: ActivityFeedMapper.toPrismaUpdate,
};

/**
 * PrismaActivityFeedRepository
 *
 * Implements the ActivityFeedRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * Note: This repository handles complex polymorphic activity feed data
 * with multiple activity types and nested relations, which requires
 * custom implementations beyond standard CRUD patterns.
 */
export class PrismaActivityFeedRepository
  extends BasePrismaRepository<
    ActivityFeed,
    PrismaActivityFeed,
    PrismaActivityFeedCreateInput,
    PrismaActivityFeedUpdateInput
  >
  implements ActivityFeedRepository
{
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.activityFeed }, ActivityFeedMapperAdapter);
    this.prisma = prisma;
  }

  async findById(id: ActivityId): Promise<ActivityFeed | null> {
    const record = await this.model.findUnique({
      where: { id },
      include: {
        submissionActivity: {
          include: {
            submission: true,
            challenge: true,
            group: true,
          },
        },
        challengeActivity: {
          include: {
            challenge: true,
          },
        },
        rankChangeActivity: {
          include: {
            group: true,
          },
        },
        userPost: {
          include: {
            author: {
              include: {
                user: true,
                group: true,
              },
            },
          },
        },
        admin: true,
        hiddenBy: true,
      },
    });

    if (!record) {
      return null;
    }

    return this.mapper.toDomain(record);
  }

  async findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
      includeHidden?: boolean;
    },
  ): Promise<{
    activities: ActivityFeed[];
    nextCursor: { id: string; createdAt: Date; isPinned: boolean } | null;
    hasMore: boolean;
  }> {
    const limit = options?.limit ?? 30;
    const cursor = options?.cursor;
    const includeHidden = options?.includeHidden ?? false;

    // Build where clause
    const baseWhere = {
      tripId,
      ...(includeHidden ? {} : { isHidden: false }),
    };

    const cursorWhere = cursor
      ? cursor.isPinned
        ? {
            OR: [
              {
                isPinned: true,
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  {
                    createdAt: cursor.createdAt,
                    id: { lt: cursor.id },
                  },
                ],
              },
              {
                isPinned: false,
              },
            ],
          }
        : {
            isPinned: false,
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              {
                createdAt: cursor.createdAt,
                id: { lt: cursor.id },
              },
            ],
          }
      : undefined;

    const where = cursorWhere ? { ...baseWhere, ...cursorWhere } : baseWhere;

    const records = await this.model.findMany({
      where,
      take: limit + 1,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      include: {
        submissionActivity: {
          include: {
            submission: true,
            challenge: true,
            group: true,
          },
        },
        challengeActivity: {
          include: {
            challenge: true,
          },
        },
        rankChangeActivity: {
          include: {
            group: true,
          },
        },
        userPost: {
          include: {
            author: {
              include: {
                user: true,
                group: true,
              },
            },
          },
        },
        admin: true,
        hiddenBy: true,
      },
    });

    const hasMore = records.length > limit;
    const currentPageRecords = hasMore ? records.slice(0, limit) : records;
    const lastRecord = currentPageRecords[currentPageRecords.length - 1];

    return {
      activities: currentPageRecords.map((r) => this.mapper.toDomain(r)),
      nextCursor:
        hasMore && lastRecord
          ? {
              id: lastRecord.id,
              createdAt: lastRecord.createdAt,
              isPinned: lastRecord.isPinned,
            }
          : null,
      hasMore,
    };
  }

  async findByTripIdPaged(
    tripId: string,
    options: {
      page: number;
      pageSize: number;
      includeHidden?: boolean;
    },
  ): Promise<{
    activities: ActivityFeed[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const { page, pageSize, includeHidden = false } = options;

    const where = {
      tripId,
      ...(includeHidden ? {} : { isHidden: false }),
    };

    const [count, records] = await Promise.all([
      this.model.count({ where }),
      this.model.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        include: {
          submissionActivity: {
            include: {
              submission: true,
              challenge: true,
              group: true,
            },
          },
          challengeActivity: {
            include: {
              challenge: true,
            },
          },
          rankChangeActivity: {
            include: {
              group: true,
            },
          },
          userPost: {
            include: {
              author: {
                include: {
                  user: true,
                  group: true,
                },
              },
            },
          },
          admin: true,
          hiddenBy: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(count / pageSize);

    return {
      activities: records.map((r) => this.mapper.toDomain(r)),
      total: count,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async create(activity: ActivityFeed): Promise<ActivityFeed> {
    const record = await this.model.create({
      data: this.mapper.toPrismaCreate(activity),
      include: {
        submissionActivity: {
          include: {
            submission: true,
            challenge: true,
            group: true,
          },
        },
        challengeActivity: {
          include: {
            challenge: true,
          },
        },
        rankChangeActivity: {
          include: {
            group: true,
          },
        },
        userPost: {
          include: {
            author: {
              include: {
                user: true,
                group: true,
              },
            },
          },
        },
        admin: true,
        hiddenBy: true,
      },
    });

    return this.mapper.toDomain(record);
  }

  async update(activity: ActivityFeed): Promise<ActivityFeed> {
    const record = await this.model.update({
      where: { id: activity.id },
      data: this.mapper.toPrismaUpdate(activity),
      include: {
        submissionActivity: {
          include: {
            submission: true,
            challenge: true,
            group: true,
          },
        },
        challengeActivity: {
          include: {
            challenge: true,
          },
        },
        rankChangeActivity: {
          include: {
            group: true,
          },
        },
        userPost: {
          include: {
            author: {
              include: {
                user: true,
                group: true,
              },
            },
          },
        },
        admin: true,
        hiddenBy: true,
      },
    });

    return this.mapper.toDomain(record);
  }

  async delete(id: ActivityId): Promise<void> {
    await this.model.delete({ where: { id } });
  }

  async exists(id: ActivityId): Promise<boolean> {
    const count = await this.model.count({ where: { id } });
    return count > 0;
  }

  async findReactionsByActivityId(
    activityId: ActivityId,
  ): Promise<ActivityReaction[]> {
    const records = await this.prisma.activityReaction.findMany({
      where: { activityId },
    });

    return records
      .map((r) => ActivityFeedMapper.toReactionDomain(r))
      .filter((r): r is ActivityReaction => r !== null);
  }

  async findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Promise<ActivityReaction[]> {
    const records = await this.prisma.activityReaction.findMany({
      where: {
        activityId,
        userId,
      },
    });

    return records
      .map((r) => ActivityFeedMapper.toReactionDomain(r))
      .filter((r): r is ActivityReaction => r !== null);
  }

  async addReaction(reaction: ActivityReaction): Promise<ActivityReaction> {
    const record = await this.prisma.activityReaction.create({
      data: ActivityFeedMapper.toPrismaReaction(reaction),
    });

    const domainReaction = ActivityFeedMapper.toReactionDomain(record);
    if (!domainReaction) {
      throw new Error("Failed to map created reaction to domain");
    }

    return domainReaction;
  }

  async removeReaction(
    activityId: ActivityId,
    userId: string,
    reactionType: string,
  ): Promise<void> {
    const reaction = await this.prisma.activityReaction.findUnique({
      where: {
        activityId_userId_reactionType: {
          activityId,
          userId,
          reactionType,
        },
      },
    });

    if (reaction) {
      await this.prisma.activityReaction.delete({
        where: { id: reaction.id },
      });
    }
  }

  async getReactionCounts(activityId: ActivityId): Promise<{
    total: number;
    counts: { heart: number; fire: number; clap: number; star: number };
  }> {
    const [total, counts] = await Promise.all([
      this.prisma.activityReaction.count({
        where: { activityId },
      }),
      this.prisma.activityReaction.groupBy({
        by: ["reactionType"],
        where: { activityId },
        _count: { _all: true },
      }),
    ]);

    const countsMap = {
      heart: 0,
      fire: 0,
      clap: 0,
      star: 0,
    };

    for (const item of counts) {
      if (item.reactionType in countsMap) {
        countsMap[item.reactionType as keyof typeof countsMap] =
          item._count._all;
      }
    }

    return { total, counts: countsMap };
  }
}

// Type declaration for PrismaClient
// This avoids importing @prisma/client directly in the domain layer
type PrismaClient = {
  activityFeed: {
    findUnique: (args: {
      where: { id: string };
      include?: unknown;
    }) => Promise<unknown | null>;
    findMany: (args: {
      where?: unknown;
      take?: number;
      skip?: number;
      orderBy?: unknown;
      include?: unknown;
    }) => Promise<unknown[]>;
    create: (args: { data: unknown; include?: unknown }) => Promise<unknown>;
    update: (args: {
      where: { id: string };
      data: unknown;
      include?: unknown;
    }) => Promise<unknown>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
    count: (args?: { where?: unknown }) => Promise<number>;
  };
  activityReaction: {
    findUnique: (args: {
      where:
        | { id: string }
        | {
            activityId_userId_reactionType: {
              activityId: string;
              userId: string;
              reactionType: string;
            };
          };
    }) => Promise<unknown | null>;
    findMany: (args: { where?: unknown }) => Promise<unknown[]>;
    create: (args: { data: unknown }) => Promise<unknown>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
    groupBy: (args: {
      by: string[];
      where?: unknown;
      _count?: { _all: boolean };
    }) => Promise<Array<{ reactionType: string; _count: { _all: number } }>>;
    count: (args?: { where?: unknown }) => Promise<number>;
  };
};
