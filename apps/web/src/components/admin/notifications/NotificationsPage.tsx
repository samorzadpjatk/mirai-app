"use client";

import { useMemo, useState } from "react";
import {
  useGetAllNotificationsQuery,
  useDeleteNotificationMutation,
  type GetAllNotificationsQuery,
} from "@mirai-app/graphql-client/urql";
import { useClient } from "urql";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import { NotificationCard } from "./NotificationCard";
import { useTrip } from "../../../contexts/TripContext";

export type NotificationStatus = "all" | "pending" | "sent" | "failed";

interface NotificationPush {
  id: string;
  status: "pending" | "sent" | "failed";
}

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
  pushes: NotificationPush[];
}

const parseNotifications = (
  data: GetAllNotificationsQuery | undefined,
): AdminNotification[] => {
  if (!data?.allNotifications?.notifications) return [];

  return data.allNotifications.notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    url: notification.url ?? "/alerts",
    status: notification.status,
    createdBy: {
      firstName: null,
      lastName: null,
    },
    pushes: [], // Note: pushes data may need to be fetched separately or added to the query
  }));
};

export function NotificationsPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus>("all");
  const [groupFilterId, setGroupFilterId] = useState("all");
  const urqlClient = useClient();

  const [
    { data: notificationsData, fetching: isLoading },
    refetchNotifications,
  ] = useGetAllNotificationsQuery({
    variables: {
      tripId: tripId || undefined,
      limit: 100,
      offset: 0,
    },
    pause: !tripId,
  });

  const [, deleteNotification] = useDeleteNotificationMutation();

  const notifications = useMemo(
    () => parseNotifications(notificationsData),
    [notificationsData],
  );

  // Mock groups for filter - would need a groups query
  const groups: { id: string; name: string }[] = [];

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

  const handleRetry = async (_notificationId: string) => {
    const toastId = appToast.loading("Retrying notification...");
    try {
      // Note: Retry functionality may need a specific GraphQL mutation
      // For now, show a message that this feature is being implemented
      appToast.dismiss(toastId);
      appToast.info("Retry feature is being migrated to GraphQL.");
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
      const result = await deleteNotification({ notificationId });

      if (result.error) {
        throw result.error;
      }

      appToast.dismiss(toastId);
      appToast.success("Notification deleted.");
      await refetchNotifications({ requestPolicy: "network-only" });
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

  const pagination = notificationsData?.allNotifications?.pagination;
  const hasMore = pagination?.hasMore ?? false;
  const total = pagination?.total ?? 0;

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
            disabled={isLoading}
            onClick={() => {
              void refetchNotifications({ requestPolicy: "network-only" });
            }}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
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
              isRetrying={false}
              isDeleting={false}
            />
          ))}
        </div>
      )}

      {pagination ? (
        <p className="text-sm text-text-tertiary">
          Showing {notifications.length} / {total} notifications
        </p>
      ) : null}

      {hasMore ? (
        <div>
          <Button variant="secondary" disabled={isLoading}>
            Load more
          </Button>
        </div>
      ) : null}
    </section>
  );
}
