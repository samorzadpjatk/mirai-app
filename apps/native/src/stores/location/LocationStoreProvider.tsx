import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useQuery, useMutation, useClient } from "urql";
import { Alert } from "react-native";
import { locationStore, setLocationServerUpdater } from "./locationStore";

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

interface LocationStoreProviderProps {
  children: ReactNode;
}

type SharingSettings = {
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
  }>;
};

/**
 * Bridges the Zustand location store with GraphQL server data.
 * Hydrates the store with server sharing settings and synchronizes background tasks.
 */
export function LocationStoreProvider({
  children,
}: LocationStoreProviderProps) {
  const client = useClient();
  const hasHydrated = useRef(false);

  // GraphQL query for sharing settings
  const [{ data: sharingSettingsData }] = useQuery<{
    mySharingSettings: SharingSettings | null;
  }>({
    query: GetMySharingSettingsDocument,
  });
  const sharingSettings = sharingSettingsData?.mySharingSettings;

  // GraphQL mutation for updating sharing settings
  const [, executeUpdateSharing] = useMutation<{
    updateLocationSharing: SharingSettings;
  }>(UpdateSharingSettingsDocument);

  const updateSharingMutation = useMemo(
    () => ({
      mutateAsync: async (input: {
        isSharingLocation: boolean;
        userIdsToShareWith?: string[];
      }) => {
        const result = await executeUpdateSharing({ input });
        if (result.error) {
          const error = result.error;
          clientLogger.error("Failed to update location sharing settings:", {
            error,
          });
          if (error?.message?.includes("UNAUTHORIZED")) {
            Alert.alert(
              "Authentication Required",
              "Please sign in again to update location settings.",
            );
          } else if (error?.message?.includes("FORBIDDEN")) {
            Alert.alert(
              "Access Denied",
              "You don't have permission to update location settings.",
            );
          } else {
            Alert.alert(
              "Connection Error",
              "Failed to update location sharing settings. Please check your internet connection and try again.",
            );
          }
          throw error;
        }
        // Invalidate cache on success
        await client.invalidate("GetMySharingSettings");
        return result.data!.updateLocationSharing;
      },
    }),
    [executeUpdateSharing, client],
  );

  // Inject the server updater into the store
  useEffect(() => {
    setLocationServerUpdater((input) =>
      updateSharingMutation.mutateAsync(input),
    );
    return () => setLocationServerUpdater(null);
  }, [updateSharingMutation]);

  // Hydrate store when server settings arrive
  useEffect(() => {
    const serverSharingEnabled = sharingSettings?.isSharingLocation;
    void locationStore.getState().hydrate(serverSharingEnabled);
    hasHydrated.current = true;
  }, [sharingSettings]);

  // Synchronize background task when relevant state changes
  useEffect(() => {
    if (!hasHydrated.current) return;

    const unsubscribe = locationStore.subscribe((state, prevState) => {
      if (
        state.isBackgroundLocationEnabled !==
          prevState.isBackgroundLocationEnabled ||
        state.isLocationSharingEnabled !== prevState.isLocationSharingEnabled ||
        state.permissionStatus !== prevState.permissionStatus ||
        state.backgroundPermissionStatus !==
          prevState.backgroundPermissionStatus
      ) {
        void state.syncBackgroundTask();
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
