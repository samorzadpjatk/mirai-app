import { Ionicons } from "@expo/vector-icons";
import { orpc } from "@mirai-app/orpc/client";
import { invalidateGroupQueries } from "@mirai-app/orpc/client/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { DeckBackground } from "~/components/common/DeckBackground";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { EmptyState, FormField, ThemedTextInput } from "~/components/common/ui";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface OrganizerOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export default function AdminEditGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ groupId: string; tripId?: string }>();
  const groupId = params.groupId;
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");

  const { data: group, isLoading: groupLoading } = useQuery({
    ...orpc.group.getById.queryOptions({ input: { id: groupId } }),
    enabled: !!groupId,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    ...orpc.user.getAll.queryOptions({ input: { tripId } }),
    enabled: !!tripId,
  });

  const [groupName, setGroupName] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerOption | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [hydratedGroupId, setHydratedGroupId] = useState<string | null>(null);

  // `useState` initialisers only run on the first render, while the group query
  // is still in flight, so seeding the form from `group` there leaves the name
  // blank and the organizer unselected forever. Hydrate during render once the
  // data lands, keyed on the group so navigating to another group re-hydrates.
  if (group && hydratedGroupId !== groupId) {
    setHydratedGroupId(groupId);
    setGroupName(group.name ?? "");
    setSelectedOrganizer(group.organizer ?? null);
  }

  const updateGroupMutation = useMutation(
    orpc.group.update.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient, true);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to update group: ${error.message}`);
      },
    }),
  );

  const deleteGroupMutation = useMutation(
    orpc.group.delete.mutationOptions({
      onSuccess: async () => {
        await invalidateGroupQueries(queryClient, true);
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
      await Promise.all([
        trimmedGroupName !== group.name
          ? updateGroupMutation.mutateAsync({
              id: groupId,
              tripId: effectiveTripId,
              name: trimmedGroupName,
            })
          : Promise.resolve(),
        selectedOrganizer?.id !== group.organizer?.id
          ? updateGroupMutation.mutateAsync({
              id: groupId,
              tripId: effectiveTripId,
              organizerId: selectedOrganizer?.id,
            })
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
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all members from the group.${
        group._count.participants > 0
          ? `\n\n${group._count.participants} participants will be affected.`
          : ""
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
      ],
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
      <DeckBackground />
      <View style={styles.body}>
        <View style={styles.formSection}>
          <FormField label="Group Name" required={true}>
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
              {selectedOrganizer?.id === item.id ? (
                <Ionicons name="checkmark" size={18} color={palette.primary} />
              ) : null}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No users found"
              subtitle={
                normalizedSearch
                  ? "Try adjusting your search terms"
                  : "No users available for this trip"
              }
            />
          }
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

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundDark,
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
      paddingBottom: 96,
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
      color: palette.textSecondary,
    },
    section: {
      marginTop: spacing.md,
    },
    sectionTitle: {
      fontSize: typography.base,
      fontWeight: typography.semibold,
      color: palette.white,
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
      backgroundColor: palette.backgroundDark,
      marginBottom: spacing.sm,
    },
    userOptionSelected: {
      backgroundColor: `${palette.primary}20`,
      borderWidth: 1,
      borderColor: palette.primary,
    },
    userOptionInfo: {
      flex: 1,
    },
    userOptionName: {
      fontSize: typography.base,
      color: palette.white,
      fontWeight: typography.medium,
    },
    userOptionNameSelected: {
      color: palette.primary,
    },
    userOptionEmail: {
      fontSize: typography.sm,
      color: palette.textSecondary,
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
}
