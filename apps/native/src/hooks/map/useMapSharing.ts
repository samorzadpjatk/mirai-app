import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

export function extractSharingUserIds(
  sharingSettings: { usersToShareWith: { id: string }[] } | null | undefined,
): string[] {
  return sharingSettings?.usersToShareWith.map((u) => u.id) ?? [];
}

export function useMapSharing(enabledForAllUsersQuery: boolean, tripId?: string | null) {
  const sharingQuery = useQuery(orpc.location.getMySharingSettings.queryOptions({ input: {} }));
  const { data: sharingSettings, refetch: refetchSharing } = sharingQuery;

  // Use regular TanStack Query for parameterized query (complex case)
  const { data: allAvailableUsers } = useQuery({
    ...orpc.location.getAllUsersForSharing.queryOptions({
      input: tripId ? { tripId } : {},
    }),
    enabled: enabledForAllUsersQuery && !!tripId,
  });

  const updateSharingMutation = useMutation(
    orpc.location.updateSharingSettings.mutationOptions({
      onError: () => {
        Alert.alert("Update Failed", "Failed to update sharing settings. Please try again.");
      },
    }),
  );
  const removeUserMutation = useMutation(
    orpc.location.removeUserFromSharing.mutationOptions({
      onError: () => {
        Alert.alert("Remove Failed", "Failed to remove user from sharing. Please try again.");
      },
    }),
  );

  const sharingUserIds = useMemo(() => extractSharingUserIds(sharingSettings), [sharingSettings]);

  // `mutateAsync` and `refetch` are stable across renders, so these callbacks
  // keep a stable identity. Consumers put them in effect dependency arrays;
  // recreating them on every render made those effects fire continuously.
  const { mutateAsync: mutateUpdateSharing } = updateSharingMutation;
  const { mutateAsync: mutateRemoveUser } = removeUserMutation;

  const updateSharing = useCallback(
    async (userIdsToShareWith: string[]) => {
      await mutateUpdateSharing({
        isSharingLocation: true,
        userIdsToShareWith,
        tripId: tripId ?? undefined,
      });
      // Refetch sharing settings after successful update
      void refetchSharing();
    },
    [mutateUpdateSharing, refetchSharing, tripId],
  );

  const removeUser = useCallback(
    async (userId: string) => {
      await mutateRemoveUser({ userId });
      // Refetch sharing settings after successful removal
      void refetchSharing();
    },
    [mutateRemoveUser, refetchSharing],
  );

  return {
    sharingSettings,
    sharingUserIds,
    allAvailableUsers,
    refetchSharing,
    updateSharing,
    removeUser,
    isUpdatingSharing: updateSharingMutation.isPending,
    isRemovingUser: removeUserMutation.isPending,
  };
}
