/**
 * Local Prisma type definitions for adapters layer
 *
 * These type definitions mirror the Prisma Client types to avoid
 * direct dependency on @mirai-app/frameworks/prisma from within adapters.
 *
 * NOTE: These are TypeScript type definitions only. The actual implementation
 * receives the Prisma client via context injection.
 */

/**
 * TransactionClient interface - represents a Prisma transaction client
 * This is the minimal interface needed for transaction operations
 */
export interface TransactionClient {
  challenge: {
    findFirst: (args: {
      where: {
        tripId?: string;
        isRecurring?: boolean;
        name?: string;
        startTime?: Date;
        endTime?: Date;
      };
      select?: Record<string, boolean>;
    }) => Promise<{ id: string; status: string } | null>;
    findMany: (args: {
      where: { tripId?: string; isRecurring?: boolean };
      select?: Record<string, boolean>;
    }) => Promise<unknown[]>;
    findUnique: (args: {
      where: { id: string };
      select?: Record<string, boolean>;
    }) => Promise<unknown>;
    create: (args: {
      data: Record<string, unknown>;
      select?: Record<string, boolean>;
    }) => Promise<{ id: string; status: string }>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  challengeSubmission: {
    findMany: (args: {
      where: {
        challengeId?: string;
        status?: { not?: string; in?: string[] };
      };
      orderBy?: Record<string, string>[];
      select?: Record<string, boolean>;
    }) => Promise<unknown[]>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
    findFirst: (args: {
      where: {
        challengeId?: string;
        eventType?: string;
      };
      select?: Record<string, boolean>;
    }) => Promise<{ activityId: string } | null>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  activityFeed: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  group: {
    findMany: (args: {
      where: { tripId?: string; isDeleted?: boolean };
      orderBy?: Record<string, string>[];
      select?: Record<string, boolean>;
    }) => Promise<unknown[]>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  coinTransaction: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  user: {
    findFirst: (args: {
      where?: { role?: { in?: string[] } };
      select?: Record<string, boolean>;
      orderBy?: Record<string, string>;
    }) => Promise<{ id: string } | null>;
  };
  challengeVote: {
    findMany: (args: {
      where: { submissionId?: string };
      select?: Record<string, boolean>;
    }) => Promise<unknown[]>;
  };
  submissionActivity: {
    findMany: (args: {
      where: { challengeId?: string; isWinner?: boolean };
      select?: Record<string, boolean>;
    }) => Promise<{ submissionId: string }[]>;
  };
  challengeActivity: {
    findFirst: (args: {
      where: { challengeId?: string; eventType?: string };
      select?: Record<string, boolean>;
    }) => Promise<{ activityId: string } | null>;
  };
  rankChangeActivity: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
  trip: {
    findUnique: (args: {
      where: { id: string };
      select?: Record<string, boolean>;
    }) => Promise<unknown>;
  };
}

/**
 * ChallengeSelect type - for selecting challenge fields
 */
export type ChallengeSelect = Record<string, boolean>;

/**
 * ChallengeWhereInput type - for challenge query filters
 */
export type ChallengeWhereInput = {
  status?: string;
  scoringCategory?: string;
  endTime?: { lte?: Date };
  votingEndTime?: { lte?: Date };
  submissions?: {
    some?: Record<string, unknown>;
    every?: Record<string, unknown>;
  };
  AND?: ChallengeWhereInput[];
};
