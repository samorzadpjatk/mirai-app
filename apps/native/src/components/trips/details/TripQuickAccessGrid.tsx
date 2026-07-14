import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface TripQuickAccessGridProps {
  isTripPast?: boolean;
  onOpenGroups: () => void;
  onOpenRooms: () => void;
  onOpenMap: () => void;
  onOpenChallenges: () => void;
  onOpenLeaderboard: () => void;
  onOpenRewards: () => void;
  onOpenInfo: () => void;
}

export function TripQuickAccessGrid({
  isTripPast,
  onOpenGroups,
  onOpenRooms,
  onOpenMap,
  onOpenChallenges,
  onOpenLeaderboard,
  onOpenRewards,
  onOpenInfo,
}: TripQuickAccessGridProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  return (
    <View style={styles.gridContainer}>
      <TouchableOpacity style={[styles.gridCard, styles.gridCardGlow]} onPress={onOpenGroups}>
        <View style={styles.gridIconWrapper}>
          <Ionicons name="grid" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Groups</Text>
          <Text style={styles.gridCardSubtitle}>Team Roster</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gridCard} onPress={onOpenRooms}>
        <View style={styles.gridIconWrapper}>
          <Ionicons name="bed" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Rooms</Text>
          <Text style={styles.gridCardSubtitle}>Who's Where</Text>
        </View>
      </TouchableOpacity>

      {!isTripPast && (
        <TouchableOpacity style={styles.gridCard} onPress={onOpenMap}>
          <View style={styles.gridIconWrapper}>
            <Ionicons name="map" size={24} color={palette.primary} />
          </View>
          <View style={styles.gridCardContent}>
            <Text style={styles.gridCardTitle}>Map</Text>
            <Text style={styles.gridCardSubtitle}>Trip Locations</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.gridCard} onPress={onOpenChallenges}>
        <View style={styles.gridIconWrapper}>
          <Ionicons name="trophy" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Challenges</Text>
          <Text style={styles.gridCardSubtitle}>Daily Quests</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gridCard} onPress={onOpenRewards}>
        <View style={styles.gridIconWrapper}>
          <Ionicons name="gift" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Rewards</Text>
          <Text style={styles.gridCardSubtitle}>Prize Store</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gridCard} onPress={onOpenLeaderboard}>
        <View style={styles.gridIconWrapper}>
          <Ionicons name="ribbon" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Leaderboard</Text>
          <Text style={styles.gridCardSubtitle}>Quest Rankings</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gridCard} onPress={onOpenInfo}>
        <View style={styles.gridIconWrapper}>
          <Ionicons name="information-circle" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Trip Info</Text>
          <Text style={styles.gridCardSubtitle}>Schedules & Rules</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    gridCard: {
      width: "48%",
      backgroundColor: colors.cardDark,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      gap: spacing.lg,
    },
    gridCardGlow: {
      shadowColor: palette.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 4,
    },
    gridCardWide: {
      width: "100%",
      backgroundColor: colors.cardDark,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
    },
    gridIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
      backgroundColor: palette.primaryOpacity10,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    gridIconWrapperLarge: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.sm,
      backgroundColor: palette.primaryOpacity10,
      alignItems: "center",
      justifyContent: "center",
    },
    gridCardContent: {
      gap: 2,
    },
    gridCardContentWide: {
      flex: 1,
      gap: 2,
    },
    gridCardTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
      lineHeight: typography.lg * typography.tight,
    },
    gridCardSubtitle: {
      fontSize: typography.xs,
      color: colors.textTertiary,
    },
  });
