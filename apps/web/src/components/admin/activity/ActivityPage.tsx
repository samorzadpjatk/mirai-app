"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useClient } from "urql";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import {
  GetActivitiesByTripDocument,
  SetActivityPinnedDocument,
  HideActivityDocument,
  UnhideActivityDocument,
  DeleteActivityDocument,
  type ActivityType,
  type ActivityFieldsFragment,
} from "@mirai-app/graphql-client/urql";
import { AdminActivityCard } from "./AdminActivityCard";
import { useTrip } from "../../../contexts/TripContext";

const activityTypeFilters: { label: string; value: "all" | ActivityType }[] = [
  { label: "All", value: "all" },
  { label: "Submission", value: "Submission" },
  { label: "Challenge", value: "ChallengeEvent" },
  { label: "Rank", value: "RankChange" },
  { label: "Custom", value: "Custom" },
  { label: "User Post", value: "UserPost" },
];

// GraphQL Activity type doesn't include nested group info, so we return empty
// This maintains backward compatibility with AdminActivityCard interface
const getActivityGroupName = (_activity: ActivityFieldsFragment) => "";

export function ActivityPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const urqlClient = useClient();

  // Query for fetching activities using urql
  const [activitiesResult, refetch] = useQuery({
    query: GetActivitiesByTripDocument,
    variables: { tripId, limit: 100 },
    pause: !tripId,
  });

  const activities = activitiesResult.data?.activitiesByTrip.activities ?? [];
  const isLoading = activitiesResult.fetching;
  const isRefetching =
    activitiesResult.fetching && activitiesResult.data !== undefined;

  // Mutations using urql
  const [, setPinned] = useMutation(SetActivityPinnedDocument);
  const [, hideActivity] = useMutation(HideActivityDocument);
  const [, unhideActivity] = useMutation(UnhideActivityDocument);
  const [, deleteActivity] = useMutation(DeleteActivityDocument);

  const [isBusy, setIsBusy] = useState(false);

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return activities.filter((activity) => {
      if (selectedType !== "all" && activity.activityType !== selectedType) {
        return false;
      }

      if (!query) return true;

      const title = activity.title.toLowerCase();
      return title.includes(query);
    });
  }, [activities, searchTerm, selectedType]);

  const handlePin = async (activity: ActivityFieldsFragment) => {
    setIsBusy(true);
    try {
      const result = await setPinned({
        id: activity.id,
        isPinned: !activity.isPinned,
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate the query to refresh
      await urqlClient.invalidate(GetActivitiesByTripDocument, {
        tripId,
        limit: 100,
      });
    } catch (error) {
      appToast.error(
        error instanceof Error ? error.message : "Pin update failed.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleHide = async (activity: ActivityFieldsFragment) => {
    setIsBusy(true);
    try {
      const result = activity.isHidden
        ? await unhideActivity({ id: activity.id })
        : await hideActivity({ id: activity.id });

      if (result.error) {
        throw result.error;
      }

      // Invalidate the query to refresh
      await urqlClient.invalidate(GetActivitiesByTripDocument, {
        tripId,
        limit: 100,
      });
    } catch (error) {
      appToast.error(
        error instanceof Error ? error.message : "Hide/unhide failed.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (activity: ActivityFieldsFragment) => {
    const confirmed = window.confirm("Delete this activity?");
    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    try {
      const result = await deleteActivity({ id: activity.id });

      if (result.error) {
        throw result.error;
      }

      // Invalidate the query to refresh
      await urqlClient.invalidate(GetActivitiesByTripDocument, {
        tripId,
        limit: 100,
      });
      appToast.success("Activity deleted.");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setIsBusy(false);
    }
  };

  if (!tripId) {
    return <ErrorMessage message="Please select a trip first." />;
  }

  if (isLoading && !activitiesResult.data) {
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
          placeholder="Title"
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
              refetch({ requestPolicy: "network-only" });
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
