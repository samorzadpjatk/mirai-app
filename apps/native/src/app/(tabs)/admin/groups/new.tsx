import React, { useState, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { useCreateGroupMutation } from "@mirai-app/graphql-types";

// GraphQL Client setup with SecureStore
const createGraphQLClient = async (): Promise<GraphQLClient> => {
  const token = await SecureStore.getItemAsync("sb-access-token");
  return new GraphQLClient(
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );
};

export default function AdminCreateGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [client, setClient] = useState<GraphQLClient | null>(null);

  useMemo(() => {
    createGraphQLClient().then(setClient);
  }, []);

  const [groupName, setGroupName] = useState("");

  const createGroupMutation = useMutation({
    mutationFn: async (input: { name: string; tripId: string }) => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useCreateGroupMutation.fetcher(client, {
        input: {
          name: input.name,
          tripId: input.tripId,
        },
      })();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["GetGroupsByTrip"] });
      Alert.alert("Success", "Group created successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        `Failed to create group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });

  const handleSubmit = async () => {
    const trimmedGroupName = groupName.trim();

    if (!trimmedGroupName) {
      Alert.alert("Validation", "Group name is required.");
      return;
    }

    if (!tripId) {
      Alert.alert("Error", "Trip context is required.");
      return;
    }

    try {
      await createGroupMutation.mutateAsync({
        name: trimmedGroupName,
        tripId,
      });
    } catch {
      // Error handling is done in the mutation's onError
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Create Group"
        subtitle="Add a new group to the trip"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FormField label="Group Name" required>
          <ThemedTextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Enter group name..."
          />
        </FormField>

        <PrimaryLoadingButton
          label="Create Group"
          isLoading={createGroupMutation.isPending}
          onPress={handleSubmit}
          disabled={
            !groupName.trim() || createGroupMutation.isPending || !client
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
});
