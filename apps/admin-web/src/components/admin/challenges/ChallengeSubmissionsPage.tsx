"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import {
  useChallengeSubmissions,
  type SubmissionStatus,
} from "../../../hooks/admin/useChallengeSubmissions";
import { SubmissionCard } from "./SubmissionCard";
import { useTrip } from "../../../contexts/TripContext";

interface ChallengeSubmissionsPageProps {
  challengeId: string;
}

type StatusFilter = "ALL" | SubmissionStatus;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function ChallengeSubmissionsPage({
  challengeId,
}: ChallengeSubmissionsPageProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState("");

  const {
    submissions,
    isLoading,
    isRefetching,
    refetch,
    reviewSubmission,
    isReviewing,
    flagSubmission,
    isFlagging,
  } = useChallengeSubmissions(tripId, challengeId);

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const parsedMinScore = minScore.trim()
      ? Number.parseFloat(minScore.trim())
      : null;

    return [...submissions]
      .filter((submission) => {
        if (statusFilter !== "ALL" && submission.status !== statusFilter) {
          return false;
        }

        if (
          normalizedSearch &&
          !submission.group.name.toLowerCase().includes(normalizedSearch)
        ) {
          return false;
        }

        if (
          parsedMinScore != null &&
          Number.isFinite(parsedMinScore) &&
          submission.voteScore < parsedMinScore
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
  }, [minScore, searchTerm, statusFilter, submissions]);

  const handleApprove = async (submissionId: string) => {
    const toastId = appToast.loading("Approving submission...");
    try {
      await reviewSubmission({ id: submissionId, status: "APPROVED" });
      appToast.dismiss(toastId);
      appToast.success("Submission approved.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error
          ? error.message
          : "Failed to approve submission.",
      );
    }
  };

  const handleReject = async (submissionId: string, reason: string) => {
    const toastId = appToast.loading("Rejecting submission...");
    try {
      await reviewSubmission({
        id: submissionId,
        status: "REJECTED",
        rejectionReason: reason,
      });
      appToast.dismiss(toastId);
      appToast.success("Submission rejected.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Failed to reject submission.",
      );
    }
  };

  const handleFlag = async (
    submissionId: string,
    reason: string,
    details?: string,
  ) => {
    const toastId = appToast.loading("Flagging submission...");
    try {
      await flagSubmission({ submissionId, reason, details });
      appToast.dismiss(toastId);
      appToast.success("Submission flagged.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Failed to flag submission.",
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading submissions..." />;
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 md:grid-cols-4">
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as StatusFilter)
          }
          options={statusOptions}
        />
        <Input
          label="Filter by group"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search group name"
        />
        <Input
          label="Min vote score"
          value={minScore}
          onChange={(event) => setMinScore(event.target.value)}
          placeholder="e.g. 2.5"
        />
        <div className="flex items-end">
          <Button
            variant="secondary"
            disabled={isRefetching}
            onClick={() => {
              void refetch();
            }}
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <ErrorMessage message="No submissions found for selected filters." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              isReviewing={isReviewing}
              isFlagging={isFlagging}
              onApprove={handleApprove}
              onReject={handleReject}
              onFlag={handleFlag}
            />
          ))}
        </div>
      )}
    </section>
  );
}
