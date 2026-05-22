import { isNull } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { resolveRecurringChallengeIdForTrip } from "../../../utils/recurringChallenges";
import { submissionBaseColumns, submissionWithRelations } from "./types";
import { attachReviewerEmail, ensureTripParticipant, ensureChallengeInTrip } from "./utils";
import type { DB } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";

export type SubmissionContext = {
  db: DB;
  supabase: SupabaseClient;
  dbUser: { id: string; role: string };
};

export const fetchSubmissionsByChallenge = async (params: {
  context: SubmissionContext;
  challengeId: string;
  tripId: string;
}) => {
  const resolvedChallengeId =
    (await resolveRecurringChallengeIdForTrip({
      tx: params.context.db,
      challengeId: params.challengeId,
      tripId: params.tripId,
    })) ?? params.challengeId;
  await ensureChallengeInTrip(params.context, resolvedChallengeId, params.tripId);

  const submissions = await params.context.db.query.challengeSubmissions.findMany({
    where: (cs, { eq }) => eq(cs.challengeId, resolvedChallengeId),
    columns: submissionBaseColumns,
    with: submissionWithRelations,
    orderBy: (cs, { desc, asc }) => [desc(cs.voteScore), asc(cs.createdAt)],
  });

  const emailByAuthUserId = await buildAuthEmailLookup(
    params.context.supabase,
    submissions.map((submission) => submission.reviewedBy?.authUserId),
  );

  return submissions.map((submission) => ({
    ...submission,
    reviewedBy: attachReviewerEmail(submission.reviewedBy, emailByAuthUserId),
  }));
};

export const fetchSubmissionsByChallengeForParticipant = async (params: {
  context: SubmissionContext;
  challengeId: string;
  tripId: string;
}) => {
  await ensureTripParticipant(params.context, params.tripId);
  const resolvedChallengeId =
    (await resolveRecurringChallengeIdForTrip({
      tx: params.context.db,
      challengeId: params.challengeId,
      tripId: params.tripId,
    })) ?? params.challengeId;

  const submissions = await params.context.db.query.challengeSubmissions.findMany({
    where: (cs, { eq }) => eq(cs.challengeId, resolvedChallengeId),
    columns: submissionBaseColumns,
    with: submissionWithRelations,
    orderBy: (cs, { desc, asc }) => [desc(cs.voteScore), asc(cs.createdAt)],
  });

  const emailByAuthUserId = await buildAuthEmailLookup(
    params.context.supabase,
    submissions.map((submission) => submission.reviewedBy?.authUserId),
  );

  const shouldHideUnapprovedMedia =
    params.context.dbUser.role !== "ADMIN" && params.context.dbUser.role !== "MODERATOR";

  const sanitizedSubmissions = shouldHideUnapprovedMedia
    ? submissions.map((submission) =>
        submission.status === "APPROVED"
          ? submission
          : {
              ...submission,
              imageIds: [],
              videoId: null,
            },
      )
    : submissions;

  return sanitizedSubmissions.map((submission) => ({
    ...submission,
    reviewedBy: attachReviewerEmail(submission.reviewedBy, emailByAuthUserId),
  }));
};

export const fetchSubmissionById = async (params: {
  context: SubmissionContext;
  id: string;
  tripId: string;
}) => {
  await ensureTripParticipant(params.context, params.tripId);

  const submission = await params.context.db.query.challengeSubmissions.findFirst({
    where: (cs, { eq }) => eq(cs.id, params.id),
    columns: submissionBaseColumns,
    with: submissionWithRelations,
  });

  if (!submission) {
    throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
  }

  const challengeCheck = await params.context.db.query.challenges.findFirst({
    where: (c, { eq, and }) =>
      and(eq(c.id, submission.challengeId), eq(c.tripId, params.tripId)),
    columns: { id: true },
  });
  if (!challengeCheck) {
    throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(params.context.supabase, [
    submission.reviewedBy?.authUserId,
  ]);

  return {
    ...submission,
    reviewedBy: attachReviewerEmail(submission.reviewedBy, emailByAuthUserId),
  };
};

export const fetchMySubmissionForChallenge = async (params: {
  context: SubmissionContext;
  challengeId: string;
  tripId: string;
}) => {
  const participant = await ensureTripParticipant(params.context, params.tripId);
  if (!participant.groupId) return null;
  const resolvedChallengeId =
    (await resolveRecurringChallengeIdForTrip({
      tx: params.context.db,
      challengeId: params.challengeId,
      tripId: params.tripId,
    })) ?? params.challengeId;

  const participantGroupId = participant.groupId;
  const submission = await params.context.db.query.challengeSubmissions.findFirst({
    where: (cs, { eq, and }) =>
      and(
        eq(cs.challengeId, resolvedChallengeId),
        participantGroupId ? eq(cs.groupId, participantGroupId) : isNull(cs.groupId),
      ),
    columns: submissionBaseColumns,
    with: submissionWithRelations,
  });

  if (!submission) return null;

  const emailByAuthUserId = await buildAuthEmailLookup(params.context.supabase, [
    submission.reviewedBy?.authUserId,
  ]);

  return {
    ...submission,
    reviewedBy: attachReviewerEmail(submission.reviewedBy, emailByAuthUserId),
  };
};
