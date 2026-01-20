import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useAuth } from "@integral-2025-app/auth/client";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../../../../../styles";

export default function EditGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const { data: group, isLoading: groupLoading } = useQuery({
    ...trpc.group.getById.queryOptions({ id: groupId ?? '' }),
    enabled: !!groupId,
  });

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: group?.trip?.id ?? '' }),
    enabled: !!group?.trip?.id,
  });

  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMembers, setCurrentMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setGroupCode(group.code);
      setCurrentMembers(new Set(group.participants.map(p => p.user.id)));
    }
  }, [group]);

  const updateGroupMutation = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess: () => {
        Alert.alert('Success', 'Group updated successfully!');
      },
      onError: (error: any) => {
        console.error('Update group error:', error);
        Alert.alert('Error', error?.message ?? 'Failed to update group');
      },
    })
  );

  const assignMemberMutation = useMutation(
    trpc.group.assignUserToGroup.mutationOptions()
  );

  const removeMemberMutation = useMutation(
    trpc.group.removeUserFromGroup.mutationOptions()
  );

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name');
      return;
    }
    if (!groupCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a group code');
      return;
    }

    try {
      // Update group name and code
      await updateGroupMutation.mutateAsync({
        id: groupId ?? '',
        tripId: group?.trip?.id ?? '',
        name: groupName,
      });

      // Handle member changes
      const originalMembers = new Set(group?.participants?.map(p => p.user.id) ?? []);
      const membersToAdd = Array.from(currentMembers).filter(id => !originalMembers.has(id));
      const membersToRemove = Array.from(originalMembers).filter(id => !currentMembers.has(id));

      // Add new members
      for (const userId of membersToAdd) {
        await assignMemberMutation.mutateAsync({
          userId,
          tripId: group?.trip?.id ?? '',
          groupId: groupId ?? '',
        });
      }

      // Remove members
      for (const userId of membersToRemove) {
        await removeMemberMutation.mutateAsync({
          userId,
          tripId: group?.trip?.id ?? '',
        });
      }

      // Invalidate queries
      await queryClient.invalidateQueries({
        queryKey: [['group', 'getById']],
      });
      await queryClient.invalidateQueries({
        queryKey: [['group', 'getAll']],
      });

      router.back();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const toggleMember = (userId: string) => {
    const newMembers = new Set(currentMembers);
    if (newMembers.has(userId)) {
      // Don't allow removing the organizer
      if (userId === group?.organizer?.id) {
        Alert.alert('Error', 'Cannot remove group organizer');
        return;
      }
      newMembers.delete(userId);
    } else {
      newMembers.add(userId);
    }
    setCurrentMembers(newMembers);
  };

  const availableParticipants = trip?.participants.filter((p) => {
    const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Check if current user is the organizer
  const isOrganizer = currentUser?.id === group?.organizer?.id;

  if (!groupId || groupLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isOrganizer) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Only group organizer can edit</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Name Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Group Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            placeholderTextColor="rgba(148, 163, 184, 0.4)"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        {/* Group Code Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Group Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter group code"
            placeholderTextColor="rgba(148, 163, 184, 0.4)"
            value={groupCode}
            onChangeText={setGroupCode}
          />
        </View>

        {/* Manage Members Section */}
        <View style={styles.memberSection}>
          <Text style={styles.inputLabel}>Manage Members</Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name"
              placeholderTextColor="rgba(148, 163, 184, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Members List */}
          {tripLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.memberListContainer}>
              <ScrollView
                style={styles.memberListScroll}
                showsVerticalScrollIndicator={false}
              >
                {availableParticipants && availableParticipants.length > 0 ? (
                  availableParticipants.map((participant) => {
                    const isSelected = currentMembers.has(participant.user.id);
                    const isOrganizerUser = participant.user.id === group.organizer?.id;
                    const initials = `${participant.user.firstName.charAt(0)}${participant.user.lastName.charAt(0)}`.toUpperCase();

                    return (
                      <TouchableOpacity
                        key={participant.user.id}
                        style={styles.memberItem}
                        onPress={() => toggleMember(participant.user.id)}
                        activeOpacity={0.7}
                        disabled={isOrganizerUser}
                      >
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{initials}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {participant.user.firstName} {participant.user.lastName}
                          </Text>
                          <Text style={styles.memberEmail}>
                            {participant.user.email}
                            {isOrganizerUser && ' (Organizer)'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                            isOrganizerUser && styles.checkboxDisabled,
                          ]}
                        >
                          {isSelected && <View style={styles.checkboxInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No participants found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, shadows.primaryGlow]}
          onPress={() => void handleSave()}
          disabled={updateGroupMutation.isPending}
          activeOpacity={0.9}
        >
          {updateGroupMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.backgroundDark} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: typography.lg,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    color: colors.white,
    fontSize: typography.base,
  },
  memberSection: {
    marginBottom: spacing.xl,
  },
  searchContainer: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  searchIconContainer: {
    position: "absolute",
    left: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingLeft: 48,
    paddingRight: spacing.lg,
    color: colors.white,
    fontSize: typography.sm,
  },
  memberListContainer: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  memberListScroll: {
    maxHeight: 340,
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textMuted,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.white,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(48, 54, 61, 1)",
    backgroundColor: colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: colors.backgroundDark,
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: typography.base,
    color: colors.textMuted,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
});
