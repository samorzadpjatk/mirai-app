import { useEffect, useRef, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { graphqlClient } from "~/lib/graphql-client";
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
  const queryClient = useQueryClient();
  const hasHydrated = useRef(false);

  // GraphQL query for sharing settings
  const { data: sharingSettings } = useQuery({
    queryKey: ["GetMySharingSettings"],
    queryFn: async () => {
      const result = (await graphqlClient.request(
        GetMySharingSettingsDocument,
      )) as { mySharingSettings: SharingSettings | null };
      return result.mySharingSettings;
    },
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
      )) as { updateLocationSharing: SharingSettings };
      return result.updateLocationSharing;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["GetMySharingSettings"],
      });
    },
    onError: (error: Error & { message?: string }) => {
      console.error("Failed to update location sharing settings:", error);
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
    },
  });

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

/**
 * Bridges the Zustand location store with GraphQL server data.
 * Hydrates the store with server sharing settings and synchronizes background tasks.
 */
export function LocationStoreProvider({
  children,
}: LocationStoreProviderProps) {
  const queryClient = useQueryClient();
  const hasHydrated = useRef(false);

  // GraphQL query for sharing settings
  const { data: sharingSettings } = useQuery({
    queryKey: ["GetMySharingSettings"],
    queryFn: async () => {
      const result = await graphqlClient.request(GetMySharingSettingsDocument);
      return result.mySharingSettings;
    },
  });

  // GraphQL mutation for updating sharing settings
  const updateSharingMutation = useMutation({
    mutationFn: async (
      input: UpdateSharingSettingsMutationVariables["input"],
    ) => {
      const result = await graphqlClient.request(
        UpdateSharingSettingsDocument,
        { input },
      );
      return result.updateLocationSharing;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["GetMySharingSettings"],
      });
    },
    onError: (error: Error & { message: string }) => {
      console.error("Failed to update location sharing settings:", error);
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
    },
  });

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
