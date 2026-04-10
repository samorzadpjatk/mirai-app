import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetNotificationSchedulesQuery,
  useDeleteNotificationScheduleMutation,
  useToggleNotificationScheduleActiveMutation,
} from "@mirai-app/graphql-types";
import { graphqlClient } from "~/lib/graphql-client";

export function useNotificationSchedules() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: useGetNotificationSchedulesQuery.getKey(),
    queryFn: () => useGetNotificationSchedulesQuery.fetcher(graphqlClient)(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (variables: { id: string }) => {
      return useDeleteNotificationScheduleMutation.fetcher(
        graphqlClient,
        variables,
      )();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: useGetNotificationSchedulesQuery.getKey(),
      });
    },
    onError: (err) => {
      console.error("Error deleting schedule:", err);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (variables: { id: string }) => {
      return useToggleNotificationScheduleActiveMutation.fetcher(
        graphqlClient,
        variables,
      )();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: useGetNotificationSchedulesQuery.getKey(),
      });
    },
    onError: (err) => {
      console.error("Error toggling schedule:", err);
    },
  });

  const schedules = query.data?.notificationSchedules ?? [];

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
