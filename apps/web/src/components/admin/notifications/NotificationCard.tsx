"use client";

import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  url: string;
  status: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
  };
  pushes: Array<{
    id: string;
    status: "pending" | "sent" | "failed";
  }>;
}

interface NotificationCardProps {
  notification: AdminNotification;
  onRetry: (notificationId: string) => Promise<void>;
  onDelete: (notificationId: string) => Promise<void>;
  isRetrying: boolean;
  isDeleting: boolean;
}

const getStatusSummary = (pushes: AdminNotification["pushes"]) => {
  const sentCount = pushes.filter((push) => push.status === "sent").length;
  const failedCount = pushes.filter((push) => push.status === "failed").length;
  const pendingCount = pushes.filter(
    (push) => push.status === "pending",
  ).length;

  const status =
    failedCount > 0 ? "failed" : pendingCount > 0 ? "pending" : "sent";

  return {
    sentCount,
    failedCount,
    pendingCount,
    status,
  };
};

const statusPillClassName = (status: string): string => {
  if (status === "sent") return "bg-success/20 text-success";
  if (status === "failed") return "bg-danger/20 text-danger";
  if (status === "pending") return "bg-primary/20 text-primary";
  return "bg-white-10 text-text-secondary";
};

export function NotificationCard({
  notification,
  onRetry,
  onDelete,
  isRetrying,
  isDeleting,
}: NotificationCardProps) {
  const summary = getStatusSummary(notification.pushes);
  const creatorName =
    `${notification.createdBy.firstName ?? ""} ${notification.createdBy.lastName ?? ""}`.trim() ||
    "Unknown";

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-text-primary">
            {notification.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
            {notification.body}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">By {creatorName}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClassName(summary.status)}`}
        >
          {summary.status.toUpperCase()}
        </span>
      </div>

      <div className="grid gap-2 text-sm text-text-secondary md:grid-cols-4">
        <p>
          <span className="font-medium text-text-primary">Sent:</span>{" "}
          {summary.sentCount}
        </p>
        <p>
          <span className="font-medium text-text-primary">Failed:</span>{" "}
          {summary.failedCount}
        </p>
        <p>
          <span className="font-medium text-text-primary">Pending:</span>{" "}
          {summary.pendingCount}
        </p>
        <p>
          <span className="font-medium text-text-primary">Total:</span>{" "}
          {notification.pushes.length}
        </p>
      </div>

      <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isRetrying || summary.failedCount === 0}
          className="w-full"
          onClick={() => void onRetry(notification.id)}
        >
          {isRetrying ? "Retrying..." : "Retry Failed"}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isDeleting}
          className="w-full"
          onClick={() => void onDelete(notification.id)}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Card>
  );
}
