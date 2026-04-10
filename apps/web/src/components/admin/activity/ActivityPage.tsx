"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import {
  useGetActivitiesByTripQuery,
  useSetActivityPinnedMutation,
  useHideActivityMutation,
  useUnhideActivityMutation,
  useDeleteActivityMutation,
  type ActivityType,
  type ActivityFieldsFragment,
} from "@mirai-app/graphql-types";
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

// Create GraphQL client (matches pattern in other admin components)
const createGraphQLClient = () => {
  const graphqlUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_URL || `${window.location.origin}/graphql`;

  return new GraphQLClient(graphqlUrl, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export function ActivityPage() {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [selectedType, setSelectedType] = useState<"all" | ActivityType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const client = useMemo(() => createGraphQLClient(), []);
  const queryClient = useQueryClient();

  // Query for fetching activities
  const {
    data: activitiesData,
    isLoading,
    isFetching: isRefetching,
    refetch,
  } = useGetActivitiesByTripQuery(
    client,
    { tripId, limit: 100 },
    {
      enabled: !!tripId,
    },
  );

  const activities = activitiesData?.activitiesByTrip.activities ?? [];

  // Mutations
  const setPinnedMutation = useSetActivityPinnedMutation(client, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["GetActivitiesByTrip", { tripId, limit: 100 }],
      });
    },
    onError: (error) => {
      appToast.error(
        error instanceof Error ? error.message : "Pin update failed.",
      );
    },
  });

  const hideMutation = useHideActivityMutation(client, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["GetActivitiesByTrip", { tripId, limit: 100 }],
      });
    },
    onError: (error) => {
      appToast.error(error instanceof Error ? error.message : "Hide failed.");
    },
  });

  const unhideMutation = useUnhideActivityMutation(client, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["GetActivitiesByTrip", { tripId, limit: 100 }],
      });
    },
    onError: (error) => {
      appToast.error(error instanceof Error ? error.message : "Unhide failed.");
    },
  });

  const deleteMutation = useDeleteActivityMutation(client, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["GetActivitiesByTrip", { tripId, limit: 100 }],
      });
      appToast.success("Activity deleted.");
    },
    onError: (error) => {
      appToast.error(error instanceof Error ? error.message : "Delete failed.");
    },
  });

  const isBusy =
    setPinnedMutation.isPending ||
    hideMutation.isPending ||
    unhideMutation.isPending ||
    deleteMutation.isPending;

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
    await setPinnedMutation.mutateAsync({
      id: activity.id,
      isPinned: !activity.isPinned,
    });
  };

  const handleHide = async (activity: ActivityFieldsFragment) => {
    if (activity.isHidden) {
      await unhideMutation.mutateAsync({ id: activity.id });
    } else {
      await hideMutation.mutateAsync({ id: activity.id });
    }
  };

  const handleDelete = async (activity: ActivityFieldsFragment) => {
    const confirmed = window.confirm("Delete this activity?");
    if (!confirmed) {
      return;
    }

    await deleteMutation.mutateAsync({ id: activity.id });
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
