import { orpc } from "@mirai-app/orpc/client";
import { invalidateGroupQueries } from "@mirai-app/orpc/client/query";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOfflineMutation } from "~/hooks/offline/useOfflineMutation";

export function resolveTripIdForUpdate(
  providedTripId: string | undefined,
  groupTripId: string | undefined,
): string {
  const tripId = providedTripId ?? groupTripId;
  if (!tripId) throw new Error("Missing tripId for updateGroup");
  return tripId;
}

export function resolveTripIdForRemove(groupTripId: string | undefined): string {
  if (!groupTripId) throw new Error("Missing tripId for removeUser");
  return groupTripId;
}

export function useGroupEditor(groupId?: string | null) {
  const queryClient = useQueryClient();

  const groupQuery = useQuery(
    orpc.group.getById.queryOptions({ input: { id: groupId ?? "" }, enabled: !!groupId }),
  );
  const updateMutation = useOfflineMutation({
    mutationFn: (variables: { id: string; name?: string; image?: string; tripId: string }) =>
      orpc.group.update.mutate(variables),
    mutationKey: "group.update",
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient);
    },
  });
  const assignMutation = useOfflineMutation({
    mutationFn: (variables: { userId: string; tripId: string; groupId: string }) =>
      orpc.group.assignUserToGroup.mutate(variables),
    mutationKey: "group.assignUserToGroup",
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient);
    },
  });
  const removeMutation = useOfflineMutation({
    mutationFn: (variables: { userId: string; tripId: string }) =>
      orpc.group.removeUserFromGroup.mutate(variables),
    mutationKey: "group.removeUserFromGroup",
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient);
    },
  });

  const updateGroup = async (data: {
    id: string;
    name?: string;
    image?: string;
    tripId?: string;
  }) => {
    const tripId = resolveTripIdForUpdate(data.tripId, groupQuery.data?.trip?.id);
    return updateMutation.mutateAsync({ ...data, tripId });
  };

  const assignUser = async (userId: string, tripId: string) => {
    return assignMutation.mutateAsync({
      userId,
      tripId,
      groupId: groupId ?? "",
    });
  };

  const removeUser = async (userId: string) => {
    const tripId = resolveTripIdForRemove(groupQuery.data?.trip?.id);
    return removeMutation.mutateAsync({ userId, tripId });
  };

  return {
    group: groupQuery.data,
    isLoading: groupQuery.isLoading,
    isUpdating: updateMutation.isPending,
    updateGroup,
    assignUser,
    removeUser,
  } as const;
}
