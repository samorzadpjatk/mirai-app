import {
  type Challenge,
  type DB,
  challengeLocation,
  challengeQrCode,
  challengeRecurrence,
  challengeText,
  challenges,
} from "@mirai-app/db";
import { resolveStorageUrl, resolveStorageUrls } from "@mirai-app/shared/storage";
import { and, eq, getTableColumns, lte, notInArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import {
  finalizeVotingChallengesToCompletedWithFeed,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "../../../utils/activityFeed";

// expectedValue holds the QR code value or the required text phrase.
// It is stored directly in the dedicated DB column — no encoding needed.
export const toClientChallenge = <
  T extends {
    description?: string | null;
    textExpectedPhrase?: string | null;
    qrCodeValue?: string | null;
    image?: string | null;
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
    targetLatitude?: number | null;
    targetLongitude?: number | null;
    basePoints?: number | null;
    firstPlacePoints?: number | null;
    secondPlacePoints?: number | null;
    thirdPlacePoints?: number | null;
    autoApprove?: boolean | null;
    isRecurring?: boolean | null;
  },
>(
  challenge: T,
) => ({
  ...challenge,
  description: challenge.description ?? "",
  textExpectedPhrase: challenge.textExpectedPhrase ?? "",
  qrCodeValue: challenge.qrCodeValue ?? "",
  image: challenge.image ?? "",
  dailyStartTime: challenge.dailyStartTime ?? "",
  dailyEndTime: challenge.dailyEndTime ?? "",
  targetLatitude: challenge.targetLatitude ?? 0,
  targetLongitude: challenge.targetLongitude ?? 0,
  basePoints: challenge.basePoints ?? 0,
  firstPlacePoints: challenge.firstPlacePoints ?? 0,
  secondPlacePoints: challenge.secondPlacePoints ?? 0,
  thirdPlacePoints: challenge.thirdPlacePoints ?? 0,
  autoApprove: challenge.autoApprove ?? false,
  isRecurring: challenge.isRecurring ?? false,
});

export const resolveChallengeImage = resolveStorageUrl;

export const resolveChallengeImages = async <T extends { image: string | null }>(
  supabase: Parameters<typeof resolveStorageUrl>[0],
  challengeRows: T[],
  seconds?: number,
): Promise<(T & { image: string | null })[]> =>
  resolveStorageUrls(supabase, challengeRows, seconds);

export type ChallengeWithRelations = Challenge & {
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  isRecurring: boolean | null;
  recurringDays: number | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  textExpectedPhrase: string | null;
  qrCodeValue: string | null;
};

const challengeWithRelationsColumns = {
  ...getTableColumns(challenges),
  dailyStartTime: challengeRecurrence.dailyStartTime,
  dailyEndTime: challengeRecurrence.dailyEndTime,
  isRecurring: challengeRecurrence.isRecurring,
  recurringDays: challengeRecurrence.recurringDays,
  targetLatitude: challengeLocation.targetLatitude,
  targetLongitude: challengeLocation.targetLongitude,
  textExpectedPhrase: challengeText.expectedPhrase,
  qrCodeValue: challengeQrCode.expectedValue,
};

export const fetchChallengesWithRelations = async (
  db: DB,
  where: SQL<unknown> | undefined,
  orderBy?: SQL<unknown>,
  limit?: number,
  offset?: number,
): Promise<ChallengeWithRelations[]> => {
  const query = db
    .select(challengeWithRelationsColumns)
    .from(challenges)
    .leftJoin(challengeRecurrence, eq(challenges.id, challengeRecurrence.challengeId))
    .leftJoin(challengeLocation, eq(challenges.id, challengeLocation.challengeId))
    .leftJoin(challengeText, eq(challenges.id, challengeText.challengeId))
    .leftJoin(challengeQrCode, eq(challenges.id, challengeQrCode.challengeId))
    .where(where);

  if (orderBy) return (await (query as any).orderBy(orderBy)) as ChallengeWithRelations[];
  if (limit) return (await (query as any).limit(limit)) as ChallengeWithRelations[];
  if (offset !== undefined)
    return (await (query as any).offset(offset)) as ChallengeWithRelations[];
  return (await query) as ChallengeWithRelations[];
};

export const fetchChallengeWithRelations = async (db: DB, where: SQL<unknown> | undefined) => {
  const rows = await fetchChallengesWithRelations(db, where, undefined, 1, 0);
  return rows[0] ?? null;
};

export const activateVisibleChallenges = async (
  db: DB,
  where?: { id?: string; tripId?: string },
) => {
  const now = new Date();

  const visibleConditions = [
    eq(challenges.status, "VISIBLE"),
    notInArray(challenges.scoringCategory, ["PEER_VOTING", "JUDGED_STAFF"]),
    lte(challenges.endTime, now),
  ];
  if (where?.id) visibleConditions.push(eq(challenges.id, where.id));
  if (where?.tripId) visibleConditions.push(eq(challenges.tripId, where.tripId));

  await db
    .update(challenges)
    .set({ status: "COMPLETED" })
    .where(and(...visibleConditions));

  await promoteVisibleChallengesToActiveWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });

  await promoteActivePeerVotingChallengesToVotingPhaseWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });

  const activeConditions = [
    eq(challenges.status, "ACTIVE"),
    notInArray(challenges.scoringCategory, ["PEER_VOTING", "JUDGED_STAFF"]),
    lte(challenges.endTime, now),
  ];
  if (where?.id) activeConditions.push(eq(challenges.id, where.id));
  if (where?.tripId) activeConditions.push(eq(challenges.tripId, where.tripId));

  await db
    .update(challenges)
    .set({ status: "COMPLETED" })
    .where(and(...activeConditions));

  await finalizeVotingChallengesToCompletedWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });
};
