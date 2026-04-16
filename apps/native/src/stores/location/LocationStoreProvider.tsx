import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useClient } from "urql";
import { Alert } from "react-native";
import { locationStore, setLocationServerUpdater } from "./locationStore";
import {
  useGetLocationSharingSettingsQuery,
  useSetLocationSharingSettingsMutation,
  GetLocationSharingSettingsDocument,
} from "@mirai-app/frameworks";

interface LocationStoreProviderProps {
  children: ReactNode;
}

/**
 * Bridges the Zustand location store with GraphQL server data.
 * Hydrates the store with server sharing settings and synchronizes background tasks.
 */
export function LocationStoreProvider({
  children,
}: LocationStoreProviderProps) {
  const client = useClient();
  const hasHydrated = useRef(false);

  // GraphQL query for sharing settings using generated hook
  const [{ data: sharingSettingsData }] = useGetLocationSharingSettingsQuery();
  const sharingSettings = sharingSettingsData?.mySharingSettings;

  // GraphQL mutation for updating sharing settings using generated hook
  const [, executeUpdateSharing] = useSetLocationSharingSettingsMutation();

  const updateSharingMutation = useMemo(
    () => ({
      mutateAsync: async (input: {
        isSharingLocation: boolean;
        userIdsToShareWith?: string[];
      }) => {
        const result = await executeUpdateSharing({ input });
        if (result.error) {
          const error = result.error;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).invalidate(GetLocationSharingSettingsDocument);
        // Return the settings from the nested response structure
        return (
          result.data?.updateSharingSettings?.settings ?? {
            isSharingLocation: input.isSharingLocation,
            usersToShareWith: [],
          }
        );
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
