import React, { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUserQuery,
  useUpdateUserMutation,
} from "@mirai-app/graphql-types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import {
  FormField,
  ThemedTextInput,
  DateTimePickerModal,
} from "~/components/common/ui";

export default function AdminEditUserScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId: string; tripId?: string }>();
  const userId = params.userId;
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  // GraphQL query for user data
  const { data: userData, isLoading } = useGetUserQuery(
    { id: userId },
    { enabled: !!userId },
  );

  const user = userData?.user;

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [wristNumber, setWristNumber] = useState(user?.wristNumber ?? "");
  const [houseNumber, setHouseNumber] = useState(user?.houseNumber ?? "");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [banUntil, setBanUntil] = useState<Date | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanPickerOpen, setIsBanPickerOpen] = useState(false);

  // Update local state when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setWristNumber(user.wristNumber ?? "");
      setHouseNumber(user.houseNumber ?? "");
      setSelectedGroupId(user.group?.id ?? null);
    }
  }, [user]);

  // Groups data - placeholder
  const groups: Array<{ id: string; name: string }> = [];

  // GraphQL mutation for updating user
  const updateUserMutation = useUpdateUserMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      Alert.alert("Success", "User updated successfully.");
    },
    onError: (error) => {
      Alert.alert("Error", `Failed to update user: ${error.message}`);
    },
  });

  const handleSave = async () => {
    if (!user || !userId) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      Alert.alert("Validation", "First name and last name are required.");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        input: {
          id: userId,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          wristNumber: wristNumber.trim() || undefined,
          houseNumber: houseNumber.trim() || undefined,
          groupId: selectedGroupId || undefined,
        },
      });
    } catch {
      // Error handling is done in the mutation
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
          // Ban mutation would be implemented here
          Alert.alert(
            "Info",
            "Ban functionality not yet implemented in GraphQL",
          );
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
          // Delete mutation would be implemented here
          Alert.alert(
            "Info",
            "Delete functionality not yet implemented in GraphQL",
          );
        },
      },
    ]);
  };

  const isSaving = updateUserMutation.isPending;
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
        {
          paddingTop: spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Edit User"
        subtitle="Update user information and permissions"
      />

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
                    style={[
                      styles.groupOption,
                      isSelected && styles.groupOptionSelected,
                    ]}
                    onPress={() => setSelectedGroupId(group.id)}
                    disabled={isSaving}
                  >
                    <Text
                      style={[
                        styles.groupOptionText,
                        isSelected && styles.groupOptionTextSelected,
                      ]}
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
          <Text style={styles.sectionHint}>
            Pick a date and time to ban until
          </Text>

          <TouchableOpacity
            style={styles.banPickerButton}
            onPress={() => setIsBanPickerOpen(true)}
          >
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
              (!isBanReady || isSaving) && styles.dangerButtonDisabled,
            ]}
            onPress={handleBan}
            disabled={!isBanReady || isSaving}
          >
            <Text style={styles.banButtonText}>
              {isSaving ? "Banning..." : "Ban user"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, isSaving && styles.dangerButtonDisabled]}
          onPress={handleDelete}
          disabled={isSaving}
        >
          <Text style={styles.deleteButtonText}>
            {isSaving ? "Deleting..." : "Delete user"}
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
