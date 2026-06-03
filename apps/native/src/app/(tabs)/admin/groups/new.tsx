import { orpc } from "@mirai-app/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { colors, spacing } from "~/styles";

export default function AdminCreateGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const [groupName, setGroupName] = useState("");

  const createGroupMutation = useMutation(
    orpc.group.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["group", "getAll"], { input: { tripId } }],
        });
        Alert.alert("Success", "Group created successfully.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to create group: ${error.message}`);
      },
    }),
  );

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
        { paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader title="Create Group" subtitle="Add a new group to the trip" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FormField label="Group Name" required={true}>
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
          disabled={!groupName.trim() || createGroupMutation.isPending}
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
