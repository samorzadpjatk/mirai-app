import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { getColorForPoints, getIconForChallenge } from "./challengeStyles";

interface ChallengeHeroCardProps {
  name: string;
  points: number;
  isSelected: boolean;
  imageUrl?: string | null;
  submissionType?: string | null;
  scoringCategory?: string | null;
  status?: string | null;
  endTime?: Date | string | null;
  isRecurring?: boolean;
  firstPlacePoints?: number | null;
  secondPlacePoints?: number | null;
  thirdPlacePoints?: number | null;
}

const submissionTypeLabels: Record<string, string> = {
  IMAGE: "Photo",
  MULTI_IMAGE: "Multi Photo",
  VIDEO: "Video",
  TEXT: "Text",
  IMAGE_LOCATION: "Photo + GPS",
  LOCATION: "GPS",
  QR_CODE: "QR Code",
};

const scoringLabels: Record<string, string> = {
  SPEED: "Speed",
  UNLIMITED: "Unlimited",
  JUDGED_STAFF: "Staff Judged",
  PEER_VOTING: "Peer Voting",
};

const statusLabels: Record<string, string> = {
  HIDDEN: "Hidden",
  VISIBLE: "Visible",
  ACTIVE: "Active",
  VOTING_PHASE: "Voting",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<string, string> = {
  HIDDEN: colors.slate400,
  VISIBLE: colors.primary,
  ACTIVE: colors.primary,
  VOTING_PHASE: colors.warning,
  COMPLETED: colors.success,
  CANCELLED: colors.danger,
};

const getEndsLabel = (isRecurring?: boolean) => (isRecurring ? "Recurring" : "One-time");

export function ChallengeHeroCard({
  name,
  points,
  isSelected,
  imageUrl,
  submissionType,
  scoringCategory,
  status,
  endTime: _endTime,
  isRecurring,
  firstPlacePoints,
  secondPlacePoints,
  thirdPlacePoints,
}: ChallengeHeroCardProps) {
  const icon = getIconForChallenge(name);
  const iconColor = getColorForPoints(points);
  const statusValue = status ?? (isSelected ? "ACTIVE" : "VISIBLE");
  const statusColor = statusTone[statusValue] ?? colors.primary;
  const statusText = statusLabels[statusValue] ?? statusValue;
  const typeText = submissionType
    ? (submissionTypeLabels[submissionType] ?? submissionType)
    : "Photo";
  const scoringText = scoringCategory
    ? (scoringLabels[scoringCategory] ?? scoringCategory)
    : "Speed";
  const endsText = getEndsLabel(isRecurring);
  const hasPodium =
    firstPlacePoints != null || secondPlacePoints != null || thirdPlacePoints != null;
  const podiumItems = [
    {
      place: "1st",
      points: firstPlacePoints ?? 0,
      iconColor: colors.yellow400,
      borderColor: `${colors.yellow400}99`,
      backgroundColor: `${colors.yellow400}2E`,
    },
    {
      place: "2nd",
      points: secondPlacePoints ?? 0,
      iconColor: colors.gray400,
      borderColor: `${colors.gray400}99`,
      backgroundColor: `${colors.gray400}29`,
    },
    {
      place: "3rd",
      points: thirdPlacePoints ?? 0,
      iconColor: colors.orange400,
      borderColor: `${colors.orange400}99`,
      backgroundColor: `${colors.orange400}29`,
    },
  ];
  const heroFallbackColor = `${iconColor}30`;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.heroContainer,
          isSelected && styles.heroSelected,
          !imageUrl && { backgroundColor: heroFallbackColor },
        ]}
      >
        {imageUrl ? (
          <CachedImage source={{ uri: imageUrl }} style={styles.heroImage} contentFit="cover" />
        ) : null}
        <LinearGradient
          colors={["rgba(10,11,13,0.08)", "rgba(10,11,13,0.36)", "rgba(10,11,13,0.9)"]}
          style={styles.heroOverlay}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: `${statusColor}66`,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
            <View style={styles.pointsStack}>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{points} pts</Text>
              </View>
              {hasPodium && (
                <View style={styles.podiumInline}>
                  {podiumItems.map((item) => (
                    <View
                      key={item.place}
                      style={[
                        styles.podiumChip,
                        {
                          borderColor: item.borderColor,
                          backgroundColor: item.backgroundColor,
                        },
                      ]}
                    >
                      <Ionicons name="medal-outline" size={10} color={item.iconColor} />
                      <Text style={styles.podiumPlaceText}>{item.place}</Text>
                      <Text style={styles.podiumPointsText}>{item.points}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroBottom}>
            <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
              <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <Text numberOfLines={2} style={styles.title}>
              {name}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.metaGrid}>
        <MetaCard icon="camera-outline" label="Type" value={typeText} />
        <MetaCard icon="speedometer-outline" label="Scoring" value={scoringText} />
        <MetaCard icon="calendar-outline" label="Ends" value={endsText} />
      </View>
    </View>
  );
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaCard}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  heroContainer: {
    position: "relative",
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    overflow: "hidden",
  },
  heroSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  heroImage: {
    position: "absolute",
    inset: 0,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(10,11,13,0.58)",
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pointsBadge: {
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(10,11,13,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pointsText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pointsStack: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: "78%",
  },
  podiumInline: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: "rgba(10,11,13,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  podiumChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  podiumPlaceText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 9,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  podiumPointsText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.bold,
  },
  heroBottom: {
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.6,
  },
  metaGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.borderWhite10,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    gap: 2,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: typography.bold,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  metaValue: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textAlign: "center",
  },
});
