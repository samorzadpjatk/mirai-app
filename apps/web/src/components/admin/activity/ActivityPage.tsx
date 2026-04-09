"use client";

import { useMemo, useState } from "react";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import {
  useAdminActivity,
  type ActivityType,
  type AdminActivity,
} from "@repo/frameworks/trpc/hooks";
import { AdminActivityCard } from "./AdminActivityCard";
import { useTrip } from "../../../contexts/TripContext";

const activityTypeFilters: { label: string; value: "all" | ActivityType }[] = [
  { label: "All", value: "all" },
  { label: "Submission", value: "submission" },
  { label: "Challenge", value: "challenge_event" },
  { label: "Rank", value: "rank_change" },
  { label: "Custom", value: "custom" },
  { label: "User Post", value: "user_post" },
];

const getActivityGroupName = (activity: AdminActivity) =>
  activity.submissionActivity?.group?.name?.trim() ??
  activity.rankChangeActivity?.group?.name?.trim() ??
  activity.userPost?.author?.group?.name?.trim() ??
  "";

export function ActivityPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    activities,
    isLoading,
    isRefetching,
    refetch,
    setPinned,
    hide,
    unhide,
    deleteActivity,
    isBusy,
  } = useAdminActivity(tripId);

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return activities.filter((activity) => {
      if (selectedType !== "all" && activity.activityType !== selectedType) {
        return false;
      }

      if (!query) return true;

      const groupName = getActivityGroupName(activity).toLowerCase();
      const title = activity.title.toLowerCase();
      return title.includes(query) || groupName.includes(query);
    });
  }, [activities, searchTerm, selectedType]);

  const handlePin = async (activity: AdminActivity) => {
    try {
      await setPinned({
        activityId: activity.id,
        isPinned: !activity.isPinned,
      });
    } catch (error) {
      appToast.error(
        error instanceof Error ? error.message : "Pin update failed.",
      );
    }
  };

  const handleHide = async (activity: AdminActivity) => {
    try {
      if (activity.isHidden) {
        await unhide({ activityId: activity.id });
      } else {
        await hide({ activityId: activity.id });
      }
    } catch (error) {
      appToast.error(
        error instanceof Error ? error.message : "Visibility update failed.",
      );
    }
  };

  const handleDelete = async (activity: AdminActivity) => {
    const confirmed = window.confirm("Delete this activity?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteActivity({ activityId: activity.id });
      appToast.success("Activity deleted.");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  };

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading activities..." />;
  }

  return (
    <section className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Activity</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage community activity feed.
          </p>
        </div>
        <a
          href="/activity/new"
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Create activity
        </a>
      </header>

      <div className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 md:grid-cols-3">
        <Input
          label="Search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Title or group"
        />
        <Select
          label="Type"
          value={selectedType}
          onChange={(event) =>
            setSelectedType(event.target.value as "all" | ActivityType)
          }
          options={activityTypeFilters.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
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

      {filteredActivities.length === 0 ? (
        <ErrorMessage message="No activities found for selected filters." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredActivities.map((item) => (
            <AdminActivityCard
              key={item.id}
              item={item}
              isBusy={isBusy}
              onEdit={(activity) => {
                window.location.href = `/activity/edit/${activity.id}`;
              }}
              onPin={handlePin}
              onHide={handleHide}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
