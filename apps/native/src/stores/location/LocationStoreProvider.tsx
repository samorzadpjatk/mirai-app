import { useEffect, useRef, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/trpc/client";
import { Alert } from "react-native";
import { locationStore, setLocationServerUpdater } from "./locationStore";

interface LocationStoreProviderProps {
  children: ReactNode;
}

/**
 * Bridges the Zustand location store with tRPC server data.
 * Hydrates the store with server sharing settings and synchronizes background tasks.
 */
export function LocationStoreProvider({ children }: LocationStoreProviderProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const hasHydrated = useRef(false);

  // Get current sharing settings from server
  const { data: sharingSettings } = useQuery(
    trpc.location.getMySharingSettings.queryOptions(),
  );

  // Mutation to update sharing settings on the server
  const updateSharingMutation = useMutation(
    trpc.location.updateSharingSettings.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["location", "getMySharingSettings"],
        });
      },
      onError: (error) => {
        console.error("Failed to update location sharing settings:", error);
        if (error?.data?.code === "UNAUTHORIZED") {
          Alert.alert("Authentication Required", "Please sign in again to update location settings.");
        } else if (error?.data?.code === "FORBIDDEN") {
          Alert.alert("Access Denied", "You don't have permission to update location settings.");
        } else {
          Alert.alert("Connection Error", "Failed to update location sharing settings. Please check your internet connection and try again.");
        }
      },
    }),
  );

  // Inject the server updater into the store
  useEffect(() => {
    setLocationServerUpdater((input) => updateSharingMutation.mutateAsync(input));
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
        state.isBackgroundLocationEnabled !== prevState.isBackgroundLocationEnabled ||
        state.isLocationSharingEnabled !== prevState.isLocationSharingEnabled ||
        state.permissionStatus !== prevState.permissionStatus ||
        state.backgroundPermissionStatus !== prevState.backgroundPermissionStatus
      ) {
        void state.syncBackgroundTask();
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
