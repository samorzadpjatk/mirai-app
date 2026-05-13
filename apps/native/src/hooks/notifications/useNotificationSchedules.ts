import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateNotificationQueries } from "@mirai-app/orpc/client/query";

export function useNotificationSchedules() {
  const queryClient = useQueryClient();
  const query = useQuery(orpc.notificationSchedule.getAll.queryOptions({ input: {} }));
  const deleteMutation = useMutation(
    orpc.notificationSchedule.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
      onError: (err) => {
        console.error("Error deleting schedule:", err);
      },
    }),
  );
  const toggleMutation = useMutation(
    orpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
      onError: (err) => {
        console.error("Error toggling schedule:", err);
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
