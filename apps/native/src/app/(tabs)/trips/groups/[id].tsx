import React from "react";
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/SafeAreaInsetsContext";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { EditGroupButton } from "~/components/trips/groups/details/EditGroupButton";
import { GroupDetailsHero } from "~/components/trips/groups/details/GroupDetailsHero";
import { GroupDetailsLoadingState } from "~/components/trips/groups/details/GroupDetailsLoadingState";
import { GroupMemberList } from "~/components/trips/groups/details/GroupMemberList";
import { GroupNotFoundState } from "~/components/trips/groups/details/GroupNotFoundState";
import { GroupStatsGrid } from "~/components/trips/groups/details/GroupStatsGrid";
import { TransactionHistory } from "~/components/trips/groups/details/TransactionHistory";

export default function GroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : params.id?.[0];
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const { data: group, isLoading: groupLoading } = useQuery({
    ...trpc.group.getById.queryOptions({ id: groupId ?? "" }),
    enabled: !!groupId,
  });

  const { data: transactions } = useQuery({
    ...trpc.coinTransaction.getCoinTransactions.queryOptions({
      tripId: group?.trip?.id ?? "",
      groupId: groupId ?? "",
      limit: 20,
    }),
    enabled: !!groupId && !!group?.trip?.id,
  });
  const { data: rankingData } = useQuery({
    ...trpc.group.ranking.queryOptions({ tripId: group?.trip?.id ?? "" }),
    enabled: !!group?.trip?.id,
  });
  const leaveGroupMutation = useMutation(
    trpc.group.leaveMyGroup.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.group.getById.queryOptions({ id: groupId ?? "" }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.group.getAll.queryOptions({ tripId: group?.trip?.id ?? "" }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.group.ranking.queryOptions({ tripId: group?.trip?.id ?? "" }).queryKey,
        });
      },
    }),
  );

  const insets = useAppSafeAreaInsets();

  if (!groupId || groupLoading) {
    return <GroupDetailsLoadingState />;
  }

  if (!group) {
    return <GroupNotFoundState onGoBack={() => router.back()} />;
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = (firstName ?? "")[0] ?? "";
    const l = (lastName ?? "")[0] ?? "";
    const initials = `${f}${l}`.toUpperCase();
    return initials || "?";
  };

  const organizerId = group.organizer?.id;
  const isGroupMember = group.participants.some(
    (participant) => participant.user.id === currentUser?.id,
  );
  const isOrganizer = currentUser?.id === organizerId;
  const canManageGroup = isGroupMember && isOrganizer;
  const sortedParticipants = [...group.participants].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const memberList = sortedParticipants.map((p) => ({
    id: p.user.id,
    name: `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim(),
    initials: getInitials(p.user.firstName, p.user.lastName),
    role: p.user.id === organizerId ? "Group Leader" : "Member",
    isLeader: p.user.id === organizerId,
  }));
  const rankingPosition = (() => {
    const index = rankingData?.data.findIndex((rankingGroup) => rankingGroup.id === group.id);
    return typeof index === "number" && index >= 0 ? index + 1 : null;
  })();

  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Do you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await leaveGroupMutation.mutateAsync({ groupId: group.id });
                router.replace(`/trips/groups?tripId=${group.trip.id}`);
              } catch (error) {
                console.error("Failed to leave group:", error);
                Alert.alert("Error", "Failed to leave group");
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {canManageGroup && (
        <View style={styles.editButtonContainer}>
          <EditGroupButton onPress={() => router.push(`/trips/groups/edit/${groupId}`)} />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <GroupDetailsHero
          name={group.name}
          imageUrl={group.image}
        />

        {canManageGroup ? (
          <TouchableOpacity
            style={styles.leaveButton}
            activeOpacity={0.8}
            onPress={handleLeaveGroup}
            disabled={leaveGroupMutation.isPending}
          >
            <Ionicons name="exit-outline" size={18} color={colors.white} />
            <Text style={styles.leaveButtonText}>
              {leaveGroupMutation.isPending ? "Leaving..." : "Leave Group"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Stats Grid */}
        <GroupStatsGrid
          membersCount={group._count.participants}
          points={group.coins}
          rankingPosition={rankingPosition}
        />

        {/* Member Directory */}
        <GroupMemberList members={memberList} />

        {/* Transaction History */}
        <TransactionHistory transactions={transactions ?? []} />
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  editButtonContainer: {
    position: "absolute",
    right: 20,
    bottom: 96,
    zIndex: 20,
  },
  leaveButton: {
    marginBottom: spacing.lg,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.45)",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  leaveButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
