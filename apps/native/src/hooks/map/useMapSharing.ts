import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/graphql";
import { Alert } from "react-native";

export function useMapSharing(
  enabledForAllUsersQuery: boolean,
  tripId?: string | null,
) {
  const trpc = useTRPC();

  const sharingQuery = useQuery(
    trpc.location.getMySharingSettings.queryOptions(),
  );
  const { data: sharingSettings, refetch: refetchSharing } = sharingQuery;

  // Use regular TanStack Query for parameterized query (complex case)
  const { data: allAvailableUsers } = useQuery({
    ...trpc.location.getAllUsersForSharing.queryOptions(
      tripId ? { tripId } : undefined,
    ),
    enabled: enabledForAllUsersQuery && !!tripId,
  });

  const updateSharingMutation = useMutation(
    trpc.location.updateSharingSettings.mutationOptions({
      onError: (err) => {
        console.error("[Map] Failed to update sharing:", err);
        Alert.alert(
          "Update Failed",
          "Failed to update sharing settings. Please try again.",
        );
      },
    }),
  );
  const removeUserMutation = useMutation(
    trpc.location.removeUserFromSharing.mutationOptions({
      onError: (err) => {
        console.error("[Map] Failed to remove user from sharing:", err);
        Alert.alert(
          "Remove Failed",
          "Failed to remove user from sharing. Please try again.",
        );
      },
    }),
  );

  const sharingUserIds = useMemo(
    () => sharingSettings?.usersToShareWith.map((u) => u.id) ?? [],
    [sharingSettings],
  );

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
