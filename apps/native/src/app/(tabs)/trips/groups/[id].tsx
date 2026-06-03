import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { formatDisplayName, getInitials } from "@mirai-app/shared";
import { borderRadius, colors, spacing, typography } from "../../../../styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { orpc } from "@mirai-app/orpc/client";
import { useTripDetails } from "~/hooks/trips";
import { EditGroupButton } from "~/components/trips/groups/details/EditGroupButton";
import { GroupDetailsHero } from "~/components/trips/groups/details/GroupDetailsHero";
import { GroupDetailsLoadingState } from "~/components/trips/groups/details/GroupDetailsLoadingState";
import { GroupMemberList } from "~/components/trips/groups/details/GroupMemberList";
import { GroupNotFoundState } from "~/components/trips/groups/details/GroupNotFoundState";
import { GroupApprovedChallenges } from "~/components/trips/groups/details/GroupApprovedChallenges";
import { GroupStatsGrid } from "~/components/trips/groups/details/GroupStatsGrid";
import { TransactionHistory } from "~/components/trips/groups/details/TransactionHistory";

export default function GroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : params.id?.[0];
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery(orpc.user.getMy.queryOptions({ input: {} }));

  const { data: group, isLoading: groupLoading } = useQuery({
    ...orpc.group.getById.queryOptions({ input: { id: groupId ?? "" } }),
    enabled: !!groupId,
  });
  const { isTripPast } = useTripDetails(group?.trip?.id);
  const isCurrentUserMemberInViewedGroup = Boolean(
    group?.participants.some((participant) => participant.user.id === currentUser?.id),
  );
  const isCurrentUserOrganizerOfViewedGroup = Boolean(
    currentUser?.id && group?.organizer?.id === currentUser.id,
  );

  const { data: currentUserWithGroup, isLoading: isLoadingCurrentUserGroup } = useQuery({
    ...orpc.user.getMyWithGroup.queryOptions({
      input: { tripId: group?.trip?.id ?? "" },
    }),
    enabled: !!group?.trip?.id,
  });
  const currentUserGroupId = currentUserWithGroup?.trips?.[0]?.group?.id ?? null;
  const hasGroupInCurrentTrip = Boolean(currentUserGroupId);

  const { data: myJoinRequest } = useQuery({
    ...orpc.group.getMyJoinRequestForGroup.queryOptions({
      input: { groupId: groupId ?? "" },
    }),
    enabled: !!groupId && !!group?.trip?.id && !isCurrentUserMemberInViewedGroup,
  });

  const { data: pendingJoinRequests } = useQuery({
    ...orpc.group.getPendingJoinRequests.queryOptions({
      input: { groupId: groupId ?? "" },
    }),
    enabled: !!groupId && isCurrentUserOrganizerOfViewedGroup,
  });

  const { data: transactions } = useQuery({
    ...orpc.coinTransaction.getCoinTransactions.queryOptions({
      input: {
        tripId: group?.trip?.id ?? "",
        groupId: groupId ?? "",
        limit: 20,
      },
    }),
    enabled: !!groupId && !!group?.trip?.id,
  });
  const { data: rankingData } = useQuery({
    ...orpc.group.ranking.queryOptions({ input: { tripId: group?.trip?.id ?? "" } }),
    enabled: !!group?.trip?.id,
  });
  const leaveGroupMutation = useMutation(
    orpc.group.leaveMyGroup.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getById.queryOptions({ input: { id: groupId ?? "" } }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getAll.queryOptions({
            input: { tripId: group?.trip?.id ?? "" },
          }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.group.ranking.queryOptions({
            input: { tripId: group?.trip?.id ?? "" },
          }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.user.getMyWithGroup.queryOptions({
            input: { tripId: group?.trip?.id ?? "" },
          }).queryKey,
        });
      },
    }),
  );
  const requestToJoinMutation = useMutation(
    orpc.group.requestToJoin.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getMyJoinRequestForGroup.queryOptions({
            input: { groupId: groupId ?? "" },
          }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getPendingJoinRequests.queryOptions({
            input: { groupId: groupId ?? "" },
          }).queryKey,
        });
      },
    }),
  );
  const cancelJoinRequestMutation = useMutation(
    orpc.group.cancelMyJoinRequest.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getMyJoinRequestForGroup.queryOptions({
            input: { groupId: groupId ?? "" },
          }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getPendingJoinRequests.queryOptions({
            input: { groupId: groupId ?? "" },
          }).queryKey,
        });
      },
    }),
  );
  const respondToJoinRequestMutation = useMutation(
    orpc.group.respondToJoinRequest.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getById.queryOptions({ input: { id: groupId ?? "" } }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getPendingJoinRequests.queryOptions({
            input: { groupId: groupId ?? "" },
          }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.group.getAll.queryOptions({
            input: { tripId: group?.trip?.id ?? "" },
          }).queryKey,
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.group.ranking.queryOptions({
            input: { tripId: group?.trip?.id ?? "" },
          }).queryKey,
        });
      },
    }),
  );

  const insets = useSafeAreaInsets();

  if (!groupId || groupLoading) {
    return <GroupDetailsLoadingState />;
  }

  if (!group) {
    return <GroupNotFoundState onGoBack={() => router.back()} />;
  }

  const organizerId = group.organizer?.id;
  const isGroupMember = group.participants.some(
    (participant) => participant.user.id === currentUser?.id,
  );
  const isOrganizer = currentUser?.id === organizerId;
  const canManageGroup = isGroupMember && isOrganizer;
  const canRequestToJoin = !isLoadingCurrentUserGroup && !isGroupMember && !hasGroupInCurrentTrip;
  const hasPendingRequestToThisGroup = Boolean(myJoinRequest);
  const sortedParticipants = [...group.participants].sort((a, b) => {
    const aIsLeader = a.user.id === organizerId;
    const bIsLeader = b.user.id === organizerId;

    if (aIsLeader && !bIsLeader) return -1;
    if (!aIsLeader && bIsLeader) return 1;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  const memberList = sortedParticipants.map((p) => ({
    id: p.user.id,
    name: formatDisplayName(p.user.firstName, p.user.lastName) ?? "Unknown User",
    initials: getInitials(p.user.firstName, p.user.lastName),
    role: p.user.id === organizerId ? "Group Leader" : "Member",
    isLeader: p.user.id === organizerId,
    avatarStoragePath: p.user.hasAvatar ? `avatar/${p.user.id}.jpg` : null,
  }));
  const rankingPosition = (() => {
    const index = rankingData?.data.findIndex((rankingGroup) => rankingGroup.id === group.id);
    return typeof index === "number" && index >= 0 ? index + 1 : null;
  })();

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Do you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await leaveGroupMutation.mutateAsync({ groupId: group.id });
              router.replace(`/trips/groups?tripId=${group.trip.id}`);
            } catch {
              Alert.alert("Error", "Failed to leave group");
            }
          })();
        },
      },
    ]);
  };
  const handleRequestToJoin = () => {
    if (!groupId) return;
    void (async () => {
      try {
        await requestToJoinMutation.mutateAsync({ groupId });
        Alert.alert("Success", "Join request sent");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to send join request";
        Alert.alert("Error", message);
      }
    })();
  };

  const handleRespondToJoinRequest = (requestId: string, decision: "ACCEPT" | "REJECT") => {
    void (async () => {
      try {
        await respondToJoinRequestMutation.mutateAsync({ requestId, decision });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update join request";
        Alert.alert("Error", message);
      }
    })();
  };

  const handleCancelJoinRequest = () => {
    if (!groupId) return;
    void (async () => {
      try {
        await cancelJoinRequestMutation.mutateAsync({ groupId });
        Alert.alert("Success", "Join request canceled");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to cancel join request";
        Alert.alert("Error", message);
      }
    })();
  };

  const formatJoinRequestTime = (date: Date | string) => {
    const parsed = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  };

  return (
    <View style={styles.container}>
      {canManageGroup && !isTripPast && (
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
        <GroupDetailsHero name={group.name} imageUrl={group.image} />

        {canRequestToJoin && !hasPendingRequestToThisGroup && !isTripPast ? (
          <TouchableOpacity
            style={styles.joinButton}
            activeOpacity={0.8}
            onPress={handleRequestToJoin}
            disabled={requestToJoinMutation.isPending}
          >
            <Ionicons name="log-in-outline" size={18} color={colors.white} />
            <Text style={styles.joinButtonText}>
              {requestToJoinMutation.isPending ? "Sending..." : "Join Group"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {canRequestToJoin && hasPendingRequestToThisGroup && !isTripPast ? (
          <View style={styles.pendingRequestContainer}>
            <View style={styles.pendingRequestBadge}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.pendingRequestText}>Join request pending approval</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelRequestButton}
              activeOpacity={0.8}
              onPress={handleCancelJoinRequest}
              disabled={cancelJoinRequestMutation.isPending}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.white} />
              <Text style={styles.cancelRequestButtonText}>
                {cancelJoinRequestMutation.isPending ? "Canceling..." : "Cancel request"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isLoadingCurrentUserGroup && !isGroupMember && hasGroupInCurrentTrip ? (
          <View style={styles.groupLockedBadge}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            <Text style={styles.groupLockedText}>
              Leave your current group first to join this one
            </Text>
          </View>
        ) : null}

        {isGroupMember && !isTripPast ? (
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

        {canManageGroup && !isTripPast ? (
          <View style={styles.joinRequestsCard}>
            <Text style={styles.joinRequestsTitle}>Pending join requests</Text>
            {(pendingJoinRequests ?? []).length === 0 ? (
              <Text style={styles.joinRequestsEmpty}>No pending requests</Text>
            ) : (
              pendingJoinRequests?.map((request) => (
                <View key={request.id} style={styles.joinRequestRow}>
                  <View style={styles.joinRequestTop}>
                    <View style={styles.joinRequestAvatar}>
                      <Text style={styles.joinRequestAvatarText}>
                        {getInitials(request.user.firstName, request.user.lastName)}
                      </Text>
                    </View>
                    <Text style={styles.joinRequestDate}>
                      {formatJoinRequestTime(request.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.joinRequestUser}>
                    <Text style={styles.joinRequestName}>
                      {formatDisplayName(request.user.firstName, request.user.lastName) ??
                        "Unknown User"}
                    </Text>
                    <Text style={styles.joinRequestEmail}>{request.user.email ?? "No email"}</Text>
                  </View>
                  <View style={styles.joinRequestActions}>
                    <TouchableOpacity
                      style={[styles.joinRequestButton, styles.joinRequestRejectButton]}
                      onPress={() => handleRespondToJoinRequest(request.id, "REJECT")}
                      disabled={respondToJoinRequestMutation.isPending}
                    >
                      <Ionicons name="close" size={14} color={colors.white} />
                      <Text style={styles.joinRequestButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.joinRequestButton, styles.joinRequestAcceptButton]}
                      onPress={() => handleRespondToJoinRequest(request.id, "ACCEPT")}
                      disabled={respondToJoinRequestMutation.isPending}
                    >
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                      <Text style={styles.joinRequestButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* Stats Grid */}
        <GroupStatsGrid
          membersCount={group._count.participants}
          coins={group.coins}
          rankingPosition={rankingPosition}
        />

        {/* Member Directory */}
        <GroupMemberList members={memberList} />

        {/* Transaction History */}
        <View style={styles.transactionHistorySection}>
          <TransactionHistory transactions={transactions ?? []} />
        </View>

        <GroupApprovedChallenges submissions={group.approvedSubmissions ?? []} />
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
  transactionHistorySection: {
    marginBottom: spacing.xxl,
  },
  editButtonContainer: {
    position: "absolute",
    right: 20,
    bottom: 96,
    zIndex: 20,
  },
  joinButton: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  joinButtonText: {
    color: colors.backgroundDark,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pendingRequestBadge: {
    backgroundColor: colors.primaryOpacity12,
    borderWidth: 1,
    borderColor: colors.primaryOpacity30,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  pendingRequestText: {
    color: colors.primary,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
  pendingRequestContainer: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cancelRequestButton: {
    backgroundColor: colors.dangerOpacity12,
    borderWidth: 1,
    borderColor: colors.dangerOpacity45,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  cancelRequestButtonText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  groupLockedBadge: {
    marginBottom: spacing.lg,
    backgroundColor: colors.whiteOpacity4,
    borderWidth: 1,
    borderColor: colors.whiteOpacity10,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  groupLockedText: {
    color: colors.textMuted,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  leaveButton: {
    marginBottom: spacing.lg,
    backgroundColor: colors.dangerOpacity15,
    borderWidth: 1,
    borderColor: colors.dangerOpacity45,
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
  joinRequestsCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.cardDarkOpacity45,
    borderWidth: 1,
    borderColor: colors.whiteOpacity8,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  joinRequestsTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  joinRequestsEmpty: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  joinRequestRow: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.whiteOpacity6,
    backgroundColor: colors.blackOpacity12,
  },
  joinRequestTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  joinRequestAvatar: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.whiteOpacity12,
    borderWidth: 1,
    borderColor: colors.whiteOpacity18,
    alignItems: "center",
    justifyContent: "center",
  },
  joinRequestAvatarText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.bold,
    textTransform: "uppercase",
  },
  joinRequestDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.medium,
  },
  joinRequestUser: {
    gap: 4,
  },
  joinRequestName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.white,
  },
  joinRequestEmail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  joinRequestActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  joinRequestButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
  },
  joinRequestRejectButton: {
    borderColor: colors.dangerOpacity50,
    backgroundColor: colors.dangerOpacity12,
  },
  joinRequestAcceptButton: {
    borderColor: colors.successOpacity50,
    backgroundColor: colors.successOpacity12,
  },
  joinRequestButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
