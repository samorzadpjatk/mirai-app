import type { DB } from "@mirai-app/db";
import { users } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";
import { isValidHttpUrl } from "../../../utils/url-validation";

export const imageReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (normalizeSupabaseStoragePath(value)) {
      return true;
    }

    return isValidHttpUrl(value);
  }, "Image must be a valid HTTP/HTTPS URL or storage path");

export const optionalImageReferenceSchema = imageReferenceSchema.optional();

export const ensureTripParticipant = async (
  context: { db: DB; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, tripId)),
    columns: {
      id: true,
      tripId: true,
      groupId: true,
    },
  });

  if (!participant) {
    throw new ORPCError("FORBIDDEN", {
      message: "You are not a participant of this trip",
    });
  }

  return participant;
};

export const ensureTripExists = async (context: { db: DB }, tripId: string) => {
  const trip = await context.db.query.trips.findFirst({
    where: (t, { eq }) => eq(t.id, tripId),
    columns: { id: true },
  });

  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  return trip;
};

export const updateUserLastSeenOn = async (context: { db: DB; dbUser: { id: string } }) => {
  await context.db
    .update(users)
    .set({ lastSeenOn: new Date() })
    .where(eq(users.id, context.dbUser.id));
};

export const toClientActivity = <
  T extends {
    description: string | null;
    imageUrl: string | null;
    hiddenReason: string | null;
    createdByAdmin: string | null;
  },
>(
  activity: T,
) => ({
  ...activity,
  description: activity.description ?? "",
  imageUrl: activity.imageUrl ?? "",
  hiddenReason: activity.hiddenReason ?? "",
  createdByAdmin: activity.createdByAdmin ?? "",
});

export const toClientSubmissionActivity = <
  T extends {
    ranking: number | null;
    pointsAwarded: number | null;
  },
>(
  submissionActivity: T,
) => ({
  ...submissionActivity,
  ranking: submissionActivity.ranking ?? 0,
  pointsAwarded: submissionActivity.pointsAwarded ?? 0,
});

export const toClientChallengeActivity = <
  T extends {
    submissionType: string | null;
    basePoints: number | null;
    submissionCount: number | null;
  },
>(
  challengeActivity: T,
) => ({
  ...challengeActivity,
  submissionType: challengeActivity.submissionType ?? "",
  basePoints: challengeActivity.basePoints ?? 0,
  submissionCount: challengeActivity.submissionCount ?? 0,
});

export const toClientGroupSnippet = <T extends { image: string | null }>(group: T) => ({
  ...group,
  image: group.image ?? "",
});

export const toClientChallengeSnippet = <
  T extends {
    description?: string | null;
    image?: string | null;
    submissionType?: string | null;
  },
>(
  challenge: T,
) => ({
  ...challenge,
  description: challenge.description ?? "",
  image: challenge.image ?? "",
  submissionType: challenge.submissionType ?? "",
});

export const toClientSubmissionSnippet = <
  T extends {
    awardedPoints: number | null;
    bonusPoints: number | null;
    ranking: number | null;
  },
>(
  submission: T,
) => ({
  ...submission,
  awardedPoints: submission.awardedPoints ?? 0,
  bonusPoints: submission.bonusPoints ?? 0,
  ranking: submission.ranking ?? 0,
});
