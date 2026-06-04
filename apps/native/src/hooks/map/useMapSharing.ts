import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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

  const updateSharing = async (userIdsToShareWith: string[]) => {
    await updateSharingMutation.mutateAsync({
      isSharingLocation: true,
      userIdsToShareWith,
      tripId: tripId ?? undefined,
    });
    // Refetch sharing settings after successful update
    void refetchSharing();
  };

  const removeUser = async (userId: string) => {
    await removeUserMutation.mutateAsync({ userId });
    // Refetch sharing settings after successful removal
    void refetchSharing();
  };

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
