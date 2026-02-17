import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';

export interface NotificationSchedule {
  id: string;
  name: string;
  message: string;
  triggerTime: string;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export function useAdminSchedules() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryOptions = trpc.notificationSchedule.getAll.queryOptions();

  const { data: schedules, isLoading } = useQuery(queryOptions);

  const createScheduleMutation = useMutation(
    trpc.notificationSchedule.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );

  const updateScheduleMutation = useMutation(
    trpc.notificationSchedule.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );

  const deleteScheduleMutation = useMutation(
    trpc.notificationSchedule.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );

  const toggleScheduleMutation = useMutation(
    trpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      },
    }),
  );


  type CreateScheduleInput = Parameters<(typeof createScheduleMutation)['mutateAsync']>[0];
  type UpdateScheduleInput = Parameters<(typeof updateScheduleMutation)['mutateAsync']>[0];

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


  return {
    schedules: schedules ?? [],
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateScheduleMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending,
    isToggling: toggleScheduleMutation.isPending,
  };
}
