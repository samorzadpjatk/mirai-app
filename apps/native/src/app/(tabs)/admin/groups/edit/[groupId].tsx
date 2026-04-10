import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@mirai-app/frameworks/graphql";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { Ionicons } from "@expo/vector-icons";
import { AdminHeader } from "~/components/admin/AdminHeader";

interface OrganizerOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export default function AdminEditGroupScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ groupId: string; tripId?: string }>();
  const groupId = params.groupId;
  const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";


  const { data: group, isLoading: groupLoading } = useQuery({
    ...trpc.group.getById.queryOptions({ id: groupId }),
    enabled: !!groupId,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    ...trpc.user.getAll.queryOptions({ tripId }),
    enabled: !!tripId,
  });

  const [groupName, setGroupName] = useState(group?.name ?? "");
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerOption | null>(
    group?.organizer ?? null,
  );
  const [userSearch, setUserSearch] = useState("");

  const updateGroupMutation = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["group", "getAll"], { input: { tripId } }],
        });
        await queryClient.invalidateQueries({
          queryKey: [["group", "getById"], { input: { id: groupId } }],
        });
        Alert.alert("Success", "Group updated successfully.");
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update group: ${error.message}`);
      },
    }),
  );

  const deleteGroupMutation = useMutation(
    trpc.group.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: [["group", "getAll"], { input: { tripId } }],
        });
        Alert.alert("Success", "Group deleted successfully.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to delete group: ${error.message}`);
      },
    }),
  );

  const handleSave = async () => {
    if (!group || !groupId) return;

    const trimmedGroupName = groupName.trim();
    const effectiveTripId = tripId || group.trip?.id;

    if (!effectiveTripId) {
      Alert.alert("Error", "Missing trip context for this group. Please reopen the group from its trip.");
      return;
    }

    if (!trimmedGroupName) {
      Alert.alert("Validation", "Group name is required.");
      return;
    }

    try {
      await Promise.all([
        trimmedGroupName !== group.name
          ? updateGroupMutation.mutateAsync({ id: groupId, tripId: effectiveTripId, name: trimmedGroupName })
          : Promise.resolve(),
        selectedOrganizer?.id !== group.organizer?.id
          ? updateGroupMutation.mutateAsync({ id: groupId, tripId: effectiveTripId, organizerId: selectedOrganizer?.id })
          : Promise.resolve(),
      ]);

      Alert.alert("Success", "Group updated successfully.");
    } catch {
      // Error handling is done in the individual mutations
    }
  };

  const handleDelete = () => {
    if (!group) return;

    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all members from the group.${group._count.participants > 0 ? `\n\n${group._count.participants} participants will be affected.` : ""
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteGroupMutation.mutate({ id: groupId });
            } catch {
              // Error handling is done in the mutation
            }
          },
        },
      ]
    );
  };

  const normalizedSearch = userSearch.trim().toLowerCase();
  const filteredUsers = (users ?? []).filter((user) => {
    if (!normalizedSearch) return true;

    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
    const email = user.email?.toLowerCase() ?? "";

    return fullName.includes(normalizedSearch) || email.includes(normalizedSearch);
  });

  const isLoading = groupLoading || usersLoading;
  const isSaving = updateGroupMutation.isPending;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Edit Group" subtitle="Loading group data..." />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="Group not found" />
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
      <View style={styles.body}>
        <View style={styles.formSection}>
          <FormField label="Group Name" required>
            <ThemedTextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name..."
            />
          </FormField>

          <View style={styles.groupInfo}>
            <Text style={styles.participantCount}>{group._count.participants} participants</Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Assign Organizer</Text>
          </View>

          <View style={styles.searchContainer}>
            <ThemedTextInput
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Search users by name or email..."
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.userOption,
                selectedOrganizer?.id === item.id && styles.userOptionSelected,
              ]}
              onPress={() => setSelectedOrganizer(item)}
            >
              <View style={styles.userOptionInfo}>
                <Text
                  style={[
                    styles.userOptionName,
                    selectedOrganizer?.id === item.id && styles.userOptionNameSelected,
                  ]}
                >
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.userOptionEmail}>{item.email}</Text>
              </View>
              {selectedOrganizer?.id === item.id && (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          style={styles.usersList}
        />

        <View style={[styles.actions, { paddingBottom: insets.bottom + spacing.xl }]}>
          <PrimaryLoadingButton
            label="Save Changes"
            isLoading={isSaving}
            onPress={handleSave}
            disabled={isSaving}
          />

          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleteGroupMutation.isPending && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={deleteGroupMutation.isPending}
          >
            <Text style={styles.deleteButtonText}>
              {deleteGroupMutation.isPending ? "Deleting..." : "Delete Group"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  formSection: {
    gap: spacing.md,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: spacing.md,
  },
  usersList: {
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupInfo: {
    marginBottom: spacing.xs,
  },
  participantCount: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  usersListContent: {
    paddingBottom: spacing.sm,
  },
  userSeparator: {
    height: spacing.xs,
  },
  userOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundDark,
    marginBottom: spacing.sm,
  },
  userOptionSelected: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  userOptionInfo: {
    flex: 1,
  },
  userOptionName: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.medium,
  },
  userOptionNameSelected: {
    color: colors.primary,
  },
  userOptionEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: "center",
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: typography.base,
    color: colors.danger,
    fontWeight: typography.medium,
  },
});
