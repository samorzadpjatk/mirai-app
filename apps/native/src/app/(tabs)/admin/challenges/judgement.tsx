import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingScreen from "~/components/LoadingScreen";
import { JudgementContent } from "~/components/judgement/JudgementContent";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { textStyles, viewStyles } from "~/styles/judgement";

export default function ChallengeJudgementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : (params.tripId?.[0] ?? "");
  const challengeId =
    typeof params.challengeId === "string" ? params.challengeId : (params.challengeId?.[0] ?? "");

  const challengeQuery = useQuery({
    ...orpc.challenge.getById.queryOptions({
      input: {
        id: challengeId,
        tripId,
      },
    }),
    enabled: Boolean(tripId) && Boolean(challengeId),
  });

  if (!tripId || !challengeId) {
    return (
      <View style={[viewStyles.container, viewStyles.centered]}>
        <Text style={textStyles.emptyText}>Missing challenge context.</Text>
      </View>
    );
  }

  if (challengeQuery.isLoading) {
    return <LoadingScreen message="Loading challenge..." />;
  }

  if (challengeQuery.data?.scoringCategory === "JUDGED_STAFF") {
    return (
      <View style={[viewStyles.container, viewStyles.centered, { padding: spacing.lg }]}>
        <Text style={[textStyles.emptyText, { textAlign: "center", marginBottom: spacing.md }]}>
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
