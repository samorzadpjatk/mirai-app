"use client";

import { useState } from "react";
import { useTRPCClient } from "@mirai-app/frameworks/graphql/client";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { Input } from "../../ui/Input";
import { appToast } from "../../../lib/toast";
import type { SubmissionItem } from "../../../hooks/admin/useChallengeSubmissions";

interface SubmissionCardProps {
  submission: SubmissionItem;
  isReviewing: boolean;
  isFlagging: boolean;
  onApprove: (submissionId: string) => Promise<void>;
  onReject: (submissionId: string, reason: string) => Promise<void>;
  onFlag: (
    submissionId: string,
    reason: string,
    details?: string,
  ) => Promise<void>;
}

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const statusClassName = (status: SubmissionItem["status"]): string => {
  if (status === "APPROVED") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "REJECTED") {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-amber-100 text-amber-800";
};

const formatReviewer = (submission: SubmissionItem): string => {
  const reviewedBy = submission.reviewedBy;
  if (!reviewedBy) {
    return "-";
  }

  const fullName =
    `${reviewedBy.firstName ?? ""} ${reviewedBy.lastName ?? ""}`.trim();
  if (fullName) {
    return fullName;
  }

  return reviewedBy.email ?? "Unknown reviewer";
};

export function SubmissionCard({
  submission,
  isReviewing,
  isFlagging,
  onApprove,
  onReject,
  onFlag,
}: SubmissionCardProps) {
  const trpcClient = useTRPCClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    submission.rejectionReason ?? "",
  );
  const [flagReason, setFlagReason] = useState("");
  const [flagDetails, setFlagDetails] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isOpeningImage, setIsOpeningImage] = useState(false);

  const openImage = async () => {
    const storagePath = submission.imageIds[0];
    if (!storagePath) {
      return;
    }

    setIsOpeningImage(true);
    try {
      const response = await trpcClient.storage.createDownloadUrl.query({
        storagePath,
      });

      if (
        typeof response !== "object" ||
        response === null ||
        typeof (response as { signedUrl?: unknown }).signedUrl !== "string"
      ) {
        throw new Error("Could not create download URL for image.");
      }

      setPreviewImageUrl((response as { signedUrl: string }).signedUrl);
    } catch (error) {
      appToast.error(
        error instanceof Error
          ? error.message
          : "Failed to open submission image.",
      );
    } finally {
      setIsOpeningImage(false);
    }
  };

  const handleApprove = async () => {
    await onApprove(submission.id);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    await onReject(submission.id, rejectReason.trim());
    setRejectOpen(false);
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      return;
    }
    await onFlag(
      submission.id,
      flagReason.trim(),
      flagDetails.trim() || undefined,
    );
    setFlagOpen(false);
    setFlagReason("");
    setFlagDetails("");
  };

  return (
    <>
      <Card className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-text-primary">
              {submission.group.name}
            </p>
            <p className="text-xs text-text-muted">
              Submitted: {formatDateTime(submission.createdAt)}
            </p>
            <p className="text-xs text-text-muted">
              Reviewed by: {formatReviewer(submission)}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(submission.status)}`}
          >
            {submission.status}
          </span>
        </div>

        <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
          <p>
            <span className="font-medium text-text-primary">Vote score:</span>{" "}
            {submission.voteScore}
          </p>
          <p>
            <span className="font-medium text-text-primary">Votes:</span>{" "}
            {submission.voteCount}
          </p>
          <p>
            <span className="font-medium text-text-primary">
              Awarded points:
            </span>{" "}
            {submission.awardedPoints}
          </p>
          <p>
            <span className="font-medium text-text-primary">Bonus points:</span>{" "}
            {submission.bonusPoints}
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

        <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
          {submission.imageIds.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => void openImage()}
              disabled={isOpeningImage}
            >
              {isOpeningImage ? "Opening image..." : "View image"}
            </Button>
          ) : null}

          {submission.videoId ? (
            <span className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs text-text-secondary">
              Video submission available
            </span>
          ) : null}

          {submission.status !== "APPROVED" ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={isReviewing}
              onClick={() => void handleApprove()}
            >
              Approve
            </Button>
          ) : null}

          {submission.status !== "REJECTED" ? (
            <Button
              type="button"
              variant="danger"
              className="w-full"
              disabled={isReviewing}
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isFlagging}
            onClick={() => setFlagOpen(true)}
          >
            Flag
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={rejectOpen}
        title="Reject Submission"
        onClose={() => setRejectOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Reason"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Explain why this submission is rejected"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleReject()}
              disabled={!rejectReason.trim() || isReviewing}
            >
              Confirm reject
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={flagOpen}
        title="Flag Submission"
        onClose={() => setFlagOpen(false)}
      >
        <div className="space-y-4">
          <Input
            label="Flag reason"
            value={flagReason}
            onChange={(event) => setFlagReason(event.target.value)}
            placeholder="e.g. inappropriate content"
          />
          <Input
            label="Details"
            value={flagDetails}
            onChange={(event) => setFlagDetails(event.target.value)}
            placeholder="Optional extra details"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFlagOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleFlag()}
              disabled={!flagReason.trim() || isFlagging}
            >
              Submit flag
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(previewImageUrl)}
        title="Submission Image"
        onClose={() => setPreviewImageUrl(null)}
      >
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt="Submission"
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        ) : null}
      </Modal>
    </>
  );
}
