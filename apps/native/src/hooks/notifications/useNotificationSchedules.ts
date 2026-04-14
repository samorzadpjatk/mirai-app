import { useQuery, useMutation, useClient } from "urql";
import {
  GetNotificationSchedulesDocument,
  DeleteNotificationScheduleDocument,
  ToggleNotificationScheduleActiveDocument,
} from "@mirai-app/graphql-client";
import { clientLogger } from "@mirai-app/shared";

export function useNotificationSchedules() {
  const client = useClient();

  const [{ data, fetching, error }] = useQuery({
    query: GetNotificationSchedulesDocument,
  });

  const [, deleteScheduleMutation] = useMutation(
    DeleteNotificationScheduleDocument,
  );
  const [, toggleMutation] = useMutation(
    ToggleNotificationScheduleActiveDocument,
  );

  const schedules = data?.notificationSchedules ?? [];

  const deleteSchedule = async (id: string) => {
    const result = await deleteScheduleMutation({ id });
    if (result.error) {
      clientLogger.error("Error deleting schedule:", { error: result.error });
      throw result.error;
    }
    // Invalidate query
    client.invalidate(GetNotificationSchedulesDocument);
  };

  const toggleActive = async (id: string) => {
    const result = await toggleMutation({ id });
    if (result.error) {
      clientLogger.error("Error toggling schedule:", { error: result.error });
      throw result.error;
    }
    // Invalidate query
    client.invalidate(GetNotificationSchedulesDocument);
  };

  return {
    schedules,
    isLoading: fetching,
    isError: !!error,
    error,
    refetch: () => client.invalidate(GetNotificationSchedulesDocument),
    isFetching: fetching,
    deleteSchedule,
    toggleActive,
    isDeleting: false,
    isToggling: false,
  };
}
