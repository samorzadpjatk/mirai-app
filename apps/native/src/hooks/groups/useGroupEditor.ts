import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateGroupQueries } from "@mirai-app/orpc/client/query";

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

export interface GroupEditorMutations {
  updateMutation: { mutateAsync: (data: unknown) => Promise<unknown> };
  assignMutation: { mutateAsync: (data: unknown) => Promise<unknown> };
  removeMutation: { mutateAsync: (data: unknown) => Promise<unknown> };
}

export function buildGroupEditorActions(
  groupId: string | null | undefined,
  groupQueryData: { trip?: { id?: string } } | undefined,
  mutations: GroupEditorMutations,
) {
  const { updateMutation, assignMutation, removeMutation } = mutations;

  const updateGroup = async (data: {
    id: string;
    name?: string;
    image?: string;
    tripId?: string;
  }) => {
    const tripId = resolveTripIdForUpdate(data.tripId, groupQueryData?.trip?.id);
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
    const tripId = resolveTripIdForRemove(groupQueryData?.trip?.id);
    return removeMutation.mutateAsync({ userId, tripId });
  };

  return { updateGroup, assignUser, removeUser };
}

export function useGroupEditor(groupId?: string | null) {
  const queryClient = useQueryClient();

  const groupQuery = useQuery(
    orpc.group.getById.queryOptions({ input: { id: groupId ?? "" }, enabled: !!groupId }),
  );
  const updateMutation = useMutation(
    orpc.group.update.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient);
      },
    }),
  );
  const assignMutation = useMutation(
    orpc.group.assignUserToGroup.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient);
      },
    }),
  );
  const removeMutation = useMutation(
    orpc.group.removeUserFromGroup.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient);
      },
    }),
  );

  const actions = buildGroupEditorActions(groupId, groupQuery.data, {
    updateMutation,
    assignMutation,
    removeMutation,
  });

  return {
    group: groupQuery.data,
    isLoading: groupQuery.isLoading,
    isUpdating: updateMutation.isPending,
    ...actions,
  } as const;
}
