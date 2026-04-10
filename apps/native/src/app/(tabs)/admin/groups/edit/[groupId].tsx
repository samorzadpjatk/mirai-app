import React, { useState, useMemo } from "react";
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
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, typography, borderRadius } from "~/styles";
import { PrimaryLoadingButton } from "~/components/common/buttons/PrimaryLoadingButton";
import { FormField, ThemedTextInput } from "~/components/common/ui";
import { Ionicons } from "@expo/vector-icons";
import { AdminHeader } from "~/components/admin/AdminHeader";
import {
  useGetGroupQuery,
  useGetUsersQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  type GetGroupQuery,
  type GetUsersQuery,
} from "@mirai-app/graphql-types";

interface OrganizerOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

// GraphQL Client setup with SecureStore
const createGraphQLClient = async (): Promise<GraphQLClient> => {
  const token = await SecureStore.getItemAsync("sb-access-token");
  return new GraphQLClient(
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );
};

export default function AdminEditGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ groupId: string; tripId?: string }>();
  const groupId = params.groupId;
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [client, setClient] = useState<GraphQLClient | null>(null);

  useMemo(() => {
    createGraphQLClient().then(setClient);
  }, []);

  // Query for group data
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ["GetGroup", { id: groupId }],
    enabled: Boolean(groupId) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useGetGroupQuery.fetcher(client, { id: groupId })();
    },
  });

  const group = (groupData as GetGroupQuery | undefined)?.group;

  // Query for users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["GetUsers", { limit: 100, offset: 0 }],
    enabled: Boolean(tripId) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useGetUsersQuery.fetcher(client, { limit: 100, offset: 0 })();
    },
  });

  const users = (usersData as GetUsersQuery | undefined)?.users ?? [];

  const [groupName, setGroupName] = useState(group?.name ?? "");
  const [selectedOrganizer, setSelectedOrganizer] =
    useState<OrganizerOption | null>(group?.organizer ?? null);
  const [userSearch, setUserSearch] = useState("");

  // Update local state when group data loads
  React.useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setSelectedOrganizer(group.organizer);
    }
  }, [group]);

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      organizerId?: string | null;
    }) => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useUpdateGroupMutation.fetcher(client, {
        input: {
          id: input.id,
          name: input.name,
          organizerId: input.organizerId ?? undefined,
        },
      })();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["GetGroupsByTrip"] });
      await queryClient.invalidateQueries({ queryKey: ["GetGroup"] });
      Alert.alert("Success", "Group updated successfully.");
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        `Failed to update group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useDeleteGroupMutation.fetcher(client, { id: input.id })();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["GetGroupsByTrip"] });
      Alert.alert("Success", "Group deleted successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        `Failed to delete group: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });

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
              name: trimmedGroupName,
            })
          : Promise.resolve(),
        selectedOrganizer?.id !== group.organizer?.id
          ? updateGroupMutation.mutateAsync({
              id: groupId,
              organizerId: selectedOrganizer?.id ?? null,
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
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all members from the group.${group._count?.participants && group._count.participants > 0 ? `\n\n${group._count.participants} participants will be affected.` : ""}`,
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

    const fullName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
    const email = user.email?.toLowerCase() ?? "";

    return (
      fullName.includes(normalizedSearch) || email.includes(normalizedSearch)
    );
  });

  const isLoading = groupLoading || usersLoading || !client;
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
              {group._count?.participants ?? 0} participants
            </Text>
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
                    selectedOrganizer?.id === item.id &&
                      styles.userOptionNameSelected,
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

        <View
          style={[
            styles.actions,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
        >
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
