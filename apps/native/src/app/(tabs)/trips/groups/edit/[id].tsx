import { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useGroupEditor } from "~/hooks/groups";
import { colors, spacing, typography } from "../../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { EditGroupFormFields } from "~/components/trips/groups/edit/EditGroupFormFields";
import { EditMembersSearchBar } from "~/components/trips/groups/edit/EditMembersSearchBar";
import { EditMembersPicker } from "~/components/trips/groups/edit/EditMembersPicker";
import { GroupEditLoadingState } from "~/components/trips/groups/edit/GroupEditLoadingState";
import { GroupEditNoTripState } from "~/components/trips/groups/edit/GroupEditNoTripState";
import { GroupEditNotFoundState } from "~/components/trips/groups/edit/GroupEditNotFoundState";
import { GroupEditPermissionState } from "~/components/trips/groups/edit/GroupEditPermissionState";
import { SaveGroupButton } from "~/components/trips/groups/edit/SaveGroupButton";

export default function EditGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : params.id?.[0];
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const { group, isLoading: groupLoading } = useGroupEditor(groupId);

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: group?.trip?.id ?? "" }),
    enabled: !!group?.trip?.id,
  });

  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMembers, setCurrentMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!group) return;
    // Defer state updates to avoid calling setState synchronously within the effect
    // which can cause cascading renders and trigger the lint rule
    const id = setTimeout(() => {
      setGroupName(group.name);
      setGroupCode(group.code);
      setCurrentMembers(new Set(group.participants.map((p) => p.user.id)));
    }, 0);
    return () => clearTimeout(id);
  }, [group]);

  const { updateGroup, assignUser, removeUser, isUpdating } =
    useGroupEditor(groupId);

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert("Validation Error", "Please enter a group name");
      return;
    }
    if (!groupCode.trim()) {
      Alert.alert("Validation Error", "Please enter a group code");
      return;
    }

    try {
      // Update group name and code
      await updateGroup({
        id: groupId ?? "",
        name: groupName,
        code: groupCode,
      });

      // Handle member changes
      const originalMembers = new Set(
        group?.participants?.map((p) => p.user.id) ?? [],
      );
      const membersToAdd = Array.from(currentMembers).filter(
        (id) => !originalMembers.has(id),
      );
      const membersToRemove = Array.from(originalMembers).filter(
        (id) => !currentMembers.has(id),
      );

      // Add new members
      for (const userId of membersToAdd) {
        await assignUser(userId, group?.trip?.id ?? "");
      }

      // Remove members
      for (const userId of membersToRemove) {
        await removeUser(userId);
      }

      router.back();
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const toggleMember = (userId: string) => {
    const newMembers = new Set(currentMembers);
    if (newMembers.has(userId)) {
      // Don't allow removing the organizer
      if (userId === group?.organizer?.id) {
        Alert.alert("Error", "Cannot remove group organizer");
        return;
      }
      newMembers.delete(userId);
    } else {
      newMembers.add(userId);
    }
    setCurrentMembers(newMembers);
  };

  const availableParticipants = useMemo(() => {
    const participants = trip?.participants ?? [];
    return participants.filter((participant) => {
      const fullName =
        `${participant.user.firstName} ${participant.user.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [trip?.participants, searchQuery]);

  // Check if current user is the organizer
  const isOrganizer = currentUser?.id === group?.organizer?.id;

  if (!groupId) {
    return <GroupEditNoTripState onGoBack={() => router.back()} />;
  }

  if (groupLoading) {
    return <GroupEditLoadingState />;
  }

  if (!group) {
    return <GroupEditNotFoundState onGoBack={() => router.back()} />;
  }

  if (!isOrganizer) {
    return (
      <GroupEditPermissionState
        message="Only group organizer can edit"
        onGoBack={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <EditGroupFormFields
          groupName={groupName}
          groupCode={groupCode}
          onChangeName={setGroupName}
          onChangeCode={setGroupCode}
        />

        {/* Manage Members Section */}
        <View style={styles.memberSection}>
          <Text style={styles.inputLabel}>Manage Members</Text>

          {/* Search */}
          <EditMembersSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Members List */}
          <EditMembersPicker
            participants={availableParticipants ?? []}
            selectedMembers={currentMembers}
            isLoading={tripLoading}
            organizerId={group.organizer?.id}
            onToggleMember={toggleMember}
          />
        </View>

        {/* Save Button */}
        <SaveGroupButton
          isSubmitting={isUpdating}
          onPress={() => void handleSave()}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
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
  memberSection: {
    marginBottom: spacing.xl,
  },
});
