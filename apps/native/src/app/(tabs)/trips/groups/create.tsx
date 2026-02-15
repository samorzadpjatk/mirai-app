import { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useCreateGroup } from "~/hooks/groups";
import { colors, spacing, typography } from "../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { CreateGroupButton } from "~/components/trips/groups/create/CreateGroupButton";
import { GroupCreateNoTripState } from "~/components/trips/groups/create/GroupCreateNoTripState";
import { GroupFormFields } from "~/components/trips/groups/create/GroupFormFields";
import { MembersPicker } from "~/components/trips/groups/create/MembersPicker";
import { MembersSearchBar } from "~/components/trips/groups/create/MembersSearchBar";

export default function CreateGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(),
  );

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? "" }),
    enabled: !!tripId,
  });

  const { createGroup, isCreating } = useCreateGroup(tripId);

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Validation Error", "Please enter a group name");
      return;
    }
    if (!groupCode.trim()) {
      Alert.alert("Validation Error", "Please enter a group code");
      return;
    }

    try {
      const newGroup = await createGroup({
        name: groupName,
        code: groupCode,
        selectedMembers: Array.from(selectedMembers),
      });
      Alert.alert("Success", "Group created successfully!");
      router.push(`/trips/groups/${newGroup.id}`);
    } catch (err: unknown) {
      console.error("Create group error:", err);
      if (err instanceof Error) {
        Alert.alert("Error", err.message);
      } else {
        Alert.alert("Error", "Failed to create group");
      }
    }
  };

  const filteredParticipants = useMemo(() => {
    const participants = trip?.participants ?? [];
    return participants.filter((participant) => {
      if (participant.user.id === currentUser?.id) return false;
      const fullName =
        `${participant.user.firstName} ${participant.user.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [trip?.participants, currentUser?.id, searchQuery]);

  if (!tripId) {
    return <GroupCreateNoTripState onGoBack={() => router.back()} />;
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
        <GroupFormFields
          groupName={groupName}
          groupCode={groupCode}
          onChangeName={setGroupName}
          onChangeCode={setGroupCode}
        />

        {/* Add Members Section */}
        <View style={styles.memberSection}>
          <Text style={styles.inputLabel}>Add Members</Text>

          {/* Search */}
          <MembersSearchBar value={searchQuery} onChangeText={setSearchQuery} />

          {/* Members List */}
          <MembersPicker
            participants={filteredParticipants}
            selectedMembers={selectedMembers}
            isLoading={tripLoading}
            onToggleMember={toggleMember}
          />
        </View>
        {/* Create Button at bottom of scroll */}
        <CreateGroupButton
          isSubmitting={isCreating}
          onPress={handleCreateGroup}
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
    paddingBottom: spacing.xxxl,
  },
  memberSection: {
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
});
