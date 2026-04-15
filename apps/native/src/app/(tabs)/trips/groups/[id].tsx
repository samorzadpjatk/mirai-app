import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "../../../../styles";
import { clientLogger } from "@mirai-app/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GetGroupDocument,
  GetCurrentUserDocument,
  GetGroupRankingDocument,
  GetCoinTransactionsDocument,
  GetGroupJoinRequestDocument,
  GetPendingGroupJoinRequestsDocument,
  RequestToJoinGroupDocument,
  CancelGroupJoinRequestDocument,
  RespondToGroupJoinRequestDocument,
  LeaveGroupDocument,
} from "@mirai-app/graphql-client";
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
  const insets = useSafeAreaInsets();
  const client = useClient();

  // GraphQL queries
  const [{ data: currentUser }] = useQuery({
    query: GetCurrentUserDocument,
  });

  const [{ data: groupData, fetching: groupLoading }] = useQuery({
    query: GetGroupDocument,
    variables: { id: groupId ?? "" },
    pause: !groupId,
  });
  const group = groupData?.group;

  const { isTripPast } = useTripDetails(group?.trip?.id);
  const isCurrentUserMemberInViewedGroup = Boolean(
    group?.participants?.some(
      (participant) => participant.user?.id === currentUser?.currentUser?.id,
    ),
  );
  const isCurrentUserOrganizerOfViewedGroup = Boolean(
    currentUser?.currentUser?.id &&
    group?.organizer?.id === currentUser.currentUser.id,
  );

  const [{ data: rankingData }] = useQuery({
    query: GetGroupRankingDocument,
    variables: { tripId: group?.trip?.id ?? "" },
    pause: !group?.trip?.id,
  });

  const [{ data: transactionsData }] = useQuery({
    query: GetCoinTransactionsDocument,
    variables: {
      tripId: group?.trip?.id ?? "",
      groupId: groupId ?? "",
      limit: 20,
    },
    pause: !groupId || !group?.trip?.id,
  });
  const transactions = transactionsData?.coinTransactions?.transactions ?? [];

  const [{ data: myJoinRequest }] = useQuery({
    query: GetGroupJoinRequestDocument,
    variables: { groupId: groupId ?? "" },
    pause: !groupId || !group?.trip?.id || isCurrentUserMemberInViewedGroup,
  });

  const [{ data: pendingJoinRequestsData }] = useQuery({
    query: GetPendingGroupJoinRequestsDocument,
    variables: { groupId: groupId ?? "" },
    pause: !groupId || !isCurrentUserOrganizerOfViewedGroup,
  });
  const pendingJoinRequests =
    pendingJoinRequestsData?.pendingGroupJoinRequests ?? [];

  // GraphQL mutations
  const [, leaveGroup] = useMutation(LeaveGroupDocument);
  const [, requestToJoin] = useMutation(RequestToJoinGroupDocument);
  const [, cancelJoinRequest] = useMutation(CancelGroupJoinRequestDocument);
  const [, respondToJoinRequest] = useMutation(
    RespondToGroupJoinRequestDocument,
  );

  // Loading states for mutations
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

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
  const isGroupMember = group.participants?.some(
    (participant) => participant.user?.id === currentUser?.currentUser?.id,
  );
  const isOrganizer = currentUser?.currentUser?.id === organizerId;
  const canManageGroup = isGroupMember && isOrganizer;

  // Check if user has a group in current trip by looking at ranking data
  const hasGroupInCurrentTrip = Boolean(
    rankingData?.groupRanking?.groups?.some((g) =>
      g.participants?.some((p) => p.user?.id === currentUser?.currentUser?.id),
    ),
  );
  const currentUserGroupId =
    rankingData?.groupRanking?.groups?.find((g) =>
      g.participants?.some((p) => p.user?.id === currentUser?.currentUser?.id),
    )?.id ?? null;

  const canRequestToJoin = !isGroupMember && !hasGroupInCurrentTrip;
  const hasPendingRequestToThisGroup = Boolean(myJoinRequest?.groupJoinRequest);

  const sortedParticipants = [...(group.participants ?? [])].sort((a, b) => {
    const aIsLeader = a.user?.id === organizerId;
    const bIsLeader = b.user?.id === organizerId;

    if (aIsLeader && !bIsLeader) return -1;
    if (!aIsLeader && bIsLeader) return 1;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const memberList = sortedParticipants.map((p) => ({
    id: p.user?.id ?? "",
    name: `${p.user?.firstName ?? ""} ${p.user?.lastName ?? ""}`.trim(),
    initials: getInitials(p.user?.firstName, p.user?.lastName),
    role: p.user?.id === organizerId ? "Group Leader" : "Member",
    isLeader: p.user?.id === organizerId,
    avatarStoragePath: p.user?.hasAvatar ? `avatar/${p.user?.id}.jpg` : null,
  }));

  const rankingPosition = (() => {
    const index = rankingData?.groupRanking?.groups?.findIndex(
      (rankingGroup) => rankingGroup.id === group.id,
    );
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
              setIsLeaving(true);
              const result = await leaveGroup({ groupId: group.id });
              if (result.error) {
                throw result.error;
              }
              // Invalidate related queries
              await client.invalidate("GetGroup");
              await client.invalidate("GetGroupsByTrip");
              await client.invalidate("GetGroupRanking");
              router.replace(`/trips/groups?tripId=${group.trip?.id}`);
            } catch (error) {
              clientLogger.error("Failed to leave group:", error as Error);
              Alert.alert("Error", "Failed to leave group");
            } finally {
              setIsLeaving(false);
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
        setIsRequesting(true);
        const result = await requestToJoin({ groupId });
        if (result.error) {
          throw result.error;
        }
        // Invalidate related queries
        await client.invalidate("GetGroupJoinRequest");
        await client.invalidate("GetPendingGroupJoinRequests");
        Alert.alert("Success", "Join request sent");
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to send join request";
        Alert.alert("Error", message);
      } finally {
        setIsRequesting(false);
      }
    })();
  };

  const handleRespondToJoinRequest = (
    requestId: string,
    decision: "ACCEPT" | "REJECT",
  ) => {
    void (async () => {
      try {
        setIsResponding(true);
        const result = await respondToJoinRequest({ requestId, decision });
        if (result.error) {
          throw result.error;
        }
        // Invalidate related queries
        await client.invalidate("GetGroup");
        await client.invalidate("GetPendingGroupJoinRequests");
        await client.invalidate("GetGroupsByTrip");
        await client.invalidate("GetGroupRanking");
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update join request";
        Alert.alert("Error", message);
      } finally {
        setIsResponding(false);
      }
    })();
  };

  const handleCancelJoinRequest = () => {
    if (!groupId) return;
    void (async () => {
      try {
        setIsCanceling(true);
        const result = await cancelJoinRequest({ groupId });
        if (result.error) {
          throw result.error;
        }
        // Invalidate related queries
        await client.invalidate("GetGroupJoinRequest");
        await client.invalidate("GetPendingGroupJoinRequests");
        Alert.alert("Success", "Join request canceled");
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to cancel join request";
        Alert.alert("Error", message);
      } finally {
        setIsCanceling(false);
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
          <EditGroupButton
            onPress={() => router.push(`/trips/groups/edit/${groupId}`)}
          />
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
            disabled={isRequesting}
          >
            <Ionicons name="log-in-outline" size={18} color={colors.white} />
            <Text style={styles.joinButtonText}>
              {isRequesting ? "Sending..." : "Join Group"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {canRequestToJoin && hasPendingRequestToThisGroup && !isTripPast ? (
          <View style={styles.pendingRequestContainer}>
            <View style={styles.pendingRequestBadge}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.pendingRequestText}>
                Join request pending approval
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cancelRequestButton}
              activeOpacity={0.8}
              onPress={handleCancelJoinRequest}
              disabled={isCanceling}
            >
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={colors.white}
              />
              <Text style={styles.cancelRequestButtonText}>
                {isCanceling ? "Canceling..." : "Cancel request"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isGroupMember && hasGroupInCurrentTrip ? (
          <View style={styles.groupLockedBadge}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={colors.textMuted}
            />
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
            disabled={isLeaving}
          >
            <Ionicons name="exit-outline" size={18} color={colors.white} />
            <Text style={styles.leaveButtonText}>
              {isLeaving ? "Leaving..." : "Leave Group"}
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
                        {`${request.user?.firstName?.[0] ?? ""}${request.user?.lastName?.[0] ?? ""}`.toUpperCase() ||
                          "?"}
                      </Text>
                    </View>
                    <Text style={styles.joinRequestDate}>
                      {formatJoinRequestTime(request.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.joinRequestUser}>
                    <Text style={styles.joinRequestName}>
                      {[request.user?.firstName, request.user?.lastName]
                        .filter(Boolean)
                        .join(" ") || "Unknown user"}
                    </Text>
                    <Text style={styles.joinRequestEmail}>
                      {request.user?.email ?? "No email"}
                    </Text>
                  </View>
                  <View style={styles.joinRequestActions}>
                    <TouchableOpacity
                      style={[
                        styles.joinRequestButton,
                        styles.joinRequestRejectButton,
                      ]}
                      onPress={() =>
                        handleRespondToJoinRequest(request.id, "REJECT")
                      }
                      disabled={isResponding}
                    >
                      <Ionicons name="close" size={14} color={colors.white} />
                      <Text style={styles.joinRequestButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.joinRequestButton,
                        styles.joinRequestAcceptButton,
                      ]}
                      onPress={() =>
                        handleRespondToJoinRequest(request.id, "ACCEPT")
                      }
                      disabled={isResponding}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.white}
                      />
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
          membersCount={group._count?.participants ?? 0}
          coins={group.coins ?? 0}
          rankingPosition={rankingPosition}
        />

        {/* Member Directory */}
        <GroupMemberList members={memberList} />

        {/* Transaction History */}
        <View style={styles.transactionHistorySection}>
          <TransactionHistory transactions={transactions} />
        </View>

        <GroupApprovedChallenges
          submissions={group.approvedSubmissions ?? []}
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
