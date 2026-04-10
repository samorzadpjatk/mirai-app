import React, { useState, useEffect, useCallback } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetActivityQuery,
  useUpdateActivityMutation,
} from "@mirai-app/graphql-types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";

// Create GraphQL client with auth token from SecureStore
const createGraphQLClient = async () => {
  const graphqlUrl =
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:3000/graphql";
  const token = await SecureStore.getItemAsync("token");

  return new GraphQLClient(graphqlUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export default function AdminEditActivityScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    activityId: string;
    tripId?: string;
  }>();
  const activityId = params.activityId;
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [client, setClient] = useState<GraphQLClient | null>(null);

  // Initialize GraphQL client
  useEffect(() => {
    void createGraphQLClient().then(setClient);
  }, []);

  // Get activity query
  const { data: activity, isLoading } = useGetActivityQuery(
    client ?? new GraphQLClient(""),
    { id: activityId },
    { enabled: !!client && !!activityId },
  );

  // Initialize form with activity data when it loads
  useEffect(() => {
    if (activity?.activity) {
      const updateState = () => {
        if (title !== activity.activity.title) {
          setTitle(activity.activity.title);
        }
        const newDescription = activity.activity.description ?? "";
        if (description !== newDescription) {
          setDescription(newDescription);
        }
      };
      requestAnimationFrame(updateState);
    }
  }, [activity, title, description]);

  const invalidateFeed = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [
        "GetActivitiesByTripModeration",
        { tripId, page: 1, perPage: 100 },
      ],
    });
  }, [queryClient, tripId]);

  const updateMutation = useUpdateActivityMutation(
    client ?? new GraphQLClient(""),
    {
      onSuccess: async () => {
        await invalidateFeed();
        Alert.alert("Success", "Activity updated successfully.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error) =>
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Update failed.",
        ),
    },
  );

  const handleSubmit = async () => {
    if (!activity?.activity) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Validation", "Title is required.");
      return;
    }

    const trimmedDescription = description.trim();

    const payload: {
      activityId: string;
      title?: string;
      description?: string | null;
    } = { activityId: activity.activity.id };

    if (trimmedTitle !== activity.activity.title) {
      payload.title = trimmedTitle;
    }

    if (trimmedDescription !== (activity.activity.description ?? "")) {
      payload.description =
        trimmedDescription.length > 0 ? trimmedDescription : null;
    }

    if (Object.keys(payload).length === 1) {
      router.back();
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
    } catch {
      // Error handling is done in the mutation's onError
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader
          title="Edit Activity"
          subtitle="Loading activity data..."
        />
      </View>
    );
  }

  if (!activity?.activity) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="Activity not found" />
      </View>
    );
  }

  const activityData = activity.activity;

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
        title="Edit Activity"
        subtitle="Update activity information"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>{activityData.title}</Text>
          <Text style={styles.activityType}>
            Type: {activityData.activityType}
          </Text>
          <Text style={styles.activityMeta}>
            Created: {new Date(activityData.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <FormField label="Title" required>
          <ThemedTextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
          />
        </FormField>

        <FormField label="Description">
          <ThemedTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </FormField>

        <Text style={styles.readOnlyHint}>
          Image is read-only and inherited from source activity.
        </Text>

        <PrimaryLoadingButton
          label="Save Changes"
          isLoading={updateMutation.isPending}
          onPress={handleSubmit}
          disabled={updateMutation.isPending}
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
  activityInfo: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  activityTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  activityType: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  activityMeta: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  readOnlyHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
