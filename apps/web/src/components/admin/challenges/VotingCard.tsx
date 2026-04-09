"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/frameworks/trpc/client";
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
  const trpcClient = useTRPCClient();

  const imageQuery = useQuery({
    queryKey: ["voting-card-image", submission.id, submission.imagePath],
    enabled: Boolean(submission.imagePath),
    queryFn: async () => {
      const result = await trpcClient.storage.createDownloadUrl.query({
        storagePath: submission.imagePath,
      });

      if (
        typeof result === "object" &&
        result !== null &&
        "signedUrl" in result &&
        typeof (result as { signedUrl?: unknown }).signedUrl === "string"
      ) {
        return (result as { signedUrl: string }).signedUrl;
      }

      return null;
    },
  });

  return (
    <Card className="h-full space-y-3 overflow-hidden p-0">
      <div className="aspect-[16/10] w-full bg-surface">
        {imageQuery.data ? (
          <img
            src={imageQuery.data}
            alt={submission.groupName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            {imageQuery.isLoading ? "Loading image..." : "Image unavailable"}
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
