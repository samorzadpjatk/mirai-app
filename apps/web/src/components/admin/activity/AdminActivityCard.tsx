"use client";

import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import type { AdminActivity } from "@mirai-app/graphql-types";

interface AdminActivityCardProps {
  item: AdminActivity;
  isBusy: boolean;
  onEdit: (item: AdminActivity) => void;
  onPin: (item: AdminActivity) => void;
  onHide: (item: AdminActivity) => void;
  onDelete: (item: AdminActivity) => void;
}

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const getActivityGroupName = (activity: AdminActivity) =>
  activity.submissionActivity?.group?.name?.trim() ??
  activity.rankChangeActivity?.group?.name?.trim() ??
  activity.userPost?.author?.group?.name?.trim() ??
  "";

export function AdminActivityCard({
  item,
  isBusy,
  onEdit,
  onPin,
  onHide,
  onDelete,
}: AdminActivityCardProps) {
  const groupName = getActivityGroupName(item);

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-primary">
            {item.activityType}
          </p>
          <h3 className="text-base font-semibold text-text-primary">
            {item.title}
          </h3>
          {groupName ? (
            <p className="text-sm text-text-secondary">Group: {groupName}</p>
          ) : null}
          <p className="text-sm text-text-muted">
            {formatRelativeTime(item.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.isPinned ? (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              Pinned
            </span>
          ) : null}
          {item.isHidden ? (
            <span className="rounded-full bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-400">
              Hidden
            </span>
          ) : null}
        </div>
      </div>

      {item.description ? (
        <p className="text-sm text-text-secondary">{item.description}</p>
      ) : null}

      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-36 w-full rounded-lg border border-border-subtle object-cover"
        />
      ) : null}

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          disabled={isBusy}
          className="w-full"
          onClick={() => onEdit(item)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          disabled={isBusy}
          onClick={() => onHide(item)}
        >
          {item.isHidden ? "Unhide" : "Hide"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          disabled={isBusy}
          onClick={() => onPin(item)}
        >
          {item.isPinned ? "Unpin" : "Pin"}
        </Button>
        <Button
          variant="danger"
          className="w-full"
          disabled={isBusy}
          onClick={() => onDelete(item)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
