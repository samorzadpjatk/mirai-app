import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { Alert } from "react-native";

export function useMapSharing(enabledForAllUsersQuery: boolean) {
  const trpc = useTRPC();

  const sharingQueryOptions = trpc.location.getMySharingSettings.queryOptions();
  const { data: sharingSettings, refetch: refetchSharing } = useQuery({
    ...sharingQueryOptions,
    enabled: true,
  });

  const allUsersQueryOptions =
    trpc.location.getAllUsersForSharing.queryOptions();
  const { data: allAvailableUsers } = useQuery({
    ...allUsersQueryOptions,
    enabled: enabledForAllUsersQuery,
  });

  const updateSharingMutation = useMutation(
    trpc.location.updateSharingSettings.mutationOptions({
      onSuccess: () => {
        void refetchSharing();
      },
      onError: (err) => {
        console.error("[Map] Failed to update sharing:", err);
        
        // Provide specific error messages based on error type
        if (err?.data?.code === "UNAUTHORIZED") {
          Alert.alert(
            "Authentication Required", 
            "Please sign in again to update sharing settings."
          );
        } else if (err?.data?.code === "FORBIDDEN") {
          Alert.alert(
            "Access Denied", 
            "You don't have permission to update sharing settings."
          );
        } else {
          Alert.alert(
            "Connection Error", 
            "Failed to update sharing settings. Please check your internet connection and try again."
          );
        }
      },
    }),
  );

  const removeUserMutation = useMutation(
    trpc.location.removeUserFromSharing.mutationOptions({
      onSuccess: () => {
        void refetchSharing();
      },
      onError: (err) => {
        console.error("[Map] Failed to remove user from sharing:", err);
        
        // Provide specific error messages based on error type
        if (err?.data?.code === "UNAUTHORIZED") {
          Alert.alert(
            "Authentication Required", 
            "Please sign in again to update sharing settings."
          );
        } else if (err?.data?.code === "FORBIDDEN") {
          Alert.alert(
            "Access Denied", 
            "You don't have permission to update sharing settings."
          );
        } else {
          Alert.alert(
            "Connection Error", 
            "Failed to remove user from sharing. Please check your internet connection and try again."
          );
        }
      },
    }),
  );

  const sharingUserIds = useMemo(
    () => sharingSettings?.usersToShareWith.map((u) => u.id) ?? [],
    [sharingSettings],
  );

  const updateSharing = (userIdsToShareWith: string[]) =>
    updateSharingMutation.mutateAsync({
      isSharingLocation: true,
      userIdsToShareWith,
    });

  const removeUser = (userId: string) =>
    removeUserMutation.mutateAsync({ userId });

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
