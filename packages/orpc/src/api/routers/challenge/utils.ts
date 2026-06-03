import { type DB, challenges } from "@mirai-app/db";
import { resolveStorageUrl, resolveStorageUrls } from "@mirai-app/shared";
import { and, eq, lte, notInArray } from "drizzle-orm";
import {
  finalizeVotingChallengesToCompletedWithFeed,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "../../../utils/activityFeed";

// expectedValue holds the QR code value or the required text phrase.
// It is stored directly in the dedicated DB column — no encoding needed.
export const toClientChallenge = <
  T extends { description: string | null; expectedValue: string | null },
>(
  challenge: T,
) => ({
  ...challenge,
  // qrCodeValue kept for backwards-compat with existing clients
  qrCodeValue: challenge.expectedValue,
});

export const resolveChallengeImage = resolveStorageUrl;

export const resolveChallengeImages = async <T extends { image: string | null }>(
  supabase: Parameters<typeof resolveStorageUrl>[0],
  challengeRows: T[],
  seconds?: number,
): Promise<(T & { image: string | null })[]> =>
  resolveStorageUrls(supabase, challengeRows, seconds);

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
