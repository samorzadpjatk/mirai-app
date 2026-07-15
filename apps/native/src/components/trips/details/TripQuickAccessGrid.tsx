import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import plankPanel from "../../../../assets/textures/plank-panel.png";

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
  const { palette, themeKey } = useTripTheme();
  const isPirate = themeKey === "PIRATE";
  return (
    <View style={styles.gridContainer}>
      <TouchableOpacity
        style={[styles.gridCard, styles.gridCardGlow, isPirate && styles.gridCardPirate]}
        onPress={onOpenGroups}
      >
        {isPirate ? (
          <Image source={plankPanel} style={styles.panel} contentFit="fill" pointerEvents="none" />
        ) : null}
        <View style={[styles.gridIconWrapper, isPirate && styles.gridIconWrapperPirate]}>
          <Ionicons name="grid" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Groups</Text>
          <Text style={styles.gridCardSubtitle}>Team Roster</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.gridCard, isPirate && styles.gridCardPirate]}
        onPress={onOpenRooms}
      >
        {isPirate ? (
          <Image source={plankPanel} style={styles.panel} contentFit="fill" pointerEvents="none" />
        ) : null}
        <View style={[styles.gridIconWrapper, isPirate && styles.gridIconWrapperPirate]}>
          <Ionicons name="bed" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Rooms</Text>
          <Text style={styles.gridCardSubtitle}>Who's Where</Text>
        </View>
      </TouchableOpacity>

      {!isTripPast && (
        <TouchableOpacity
          style={[styles.gridCard, isPirate && styles.gridCardPirate]}
          onPress={onOpenMap}
        >
          {isPirate ? (
            <Image
              source={plankPanel}
              style={styles.panel}
              contentFit="fill"
              pointerEvents="none"
            />
          ) : null}
          <View style={[styles.gridIconWrapper, isPirate && styles.gridIconWrapperPirate]}>
            <Ionicons name="map" size={24} color={palette.primary} />
          </View>
          <View style={styles.gridCardContent}>
            <Text style={styles.gridCardTitle}>Map</Text>
            <Text style={styles.gridCardSubtitle}>Trip Locations</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.gridCard, isPirate && styles.gridCardPirate]}
        onPress={onOpenChallenges}
      >
        {isPirate ? (
          <Image source={plankPanel} style={styles.panel} contentFit="fill" pointerEvents="none" />
        ) : null}
        <View style={[styles.gridIconWrapper, isPirate && styles.gridIconWrapperPirate]}>
          <Ionicons name="trophy" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Challenges</Text>
          <Text style={styles.gridCardSubtitle}>Daily Quests</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.gridCard, isPirate && styles.gridCardPirate]}
        onPress={onOpenRewards}
      >
        {isPirate ? (
          <Image source={plankPanel} style={styles.panel} contentFit="fill" pointerEvents="none" />
        ) : null}
        <View style={[styles.gridIconWrapper, isPirate && styles.gridIconWrapperPirate]}>
          <Ionicons name="gift" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Rewards</Text>
          <Text style={styles.gridCardSubtitle}>Prize Store</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.gridCard, isPirate && styles.gridCardPirate]}
        onPress={onOpenLeaderboard}
      >
        {isPirate ? (
          <Image source={plankPanel} style={styles.panel} contentFit="fill" pointerEvents="none" />
        ) : null}
        <View style={[styles.gridIconWrapper, isPirate && styles.gridIconWrapperPirate]}>
          <Ionicons name="ribbon" size={24} color={palette.primary} />
        </View>
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle}>Leaderboard</Text>
          <Text style={styles.gridCardSubtitle}>Quest Rankings</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.gridCard, isPirate && styles.gridCardPirate]}
        onPress={onOpenInfo}
      >
        {isPirate ? (
          <Image source={plankPanel} style={styles.panel} contentFit="fill" pointerEvents="none" />
        ) : null}
        <View style={[styles.gridIconWrapper, isPirate && styles.gridIconWrapperPirate]}>
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
      backgroundColor: palette.cardDark,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: palette.primaryOpacity10,
      gap: spacing.lg,
    },
    // Pirate: the wooden plank panel image provides the surface + frame, so drop
    // the flat card fill/border and let its transparent corners reveal the deck.
    gridCardPirate: {
      backgroundColor: "transparent",
      borderWidth: 0,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      minHeight: 120,
    },
    panel: {
      ...StyleSheet.absoluteFillObject,
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
      backgroundColor: palette.cardDark,
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
    // Pirate: dark carved recess behind the gold icon, matching the plank look.
    gridIconWrapperPirate: {
      backgroundColor: "rgba(20, 12, 6, 0.55)",
      borderWidth: 1,
      borderColor: "rgba(0, 0, 0, 0.35)",
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
      textShadowColor: "rgba(0, 0, 0, 0.65)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    gridCardSubtitle: {
      fontSize: typography.xs,
      color: colors.whiteOpacity70,
      textShadowColor: "rgba(0, 0, 0, 0.6)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
  });
