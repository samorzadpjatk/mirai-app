import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@repo/frameworks/trpc/client";
import { invalidateGroupQueries } from "@repo/frameworks/trpc/client/query";

export function useGroupEditor(groupId?: string | null) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const groupQuery = useQuery(
    trpc.group.getById.queryOptions(
      { id: groupId ?? "" },
      { enabled: !!groupId },
    ),
  );
  const updateMutation = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient);
      },
    }),
  );
  const assignMutation = useMutation(
    trpc.group.assignUserToGroup.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient);
      },
    }),
  );
  const removeMutation = useMutation(
    trpc.group.removeUserFromGroup.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient);
      },
    }),
  );

  const updateGroup = async (data: {
    id: string;
    name?: string;
    image?: string;
    tripId?: string;
  }) => {
    const tripId = data.tripId ?? groupQuery.data?.trip?.id;
    if (!tripId) throw new Error("Missing tripId for updateGroup");
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
    const tripId = groupQuery.data?.trip?.id;
    if (!tripId) throw new Error("Missing tripId for removeUser");
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
