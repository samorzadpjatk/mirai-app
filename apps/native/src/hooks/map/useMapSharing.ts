import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import { graphqlClient } from "~/lib/graphql-client";

// GraphQL documents (inline until location operations are generated)
const GetMySharingSettingsDocument = `
  query GetMySharingSettings {
    mySharingSettings {
      isSharingLocation
      usersToShareWith {
        id
        firstName
        lastName
      }
    }
  }
`;

const GetAllUsersForSharingDocument = `
  query GetAllUsersForSharing($tripId: ID) {
    allUsersForSharing(tripId: $tripId) {
      id
      firstName
      lastName
      fullName
      hasAvatar
      isCurrentlySharing
    }
  }
`;

const UpdateSharingSettingsDocument = `
  mutation UpdateSharingSettings($input: UpdateSharingSettingsInput!) {
    updateLocationSharing(input: $input) {
      id
      isSharingLocation
      usersToShareWith {
        id
        firstName
        lastName
      }
    }
  }
`;

const RemoveUserFromSharingDocument = `
  mutation RemoveUserFromSharing($userId: ID!) {
    removeUserFromSharing(userId: $userId) {
      success
      location {
        id
        isSharingLocation
      }
    }
  }
`;

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
  // GraphQL query for sharing settings
  const sharingQuery = useQuery({
    queryKey: ["GetMySharingSettings"],
    queryFn: async () => {
      const result = (await graphqlClient.request(
        GetMySharingSettingsDocument,
      )) as { mySharingSettings: SharingSettings | null };
      return result.mySharingSettings;
    },
  });
  const { data: sharingSettings, refetch: refetchSharing } = sharingQuery;

  // GraphQL query for all users available for sharing
  const { data: allAvailableUsers } = useQuery({
    queryKey: ["GetAllUsersForSharing", tripId],
    queryFn: async () => {
      const result = (await graphqlClient.request(
        GetAllUsersForSharingDocument,
        { tripId: tripId ?? undefined },
      )) as { allUsersForSharing: AvailableUser[] | null };
      return result.allUsersForSharing ?? [];
    },
    enabled: enabledForAllUsersQuery && !!tripId,
  });

  // GraphQL mutation for updating sharing settings
  const updateSharingMutation = useMutation({
    mutationFn: async (input: {
      isSharingLocation: boolean;
      userIdsToShareWith?: string[];
    }) => {
      const result = (await graphqlClient.request(
        UpdateSharingSettingsDocument,
        { input },
      )) as {
        updateLocationSharing: SharingSettings;
      };
      return result.updateLocationSharing;
    },
    onError: (err) => {
      console.error("[Map] Failed to update sharing:", err);
      Alert.alert(
        "Update Failed",
        "Failed to update sharing settings. Please try again.",
      );
    },
  });

  // GraphQL mutation for removing user from sharing
  const removeUserMutation = useMutation({
    mutationFn: async (variables: { userId: string }) => {
      const result = (await graphqlClient.request(
        RemoveUserFromSharingDocument,
        variables,
      )) as {
        removeUserFromSharing: { success: boolean; location: SharingSettings };
      };
      return result.removeUserFromSharing;
    },
    onError: (err) => {
      console.error("[Map] Failed to remove user from sharing:", err);
      Alert.alert(
        "Remove Failed",
        "Failed to remove user from sharing. Please try again.",
      );
    },
  });

  const sharingUserIds = useMemo(
    () => sharingSettings?.usersToShareWith.map((u) => u.id) ?? [],
    [sharingSettings],
  );

  const updateSharing = async (userIdsToShareWith: string[]) => {
    await updateSharingMutation.mutateAsync({
      isSharingLocation: true,
      userIdsToShareWith,
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
