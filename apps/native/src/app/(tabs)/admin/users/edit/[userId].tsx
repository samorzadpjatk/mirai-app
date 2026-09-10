import { formatDisplayName } from "@mirai-app/common/users";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateUserQueries } from "@mirai-app/orpc/client/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { DeckBackground } from "~/components/common/DeckBackground";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { DateTimePickerModal, FormField, ThemedTextInput } from "~/components/common/ui";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";
import { formatBanLabel, isBanReady } from "~/utils/validation";

export default function AdminEditUserScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ userId: string; tripId?: string }>();
  const userId = params.userId;
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const { data: user, isLoading } = useQuery(
    orpc.user.getById.queryOptions({ input: { id: userId }, enabled: !!userId }),
  );

  const isParticipantQueryEnabled = Boolean(userId && tripId);
  const { data: participant, isFetched: isParticipantFetched } = useQuery(
    orpc.user.getByIdWithGroup.queryOptions({
      input: { id: userId, tripId },
      enabled: isParticipantQueryEnabled,
    }),
  );

  const { data: groupsResponse } = useQuery(
    orpc.group.getAll.queryOptions({
      input: { tripId, pagination: { limit: 100, offset: 0 } },
      enabled: Boolean(tripId),
    }),
  );
  const groups = groupsResponse?.groups ?? [];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [wristNumber, setWristNumber] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [banUntil, setBanUntil] = useState<Date | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanPickerOpen, setIsBanPickerOpen] = useState(false);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  // `useState` initialisers only run on the very first render, when both user
  // queries are still in flight, so seeding the form from them leaves every
  // field permanently empty. Hydrate during render instead - React's supported
  // "adjust state while rendering" pattern - once the data has actually landed.
  // The key covers userId *and* tripId so navigating to another user (or the
  // same user under a different trip) re-hydrates the form.
  const hydrationKey = `${userId}:${tripId}`;
  const isParticipantSettled = !isParticipantQueryEnabled || isParticipantFetched;

  if (user && isParticipantSettled && hydratedKey !== hydrationKey) {
    const participantTrip = participant?.trips?.[0];
    setHydratedKey(hydrationKey);
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setWristNumber(participantTrip?.wristNumber ?? "");
    setHouseNumber(participantTrip?.houseNumber ?? "");
    setSelectedGroupId(participantTrip?.group?.id ?? null);
  }

  const updateNameMutation = useMutation(
    orpc.user.updateName.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update user: ${error.message}`);
      },
    }),
  );

  const updateWristNumberMutation = useMutation(
    orpc.user.updateWristNumber.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update wrist number: ${error.message}`);
      },
    }),
  );

  const updateHouseNumberMutation = useMutation(
    orpc.user.updateHouseNumber.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update house number: ${error.message}`);
      },
    }),
  );

  const banUserMutation = useMutation(
    orpc.user.banUserUntil.mutationOptions({
      onSuccess: async () => {
        await invalidateUserQueries(queryClient, true);
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
        await invalidateUserQueries(queryClient, true);
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
        await invalidateUserQueries(queryClient, true);
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
      // Sequential on purpose. Firing these together put all four mutations in the
      // same tick, which the oRPC batch link merges into a single request; the
      // batch response came back short and every call in it failed with "batch
      // response not contains enough responses", so Save never wrote anything.
      // Awaiting them one at a time keeps each on its own request, and also makes
      // the failure report name the field that actually failed.
      await updateNameMutation.mutateAsync({
        userId,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });

      if (wristNumber.trim()) {
        await updateWristNumberMutation.mutateAsync({ userId, tripId, wristNumber });
      }

      if (houseNumber.trim()) {
        await updateHouseNumberMutation.mutateAsync({ userId, tripId, houseNumber });
      }

      if (selectedGroupId && selectedGroupId !== (participant?.trips?.[0]?.group?.id ?? null)) {
        await assignToGroupMutation.mutateAsync({ userId, groupId: selectedGroupId, tripId });
      }

      Alert.alert("Success", "User updated successfully.");
    } catch {
      // Each mutation reports its own failure through its onError handler.
    }
  };

  const handleBanUser = () => {
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
  // The group is optional for `handleSave`, so gating Save on it left the button
  // permanently dead for users (and trips) without a group. Gate on what the
  // handler actually requires instead.
  const canSave = firstName.trim().length > 0 && lastName.trim().length > 0;
  const banReady = isBanReady(banUntil);
  const banLabel = formatBanLabel(banUntil);

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
      <DeckBackground />

      <AdminHeader title="Edit User" subtitle="Update user information and permissions" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {formatDisplayName(firstName, lastName, "Unknown user")}
          </Text>
          <Text style={styles.userEmail}>{user.email ?? "No email"}</Text>
        </View>

        <FormField label="First name" required={true}>
          <ThemedTextInput
            testID="first-name-input"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name..."
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Last name" required={true}>
          <ThemedTextInput
            testID="last-name-input"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name..."
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Wrist #">
          <ThemedTextInput
            testID="wrist-number-input"
            value={wristNumber}
            onChangeText={setWristNumber}
            placeholder="None"
            keyboardType="numeric"
          />
        </FormField>

        <FormField label="House #">
          <ThemedTextInput
            testID="house-number-input"
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
                    testID={`group-option-${group.id}`}
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
          testID="save-changes-button"
          label="Save Changes"
          isLoading={isSaving}
          onPress={handleSave}
          disabled={isSaving || !canSave}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temporary Ban</Text>
          <Text style={styles.sectionHint}>Pick a date and time to ban until</Text>

          <TouchableOpacity style={styles.banPickerButton} onPress={() => setIsBanPickerOpen(true)}>
            <Text style={styles.banPickerButtonText}>{banLabel}</Text>
          </TouchableOpacity>

          <FormField label="Reason">
            <ThemedTextInput
              testID="ban-reason-input"
              value={banReason}
              onChangeText={setBanReason}
              placeholder="Optional reason for the ban"
              multiline={true}
            />
          </FormField>

          <TouchableOpacity
            style={[
              styles.banButton,
              (!banReady || banUserMutation.isPending) && styles.dangerButtonDisabled,
            ]}
            onPress={handleBanUser}
            disabled={!banReady || banUserMutation.isPending}
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

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 96,
      gap: spacing.md,
    },
    userInfo: {
      marginBottom: spacing.md,
    },
    userName: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: palette.white,
      marginBottom: spacing.xs,
    },
    userEmail: {
      fontSize: typography.sm,
      color: palette.textSecondary,
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
      borderColor: palette.borderWhite5,
      backgroundColor: palette.backgroundDark,
    },
    groupOptionSelected: {
      borderColor: palette.primary,
      backgroundColor: palette.primaryOpacity10,
    },
    groupOptionText: {
      color: palette.white,
      fontSize: typography.sm,
    },
    groupOptionTextSelected: {
      color: palette.primary,
      fontWeight: typography.medium,
    },
    groupEmpty: {
      color: palette.textSecondary,
      fontSize: typography.sm,
    },
    section: {
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.base,
      fontWeight: typography.semibold,
      color: palette.white,
      marginBottom: spacing.xs,
    },
    sectionHint: {
      fontSize: typography.sm,
      color: palette.textSecondary,
      marginBottom: spacing.sm,
    },
    banPickerButton: {
      backgroundColor: palette.backgroundDark,
      borderWidth: 1,
      borderColor: palette.borderDark,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    banPickerButtonText: {
      fontSize: typography.base,
      color: palette.white,
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
      color: palette.white,
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
}
