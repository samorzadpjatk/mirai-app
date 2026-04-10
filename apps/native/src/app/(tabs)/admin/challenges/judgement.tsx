import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JudgementContent } from "~/components/judgement/JudgementContent";
import { viewStyles, textStyles } from "~/styles/judgement";

const createGraphQLClient = () => {
  return new GraphQLClient(
    process.env.EXPO_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql",
    {
      headers: async () => {
        const token = await SecureStore.getItemAsync("sb-access-token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    },
  );
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseChallenge = (value: unknown) => {
  if (!isObject(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string")
    return null;

  return {
    id: value.id,
    name: value.name,
    scoringCategory:
      typeof value.scoringCategory === "string" ? value.scoringCategory : "",
    endTime:
      typeof value.endTime === "string" || value.endTime instanceof Date
        ? value.endTime
        : null,
    status: typeof value.status === "string" ? value.status : "HIDDEN",
  };
};

export default function ChallengeJudgementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const graphqlClient = useMemo(() => createGraphQLClient(), []);

  const tripId =
    typeof params.tripId === "string"
      ? params.tripId
      : (params.tripId?.[0] ?? "");
  const challengeId =
    typeof params.challengeId === "string"
      ? params.challengeId
      : (params.challengeId?.[0] ?? "");

  const challengeQuery = useQuery({
    queryKey: ["challenge", "details", challengeId, tripId],
    enabled: Boolean(tripId) && Boolean(challengeId),
    queryFn: async () => {
      const result = await graphqlClient.request<{
        challenge?: {
          id: string;
          name: string;
          scoringCategory?: string;
          endTime?: string;
          status?: string;
        };
      }>(
        `
        query GetChallenge($id: ID!, $tripId: ID!) {
          challenge(id: $id, tripId: $tripId) {
            id
            name
            scoringCategory
            endTime
            status
          }
        }
        `,
        { id: challengeId, tripId },
      );
      return parseChallenge(result.challenge);
    },
  });

  if (!tripId || !challengeId) {
    return (
      <View style={[viewStyles.container, viewStyles.centered]}>
        <Text style={textStyles.emptyText}>Missing challenge context.</Text>
      </View>
    );
  }

  if (challengeQuery.isLoading) {
    return (
      <View style={[viewStyles.container, viewStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (challengeQuery.data?.scoringCategory === "JUDGED_STAFF") {
    return (
      <View
        style={[
          viewStyles.container,
          viewStyles.centered,
          { padding: spacing.lg },
        ]}
      >
        <Text
          style={[
            textStyles.emptyText,
            { textAlign: "center", marginBottom: spacing.md },
          ]}
        >
          Judged Staff challenge uses the staff voting view.
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.replace({
              pathname: "/admin/challenges/staff-vote",
              params: { tripId, challengeId },
            })
          }
          style={{
            borderRadius: borderRadius.md,
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.backgroundDark,
              fontWeight: typography.bold,
              textTransform: "uppercase",
            }}
          >
            Open Staff Voting
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        viewStyles.container,
        {
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.xxxl,
        },
      ]}
    >
      <Stack.Screen options={{ title: "Challenge Judgement" }} />
      <StatusBar barStyle="light-content" />
      <JudgementContent tripId={tripId} challengeId={challengeId} />
    </View>
  );
}
