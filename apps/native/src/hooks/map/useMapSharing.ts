import { useMemo } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetMySharingSettingsDocument,
  GetAllUsersForSharingDocument,
  UpdateLocationSharingDocument,
  RemoveUserFromSharingDocument,
} from "@mirai-app/graphql-client";
import { clientLogger } from "@mirai-app/shared";

// Type definitions for sharing user info
type SharingUserInfo = {
  id: string;
  firstName?: string;
  lastName?: string;
};

type SharingSettings = {
  isSharingLocation: boolean;
  usersToShareWith: SharingUserInfo[];
};

type AvailableUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  hasAvatar?: boolean;
  isCurrentlySharing?: boolean;
};

export function useMapSharing(
  enabledForAllUsersQuery: boolean,
  tripId?: string | null,
) {
  const client = useClient();

  // GraphQL query for sharing settings
  const [{ data: sharingData }] = useQuery({
    query: GetMySharingSettingsDocument,
  });

  const sharingSettings: SharingSettings | null = useMemo(
    () => sharingData?.mySharingSettings ?? null,
    [sharingData],
  );

  // GraphQL query for all users available for sharing
  const [{ data: allUsersData }] = useQuery({
    query: GetAllUsersForSharingDocument,
    variables: { tripId: tripId ?? undefined },
    pause: !enabledForAllUsersQuery || !tripId,
  });

  const allAvailableUsers: AvailableUser[] = useMemo(
    () => allUsersData?.allUsersForSharing ?? [],
    [allUsersData],
  );

  // GraphQL mutation for updating sharing settings
  const [, updateSharingMutation] = useMutation(UpdateLocationSharingDocument);

  // GraphQL mutation for removing user from sharing
  const [, removeUserMutation] = useMutation(RemoveUserFromSharingDocument);

  const sharingUserIds = useMemo(
    () => sharingSettings?.usersToShareWith.map((u) => u.id) ?? [],
    [sharingSettings],
  );

  const updateSharing = async (userIdsToShareWith: string[]) => {
    const result = await updateSharingMutation({
      input: {
        isSharingLocation: true,
        userIdsToShareWith,
      },
    });

    if (result.error) {
      clientLogger.error(
        "[Map] Failed to update sharing:",
        result.error as Error,
      );
      Alert.alert(
        "Update Failed",
        "Failed to update sharing settings. Please try again.",
      );
      throw result.error;
    }

    // Invalidate sharing settings query
    client.invalidate(GetMySharingSettingsDocument);
  };

  const removeUser = async (userId: string) => {
    const result = await removeUserMutation({ userId });

    if (result.error) {
      clientLogger.error(
        "[Map] Failed to remove user from sharing:",
        result.error as Error,
      );
      Alert.alert(
        "Remove Failed",
        "Failed to remove user from sharing. Please try again.",
      );
      throw result.error;
    }

    // Invalidate sharing settings query
    client.invalidate(GetMySharingSettingsDocument);
  };

  return {
    sharingSettings,
    sharingUserIds,
    allAvailableUsers,
    updateSharing,
    removeUser,
    isUpdatingSharing: false,
    isRemovingUser: false,
  };
}
