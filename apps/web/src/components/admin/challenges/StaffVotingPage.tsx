"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengeDocument,
  GetChallengeSubmissionsDocument,
  GetMyVotesDocument,
  GetJudgedStaffVotingProgressDocument,
  SubmitVotesDocument,
  ForceEndVotingDocument,
  type GetChallengeSubmissionsQuery,
  type GetMyVotesQuery,
  type GetJudgedStaffVotingProgressQuery,
} from "@mirai-app/graphql-client/urql";
import { appToast } from "../../../lib/toast";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { Button } from "../../ui/Button";
import { VotingCard } from "./VotingCard";
import {
  useStaffVoting,
  type VotingSubmission,
} from "../../../hooks/admin/useStaffVoting";
import { useTrip } from "../../../contexts/TripContext";

interface StaffVotingPageProps {
  challengeId: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseChallenge = (value: unknown) => {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string")
    return null;

  return {
    id: value.id,
    name: value.name,
    scoringCategory:
      typeof value.scoringCategory === "string" ? value.scoringCategory : "",
    endTime:
      typeof value.endTime === "string" || value.endTime instanceof Date
        ? value.endTime
        : null,
    status: typeof value.status === "string" ? value.status : "HIDDEN",
  };
};

const parseVotingSubmissions = (
  data: GetChallengeSubmissionsQuery | undefined,
): VotingSubmission[] => {
  if (!data?.challengeSubmissions?.submissions) return [];

  return data.challengeSubmissions.submissions
    .map((item) => {
      if (!item?.id || !item.group?.id || !item.group.name) {
        return null;
      }

      const firstImage = item.imageIds?.find(
        (image): image is string => typeof image === "string",
      );

      if (!firstImage || item.status === "REJECTED") {
        return null;
      }

      return {
        id: item.id,
        groupId: item.group.id,
        groupName: item.group.name,
        imagePath: firstImage,
        createdAt: item.createdAt ?? new Date().toISOString(),
      };
    })
    .filter((item): item is VotingSubmission => item !== null);
};

export function StaffVotingPage({ challengeId }: StaffVotingPageProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const urqlClient = useClient();

  // Challenge query using urql
  const [challengeResult] = useQuery({
    query: GetChallengeDocument,
    variables: { id: challengeId, tripId },
    pause: !tripId || !challengeId,
  });

  const challengeQuery = {
    data: challengeResult.data
      ? { challenge: parseChallenge(challengeResult.data.challenge) }
      : undefined,
    fetching: challengeResult.fetching,
    error: challengeResult.error,
  };

  // Submissions query using urql
  const [submissionsResult] = useQuery({
    query: GetChallengeSubmissionsDocument,
    variables: { challengeId, limit: 100, offset: 0 },
    pause: !tripId || !challengeId,
  });

  const submissionsQuery = {
    data: submissionsResult.data,
    fetching: submissionsResult.fetching,
    error: submissionsResult.error,
  };

  // My votes query using urql
  const [myVotesResult] = useQuery({
    query: GetMyVotesDocument,
    variables: { challengeId, tripId },
    pause: !tripId || !challengeId,
  });

  const myVotesQuery = {
    data: myVotesResult.data,
    fetching: myVotesResult.fetching,
    error: myVotesResult.error,
  };

  // Judged staff progress query using urql
  const [progressResult] = useQuery({
    query: GetJudgedStaffVotingProgressDocument,
    variables: {
      challengeId,
      tripId,
      adminParticipantIds: [],
      eligibleSubmissionsCount: 0,
      requiredPositions: 3,
    },
    pause:
      !tripId ||
      !challengeId ||
      challengeQuery.data?.challenge?.scoringCategory !== "JUDGED_STAFF",
  });

  const progressQuery = {
    data: progressResult.data,
    fetching: progressResult.fetching,
    error: progressResult.error,
  };

  const votingSubmissions = useMemo(
    () => parseVotingSubmissions(submissionsQuery.data),
    [submissionsQuery.data],
  );

  const votePositions = useMemo(
    () =>
      new Set(
        (myVotesQuery.data?.myVotes?.votes ?? [])
          .filter((vote) => vote?.votePosition !== undefined)
          .map((vote) => vote.votePosition!),
      ),
    [myVotesQuery.data?.myVotes?.votes],
  );

  const requiredVotePositions = Math.max(
    progressQuery.data?.judgedStaffVotingProgress?.requiredPositions ?? 0,
    0,
  );

  const hasMyCompleteVote =
    requiredVotePositions > 0 &&
    Array.from(
      { length: requiredVotePositions },
      (_, index) => index + 1,
    ).every((position) => votePositions.has(position));

  const voting = useStaffVoting({
    votingSubmissions,
    hasMyCompleteVote,
    requiredVotePositions,
    judgedStaffProgress:
      progressQuery.data?.judgedStaffVotingProgress ?? undefined,
    myVotesError: myVotesQuery.error,
    judgedStaffProgressError: progressQuery.error,
    challenge: challengeQuery.data?.challenge ?? undefined,
  });

  useEffect(() => {
    if (
      challengeQuery.fetching ||
      submissionsQuery.fetching ||
      myVotesQuery.fetching ||
      progressQuery.fetching
    ) {
      return;
    }

    if (challengeQuery.data?.challenge) {
      voting.bootstrapVoting();
    }
  }, [
    challengeQuery.data?.challenge,
    challengeQuery.fetching,
    myVotesQuery.fetching,
    progressQuery.fetching,
    submissionsQuery.fetching,
    voting,
  ]);

  // Submit votes mutation using urql
  const [, submitVotes] = useMutation(SubmitVotesDocument);

  // Force end voting mutation using urql
  const [, forceEndVoting] = useMutation(ForceEndVotingDocument);

  const handleSubmitPodium = async () => {
    if (voting.finalTopThree.length < voting.MIN_SUBMISSIONS_TO_VOTE) {
      return;
    }

    const payload = {
      tripId,
      challengeId,
      votes: [
        {
          submissionId: voting.finalTopThree[0]?.id ?? "",
          votePosition: 1,
          votePoints: 3,
        },
        {
          submissionId: voting.finalTopThree[1]?.id ?? "",
          votePosition: 2,
          votePoints: 2,
        },
        {
          submissionId: voting.finalTopThree[2]?.id ?? "",
          votePosition: 3,
          votePoints: 1,
        },
      ].filter((item) => Boolean(item.submissionId)),
    };

    const toastId = appToast.loading("Submitting vote...");
    try {
      const result = await submitVotes({ input: payload });

      if (result.error) {
        throw result.error;
      }

      // Invalidate queries
      await urqlClient.invalidate(GetMyVotesDocument, { challengeId, tripId });
      await urqlClient.invalidate(GetChallengeSubmissionsDocument, {
        challengeId,
        limit: 100,
        offset: 0,
      });
      await urqlClient.invalidate(GetJudgedStaffVotingProgressDocument, {
        challengeId,
        tripId,
        adminParticipantIds: [],
        eligibleSubmissionsCount: 0,
        requiredPositions: 3,
      });
      await urqlClient.invalidate(GetChallengeDocument, {
        id: challengeId,
        tripId,
      });

      appToast.dismiss(toastId);
      appToast.success("Vote submitted.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Failed to submit vote.",
      );
    }
  };

  const handleForceEnd = async () => {
    if (
      !window.confirm(
        "Force end voting now and finalize results from current votes?",
      )
    ) {
      return;
    }

    const toastId = appToast.loading("Finalizing voting...");
    try {
      const result = await forceEndVoting({ challengeId, tripId });

      if (result.error) {
        throw result.error;
      }

      // Invalidate queries
      await urqlClient.invalidate(GetChallengeDocument, {
        id: challengeId,
        tripId,
      });
      await urqlClient.invalidate(GetChallengeSubmissionsDocument, {
        challengeId,
        limit: 100,
        offset: 0,
      });
      await urqlClient.invalidate(GetMyVotesDocument, { challengeId, tripId });
      await urqlClient.invalidate(GetJudgedStaffVotingProgressDocument, {
        challengeId,
        tripId,
        adminParticipantIds: [],
        eligibleSubmissionsCount: 0,
        requiredPositions: 3,
      });

      appToast.dismiss(toastId);
      appToast.success("Voting finalized.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Failed to finalize voting.",
      );
    }
  };

  if (
    challengeQuery.fetching ||
    submissionsQuery.fetching ||
    myVotesQuery.fetching
  ) {
    return <LoadingSpinner label="Loading voting..." />;
  }

  if (!challengeQuery.data?.challenge) {
    return <ErrorMessage message="Could not load challenge details." />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          Admin votes:{" "}
          {progressQuery.data?.judgedStaffVotingProgress?.votedAdmins ?? 0}/
          {progressQuery.data?.judgedStaffVotingProgress?.totalAdmins ?? 0}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {progressQuery.data?.judgedStaffVotingProgress?.pendingAdmins
            ? `Waiting for ${progressQuery.data.judgedStaffVotingProgress.pendingAdmins} admin(s).`
            : "All admin votes are in."}
        </p>
        <div className="mt-3">
          <Button
            variant="danger"
            disabled={false}
            onClick={() => void handleForceEnd()}
          >
            Force End Voting
          </Button>
        </div>
      </div>
      {voting.phase === "comparing" ? (
        <>
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-primary-600"
                style={{ width: `${Math.round(voting.progress * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {voting.comparisonCount}/{voting.hardCap} comparisons
            </p>
          </div>

          {voting.currentLeft && voting.currentRight ? (
            <div className="grid gap-4 md:grid-cols-2">
              <VotingCard
                submission={voting.currentLeft}
                title="Pick this"
                subtitle="Tap to select winner"
                onPick={() => voting.handlePickWinner(voting.currentLeft!.id)}
              />
              <VotingCard
                submission={voting.currentRight}
                title="Pick this"
                subtitle="Tap to select winner"
                onPick={() => voting.handlePickWinner(voting.currentRight!.id)}
              />
            </div>
          ) : (
            <LoadingSpinner label="Preparing next comparison..." />
          )}

          {voting.stableTop3Count > 0 ? (
            <p className="text-xs text-text-secondary">
              Top 3 stable streak: {voting.stableTop3Count}/
              {voting.TOP3_STABILITY_REQUIRED}
            </p>
          ) : null}
        </>
      ) : null}
      {voting.phase === "confirming" ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Confirm your podium
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {voting.finalTopThree.map((submission, index) => (
              <VotingCard
                key={`${submission.id}-${index + 1}`}
                submission={submission}
                title={`#${index + 1}`}
                subtitle={
                  index === 0
                    ? "3 points"
                    : index === 1
                      ? "2 points"
                      : "1 point"
                }
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => voting.startComparing()}>
              Vote Again
            </Button>
            <Button disabled={false} onClick={() => void handleSubmitPodium()}>
              Confirm Podium
            </Button>
          </div>
        </div>
      ) : null}
      {voting.phase === "done" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-lg font-semibold text-emerald-700">
            {challengeQuery.data.challenge.status === "COMPLETED"
              ? "Voting completed"
              : "Vote submitted"}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {challengeQuery.data.challenge.status === "COMPLETED"
              ? "Staff voting is closed and results were finalized."
              : `Your vote was saved. Waiting for ${progressQuery.data?.judgedStaffVotingProgress?.pendingAdmins ?? "remaining"} admin(s).`}
          </p>
          <a
            href={`/challenges/${challengeId}`}
            className="mt-3 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Back to challenge
          </a>
        </div>
      ) : null}

      {voting.phase === "blocked" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-lg font-semibold text-rose-700">
            Voting unavailable
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {voting.blockedReason ?? "Voting is not available right now."}
          </p>
          <a
            href={`/challenges/${challengeId}`}
            className="mt-3 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Back to challenge
          </a>
        </div>
      ) : null}
    </section>
  );
}
