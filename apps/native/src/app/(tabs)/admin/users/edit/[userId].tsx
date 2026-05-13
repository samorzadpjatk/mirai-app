import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@mirai-app/orpc/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput, DateTimePickerModal } from "~/components/common/ui";

export default function AdminEditUserScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId: string; tripId?: string }>();
  const userId = params.userId;
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const { data: user, isLoading } = useQuery(
    orpc.user.getById.queryOptions({ input: { id: userId }, enabled: !!userId }),
  );

  const { data: participant } = useQuery(
    orpc.user.getByIdWithGroup.queryOptions({
      input: { id: userId, tripId },
      enabled: Boolean(userId && tripId),
    }),
  );

  const { data: groupsResponse, error: groupsError } = useQuery(
    orpc.group.getAll.queryOptions({
      input: { tripId, pagination: { limit: 100, offset: 0 } },
      enabled: Boolean(tripId),
    }),
  );
  const groups = groupsResponse?.groups ?? [];
  console.debug("EditUser groups debug", { tripId, groupsResponse, groups, groupsError });

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [wristNumber, setWristNumber] = useState(participant?.trips?.[0]?.wristNumber ?? "");
  const [houseNumber, setHouseNumber] = useState(participant?.trips?.[0]?.houseNumber ?? "");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const participantTrip = participant?.trips?.[0];
    return participantTrip?.group?.id ?? null;
  });
  const [banUntil, setBanUntil] = useState<Date | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanPickerOpen, setIsBanPickerOpen] = useState(false);

  const updateNameMutation = useMutation(
    orpc.user.updateName.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["user", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["user", "getById"], { input: { id: userId } }],
        });
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update user: ${error.message}`);
      },
    }),
  );

  const updateWristNumberMutation = useMutation(
    orpc.user.updateWristNumber.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["user", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["user", "getById"], { input: { id: userId } }],
        });
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update wrist number: ${error.message}`);
      },
    }),
  );

  const updateHouseNumberMutation = useMutation(
    orpc.user.updateHouseNumber.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["user", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["user", "getById"], { input: { id: userId } }],
        });
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update house number: ${error.message}`);
      },
    }),
  );

  const banUserMutation = useMutation(
    orpc.user.banUserUntil.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["user", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["user", "getById"], { input: { id: userId } }],
        });
        Alert.alert("Success", "User has been banned.");
        setBanUntil(null);
        setBanReason("");
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to ban user: ${error.message}`);
      },
    }),
  );

  const deleteUserMutation = useMutation(
    orpc.user.deleteUser.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["user", "getAll"], { input: { tripId } }],
        });
        Alert.alert("Success", "User has been deleted.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to delete user: ${error.message}`);
      },
    }),
  );

  const assignToGroupMutation = useMutation(
    orpc.group.assignUserToGroup.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["user", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["user", "getTripParticipant"], { input: { userId, tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["user", "getById"], { input: { id: userId } }],
        });
        Alert.alert("Success", "Group updated.");
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to assign group: ${error.message}`);
      },
    }),
  );

  const handleSave = async () => {
    if (!user || !userId) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert("Validation", "First name and last name are required.");
      return;
    }

    try {
      await Promise.all([
        updateNameMutation.mutateAsync({
          userId,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
        }),
        wristNumber.trim()
          ? updateWristNumberMutation.mutateAsync({ userId, tripId, wristNumber })
          : Promise.resolve(),
        houseNumber.trim()
          ? updateHouseNumberMutation.mutateAsync({ userId, tripId, houseNumber })
          : Promise.resolve(),
        selectedGroupId && selectedGroupId !== (participant?.trips?.[0]?.group?.id ?? null)
          ? assignToGroupMutation.mutateAsync({ userId, groupId: selectedGroupId, tripId })
          : Promise.resolve(),
      ]);

      Alert.alert("Success", "User updated successfully.");
    } catch {
      // Error handling is done in the individual mutations
    }
  };

  const handleBan = () => {
    if (!user || !userId || !banUntil) return;

    Alert.alert("Ban user", "Ban this user until the selected date and time?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Ban",
        style: "destructive",
        onPress: () => {
          banUserMutation
            .mutateAsync({
              userId,
              bannedUntilMs: banUntil.getTime(),
              reason: banReason.trim(),
            })
            .catch(() => {
              // Error handling is done in the mutation
            });
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!user || !userId) return;

    Alert.alert("Delete user", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteUserMutation.mutateAsync({ userId, tripId }).catch(() => {
            // Error handling is done in the mutation
          });
        },
      },
    ]);
  };

  const isSaving =
    updateNameMutation.isPending ||
    updateWristNumberMutation.isPending ||
    updateHouseNumberMutation.isPending ||
    assignToGroupMutation.isPending;
  const isBanReady = banUntil != null && banUntil > new Date();
  const banLabel = banUntil
    ? `${banUntil.toLocaleDateString()} • ${banUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Select date & time";

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Edit User" subtitle="Loading user data..." />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="User not found" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: spacing.xl, paddingBottom: Math.max(insets.bottom, spacing.lg) },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader title="Edit User" subtitle="Update user information and permissions" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {[firstName, lastName].filter(Boolean).join(" ") || "Unknown user"}
          </Text>
          <Text style={styles.userEmail}>{user.email ?? "No email"}</Text>
        </View>

        <FormField label="First name" required>
          <ThemedTextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name..."
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Last name" required>
          <ThemedTextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name..."
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Wrist #">
          <ThemedTextInput
            value={wristNumber}
            onChangeText={setWristNumber}
            placeholder="None"
            keyboardType="numeric"
          />
        </FormField>

        <FormField label="House #">
          <ThemedTextInput
            value={houseNumber}
            onChangeText={setHouseNumber}
            placeholder="None"
            keyboardType="numeric"
          />
        </FormField>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Group</Text>
          <View style={styles.groupList}>
            {Array.isArray(groups) && groups.length > 0 ? (
              groups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[styles.groupOption, isSelected && styles.groupOptionSelected]}
                    onPress={() => setSelectedGroupId(group.id)}
                    disabled={assignToGroupMutation.isPending}
                  >
                    <Text
                      style={[styles.groupOptionText, isSelected && styles.groupOptionTextSelected]}
                    >
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.groupEmpty}>No groups available</Text>
            )}
          </View>
        </View>

        <PrimaryLoadingButton
          label="Save Changes"
          isLoading={isSaving}
          onPress={handleSave}
          disabled={isSaving || !selectedGroupId}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temporary Ban</Text>
          <Text style={styles.sectionHint}>Pick a date and time to ban until</Text>

          <TouchableOpacity style={styles.banPickerButton} onPress={() => setIsBanPickerOpen(true)}>
            <Text style={styles.banPickerButtonText}>{banLabel}</Text>
          </TouchableOpacity>

          <FormField label="Reason">
            <ThemedTextInput
              value={banReason}
              onChangeText={setBanReason}
              placeholder="Optional reason for the ban"
              multiline
            />
          </FormField>

          <TouchableOpacity
            style={[
              styles.banButton,
              (!isBanReady || banUserMutation.isPending) && styles.dangerButtonDisabled,
            ]}
            onPress={handleBan}
            disabled={!isBanReady || banUserMutation.isPending}
          >
            <Text style={styles.banButtonText}>
              {banUserMutation.isPending ? "Banning..." : "Ban user"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, deleteUserMutation.isPending && styles.dangerButtonDisabled]}
          onPress={handleDelete}
          disabled={deleteUserMutation.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {deleteUserMutation.isPending ? "Deleting..." : "Delete user"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <DateTimePickerModal
        visible={isBanPickerOpen}
        value={banUntil ?? new Date()}
        mode="datetime"
        onConfirm={(date) => {
          setBanUntil(date);
          setIsBanPickerOpen(false);
        }}
        onCancel={() => setIsBanPickerOpen(false)}
      />
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
  userInfo: {
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  sectionBlock: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  groupList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  groupOption: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
    backgroundColor: colors.backgroundDark,
  },
  groupOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity10,
  },
  groupOptionText: {
    color: colors.white,
    fontSize: typography.sm,
  },
  groupOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.medium,
  },
  groupEmpty: {
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  banPickerButton: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  banPickerButtonText: {
    fontSize: typography.base,
    color: colors.white,
  },
  banButton: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  dangerButtonDisabled: {
    opacity: 0.5,
  },
  banButtonText: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.medium,
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  deleteButtonText: {
    fontSize: typography.base,
    color: colors.danger,
    fontWeight: typography.medium,
  },
});
