"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/frameworks/graphql/client";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { Input } from "../../ui/Input";
import { appToast } from "../../../lib/toast";
import {
  useJudgement,
  type JudgementSubmission,
} from "../../../hooks/admin/useJudgement";
import { JudgmentForm } from "./JudgmentForm";
import { useTrip } from "../../../contexts/TripContext";

interface JudgingPageProps {
  challengeId: string;
}

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export function JudgingPage({ challengeId }: JudgingPageProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const trpcClient = useTRPCClient();
  const {
    challenge,
    submissions,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    rankedSubmissions,
    isLoading,
    isReviewing,
    isCompleting,
    reviewSubmission,
    completeChallenge,
  } = useJudgement(tripId, challengeId);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  const challengeVotesQuery = useQuery({
    queryKey: ["challenge", "votes", challengeId],
    enabled: Boolean(challengeId),
    queryFn: async () => {
      const result = await trpcClient.challengeVote.getByChallenge.query({
        challengeId,
      });

      return Array.isArray(result)
        ? result.filter((item) => typeof item === "object" && item !== null)
        : [];
    },
  });

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rankedSubmissions.filter((submission) => {
      if (filterStatus !== "ALL" && submission.status !== filterStatus) {
        return false;
      }

      if (normalizedSearch) {
        return submission.group.name.toLowerCase().includes(normalizedSearch);
      }

      return true;
    });
  }, [filterStatus, rankedSubmissions, searchTerm]);

  const submitJudgement = async (
    submission: JudgementSubmission,
    input: {
      status: "APPROVED" | "REJECTED";
      rejectionReason?: string;
      awardedPoints?: number;
      bonusPoints?: number;
      ranking?: 1 | 2 | 3;
    },
  ) => {
    const toastId = appToast.loading("Saving judgement...");

    try {
      await reviewSubmission({
        id: submission.id,
        status: input.status,
        rejectionReason: input.rejectionReason,
        awardedPoints: input.awardedPoints,
        bonusPoints: input.bonusPoints,
        ranking: input.ranking,
      });

      appToast.dismiss(toastId);
      appToast.success("Judgement saved.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Failed to save judgement.",
      );
      throw error;
    }
  };

  const handleCompleteChallenge = async () => {
    if (
      !window.confirm(
        "Finalize this challenge now? Ensure rankings and points are correct.",
      )
    ) {
      return;
    }

    const toastId = appToast.loading("Finalizing challenge...");
    try {
      await completeChallenge();
      appToast.dismiss(toastId);
      appToast.success("Challenge finalized.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error
          ? error.message
          : "Failed to finalize challenge.",
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading judgment data..." />;
  }

  if (!challenge) {
    return <ErrorMessage message="Could not load challenge for judging." />;
  }

  if (challenge.scoringCategory === "JUDGED_STAFF") {
    return (
      <Card className="space-y-3">
        <p className="text-lg font-semibold text-text-primary">
          Judged Staff challenge
        </p>
        <p className="text-sm text-text-secondary">
          This challenge uses staff voting. Use the dedicated voting view.
        </p>
        <a
          href={`/challenges/${challengeId}/voting`}
          className="inline-flex w-fit rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          Open staff voting
        </a>
      </Card>
    );
  }

  return (
    <section className="space-y-5">
      <Card className="space-y-2">
        <p className="text-xl font-semibold text-text-primary">
          {challenge.name}
        </p>
        <p className="text-sm text-text-secondary">
          Pending {pendingSubmissions.length} • Approved{" "}
          {approvedSubmissions.length} • Rejected {rejectedSubmissions.length}
        </p>
        <p className="text-sm text-text-secondary">
          Votes recorded: {challengeVotesQuery.data?.length ?? 0}
        </p>
      </Card>

      <div className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 md:grid-cols-3">
        <Input
          label="Search by group"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Group name"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Status
          </label>
          <select
            className="w-full rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-text-primary"
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(
                event.target.value as
                  | "ALL"
                  | "PENDING"
                  | "APPROVED"
                  | "REJECTED",
              )
            }
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            variant="danger"
            disabled={isCompleting || submissions.length === 0}
            onClick={() => void handleCompleteChallenge()}
          >
            {isCompleting ? "Finalizing..." : "Complete challenge"}
          </Button>
        </div>
      </div>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-700">
          Winner preview
        </h3>
        <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-3">
          {[1, 2, 3].map((place) => {
            const winner = rankedSubmissions.find(
              (submission) => submission.ranking === place,
            );
            return (
              <div
                key={place}
                className="rounded-lg border border-border-subtle bg-surface p-3"
              >
                <p className="font-semibold text-text-primary">#{place}</p>
                <p>{winner?.group.name ?? "Not assigned"}</p>
                <p className="text-xs text-text-muted">
                  Points:{" "}
                  {winner ? winner.awardedPoints + winner.bonusPoints : "-"}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {filteredSubmissions.length === 0 ? (
        <ErrorMessage message="No submissions match selected filters." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="h-full space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-text-primary">
                    {submission.group.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Submitted {formatDate(submission.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-secondary">
                  {submission.status}
                </span>
              </div>

              <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-3">
                <p>
                  <span className="font-medium text-text-primary">
                    Vote score:
                  </span>{" "}
                  {submission.voteScore}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Votes:</span>{" "}
                  {submission.voteCount}
                </p>
                <p>
                  <span className="font-medium text-text-primary">
                    Ranking:
                  </span>{" "}
                  {submission.ranking ?? "-"}
                </p>
                <p>
                  <span className="font-medium text-text-primary">
                    Awarded:
                  </span>{" "}
                  {submission.awardedPoints}
                </p>
                <p>
                  <span className="font-medium text-text-primary">Bonus:</span>{" "}
                  {submission.bonusPoints}
                </p>
                <p>
                  <span className="font-medium text-text-primary">
                    Final points:
                  </span>{" "}
                  {submission.awardedPoints + submission.bonusPoints}
                </p>
              </div>

              {submission.textContent ? (
                <div className="rounded-lg border border-border-subtle bg-surface p-3 text-sm text-text-secondary">
                  {submission.textContent}
                </div>
              ) : null}

              {submission.rejectionReason ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  Rejection reason: {submission.rejectionReason}
                </div>
              ) : null}

              <JudgmentForm
                submission={submission}
                isSubmitting={isReviewing}
                onSubmit={(input) => submitJudgement(submission, input)}
              />
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
