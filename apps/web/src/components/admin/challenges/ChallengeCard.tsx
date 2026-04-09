"use client";

import { Card } from "../../ui/Card";
import type { Challenge } from "@mirai-app/frameworks/trpc/hooks";

interface ChallengeCardProps {
  challenge: Challenge;
  detailsHref?: string;
  editHref?: string;
}

const formatStatus = (status: string): string =>
  status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const statusClassName = (status: Challenge["status"]): string => {
  if (status === "ACTIVE") return "bg-emerald-900/30 text-emerald-400";
  if (status === "VISIBLE") return "bg-sky-900/30 text-sky-400";
  if (status === "VOTING_PHASE") return "bg-amber-900/30 text-amber-400";
  if (status === "COMPLETED") return "bg-surface text-text-secondary";
  if (status === "CANCELLED") return "bg-rose-900/30 text-rose-400";
  return "bg-surface text-text-secondary";
};

export function ChallengeCard({
  challenge,
  detailsHref,
  editHref,
}: ChallengeCardProps) {
  const actionCount = Number(Boolean(detailsHref)) + Number(Boolean(editHref));

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-text-primary">
            {challenge.name}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
            {challenge.description || "No description"}
          </p>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(challenge.status)}`}
        >
          {formatStatus(challenge.status)}
        </span>
      </div>

      <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-2">
        <p>
          <span className="font-medium text-text-primary">Points:</span>{" "}
          {challenge.basePoints}
        </p>
        <p>
          <span className="font-medium text-text-primary">Submission:</span>{" "}
          {formatStatus(challenge.submissionType)}
        </p>
        <p>
          <span className="font-medium text-text-primary">Scoring:</span>{" "}
          {formatStatus(challenge.scoringCategory)}
        </p>
        <p>
          <span className="font-medium text-text-primary">Groups:</span>{" "}
          {challenge.participantGroupsCount}
        </p>
      </div>

      <div className="text-sm">
        <span className="inline-flex rounded-md bg-amber-900/30 px-2 py-1 font-medium text-amber-400">
          Pending submissions: {challenge.pendingSubmissionsCount}
        </span>
      </div>

      {detailsHref || editHref ? (
        <div
          className={`mt-auto grid gap-2 ${actionCount > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {detailsHref ? (
            <a
              className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-card-elevated px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-card"
              href={detailsHref}
            >
              View Details
            </a>
          ) : null}
          {editHref ? (
            <a
              className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-card-elevated px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-card"
              href={editHref}
            >
              Edit
            </a>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
