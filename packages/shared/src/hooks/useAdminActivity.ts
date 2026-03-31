"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

export type ActivityType =
  | "submission"
  | "challenge_event"
  | "rank_change"
  | "custom"
  | "user_post";

export interface AdminActivity {
  id: string;
  tripId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: string;
  admin?: { firstName?: string | null; lastName?: string | null } | null;
  submissionActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  rankChangeActivity?: {
    group?: { name?: string | null } | null;
  } | null;
  userPost?: {
    author?: {
      group?: { name?: string | null } | null;
    } | null;
  } | null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseActivities = (value: unknown): AdminActivity[] => {
  if (!isObject(value) || !Array.isArray(value.activities)) {
    return [];
  }

  return value.activities
    .map((activity) => {
      if (!isObject(activity) || typeof activity.id !== "string") {
        return null;
      }

      return {
        id: activity.id,
        tripId: typeof activity.tripId === "string" ? activity.tripId : "",
        activityType:
          typeof activity.activityType === "string"
            ? (activity.activityType as ActivityType)
            : "custom",
        title: typeof activity.title === "string" ? activity.title : "",
        description:
          typeof activity.description === "string"
            ? activity.description
            : null,
        imageUrl:
          typeof activity.imageUrl === "string" ? activity.imageUrl : null,
        isPinned: Boolean(activity.isPinned),
        isHidden: Boolean(activity.isHidden),
        createdAt:
          typeof activity.createdAt === "string"
            ? activity.createdAt
            : new Date().toISOString(),
        admin: isObject(activity.admin)
          ? {
              firstName:
                typeof activity.admin.firstName === "string"
                  ? activity.admin.firstName
                  : null,
              lastName:
                typeof activity.admin.lastName === "string"
                  ? activity.admin.lastName
                  : null,
            }
          : null,
        submissionActivity: isObject(activity.submissionActivity)
          ? {
              group: isObject(activity.submissionActivity.group)
                ? {
                    name:
                      typeof activity.submissionActivity.group.name === "string"
                        ? activity.submissionActivity.group.name
                        : null,
                  }
                : null,
            }
          : null,
        rankChangeActivity: isObject(activity.rankChangeActivity)
          ? {
              group: isObject(activity.rankChangeActivity.group)
                ? {
                    name:
                      typeof activity.rankChangeActivity.group.name === "string"
                        ? activity.rankChangeActivity.group.name
                        : null,
                  }
                : null,
            }
          : null,
        userPost: isObject(activity.userPost)
          ? {
              author: isObject(activity.userPost.author)
                ? {
                    group: isObject(activity.userPost.author.group)
                      ? {
                          name:
                            typeof activity.userPost.author.group.name ===
                            "string"
                              ? activity.userPost.author.group.name
                              : null,
                        }
                      : null,
                  }
                : null,
            }
          : null,
      } as AdminActivity;
    })
    .filter((activity): activity is AdminActivity => activity !== null);
};

export function useAdminActivity(tripId: string) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: ["activity", tripId],
    enabled: Boolean(tripId),
    queryFn: () =>
      trpc.activityFeed.getByTripModeration.query({
        tripId,
        page: 1,
        pageSize: 100,
      }),
  });

  const activities = useMemo(
    () => parseActivities(feedQuery.data),
    [feedQuery.data],
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["activity", tripId] });
  };

  const pinMutation = useMutation({
    mutationFn: (input: { activityId: string; isPinned: boolean }) =>
      trpc.activityFeed.setPinned.mutate(input),
    onSuccess: invalidate,
  });

  const hideMutation = useMutation({
    mutationFn: (input: { activityId: string }) =>
      trpc.activityFeed.hide.mutate(input),
    onSuccess: invalidate,
  });

  const unhideMutation = useMutation({
    mutationFn: (input: { activityId: string }) =>
      trpc.activityFeed.unhide.mutate(input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { activityId: string }) =>
      trpc.activityFeed.delete.mutate(input),
    onSuccess: invalidate,
  });

  const createCustomMutation = useMutation({
    mutationFn: (input: {
      tripId: string;
      title: string;
      description?: string | null;
      imageUrl?: string | null;
      isPinned?: boolean;
    }) =>
      trpc.activityFeed.createCustom.mutate({
        ...input,
        description: input.description ?? undefined,
        imageUrl: input.imageUrl ?? undefined,
      }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      activityId: string;
      title?: string;
      description?: string | null;
      isPinned?: boolean;
    }) =>
      trpc.activityFeed.update.mutate({
        ...input,
        description: input.description ?? undefined,
      }),
    onSuccess: invalidate,
  });

  return {
    activities,
    isLoading: feedQuery.isLoading,
    isRefetching: feedQuery.isRefetching,
    refetch: feedQuery.refetch,
    setPinned: pinMutation.mutateAsync,
    hide: hideMutation.mutateAsync,
    unhide: unhideMutation.mutateAsync,
    deleteActivity: deleteMutation.mutateAsync,
    createCustom: createCustomMutation.mutateAsync,
    updateActivity: updateMutation.mutateAsync,
    isBusy:
      pinMutation.isPending ||
      hideMutation.isPending ||
      unhideMutation.isPending ||
      deleteMutation.isPending ||
      createCustomMutation.isPending ||
      updateMutation.isPending,
  };
}
