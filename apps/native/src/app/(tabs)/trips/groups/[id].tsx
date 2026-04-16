import React, { useState } from "react";
import { Alert, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useClient } from "urql";
import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack, Text, View } from "@mirai-app/ui";
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
} from "@mirai-app/frameworks";
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

  // GraphQL queries - using tuple destructuring with reexecute functions
  const [{ data: currentUser }] = useQuery({
    query: GetCurrentUserDocument,
  });

  const [{ data: groupData, fetching: groupLoading }, reexecuteGroup] =
    useQuery({
      query: GetGroupDocument,
      variables: { id: groupId ?? "" },
      pause: !groupId,
    });
  const group = groupData?.group;

  const { isTripPast } = useTripDetails(group?.trip?.id);
  const isCurrentUserMemberInViewedGroup = Boolean(
    group?.participants?.some(
      (participant: { user?: { id?: string } }) =>
        participant.user?.id === currentUser?.currentUser?.id,
    ),
  );
  const isCurrentUserOrganizerOfViewedGroup = Boolean(
    currentUser?.currentUser?.id &&
    group?.organizer?.id === currentUser.currentUser.id,
  );

  const [{ data: rankingData }, reexecuteRanking] = useQuery({
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

  const [{ data: myJoinRequest }, reexecuteMyJoinRequest] = useQuery({
    query: GetGroupJoinRequestDocument,
    variables: { groupId: groupId ?? "" },
    pause: !groupId || !group?.trip?.id || isCurrentUserMemberInViewedGroup,
  });

  const [{ data: pendingJoinRequestsData }, reexecutePendingRequests] =
    useQuery({
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
    (participant: { user?: { id?: string } }) =>
      participant.user?.id === currentUser?.currentUser?.id,
  );
  const isOrganizer = currentUser?.currentUser?.id === organizerId;
  const canManageGroup = isGroupMember && isOrganizer;

  // Check if user has a group in current trip by looking at ranking data
  const hasGroupInCurrentTrip = Boolean(
    rankingData?.groupRanking?.groups?.some(
      (g: { participants?: Array<{ user?: { id?: string } }> }) =>
        g.participants?.some(
          (p: { user?: { id?: string } }) =>
            p.user?.id === currentUser?.currentUser?.id,
        ),
    ),
  );

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
      (rankingGroup: { id?: string }) => rankingGroup.id === group.id,
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
              // Reexecute queries to refresh data
              await Promise.all([
                reexecuteGroup({ requestPolicy: "network-only" }),
                reexecuteRanking({ requestPolicy: "network-only" }),
              ]);
              router.replace(`/trips/groups?tripId=${group.trip?.id}`);
            } catch {
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
        // Reexecute queries to refresh data
        await Promise.all([
          reexecuteMyJoinRequest({ requestPolicy: "network-only" }),
          reexecutePendingRequests({ requestPolicy: "network-only" }),
        ]);
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
        // Reexecute queries to refresh data
        await Promise.all([
          reexecuteGroup({ requestPolicy: "network-only" }),
          reexecuteRanking({ requestPolicy: "network-only" }),
          reexecutePendingRequests({ requestPolicy: "network-only" }),
        ]);
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
        // Reexecute queries to refresh data
        await Promise.all([
          reexecuteMyJoinRequest({ requestPolicy: "network-only" }),
          reexecutePendingRequests({ requestPolicy: "network-only" }),
        ]);
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
    <YStack flex={1} backgroundColor="$backgroundDark">
      {canManageGroup && !isTripPast && (
        <View
          style={{
            position: "absolute",
            right: 20,
            bottom: 96,
            zIndex: 20,
          }}
        >
          <EditGroupButton
            onPress={() => router.push(`/trips/groups/edit/${groupId}`)}
          />
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <GroupDetailsHero name={group.name} imageUrl={group.image} />

        {canRequestToJoin && !hasPendingRequestToThisGroup && !isTripPast ? (
          <TouchableOpacity
            style={{
              marginBottom: 16,
              backgroundColor: "#10b981",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            activeOpacity={0.8}
            onPress={handleRequestToJoin}
            disabled={isRequesting}
          >
            <Ionicons name="log-in-outline" size={18} color="white" />
            <Text
              color="white"
              fontSize={14}
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing={0.8}
            >
              {isRequesting ? "Sending..." : "Join Group"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {canRequestToJoin && hasPendingRequestToThisGroup && !isTripPast ? (
          <YStack marginBottom={16} gap={8}>
            <XStack
              backgroundColor="rgba(16, 185, 129, 0.12)"
              borderWidth={1}
              borderColor="rgba(16, 185, 129, 0.30)"
              borderRadius={12}
              paddingVertical={12}
              paddingHorizontal={16}
              alignItems="center"
              justifyContent="center"
              gap={8}
            >
              <Ionicons name="time-outline" size={16} color="#10b981" />
              <Text color="#10b981" fontSize={14} fontWeight="600">
                Join request pending approval
              </Text>
            </XStack>
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.45)",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              activeOpacity={0.8}
              onPress={handleCancelJoinRequest}
              disabled={isCanceling}
            >
              <Ionicons name="close-circle-outline" size={16} color="white" />
              <Text
                color="white"
                fontSize={14}
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing={0.8}
              >
                {isCanceling ? "Canceling..." : "Cancel request"}
              </Text>
            </TouchableOpacity>
          </YStack>
        ) : null}

        {!isGroupMember && hasGroupInCurrentTrip ? (
          <XStack
            marginBottom={16}
            backgroundColor="rgba(255, 255, 255, 0.04)"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius={12}
            paddingVertical={12}
            paddingHorizontal={16}
            alignItems="center"
            justifyContent="center"
            gap={8}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" />
            <Text color="#9ca3af" fontSize={14} fontWeight="500">
              Leave your current group first to join this one
            </Text>
          </XStack>
        ) : null}

        {isGroupMember && !isTripPast ? (
          <TouchableOpacity
            style={{
              marginBottom: 16,
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(239, 68, 68, 0.45)",
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            activeOpacity={0.8}
            onPress={handleLeaveGroup}
            disabled={isLeaving}
          >
            <Ionicons name="exit-outline" size={18} color="white" />
            <Text
              color="white"
              fontSize={14}
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing={0.8}
            >
              {isLeaving ? "Leaving..." : "Leave Group"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {canManageGroup && !isTripPast ? (
          <YStack
            marginBottom={16}
            backgroundColor="rgba(30, 30, 30, 0.45)"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.08)"
            borderRadius={16}
            padding={16}
            gap={12}
          >
            <Text
              fontSize={14}
              fontWeight="700"
              color="#9ca3af"
              textTransform="uppercase"
              letterSpacing={1.1}
            >
              Pending join requests
            </Text>
            {(pendingJoinRequests ?? []).length === 0 ? (
              <Text fontSize={14} color="#9ca3af">
                No pending requests
              </Text>
            ) : (
              pendingJoinRequests?.map(
                (request: {
                  id: string;
                  createdAt: string;
                  user?: {
                    firstName?: string | null;
                    lastName?: string | null;
                    email?: string | null;
                  };
                }) => (
                  <YStack
                    key={request.id}
                    gap={12}
                    padding={12}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="rgba(255, 255, 255, 0.06)"
                    backgroundColor="rgba(0, 0, 0, 0.12)"
                  >
                    <XStack alignItems="center" justifyContent="space-between">
                      <YStack
                        width={34}
                        height={34}
                        borderRadius={999}
                        backgroundColor="rgba(255, 255, 255, 0.12)"
                        borderWidth={1}
                        borderColor="rgba(255, 255, 255, 0.18)"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text
                          color="white"
                          fontSize={12}
                          fontWeight="700"
                          textTransform="uppercase"
                        >
                          {`${request.user?.firstName?.[0] ?? ""}${request.user?.lastName?.[0] ?? ""}`.toUpperCase() ||
                            "?"}
                        </Text>
                      </YStack>
                      <Text color="#9ca3af" fontSize={11} fontWeight="500">
                        {formatJoinRequestTime(request.createdAt)}
                      </Text>
                    </XStack>
                    <YStack gap={4}>
                      <Text fontSize={16} fontWeight="600" color="white">
                        {[request.user?.firstName, request.user?.lastName]
                          .filter(Boolean)
                          .join(" ") || "Unknown user"}
                      </Text>
                      <Text fontSize={12} color="#9ca3af">
                        {request.user?.email ?? "No email"}
                      </Text>
                    </YStack>
                    <XStack gap={8}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          borderRadius: 8,
                          paddingVertical: 8,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          flexDirection: "row",
                          gap: 6,
                          borderColor: "rgba(239, 68, 68, 0.5)",
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                        }}
                        onPress={() =>
                          handleRespondToJoinRequest(request.id, "REJECT")
                        }
                        disabled={isResponding}
                      >
                        <Ionicons name="close" size={14} color="white" />
                        <Text
                          color="white"
                          fontSize={12}
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing={0.6}
                        >
                          Reject
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          borderRadius: 8,
                          paddingVertical: 8,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          flexDirection: "row",
                          gap: 6,
                          borderColor: "rgba(34, 197, 94, 0.5)",
                          backgroundColor: "rgba(34, 197, 94, 0.12)",
                        }}
                        onPress={() =>
                          handleRespondToJoinRequest(request.id, "ACCEPT")
                        }
                        disabled={isResponding}
                      >
                        <Ionicons name="checkmark" size={14} color="white" />
                        <Text
                          color="white"
                          fontSize={12}
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing={0.6}
                        >
                          Accept
                        </Text>
                      </TouchableOpacity>
                    </XStack>
                  </YStack>
                ),
              )
            )}
          </YStack>
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
        <YStack marginBottom={24}>
          <TransactionHistory transactions={transactions} />
        </YStack>

        <GroupApprovedChallenges
          submissions={group.approvedSubmissions ?? []}
        />
      </ScrollView>
    </YStack>
  );
}
