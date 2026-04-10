import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useClient, useMutation } from "urql";
import { CreateGroupDocument } from "@mirai-app/graphql-types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";

export default function AdminCreateGroupScreen() {
  const router = useRouter();
  const client = useClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // GraphQL mutation for creating group
  const [, createGroup] = useMutation(CreateGroupDocument);

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
      setIsCreating(true);
      const result = await createGroup({
        input: {
          name: trimmedGroupName,
          tripId,
        },
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate related queries
      await client.invalidate("GetGroupsByTrip");

      Alert.alert("Success", "Group created successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", `Failed to create group: ${message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = groupName.trim().length > 0;

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
          isLoading={isCreating}
          onPress={handleSubmit}
          disabled={!isValid || isCreating}
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
