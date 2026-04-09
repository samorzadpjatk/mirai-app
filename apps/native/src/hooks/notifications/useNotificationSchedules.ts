import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@repo/frameworks/trpc/client";
import { invalidateNotificationQueries } from "@repo/frameworks/trpc/client/query";

export function useNotificationSchedules() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const query = useQuery(trpc.notificationSchedule.getAll.queryOptions());
  const deleteMutation = useMutation(
    trpc.notificationSchedule.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateNotificationQueries(queryClient);
      },
      onError: (err) => {
        console.error("Error deleting schedule:", err);
      },
    }),
  );
  const toggleMutation = useMutation(
    trpc.notificationSchedule.toggleActive.mutationOptions({
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
