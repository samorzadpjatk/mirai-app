import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";

interface ChallengeItem {
  id: string;
  title: string;
  basePoints: number;
  status: string;
  tripId: string;
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  participantGroupsCount: number;
  pendingSubmissionsCount: number;
}

const statusFilters = [
  { label: "All", value: "ALL" },
  { label: "Locked", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
  { label: "Active", value: "ACTIVE" },
  { label: "Voting", value: "VOTING_PHASE" },
  { label: "Completed", value: "COMPLETED" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

const typeFilters = [
  { value: "ALL", icon: "grid-outline" },
  { value: "IMAGE", icon: "image-outline" },
  { value: "VIDEO", icon: "videocam-outline" },
  { value: "TEXT", icon: "document-text-outline" },
  {
    value: "IMAGE_LOCATION",
    icon: "camera-outline",
    secondaryIcon: "location-outline",
  },
  { value: "LOCATION", icon: "location-outline" },
  { value: "QR_CODE", icon: "qr-code-outline" },
] as const;

type TypeFilter = (typeof typeFilters)[number]["value"];
type ChallengeTypeFilter = Exclude<TypeFilter, "ALL">;

const statusColors: Record<string, string> = {
  HIDDEN: "#64748b",
  VISIBLE: "#0ea5e9",
  ACTIVE: "#22c55e",
  VOTING_PHASE: "#f59e0b",
  COMPLETED: "#10b981",
};

const getSubmissionTypeMeta = (
  submissionType: ChallengeItem["submissionType"],
) => {
  switch (submissionType) {
    case "MULTI_IMAGE":
      return { label: "Multi", icon: "images-outline" as const };
    case "VIDEO":
      return { label: "Video", icon: "videocam-outline" as const };
    case "TEXT":
      return { label: "Text", icon: "document-text-outline" as const };
    case "IMAGE_LOCATION":
      return {
        label: "Photo+GPS",
        icon: "camera-outline" as const,
        secondaryIcon: "location-outline" as const,
      };
    case "LOCATION":
      return { label: "GPS", icon: "location-outline" as const };
    case "QR_CODE":
      return { label: "QR", icon: "qr-code-outline" as const };
    case "IMAGE":
    default:
      return { label: "Photo", icon: "image-outline" as const };
  }
};

const getScoringMeta = (scoringCategory: ChallengeItem["scoringCategory"]) => {
  switch (scoringCategory) {
    case "SPEED":
      return { label: "Speed", icon: "flash-outline" as const };
    case "UNLIMITED":
      return { label: "Unlimited", icon: "infinite-outline" as const };
    case "PEER_VOTING":
      return { label: "Voting", icon: "people-outline" as const };
    case "JUDGED_STAFF":
    default:
      return { label: "Staff", icon: "shield-checkmark-outline" as const };
  }
};

export default function AdminChallengesScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");

  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] =
    useState<TypeFilter>("ALL");
  const [nameFilter, setNameFilter] = useState("");

  const challengeQueryOptions = trpc.challenge.getAllByTrip.queryOptions({
    tripId,
  });
  const {
    data: challengesData,
    isLoading,
    isRefetching,
    refetch: refetchChallenges,
  } = useQuery({
    ...challengeQueryOptions,
    enabled: !!tripId,
  });

  const handleRefresh = useCallback(() => {
    if (!tripId) return;
    void refetchChallenges();
  }, [refetchChallenges, tripId]);

  const deleteChallengeMutation = useMutation(
    trpc.challenge.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: challengeQueryOptions.queryKey,
        });
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to delete challenge: ${error.message}`);
      },
    }),
  );

  const challenges: ChallengeItem[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((challenge) => ({
      id: challenge.id,
      title: challenge.name,
      basePoints: challenge.basePoints ?? 0,
      status: challenge.status ?? "HIDDEN",
      tripId: challenge.tripId,
      submissionType: challenge.submissionType ?? "IMAGE",
      scoringCategory: challenge.scoringCategory ?? "JUDGED_STAFF",
      participantGroupsCount: challenge.participantGroupsCount ?? 0,
      pendingSubmissionsCount: challenge.pendingSubmissionsCount ?? 0,
    }));
  }, [challengesData]);

  const handleAddChallenge = () => {
    if (!tripId) {
      Alert.alert("Error", "No trip found to attach this challenge");
      return;
    }
    router.push({
      pathname: "/admin/challenges/new",
      params: { tripId },
    });
  };

  const handleDeleteChallenge = (id: string) => {
    Alert.alert(
      "Delete Challenge",
      "Are you sure you want to delete this challenge?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteChallengeMutation.mutate({ id, tripId });
          },
        },
      ],
    );
  };

  const totalChallenges = challenges.length;
  const typeCounts = useMemo(() => {
    const counts: Record<ChallengeTypeFilter, number> = {
      IMAGE: 0,
      VIDEO: 0,
      TEXT: 0,
      IMAGE_LOCATION: 0,
      LOCATION: 0,
      QR_CODE: 0,
    };

    for (const challenge of challenges) {
      if (challenge.submissionType === "MULTI_IMAGE") {
        counts.IMAGE += 1;
        continue;
      }
      if (challenge.submissionType in counts) {
        counts[challenge.submissionType as ChallengeTypeFilter] += 1;
      }
    }

    return counts;
  }, [challenges]);

  const statusCounts = useMemo(
    () => ({
      HIDDEN: challenges.filter((challenge) => challenge.status === "HIDDEN")
        .length,
      VISIBLE: challenges.filter((challenge) => challenge.status === "VISIBLE")
        .length,
      ACTIVE: challenges.filter((challenge) => challenge.status === "ACTIVE")
        .length,
      VOTING_PHASE: challenges.filter(
        (challenge) => challenge.status === "VOTING_PHASE",
      ).length,
      COMPLETED: challenges.filter(
        (challenge) => challenge.status === "COMPLETED",
      ).length,
    }),
    [challenges],
  );

  const filteredChallenges = useMemo(() => {
    const normalizedQuery = nameFilter.trim().toLowerCase();
    let list = challenges;

    if (selectedStatusFilter === "ALL") {
      list = list.filter(
        (challenge) =>
          challenge.status === "ACTIVE" || challenge.status === "COMPLETED",
      );
    } else {
      list = list.filter(
        (challenge) => challenge.status === selectedStatusFilter,
      );
    }

    if (selectedTypeFilter !== "ALL") {
      if (selectedTypeFilter === "IMAGE") {
        list = list.filter(
          (challenge) =>
            challenge.submissionType === "IMAGE" ||
            challenge.submissionType === "MULTI_IMAGE",
        );
      } else {
        list = list.filter(
          (challenge) => challenge.submissionType === selectedTypeFilter,
        );
      }
    }

    if (normalizedQuery.length > 0) {
      list = list.filter((challenge) =>
        challenge.title.toLowerCase().includes(normalizedQuery),
      );
    }

    const statusPriority: Record<string, number> = {
      ACTIVE: 0,
      COMPLETED: 1,
    };

    return [...list].sort((a, b) => {
      const pendingDiff = b.pendingSubmissionsCount - a.pendingSubmissionsCount;
      if (pendingDiff !== 0) return pendingDiff;

      const statusDiff =
        (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      return a.title.localeCompare(b.title);
    });
  }, [challenges, selectedStatusFilter, selectedTypeFilter, nameFilter]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.backgroundDark,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.backgroundDark}
      />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: spacing.md }}
        contentContainerStyle={{ paddingTop: spacing.xl, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.primary,
              backgroundColor: "rgba(0,206,209,0.12)",
            }}
          >
            <Text
              style={{
                color: "#9ca3af",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Total
            </Text>
            <Text
              style={{ color: colors.primary, fontWeight: "800", fontSize: 16 }}
            >
              {totalChallenges}
            </Text>
          </View>

          {statusFilters
            .filter((filter) => filter.value !== "ALL")
            .map((filter) => {
              const color = statusColors[filter.value] ?? "#9ca3af";
              return (
                <View
                  key={`stat-${filter.value}`}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: color,
                    backgroundColor: `${color}1A`,
                  }}
                >
                  <Text
                    style={{
                      color: "#9ca3af",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {filter.label}
                  </Text>
                  <Text style={{ color, fontWeight: "800", fontSize: 16 }}>
                    {statusCounts[filter.value] ?? 0}
                  </Text>
                </View>
              );
            })}
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              fontSize: typography.lg,
              fontWeight: typography.bold,
              color: colors.white,
              letterSpacing: -0.5,
              marginBottom: spacing.xs,
            }}
          >
            Existing Challenges
          </Text>
          <Text
            style={{
              color: "#9ca3af",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            {filteredChallenges.length}/{totalChallenges}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 8, paddingRight: 16 }}
        >
          {typeFilters.map((filter) => {
            const selected = selectedTypeFilter === filter.value;
            const count =
              filter.value === "ALL"
                ? totalChallenges
                : typeCounts[filter.value];

            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedTypeFilter(filter.value)}
                style={{
                  minHeight: 34,
                  paddingHorizontal: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected
                    ? colors.primary
                    : "rgba(255,255,255,0.15)",
                  backgroundColor: selected
                    ? "rgba(0,206,209,0.2)"
                    : "rgba(255,255,255,0.04)",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={selected ? colors.primary : "#9ca3af"}
                />
                {"secondaryIcon" in filter && filter.secondaryIcon ? (
                  <Ionicons
                    name={filter.secondaryIcon}
                    size={14}
                    color={selected ? colors.primary : "#9ca3af"}
                  />
                ) : null}
                <View
                  style={{
                    minWidth: 20,
                    paddingHorizontal: 5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected
                      ? "rgba(0,206,209,0.45)"
                      : "rgba(255,255,255,0.2)",
                    backgroundColor: selected
                      ? "rgba(0,206,209,0.16)"
                      : "rgba(10,11,13,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: selected ? colors.primary : "#fff",
                      fontWeight: "700",
                      fontSize: 10,
                    }}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 16, paddingRight: 16 }}
        >
          {statusFilters.map((filter) => {
            const selected = selectedStatusFilter === filter.value;
            const filterColor =
              filter.value === "ALL"
                ? colors.primary
                : (statusColors[filter.value] ?? "#9ca3af");
            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedStatusFilter(filter.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected
                    ? filterColor
                    : "rgba(255,255,255,0.15)",
                  backgroundColor: selected
                    ? `${filterColor}29`
                    : "rgba(255,255,255,0.04)",
                }}
              >
                <Text
                  style={{
                    color: selected ? filterColor : "#9ca3af",
                    fontWeight: "700",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ marginBottom: 16 }}>
          <TextInput
            value={nameFilter}
            onChangeText={setNameFilter}
            placeholder="Filter by challenge name..."
            placeholderTextColor="#6b7280"
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              color: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
            }}
          />
        </View>

        <View style={{ gap: 12 }}>
          {filteredChallenges.map((challenge) => {
            const statusColor = statusColors[challenge.status] ?? "#9ca3af";
            const hasPendingSubmissions = challenge.pendingSubmissionsCount > 0;
            const pendingColor = hasPendingSubmissions ? "#ef4444" : "#64748b";
            const submissionTypeMeta = getSubmissionTypeMeta(
              challenge.submissionType,
            );
            const scoringMeta = getScoringMeta(challenge.scoringCategory);
            return (
              <View
                key={challenge.id}
                style={{
                  backgroundColor: colors.cardDark,
                  borderWidth: 1,
                  borderColor: `${statusColor}99`,
                  borderLeftWidth: 4,
                  borderLeftColor: statusColor,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderRadius: borderRadius.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    backgroundColor: `${statusColor}1A`,
                    borderWidth: 1,
                    borderColor: `${statusColor}59`,
                  }}
                >
                  <Ionicons name="trophy" size={24} color={statusColor} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {challenge.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: statusColor,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      {challenge.basePoints} PTS
                    </Text>
                    <Text
                      style={{
                        color: statusColor,
                        fontSize: 12,
                        textTransform: "uppercase",
                        fontWeight: "700",
                      }}
                    >
                      {challenge.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <View
                    style={{
                      marginTop: 8,
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(148,163,184,0.3)",
                        backgroundColor: "rgba(15,23,42,0.5)",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Ionicons
                        name={submissionTypeMeta.icon}
                        size={12}
                        color="#cbd5e1"
                      />
                      {submissionTypeMeta.secondaryIcon ? (
                        <Ionicons
                          name={submissionTypeMeta.secondaryIcon}
                          size={12}
                          color="#cbd5e1"
                        />
                      ) : null}
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: "#cbd5e1",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {submissionTypeMeta.label}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(148,163,184,0.3)",
                        backgroundColor: "rgba(15,23,42,0.5)",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Ionicons
                        name={scoringMeta.icon}
                        size={12}
                        color="#cbd5e1"
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: "#cbd5e1",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {scoringMeta.label}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(34,197,94,0.35)",
                        backgroundColor: "rgba(34,197,94,0.12)",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Ionicons name="people" size={12} color="#22c55e" />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: "#22c55e",
                        }}
                      >
                        {challenge.participantGroupsCount}
                      </Text>
                    </View>

                  </View>
                </View>

                <View
                  style={{
                    alignSelf: "stretch",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    paddingVertical: 2,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: hasPendingSubmissions
                        ? "rgba(239,68,68,0.45)"
                        : "rgba(100,116,139,0.45)",
                      backgroundColor: hasPendingSubmissions
                        ? "rgba(239,68,68,0.18)"
                        : "rgba(100,116,139,0.14)",
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Ionicons name="time-outline" size={12} color={pendingColor} />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: pendingColor,
                      }}
                    >
                      {challenge.pendingSubmissionsCount}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <TouchableOpacity
                      style={{ padding: 8 }}
                      onPress={() => {
                        router.push({
                          pathname: "/admin/challenges/judgement",
                          params: { tripId, challengeId: challenge.id },
                        });
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ padding: 8 }}
                      onPress={() => {
                        router.push({
                          pathname: "/admin/challenges/[id]",
                          params: { id: challenge.id, tripId },
                        });
                      }}
                    >
                      <Ionicons name="create" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ padding: 8 }}
                      onPress={() => handleDeleteChallenge(challenge.id)}
                    >
                      <Ionicons name="trash" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {filteredChallenges.length === 0 ? (
            <View
              style={{
                padding: 24,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.borderDark,
                backgroundColor: colors.cardDark,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#9ca3af" }}>No challenges found yet.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <AdminAddFab
        onPress={handleAddChallenge}
        accessibilityLabel="Add challenge"
      />
    </View>
  );
}
