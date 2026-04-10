import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useClient } from "urql";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { Ionicons } from "@expo/vector-icons";
import { AdminHeader } from "~/components/admin/AdminHeader";
import {
  GetGroupDocument,
  GetUsersDocument,
  UpdateGroupDocument,
  DeleteGroupDocument,
  GetGroupsByTripDocument,
  type GetGroupQuery,
  type GetUsersQuery,
} from "@mirai-app/graphql-types";

interface OrganizerOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export default function AdminEditGroupScreen() {
  const router = useRouter();
  const urqlClient = useClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ groupId: string; tripId?: string }>();
  const groupId = params.groupId;
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  // Query for group data
  const [{ data: groupData, fetching: groupLoading }] = useQuery({
    query: GetGroupDocument,
    variables: { id: groupId },
    pause: !groupId,
  });

  const group = (groupData as GetGroupQuery | undefined)?.group;

  // Query for users
  const [{ data: usersData, fetching: usersLoading }] = useQuery({
    query: GetUsersDocument,
    variables: { limit: 100, offset: 0 },
    pause: !tripId,
  });

  const users = (usersData as GetUsersQuery | undefined)?.users ?? [];

  const [groupName, setGroupName] = useState(group?.name ?? "");
  const [selectedOrganizer, setSelectedOrganizer] =
    useState<OrganizerOption | null>(null);
  const [userSearch, setUserSearch] = useState("");

  // Update local state when group data loads
  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      // Note: GetGroupDocument doesn't return organizer, only organizerId
      setSelectedOrganizer(null);
    }
  }, [group]);

  // Cache invalidation helper
  const invalidateGroupsCache = useCallback(async () => {
    await urqlClient.invalidate(GetGroupsByTripDocument, {
      tripId: tripId || "",
      pagination: { limit: 50, offset: 0 },
    });
    await urqlClient.invalidate(GetGroupDocument, { id: groupId });
  }, [urqlClient, tripId, groupId]);

  // Update group mutation
  const [, updateGroup] = useMutation(UpdateGroupDocument);

  // Delete group mutation
  const [, deleteGroup] = useMutation(DeleteGroupDocument);

  const handleSave = async () => {
    if (!group || !groupId) return;

    const trimmedGroupName = groupName.trim();
    const effectiveTripId = tripId || group.tripId;

    if (!effectiveTripId) {
      Alert.alert(
        "Error",
        "Missing trip context for this group. Please reopen the group from its trip.",
      );
      return;
    }

    if (!trimmedGroupName) {
      Alert.alert("Validation", "Group name is required.");
      return;
    }

    try {
      const promises: Promise<unknown>[] = [];

      if (trimmedGroupName !== group.name) {
        promises.push(
          updateGroup({
            input: {
              id: groupId,
              name: trimmedGroupName,
            },
          }),
        );
      }

      if (selectedOrganizer?.id !== group.organizerId) {
        promises.push(
          updateGroup({
            input: {
              id: groupId,
              organizerId: selectedOrganizer?.id ?? null,
            },
          }),
        );
      }

      const results = await Promise.all(promises);

      // Check for errors in any mutation results
      const hasError = results.some(
        (result) =>
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error != null,
      );

      if (hasError) {
        Alert.alert("Error", "Failed to update group.");
        return;
      }

      await invalidateGroupsCache();
      Alert.alert("Success", "Group updated successfully.");
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to update group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDelete = () => {
    if (!group) return;

    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all members from the group.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteGroup({ id: groupId });

              if (result.error) {
                Alert.alert(
                  "Error",
                  `Failed to delete group: ${result.error.message}`,
                );
                return;
              }

              await invalidateGroupsCache();
              Alert.alert("Success", "Group deleted successfully.", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert(
                "Error",
                `Failed to delete group: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
          },
        },
      ],
    );
  };

  const normalizedSearch = userSearch.trim().toLowerCase();
  const filteredUsers = (users ?? []).filter((user) => {
    if (!normalizedSearch) return true;

    const fullName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
    // Note: GetUsersDocument doesn't return email, only fullName
    const searchText = user.fullName?.toLowerCase() ?? "";

    return (
      fullName.includes(normalizedSearch) ||
      searchText.includes(normalizedSearch)
    );
  });

  const isLoading = groupLoading || usersLoading;

  // Track saving state locally since urql doesn't expose isPending
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveWithLoading = async () => {
    setIsSaving(true);
    try {
      await handleSave();
    } finally {
      setIsSaving(false);
    }
  };

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
        {
          paddingTop: spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
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
            <Text style={styles.participantCount}>
              {/* Note: GetGroupDocument doesn't return _count */}
              Group management
            </Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Assign Organizer</Text>
          </View>

          <View style={styles.searchContainer}>
            <ThemedTextInput
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Search users by name..."
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
              onPress={() =>
                setSelectedOrganizer({
                  id: item.id,
                  firstName: item.firstName,
                  lastName: item.lastName,
                  email: null, // GetUsersDocument doesn't return email
                })
              }
            >
              <View style={styles.userOptionInfo}>
                <Text
                  style={[
                    styles.userOptionName,
                    selectedOrganizer?.id === item.id &&
                      styles.userOptionNameSelected,
                  ]}
                >
                  {item.firstName} {item.lastName}
                </Text>
                {/* Note: email is not available from GetUsersDocument */}
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

        <View
          style={[
            styles.actions,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
        >
          <PrimaryLoadingButton
            label="Save Changes"
            isLoading={isSaving}
            onPress={handleSaveWithLoading}
            disabled={isSaving}
          />

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Group</Text>
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

// Summary:
// - File migrated: apps/native/src/app/(tabs)/admin/groups/edit/[groupId].tsx
// - Key changes made:
//   1. Replaced @tanstack/react-query imports with urql (useQuery, useMutation, useClient)
//   2. Removed GraphQLClient and SecureStore imports (urql client handles auth automatically)
//   3. Removed createGraphQLClient helper function (not needed with urql)
//   4. Removed manual client state management (urql Provider handles this)
//   5. Imported GraphQL documents from @mirai-app/graphql-types (GetGroupDocument, GetUsersDocument, UpdateGroupDocument, DeleteGroupDocument, GetGroupsByTripDocument)
//   6. Migrated useQueryClient() to useClient() from urql
//   7. Changed from TanStack Query's useQuery({ queryKey, queryFn, enabled }) to urql's useQuery({ query, variables, pause })
//   8. Changed from useMutation with callbacks to urql's useMutation(Document) with manual error handling
//   9. Replaced queryClient.invalidateQueries({ queryKey }) with urqlClient.invalidate(Document, variables)
//   10. Added local state tracking for isSaving (urql doesn't expose isPending directly)
//   11. Updated mutation error handling to check result.error from urql execute functions
//   12. Adjusted for schema differences: GetGroupDocument returns organizerId (not organizer object), GetUsersDocument doesn't return email, GetGroupDocument doesn't return _count
