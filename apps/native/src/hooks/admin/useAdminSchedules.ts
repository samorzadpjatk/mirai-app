import { orpc } from "@mirai-app/orpc/client";
import { invalidateNotificationQueries } from "@mirai-app/orpc/client/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

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
  tripId?: string | null;
  hour: number;
  minute: number;
  notificationType: string;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
}

export function toTriggerTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isScheduleRecurring(startDate: string | Date, endDate: string | Date): boolean {
  return new Date(endDate).getTime() - new Date(startDate).getTime() >= 24 * 60 * 60 * 1000;
}

export function buildScheduleMessage(
  notificationBody: string | null | undefined,
  notificationTitle: string | null | undefined,
  notificationType: string,
): string {
  return notificationBody ?? notificationTitle ?? `Scheduled notification: ${notificationType}`;
}

export function useAdminSchedules(tripId?: string) {
  const queryInput = useMemo(
    () => ({
      ...(tripId ? { filter: { tripId } } : {}),
      pagination: {
        limit: 100,
        offset: 0,
      },
    }),
    [tripId],
  );

  const queryOptions = orpc.notificationSchedule.getAll.queryOptions({ input: queryInput });

  const { data: result, isLoading } = useQuery(queryOptions);

  // Use direct oRPC + React Query for mutations
  const queryClient = useQueryClient();
  const createScheduleMutation = useMutation(
    orpc.notificationSchedule.create.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient, true);
      },
    }),
  );
  const updateScheduleMutation = useMutation(
    orpc.notificationSchedule.update.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient, true);
      },
    }),
  );
  const deleteScheduleMutation = useMutation(
    orpc.notificationSchedule.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient, true);
      },
    }),
  );
  const toggleScheduleMutation = useMutation(
    orpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient, true);
      },
    }),
  );
  const upsertTemplateMutation = useMutation(
    orpc.notificationSchedule.upsertTemplate.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient, true);
      },
    }),
  );

  type CreateScheduleInput = Parameters<(typeof createScheduleMutation)["mutateAsync"]>[0];
  type UpdateScheduleInput = Parameters<(typeof updateScheduleMutation)["mutateAsync"]>[0];

  const schedules: NotificationSchedule[] = useMemo(() => {
    const rawSchedules = result?.schedules ?? [];

    return rawSchedules.map((schedule) => ({
      id: schedule.id,
      name: schedule.name,
      message: buildScheduleMessage(
        schedule.notificationBody,
        schedule.notificationTitle,
        schedule.notificationType,
      ),
      triggerTime: toTriggerTime(schedule.hour, schedule.minute),
      isActive: schedule.isActive,
      createdAt: new Date(schedule.createdAt).toISOString(),
      startDate: new Date(schedule.startDate).toISOString(),
      endDate: new Date(schedule.endDate).toISOString(),
      lastTriggered: schedule.lastRun ? new Date(schedule.lastRun).toISOString() : undefined,
      executionCount: schedule._count?.notificationExecutions ?? 0,
      isRecurring: isScheduleRecurring(schedule.startDate, schedule.endDate),
      tripId: schedule.tripId,
      hour: schedule.hour,
      minute: schedule.minute,
      notificationType: schedule.notificationType,
      notificationTitle: schedule.notificationTitle,
      notificationBody: schedule.notificationBody,
      notificationUrl: schedule.notificationUrl,
    }));
  }, [result?.schedules]);

  const createSchedule = (data: CreateScheduleInput) => {
    return createScheduleMutation.mutateAsync(data);
  };

  const updateSchedule = (input: UpdateScheduleInput) => {
    return updateScheduleMutation.mutateAsync(input);
  };

  const deleteSchedule = (id: string) => {
    return deleteScheduleMutation.mutateAsync({ id });
  };

  const toggleSchedule = (id: string) => {
    return toggleScheduleMutation.mutateAsync({ id });
  };

  const upsertTemplateSchedule = (templateKey: "daily_morning" | "daily_evening") => {
    if (!tripId) {
      throw new Error("Trip is required to create template schedules");
    }
    return upsertTemplateMutation.mutateAsync({ tripId, templateKey });
  };

  return {
    schedules,
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    upsertTemplateSchedule,
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateScheduleMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending,
    isToggling: toggleScheduleMutation.isPending,
    isUpsertingTemplate: upsertTemplateMutation.isPending,
  };
}
