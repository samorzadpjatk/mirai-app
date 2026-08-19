import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import type { ChallengeItem } from "~/hooks/admin/useAdminChallengesByTrip";
import { borderRadius, colors, spacing } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";

interface ChallengeListItemProps {
  challenge: ChallengeItem;
  onDelete: (id: string) => void;
  onDeletePress: (id: string) => void;
}

export function ChallengeListItem({
  challenge,
  onDelete: _onDelete,
  onDeletePress,
}: ChallengeListItemProps) {
  const router = useRouter();
  const { palette } = useTripTheme();

  const handleJudgement = () => {
    router.push({
      pathname: "/admin/challenges/judgement",
      params: { tripId: challenge.tripId, challengeId: challenge.id },
    });
  };

  const handleEdit = () => {
    router.push({
      pathname: "/admin/challenges/[id]",
      params: { id: challenge.id, tripId: challenge.tripId },
    });
  };

  const handleDelete = () => {
    onDeletePress(challenge.id);
  };

  return (
    <View
      style={{
        backgroundColor: palette.cardDark,
        borderWidth: 1,
        borderColor: palette.borderDark,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          backgroundColor: palette.primaryOpacity10,
          borderWidth: 1,
          borderColor: palette.primaryOpacity20,
        }}
      >
        <Ionicons name="trophy" size={24} color={palette.primary} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: colors.white,
            marginBottom: 4,
          }}
        >
          {challenge.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Text
            style={{
              color: palette.primary,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {challenge.basePoints} PTS
          </Text>
          <Text
            style={{
              color: palette.textSecondary,
              fontSize: 12,
              textTransform: "uppercase",
            }}
          >
            {challenge.status.replace(/_/g, " ")}
          </Text>
          {!!challenge.description && (
            <Text
              numberOfLines={1}
              style={{
                color: palette.textSecondary,
                fontSize: 12,
                flex: 1,
                minWidth: 0,
              }}
            >
              {challenge.description}
            </Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 4 }}>
        <TouchableOpacity style={{ padding: 8 }} onPress={handleJudgement}>
          <Ionicons name="checkmark-circle" size={20} color={palette.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 8 }} onPress={handleEdit}>
          <Ionicons name="create" size={20} color={palette.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 8 }} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={palette.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
