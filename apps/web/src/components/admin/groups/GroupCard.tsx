"use client";

import type { AdminGroup } from "@repo/frameworks/trpc/hooks";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

interface GroupCardProps {
  group: AdminGroup;
  onAssign?: () => void;
  editHref?: string;
}

export function GroupCard({ group, onAssign, editHref }: GroupCardProps) {
  const organizerName = group.organizer
    ? [group.organizer.firstName, group.organizer.lastName]
        .filter(Boolean)
        .join(" ") || "Unknown"
    : "Not assigned";

  const actionCount = Number(Boolean(editHref)) + Number(Boolean(onAssign));

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-text-primary">
            {group.name}
          </p>
          <p className="text-sm text-text-secondary">
            Organizer: {organizerName}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Code: {group.code || "-"}
          </p>
        </div>

        <div className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-white">
          {group.coins} coins
        </div>
      </div>

      <div className="text-sm text-text-secondary">
        {group._count.participants} members
      </div>

      <div
        className={`mt-auto grid gap-2 ${actionCount > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {editHref ? (
          <a
            href={editHref}
            className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-card-elevated px-3 py-2 text-sm font-medium text-text-primary transition hover:bg-card"
          >
            Edit
          </a>
        ) : null}
        {onAssign ? (
          <Button
            variant="secondary"
            className="w-full px-3 py-2 text-sm"
            onClick={() => onAssign()}
          >
            Assign Organizer
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
