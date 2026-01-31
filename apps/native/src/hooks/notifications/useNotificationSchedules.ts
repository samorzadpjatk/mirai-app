import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

export function useNotificationSchedules() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryOptions = trpc.notificationSchedule.getAll.queryOptions();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery(queryOptions);

  const deleteMutation = useMutation(
    trpc.notificationSchedule.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: queryOptions.queryKey,
        });
      },
      onError: (err) => {
        console.error("Error deleting schedule:", err);
      },
    }),
  );

  const toggleMutation = useMutation(
    trpc.notificationSchedule.toggleActive.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: queryOptions.queryKey,
        });
      },
      onError: (err) => {
        console.error("Error toggling schedule:", err);
      },
    }),
  );

  const schedules = data?.schedules ?? [];

  return {
    schedules,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    deleteSchedule: (id: string) => deleteMutation.mutate({ id }),
    toggleActive: (id: string) => toggleMutation.mutate({ id }),
    isDeleting: deleteMutation.isPending,
    isToggling: toggleMutation.isPending,
  };
}
