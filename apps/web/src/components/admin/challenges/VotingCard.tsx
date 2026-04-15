"use client";

import { useQuery } from "urql";
import { CreateDownloadUrlDocument } from "@mirai-app/graphql-client";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import type { VotingSubmission } from "../../../hooks/admin/useStaffVoting";

interface VotingCardProps {
  submission: VotingSubmission;
  title: string;
  subtitle?: string;
  onPick?: () => void;
  disabled?: boolean;
}

export function VotingCard({
  submission,
  title,
  subtitle,
  onPick,
  disabled = false,
}: VotingCardProps) {
  // Use urql's useQuery hook with generated document for fetching image URL
  const [imageResult] = useQuery({
    query: CreateDownloadUrlDocument,
    variables: {
      input: {
        storagePath: submission.imagePath,
      },
    },
    pause: !submission.imagePath,
  });

  const imageUrl = imageResult.data?.createDownloadUrl?.signedUrl ?? null;

  return (
    <Card className="h-full space-y-3 overflow-hidden p-0">
      <div className="aspect-[16/10] w-full bg-surface">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={submission.groupName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            {imageResult.fetching ? "Loading image..." : "Image unavailable"}
          </div>
        )}
      </div>

      <div className="space-y-1 px-4 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
          {title}
        </p>
        <p className="text-base font-semibold text-text-primary">
          {submission.groupName}
        </p>
        {subtitle ? (
          <p className="text-sm text-text-secondary">{subtitle}</p>
        ) : null}

        {onPick ? (
          <Button onClick={onPick} disabled={disabled} className="mt-2 w-full">
            Pick winner
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
