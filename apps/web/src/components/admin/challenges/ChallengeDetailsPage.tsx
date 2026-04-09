"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/frameworks/trpc/client";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { appToast } from "../../../lib/toast";
import { ChallengeAnalyticsPanel } from "./ChallengeAnalyticsPanel";

interface ChallengeDetailsPageProps {
  tripId: string;
  challengeId: string;
}

type ChallengeStatus =
  | "HIDDEN"
  | "VISIBLE"
  | "ACTIVE"
  | "VOTING_PHASE"
  | "COMPLETED"
  | "CANCELLED";

interface ChallengeDetails {
  id: string;
  tripId: string;
  name: string;
  description: string;
  image: string | null;
  submissionType: string;
  scoringCategory: string;
  status: ChallengeStatus;
  startTime: string | null;
  endTime: string | null;
  votingStartTime: string | null;
  votingEndTime: string | null;
  isRecurring: boolean;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  basePoints: number | null;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  autoApprove: boolean;
  targetLatitude: number | null;
  targetLongitude: number | null;
  qrCodeValue: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseChallengeStatus = (value: unknown): ChallengeStatus => {
  if (
    value === "HIDDEN" ||
    value === "VISIBLE" ||
    value === "ACTIVE" ||
    value === "VOTING_PHASE" ||
    value === "COMPLETED" ||
    value === "CANCELLED"
  ) {
    return value;
  }

  return "HIDDEN";
};

const parseNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const parseNullableNumber = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

const parseChallengeDetails = (value: unknown): ChallengeDetails | null => {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.tripId !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    tripId: value.tripId,
    name: value.name,
    description: typeof value.description === "string" ? value.description : "",
    image: parseNullableString(value.image),
    submissionType:
      typeof value.submissionType === "string" ? value.submissionType : "IMAGE",
    scoringCategory:
      typeof value.scoringCategory === "string"
        ? value.scoringCategory
        : "JUDGED_STAFF",
    status: parseChallengeStatus(value.status),
    startTime: parseNullableString(value.startTime),
    endTime: parseNullableString(value.endTime),
    votingStartTime: parseNullableString(value.votingStartTime),
    votingEndTime: parseNullableString(value.votingEndTime),
    isRecurring: Boolean(value.isRecurring),
    dailyStartTime: parseNullableString(value.dailyStartTime),
    dailyEndTime: parseNullableString(value.dailyEndTime),
    basePoints: parseNullableNumber(value.basePoints),
    firstPlacePoints: parseNullableNumber(value.firstPlacePoints),
    secondPlacePoints: parseNullableNumber(value.secondPlacePoints),
    thirdPlacePoints: parseNullableNumber(value.thirdPlacePoints),
    autoApprove: Boolean(value.autoApprove),
    targetLatitude: parseNullableNumber(value.targetLatitude),
    targetLongitude: parseNullableNumber(value.targetLongitude),
    qrCodeValue:
      parseNullableString(value.qrCodeValue) ??
      parseNullableString(value.expectedValue),
    createdAt: parseNullableString(value.createdAt),
    updatedAt: parseNullableString(value.updatedAt),
  };
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatStatusLabel = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

export function ChallengeDetailsPage({
  tripId,
  challengeId,
}: ChallengeDetailsPageProps) {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: ["challenge", "details", challengeId, tripId],
    enabled: Boolean(challengeId) && Boolean(tripId),
    queryFn: async () => {
      const result = await trpcClient.challenge.getById.query({
        id: challengeId,
        tripId,
      });

      const parsed = parseChallengeDetails(result);
      if (!parsed) {
        throw new Error("Invalid challenge response");
      }

      return parsed;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: ChallengeStatus) => {
      return trpcClient.challenge.update.mutate({
        id: challengeId,
        tripId,
        status,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["challenge", "details", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenges", tripId],
        }),
      ]);
    },
  });

  const forceCloseVotingMutation = useMutation({
    mutationFn: async () => {
      return trpcClient.challenge.forceCloseVoting.mutate({
        id: challengeId,
        tripId,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["challenge", "details", challengeId, tripId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["challenges", tripId],
        }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return trpcClient.challenge.delete.mutate({
        id: challengeId,
        tripId,
      });
    },
  });

  const changeStatus = async (status: ChallengeStatus, label: string) => {
    const toastId = appToast.loading(`${label}...`);
    try {
      await updateStatusMutation.mutateAsync(status);
      appToast.dismiss(toastId);
      appToast.success(`Challenge moved to ${formatStatusLabel(status)}.`);
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${label.toLowerCase()}.`;
      appToast.error(message);
    }
  };

  const completeChallenge = async () => {
    const challenge = detailsQuery.data;
    if (!challenge) return;

    const toastId = appToast.loading("Completing challenge...");
    try {
      if (
        challenge.scoringCategory === "PEER_VOTING" &&
        challenge.status === "VOTING_PHASE"
      ) {
        await forceCloseVotingMutation.mutateAsync();
      } else {
        await updateStatusMutation.mutateAsync("COMPLETED");
      }

      appToast.dismiss(toastId);
      appToast.success("Challenge completed.");
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to complete challenge.";
      appToast.error(message);
    }
  };

  const deleteChallenge = async () => {
    const confirmed = window.confirm(
      "Delete this challenge? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    const toastId = appToast.loading("Deleting challenge...");
    try {
      await deleteMutation.mutateAsync();
      appToast.dismiss(toastId);
      appToast.success("Challenge deleted.");
      window.location.href = "/challenges";
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error ? error.message : "Failed to delete challenge.";
      appToast.error(message);
    }
  };

  if (detailsQuery.isLoading) {
    return <LoadingSpinner label="Loading challenge..." />;
  }

  if (detailsQuery.error || !detailsQuery.data) {
    return <ErrorMessage message="Could not load challenge details." />;
  }

  const challenge = detailsQuery.data;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`/challenges/edit/${challenge.id}`}
          className="rounded-lg border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface"
        >
          Edit challenge
        </a>
        <a
          href={`/challenges/${challenge.id}/submissions`}
          className="rounded-lg border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface"
        >
          Review submissions
        </a>
        <a
          href={`/challenges/${challenge.id}/voting`}
          className="rounded-lg border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface"
        >
          Staff voting
        </a>
        <a
          href={`/challenges/${challenge.id}/judging`}
          className="rounded-lg border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface"
        >
          Judging
        </a>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-text-primary">
              {challenge.name}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {challenge.description || "No description"}
            </p>
          </div>
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-secondary">
            {formatStatusLabel(challenge.status)}
          </span>
        </div>

        {challenge.image ? (
          <img
            src={challenge.image}
            alt={challenge.name}
            className="h-56 w-full rounded-lg border border-border-subtle object-cover"
          />
        ) : null}

        <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
          <p>
            <span className="font-medium text-text-primary">
              Submission type:
            </span>{" "}
            {formatStatusLabel(challenge.submissionType)}
          </p>
          <p>
            <span className="font-medium text-text-primary">Scoring:</span>{" "}
            {formatStatusLabel(challenge.scoringCategory)}
          </p>
          <p>
            <span className="font-medium text-text-primary">Base points:</span>{" "}
            {challenge.basePoints ?? "-"}
          </p>
          <p>
            <span className="font-medium text-text-primary">Auto-approve:</span>{" "}
            {challenge.autoApprove ? "Yes" : "No"}
          </p>
          <p>
            <span className="font-medium text-text-primary">1st/2nd/3rd:</span>{" "}
            {[
              challenge.firstPlacePoints,
              challenge.secondPlacePoints,
              challenge.thirdPlacePoints,
            ]
              .map((value) => (value == null ? "-" : String(value)))
              .join(" / ")}
          </p>
          <p>
            <span className="font-medium text-text-primary">Recurring:</span>{" "}
            {challenge.isRecurring
              ? `${challenge.dailyStartTime ?? "-"} - ${challenge.dailyEndTime ?? "-"}`
              : "No"}
          </p>
          <p>
            <span className="font-medium text-text-primary">
              Target location:
            </span>{" "}
            {challenge.targetLatitude != null &&
            challenge.targetLongitude != null
              ? `${challenge.targetLatitude}, ${challenge.targetLongitude}`
              : "-"}
          </p>
          <p>
            <span className="font-medium text-text-primary">QR value:</span>{" "}
            {challenge.qrCodeValue ?? "-"}
          </p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Timeline
        </h4>
        <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
          <p>
            <span className="font-medium text-text-primary">Start:</span>{" "}
            {formatDateTime(challenge.startTime)}
          </p>
          <p>
            <span className="font-medium text-text-primary">End:</span>{" "}
            {formatDateTime(challenge.endTime)}
          </p>
          <p>
            <span className="font-medium text-text-primary">Voting start:</span>{" "}
            {formatDateTime(challenge.votingStartTime)}
          </p>
          <p>
            <span className="font-medium text-text-primary">Voting end:</span>{" "}
            {formatDateTime(challenge.votingEndTime)}
          </p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Actions
        </h4>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={
              updateStatusMutation.isPending ||
              challenge.status === "VOTING_PHASE"
            }
            onClick={() => void changeStatus("VOTING_PHASE", "Starting voting")}
          >
            Start voting
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={
              updateStatusMutation.isPending || challenge.status === "ACTIVE"
            }
            onClick={() => void changeStatus("ACTIVE", "Starting judging")}
          >
            Start judging
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={
              updateStatusMutation.isPending ||
              forceCloseVotingMutation.isPending ||
              challenge.status === "COMPLETED"
            }
            onClick={() => void completeChallenge()}
          >
            Complete
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() => void deleteChallenge()}
          >
            Delete
          </Button>
        </div>
      </Card>

      <ChallengeAnalyticsPanel
        tripId={tripId}
        challengeId={challenge.id}
        scoringCategory={challenge.scoringCategory}
        status={challenge.status}
        createdAt={challenge.createdAt}
        updatedAt={challenge.updatedAt}
        startTime={challenge.startTime}
        endTime={challenge.endTime}
        votingStartTime={challenge.votingStartTime}
        votingEndTime={challenge.votingEndTime}
        isRecurring={challenge.isRecurring}
        dailyStartTime={challenge.dailyStartTime}
        dailyEndTime={challenge.dailyEndTime}
      />
    </section>
  );
}
