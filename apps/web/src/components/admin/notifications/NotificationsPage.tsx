"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import {
  useAdminNotifications,
  type NotificationStatus,
} from "@mirai-app/trpc/hooks";
import { NotificationCard } from "./NotificationCard";
import { useTrip } from "../../../contexts/TripContext";
export function NotificationsPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus>("all");
  const [groupFilterId, setGroupFilterId] = useState("all");

  const {
    notifications,
    pagination,
    isLoading,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    retryNotification,
    isRetrying,
    deleteNotification,
    isDeleting,
    groups,
  } = useAdminNotifications(tripId);

  const groupOptions = useMemo(
    () => [
      { value: "all", label: "All groups" },
      ...groups.map((group) => ({ value: group.id, label: group.name })),
    ],
    [groups],
  );

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (statusFilter !== "all") {
        const hasStatus = notification.pushes.some(
          (push) => push.status === statusFilter,
        );
        if (!hasStatus) {
          return false;
        }
      }

      if (normalizedSearch) {
        const creator =
          `${notification.createdBy.firstName ?? ""} ${notification.createdBy.lastName ?? ""}`.toLowerCase();
        const matches =
          notification.title.toLowerCase().includes(normalizedSearch) ||
          notification.body.toLowerCase().includes(normalizedSearch) ||
          creator.includes(normalizedSearch);
        if (!matches) {
          return false;
        }
      }

      if (groupFilterId !== "all") {
        const parsed = new URL(notification.url, "https://integral.local");
        const audience = parsed.searchParams.get("__audience");
        const groupId = parsed.searchParams.get("__groupId");
        return audience === "group" && groupId === groupFilterId;
      }

      return true;
    });
  }, [groupFilterId, notifications, searchTerm, statusFilter]);

  const handleRetry = async (notificationId: string) => {
    const toastId = appToast.loading("Retrying notification...");
    try {
      await retryNotification(notificationId);
      appToast.dismiss(toastId);
      appToast.success("Retry triggered.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error
          ? error.message
          : "Failed to retry notification.",
      );
    }
  };

  const handleDelete = async (notificationId: string) => {
    const confirmed = window.confirm("Delete this notification?");
    if (!confirmed) {
      return;
    }

    const toastId = appToast.loading("Deleting notification...");
    try {
      await deleteNotification(notificationId);
      appToast.dismiss(toastId);
      appToast.success("Notification deleted.");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete notification.",
      );
    }
  };

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading notifications..." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold text-text-primary">Notifications</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review sent notifications and delivery status.
        </p>
        <a
          href="/notifications/new"
          className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-background transition hover:brightness-110"
        >
          Create notification
        </a>
      </header>

      <div className="grid gap-3 rounded-lg border border-border-subtle bg-card p-4 md:grid-cols-4">
        <Input
          label="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Title, body, creator"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as NotificationStatus)
          }
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "sent", label: "Sent" },
            { value: "failed", label: "Failed" },
          ]}
        />
        <Select
          label="Audience group"
          value={groupFilterId}
          onChange={(event) => setGroupFilterId(event.target.value)}
          options={groupOptions}
        />
        <div className="flex items-end gap-2">
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

      {filteredNotifications.length === 0 ? (
        <ErrorMessage message="No notifications found for selected filters." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRetry={handleRetry}
              onDelete={handleDelete}
              isRetrying={isRetrying}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {pagination ? (
        <p className="text-sm text-text-tertiary">
          Showing {notifications.length} / {pagination.total} notifications
        </p>
      ) : null}

      {hasNextPage ? (
        <div>
          <Button
            variant="secondary"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
