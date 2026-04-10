"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/frameworks/graphql/client";
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

const parseVotingSubmissions = (value: unknown): VotingSubmission[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isObject(item)) return null;
      if (
        typeof item.id !== "string" ||
        typeof item.groupId !== "string" ||
        !isObject(item.group) ||
        typeof item.group.name !== "string"
      ) {
        return null;
      }

      const firstImage = Array.isArray(item.imageIds)
        ? item.imageIds.find(
            (image): image is string => typeof image === "string",
          )
        : null;

      if (!firstImage || item.status === "REJECTED") {
        return null;
      }

      return {
        id: item.id,
        groupId: item.groupId,
        groupName: item.group.name,
        imagePath: firstImage,
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString(),
      };
    })
    .filter((item): item is VotingSubmission => item !== null);
};

export function StaffVotingPage({ challengeId }: StaffVotingPageProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const challengeQuery = useQuery({
    queryKey: ["challenge", "details", challengeId, tripId],
    enabled: Boolean(tripId) && Boolean(challengeId),
    queryFn: async () => {
      const result = await trpcClient.challenge.getById.query({
        id: challengeId,
        tripId,
      });
      return parseChallenge(result);
    },
  });

  const submissionsQuery = useQuery({
    queryKey: ["challenge", "admin-submissions", challengeId, tripId],
    enabled: Boolean(tripId) && Boolean(challengeId),
    queryFn: async () => {
      const result =
        await trpcClient.challengeSubmission.getByChallengeForAdmin.query({
          challengeId,
          tripId,
        });
      return parseVotingSubmissions(result);
    },
  });

  const myVotesQuery = useQuery({
    queryKey: ["challenge", "my-votes", challengeId, tripId],
    enabled: Boolean(tripId) && Boolean(challengeId),
    queryFn: async () => {
      const result = await trpcClient.challengeVote.getMyByChallenge.query({
        challengeId,
        tripId,
      });
      return Array.isArray(result)
        ? result.filter((item) =>
            isObject(item) && typeof item.votePosition === "number"
              ? true
              : false,
          )
        : [];
    },
  });

  const progressQuery = useQuery({
    queryKey: ["challenge", "judged-progress", challengeId, tripId],
    enabled:
      Boolean(tripId) &&
      Boolean(challengeId) &&
      challengeQuery.data?.scoringCategory === "JUDGED_STAFF",
    queryFn: async () => {
      const result =
        await trpcClient.challengeVote.getJudgedStaffProgress.query({
          challengeId,
          tripId,
        });

      if (!isObject(result)) {
        return null;
      }

      return {
        requiredPositions:
          typeof result.requiredPositions === "number"
            ? result.requiredPositions
            : 0,
        eligibleSubmissionsCount:
          typeof result.eligibleSubmissionsCount === "number"
            ? result.eligibleSubmissionsCount
            : 0,
        totalAdmins:
          typeof result.totalAdmins === "number" ? result.totalAdmins : 0,
        votedAdmins:
          typeof result.votedAdmins === "number" ? result.votedAdmins : 0,
        pendingAdmins:
          typeof result.pendingAdmins === "number" ? result.pendingAdmins : 0,
      };
    },
    refetchInterval: 10000,
  });

  const votePositions = useMemo(
    () =>
      new Set(
        (myVotesQuery.data ?? []).map((vote) => vote.votePosition),
      ),
    [myVotesQuery.data],
  );

  const requiredVotePositions = Math.max(
    progressQuery.data?.requiredPositions ?? 0,
    0,
  );

  const hasMyCompleteVote =
    requiredVotePositions > 0 &&
    Array.from(
      { length: requiredVotePositions },
      (_, index) => index + 1,
    ).every((position) => votePositions.has(position));

  const voting = useStaffVoting({
    votingSubmissions: submissionsQuery.data ?? [],
    hasMyCompleteVote,
    requiredVotePositions,
    judgedStaffProgress: progressQuery.data ?? undefined,
    myVotesError: myVotesQuery.error,
    judgedStaffProgressError: progressQuery.error,
    challenge: challengeQuery.data ?? undefined,
  });

  useEffect(() => {
    if (
      challengeQuery.isLoading ||
      submissionsQuery.isLoading ||
      myVotesQuery.isLoading ||
      progressQuery.isLoading
    ) {
      return;
    }

    if (challengeQuery.data) {
      voting.bootstrapVoting();
    }
  }, [
    challengeQuery.data,
    challengeQuery.isLoading,
    myVotesQuery.isLoading,
    progressQuery.isLoading,
    submissionsQuery.isLoading,
    voting,
  ]);

  const submitVotesMutation = useMutation({
    mutationFn: (
      votes: {
        submissionId: string;
        votePosition: number;
        votePoints: number;
      }[],
    ) =>
      trpcClient.challengeVote.submitVotes.mutate({
        tripId,
        challengeId,
        votes,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["challenge", "my-votes", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "admin-submissions", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "judged-progress", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "details", challengeId, tripId],
        }),
      ]);
    },
  });

  const forceEndMutation = useMutation({
    mutationFn: () =>
      trpcClient.challengeVote.forceEndJudgedStaffVoting.mutate({
        tripId,
        challengeId,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["challenge", "details", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "admin-submissions", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "my-votes", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenge", "judged-progress", challengeId, tripId],
        }),
      ]);
    },
  });

  const handleSubmitPodium = async () => {
    if (voting.finalTopThree.length < voting.MIN_SUBMISSIONS_TO_VOTE) {
      return;
    }

    const payload = [
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
    ].filter((item) => Boolean(item.submissionId));

    const toastId = appToast.loading("Submitting vote...");
    try {
      await submitVotesMutation.mutateAsync(payload);
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
      await forceEndMutation.mutateAsync();
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
    challengeQuery.isLoading ||
    submissionsQuery.isLoading ||
    myVotesQuery.isLoading
  ) {
    return <LoadingSpinner label="Loading voting..." />;
  }

  if (!challengeQuery.data) {
    return <ErrorMessage message="Could not load challenge details." />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
          Admin votes: {progressQuery.data?.votedAdmins ?? 0}/
          {progressQuery.data?.totalAdmins ?? 0}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {progressQuery.data?.pendingAdmins
            ? `Waiting for ${progressQuery.data.pendingAdmins} admin(s).`
            : "All admin votes are in."}
        </p>
        <div className="mt-3">
          <Button
            variant="danger"
            disabled={forceEndMutation.isPending}
            onClick={() => void handleForceEnd()}
          >
            {forceEndMutation.isPending ? "Finalizing..." : "Force End Voting"}
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
            <Button
              disabled={submitVotesMutation.isPending}
              onClick={() => void handleSubmitPodium()}
            >
              {submitVotesMutation.isPending
                ? "Submitting..."
                : "Confirm Podium"}
            </Button>
          </div>
        </div>
      ) : null}

      {voting.phase === "done" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-lg font-semibold text-emerald-700">
            {challengeQuery.data.status === "COMPLETED"
              ? "Voting completed"
              : "Vote submitted"}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {challengeQuery.data.status === "COMPLETED"
              ? "Staff voting is closed and results were finalized."
              : `Your vote was saved. Waiting for ${progressQuery.data?.pendingAdmins ?? "remaining"} admin(s).`}
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
