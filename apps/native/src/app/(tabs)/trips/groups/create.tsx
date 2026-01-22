import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../../../../styles";
import { useAppSafeAreaInsets } from '~/contexts/safeArea';
import { useAuth } from "@integral-2025-app/auth/client";

export default function CreateGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const insets = useAppSafeAreaInsets();

  const { data: currentUser } = useQuery(
    trpc.user.getMy.queryOptions()
  );

  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? '' }),
    enabled: !!tripId,
  });

  const assignMemberMutation = useMutation(
    trpc.group.assignUserToGroup.mutationOptions()
  );

  const createGroupMutation = useMutation(
    trpc.group.create.mutationOptions({
      onSuccess: async (newGroup) => {
        console.log('Group created:', newGroup);

        // Assign selected members to the group
        if (selectedMembers.size > 0) {
          console.log('Assigning members:', Array.from(selectedMembers));
          try {
            for (const userId of Array.from(selectedMembers)) {
              console.log(`Assigning user ${userId} to group ${newGroup.id}`);
              await assignMemberMutation.mutateAsync({
                userId,
                tripId: tripId ?? '',
                groupId: newGroup.id,
              });
              console.log(`Successfully assigned user ${userId}`);
            }
            console.log('All members assigned successfully');
          } catch (error) {
            console.error('Error assigning members:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
          }
        }

        // Invalidate queries
        await queryClient.invalidateQueries({
          queryKey: [['group', 'getAll']],
        });

        Alert.alert('Success', 'Group created successfully!');
        router.push(`/trips/groups/${newGroup.id}`);
      },
      onError: (error) => {
        console.error('Create group error:', error);
        Alert.alert('Error', error?.message ?? 'Failed to create group');
      },
    })
  );

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreateGroup = () => {
    console.log('handleCreateGroup called', { groupName, groupCode, tripId });

    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name');
      return;
    }
    if (!groupCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a group code');
      return;
    }

    console.log('Starting mutation...');
    createGroupMutation.mutate({
      tripId: tripId ?? '',
      name: groupName,
      code: groupCode,
    });
  };

  const filteredParticipants = trip?.participants.filter((p) => {
    // Don't show current user in the list
    if (p.user.id === currentUser?.id) return false;

    const fullName = `${p.user.firstName} ${p.user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (!tripId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No trip selected</Text>
        <TouchableOpacity onPress={() => router.back()} >
          <Text >Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxxl }]}
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

        {/* Add Members Section */}
        <View style={styles.memberSection}>
          <Text style={styles.inputLabel}>Add Members</Text>

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
                {filteredParticipants && filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => {
                    const isSelected = selectedMembers.has(participant.user.id);
                    const initials = `${participant.user.firstName.charAt(0)}${participant.user.lastName.charAt(0)}`.toUpperCase();

                    return (
                      <TouchableOpacity
                        key={participant.user.id}
                        style={styles.memberItem}
                        onPress={() => toggleMember(participant.user.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{initials}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {participant.user.firstName} {participant.user.lastName}
                          </Text>
                          <Text style={styles.memberEmail}>{participant.user.email}</Text>
                        </View>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
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
        {/* Create Button at bottom of scroll */}
        <TouchableOpacity
          style={[styles.createButton, shadows.primaryGlow]}
          onPress={handleCreateGroup}
          disabled={createGroupMutation.isPending}
          activeOpacity={0.9}
        >
          {createGroupMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.backgroundDark} />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
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
    paddingBottom: spacing.xxxl,
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
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
});
