import { type DB, challengeRecurrence, challengeSubmissions, challenges } from "@mirai-app/db";
import { buildChallengeFilter } from "@mirai-app/shared/challenges";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import {
  ensureRecurringInstancesForTrip,
  resolveRecurringChallengeIdForTrip,
} from "../../../utils/recurringChallenges";
import {
  activateVisibleChallenges,
  fetchChallengesWithRelations,
  resolveChallengeImage,
  resolveChallengeImages,
  toClientChallenge,
} from "./utils";

export const getAll = async (context: {
  db: DB;
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
      };
    };
  };
}) => {
  await activateVisibleChallenges(context.db);

  const filter = buildChallengeFilter();
  const challengeRows = await fetchChallengesWithRelations(
    context.db,
    eq(challengeRecurrence.isRecurring, false),
    desc(challenges.createdAt),
  );

  const resolved = await resolveChallengeImages(context.supabase, challengeRows);
  return resolved.map((challenge) => toClientChallenge(challenge));
};

export const getAllByTrip = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
    dbUser: { id: string };
  },
  input: {
    tripId: string;
    pagination?: {
      limit: number;
      offset: number;
    };
  },
) => {
  await ensureRecurringInstancesForTrip({
    tx: context.db,
    tripId: input.tripId,
  });
  await activateVisibleChallenges(context.db, { tripId: input.tripId });

  const limit = input.pagination?.limit ?? 30;
  const offset = input.pagination?.offset ?? 0;

  const filter = buildChallengeFilter(input.tripId);
  const where = filter.tripId
    ? and(eq(challenges.tripId, filter.tripId), eq(challengeRecurrence.isRecurring, false))
    : eq(challengeRecurrence.isRecurring, false);

  const [challengeRows, totalResult] = await Promise.all([
    fetchChallengesWithRelations(context.db, where, desc(challenges.createdAt), limit, offset),
    context.db
      .select({ count: count() })
      .from(challenges)
      .leftJoin(challengeRecurrence, eq(challenges.id, challengeRecurrence.challengeId))
      .where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  if (challengeRows.length === 0) {
    return {
      challenges: [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  const challengeIds = challengeRows.map((challenge) => challenge.id);
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
    columns: {
      groupId: true,
    },
  });

  const groupedSubmissionCounts = await context.db
    .select({
      challengeId: challengeSubmissions.challengeId,
      count: count(),
    })
    .from(challengeSubmissions)
    .where(inArray(challengeSubmissions.challengeId, challengeIds))
    .groupBy(challengeSubmissions.challengeId);

  const groupedPendingSubmissionCounts = await context.db
    .select({
      challengeId: challengeSubmissions.challengeId,
      count: count(),
    })
    .from(challengeSubmissions)
    .where(
      and(
        inArray(challengeSubmissions.challengeId, challengeIds),
        eq(challengeSubmissions.status, "PENDING"),
      ),
    )
    .groupBy(challengeSubmissions.challengeId);

  const groupId = participant?.groupId;
  const myGroupSubmissions = groupId
    ? await context.db.query.challengeSubmissions.findMany({
        where: (cs, { eq, and, inArray }) =>
          and(inArray(cs.challengeId, challengeIds), eq(cs.groupId, groupId)),
        columns: {
          challengeId: true,
          status: true,
        },
      })
    : [];

  const countByChallengeId = new Map(
    groupedSubmissionCounts.map((item) => [item.challengeId, item.count]),
  );
  const pendingCountByChallengeId = new Map(
    groupedPendingSubmissionCounts.map((item) => [item.challengeId, item.count]),
  );
  const mySubmissionStatusByChallengeId = new Map(
    myGroupSubmissions.map((item) => [item.challengeId, item.status]),
  );

  const withResolvedImages = await resolveChallengeImages(context.supabase, challengeRows);

  return {
    challenges: withResolvedImages.map((challenge) => ({
      ...toClientChallenge(challenge),
      participantGroupsCount: countByChallengeId.get(challenge.id) ?? 0,
      pendingSubmissionsCount: pendingCountByChallengeId.get(challenge.id) ?? 0,
      myGroupSubmissionStatus: mySubmissionStatusByChallengeId.get(challenge.id) ?? null,
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
};

export const getById = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
    dbUser: { id: string; role: string };
  },
  input: { id: string; tripId: string },
) => {
  await ensureRecurringInstancesForTrip({
    tx: context.db,
    tripId: input.tripId,
  });

  const isAdminOrModerator = context.dbUser.role === "ADMIN" || context.dbUser.role === "MODERATOR";
  const resolvedChallengeId = isAdminOrModerator
    ? input.id
    : ((await resolveRecurringChallengeIdForTrip({
        tx: context.db,
        challengeId: input.id,
        tripId: input.tripId,
      })) ?? input.id);

  await activateVisibleChallenges(context.db, {
    id: resolvedChallengeId,
    tripId: input.tripId,
  });

  const challenge = await fetchChallengesWithRelations(
    context.db,
    and(eq(challenges.id, resolvedChallengeId), eq(challenges.tripId, input.tripId)),
    undefined,
    1,
    0,
  ).then((rows) => rows[0] ?? null);

  if (!challenge) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }

  return {
    ...toClientChallenge(challenge),
    image: await resolveChallengeImage(context.supabase, challenge.image),
  };
};
