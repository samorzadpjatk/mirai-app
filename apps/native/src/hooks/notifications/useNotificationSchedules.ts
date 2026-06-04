import { orpc } from "@mirai-app/orpc/client";
import { invalidateNotificationQueries } from "@mirai-app/orpc/client/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotificationSchedules() {
  const queryClient = useQueryClient();
  const query = useQuery(orpc.notificationSchedule.getAll.queryOptions({ input: {} }));
  const deleteMutation = useMutation(
    orpc.notificationSchedule.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
      onError: () => {
        /* no-op */
      },
    }),
  );
  const toggleMutation = useMutation(
    orpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
      onError: () => {
        /* no-op */
      },
    }),
  );

  const schedules = query.data?.schedules ?? [];

  const deleteSchedule = (id: string) => {
    deleteMutation.mutate({ id });
  };

  const toggleActive = (id: string) => {
    toggleMutation.mutate({ id });
  };

  return {
    schedules,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    deleteSchedule,
    toggleActive,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleMutation.isPending,
  };
}
