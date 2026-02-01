import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";

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
      },
    }),
  );

  const sharingUserIds = useMemo(
    () => sharingSettings?.usersToShareWith.map((u) => u.id) ?? [],
    [sharingSettings],
  );

  const updateSharing = (userIdsToShareWith: string[]) =>
    updateSharingMutation.mutate({
      isSharingLocation: true,
      userIdsToShareWith,
    });

  return {
    sharingSettings,
    sharingUserIds,
    allAvailableUsers,
    refetchSharing,
    updateSharing,
    isUpdatingSharing: updateSharingMutation.isPending,
  };
}
