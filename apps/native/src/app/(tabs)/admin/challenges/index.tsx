import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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

const statusColors: Record<string, string> = {
  HIDDEN: "#64748b",
  VISIBLE: "#0ea5e9",
  ACTIVE: "#22c55e",
  VOTING_PHASE: "#f59e0b",
  COMPLETED: "#10b981",
};

export default function AdminChallengesScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const tripId =
    typeof params.tripId === "string" ? params.tripId : params.tripId?.[0] ?? "";

  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<StatusFilter>("ALL");
  const [nameFilter, setNameFilter] = useState("");

  const challengeQueryOptions = trpc.challenge.getAllByTrip.queryOptions({ tripId });
  const { data: challengesData, isLoading } = useQuery({
    ...challengeQueryOptions,
    enabled: !!tripId,
  });

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
    Alert.alert("Delete Challenge", "Are you sure you want to delete this challenge?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteChallengeMutation.mutate({ id, tripId });
        },
      },
    ]);
  };

  const totalChallenges = challenges.length;
  const statusCounts = useMemo(
    () => ({
      HIDDEN: challenges.filter((challenge) => challenge.status === "HIDDEN").length,
      VISIBLE: challenges.filter((challenge) => challenge.status === "VISIBLE").length,
      ACTIVE: challenges.filter((challenge) => challenge.status === "ACTIVE").length,
      VOTING_PHASE: challenges.filter((challenge) => challenge.status === "VOTING_PHASE")
        .length,
      COMPLETED: challenges.filter((challenge) => challenge.status === "COMPLETED")
        .length,
    }),
    [challenges],
  );

  const filteredChallenges = useMemo(() => {
    const normalizedQuery = nameFilter.trim().toLowerCase();
    let list = challenges;

    if (selectedStatusFilter !== "ALL") {
      list = list.filter((challenge) => challenge.status === selectedStatusFilter);
    }

    if (normalizedQuery.length > 0) {
      list = list.filter((challenge) =>
        challenge.title.toLowerCase().includes(normalizedQuery),
      );
    }

    return list;
  }, [challenges, selectedStatusFilter, nameFilter]);

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
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />

      <ScrollView
        style={{ flex: 1, paddingHorizontal: spacing.md }}
        contentContainerStyle={{ paddingTop: spacing.xl, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
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
            <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 16 }}>
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
          contentContainerStyle={{ gap: 8, marginBottom: 16, paddingRight: 16 }}
        >
          {statusFilters.map((filter) => {
            const selected = selectedStatusFilter === filter.value;
            const filterColor =
              filter.value === "ALL" ? colors.primary : statusColors[filter.value] ?? "#9ca3af";
            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setSelectedStatusFilter(filter.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? filterColor : "rgba(255,255,255,0.15)",
                  backgroundColor: selected ? `${filterColor}29` : "rgba(255,255,255,0.04)",
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: statusColor, fontSize: 14, fontWeight: "600" }}>
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
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
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
