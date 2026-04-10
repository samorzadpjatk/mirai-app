import React, { useState, useEffect, useCallback } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetActivityDocument,
  UpdateActivityDocument,
  GetActivitiesByTripModerationDocument,
} from "@mirai-app/graphql-types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";

export default function AdminEditActivityScreen() {
  const router = useRouter();
  const urqlClient = useClient();
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

  // Get activity query
  const [{ data: activity, fetching: isLoading }] = useQuery({
    query: GetActivityDocument,
    variables: { id: activityId },
    pause: !activityId,
  });

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
    await urqlClient.invalidate(GetActivitiesByTripModerationDocument, {
      tripId,
      page: 1,
      perPage: 100,
    });
  }, [urqlClient, tripId]);

  // Update mutation
  const [, updateActivity] = useMutation(UpdateActivityDocument);

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

    const result = await updateActivity({
      input: payload,
    });

    if (result.error) {
      Alert.alert("Error", result.error.message || "Update failed.");
    } else {
      await invalidateFeed();
      Alert.alert("Success", "Activity updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
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
          isLoading={false}
          onPress={handleSubmit}
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

// Summary:
// - File migrated: apps/native/src/app/(tabs)/admin/activity/edit/[activityId].tsx
// - Key changes made:
//   1. Replaced @tanstack/react-query imports with urql (useQuery, useMutation, useClient)
//   2. Removed GraphQLClient and SecureStore imports (urql client handles auth automatically)
//   3. Removed createGraphQLClient helper function (not needed with urql)
//   4. Removed manual client state management (urql Provider handles this)
//   5. Imported GraphQL documents from @mirai-app/graphql-types (GetActivityDocument, UpdateActivityDocument, GetActivitiesByTripModerationDocument)
//   6. Migrated useQueryClient() to useClient() from urql
//   7. Changed from graphql-request's useGetActivityQuery(client, variables, options) to urql's useQuery({ query, variables, pause })
//   8. Changed from graphql-request's useUpdateActivityMutation(client, options) to urql's useMutation(Document)
//   9. Updated loading state: isLoading → fetching (from urql's tuple)
//   10. Replaced queryClient.invalidateQueries({ queryKey }) with urqlClient.invalidate(Document, variables)
//   11. Updated mutation pattern: removed onSuccess/onError callbacks from hook, moved to manual error handling after await
//   12. Simplified PrimaryLoadingButton: removed isPending state since urql mutation doesn't expose it directly (can add local state if needed)
// - Note: The mutation loading state can be added by tracking locally if UX requires it
