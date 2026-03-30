"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@mirai-app/trpc/client";

export interface NotificationSchedule {
  id: string;
  name: string;
  message: string;
  triggerTime: string;
  isActive: boolean;
  createdAt: string;
  startDate: string;
  endDate: string;
  lastTriggered?: string;
  executionCount: number;
  isRecurring: boolean;
  tripId: string | null;
  tripName: string | null;
  hour: number;
  minute: number;
  notificationType: string;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function toTriggerTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseSchedules(value: unknown): NotificationSchedule[] {
  if (!isObject(value) || !Array.isArray(value.schedules)) {
    return [];
  }

  return value.schedules
    .map((item) => {
      if (!isObject(item) || typeof item.id !== "string") {
        return null;
      }

      const hour = typeof item.hour === "number" ? item.hour : 0;
      const minute = typeof item.minute === "number" ? item.minute : 0;
      const trip = isObject(item.trip) ? item.trip : null;
      const count = isObject(item._count) ? item._count : null;

      return {
        id: item.id,
        name: typeof item.name === "string" ? item.name : "Untitled",
        message:
          typeof item.notificationBody === "string"
            ? item.notificationBody
            : typeof item.notificationTitle === "string"
              ? item.notificationTitle
              : "",
        triggerTime: toTriggerTime(hour, minute),
        isActive: Boolean(item.isActive),
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString(),
        startDate:
          typeof item.startDate === "string"
            ? item.startDate
            : new Date().toISOString(),
        endDate:
          typeof item.endDate === "string"
            ? item.endDate
            : new Date().toISOString(),
        lastTriggered:
          typeof item.lastRun === "string" ? item.lastRun : undefined,
        executionCount:
          count && typeof count.notificationExecutions === "number"
            ? count.notificationExecutions
            : 0,
        isRecurring:
          new Date(
            typeof item.endDate === "string" ? item.endDate : 0,
          ).getTime() -
            new Date(
              typeof item.startDate === "string" ? item.startDate : 0,
            ).getTime() >=
          24 * 60 * 60 * 1000,
        tripId: typeof item.tripId === "string" ? item.tripId : null,
        tripName: trip && typeof trip.name === "string" ? trip.name : null,
        hour,
        minute,
        notificationType:
          typeof item.notificationType === "string"
            ? item.notificationType
            : "custom",
        notificationTitle:
          typeof item.notificationTitle === "string"
            ? item.notificationTitle
            : null,
        notificationBody:
          typeof item.notificationBody === "string"
            ? item.notificationBody
            : null,
        notificationUrl:
          typeof item.notificationUrl === "string"
            ? item.notificationUrl
            : null,
      } as NotificationSchedule;
    })
    .filter((item): item is NotificationSchedule => item !== null);
}

export function useAdminSchedules(tripId?: string) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: ["schedules", tripId ?? "all"],
    queryFn: () =>
      trpc.notificationSchedule.getAll.query({
        pagination: {
          limit: 100,
          offset: 0,
        },
        ...(tripId
          ? {
              filter: {
                tripId,
              },
            }
          : {}),
      }),
  });

  const schedules = useMemo(
    () => parseSchedules(schedulesQuery.data),
    [schedulesQuery.data],
  );

  const invalidateSchedules = async () => {
    await queryClient.invalidateQueries({ queryKey: ["schedules"] });
  };

  const createScheduleMutation = useMutation({
    mutationFn: (input: {
      name: string;
      tripId?: string;
      notificationType: "custom" | "ranking";
      notificationTitle?: string;
      notificationBody?: string;
      notificationUrl?: string;
      startDate: Date;
      endDate: Date;
      hour: number;
      minute: number;
      isActive?: boolean;
    }) =>
      trpc.notificationSchedule.create.mutate({
        ...input,
        isActive: input.isActive ?? true,
      }),
    onSuccess: invalidateSchedules,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (input: {
      id: string;
      name?: string;
      notificationTitle?: string;
      notificationBody?: string;
      notificationUrl?: string;
      startDate?: Date;
      endDate?: Date;
      hour?: number;
      minute?: number;
      isActive?: boolean;
    }) => trpc.notificationSchedule.update.mutate(input),
    onSuccess: invalidateSchedules,
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => trpc.notificationSchedule.delete.mutate({ id }),
    onSuccess: invalidateSchedules,
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: (id: string) =>
      trpc.notificationSchedule.toggleActive.mutate({ id }),
    onSuccess: invalidateSchedules,
  });

  return {
    schedules,
    isLoading: schedulesQuery.isLoading,
    isRefetching: schedulesQuery.isRefetching,
    refetch: schedulesQuery.refetch,
    createSchedule: createScheduleMutation.mutateAsync,
    updateSchedule: updateScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
    toggleSchedule: toggleScheduleMutation.mutateAsync,
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateScheduleMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending,
    isToggling: toggleScheduleMutation.isPending,
  };
}
