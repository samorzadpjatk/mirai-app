import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";
import type { IoniconName } from "./getIconName";

interface InteractiveMapTileProps {
  label: string;
  /** Description seeded with the resource; omitted when there is none. */
  subtitle?: string | null;
  iconName: IoniconName;
  /** Local URI of the downloaded map background image, when one is seeded. */
  backgroundUri?: string | null;
  onPress: () => void;
}

/**
 * Square tile that opens the interactive map. Without a seeded background
 * image it renders as a plain themed card rather than falling back to an
 * unrelated stock photo.
 */
export function InteractiveMapTile({
  label,
  subtitle,
  iconName,
  backgroundUri,
  onPress,
}: InteractiveMapTileProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();

  const content: ReactNode = (
    <>
      <View style={styles.mapGradient} />
      <View style={styles.mapContent}>
        <View style={styles.mapIconWrapper}>
          <Ionicons name={iconName} size={24} color={palette.primary} />
        </View>
        <Text style={styles.mapTitle}>{label}</Text>
        {subtitle ? (
          <Text testID="trip-info-map-tile-subtitle" style={styles.mapSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.mapAction}>
          <Text style={styles.mapActionText}>Explore Map</Text>
          <Ionicons name="chevron-forward" size={16} color={palette.primary} />
        </View>
      </View>
    </>
  );

  return (
    <TouchableOpacity
      testID="trip-info-map-tile"
      style={styles.mapTile}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {backgroundUri ? (
        <ImageBackground
          testID="trip-info-map-tile-image"
          source={{ uri: backgroundUri }}
          style={styles.mapBackground}
          imageStyle={styles.mapBackgroundImage}
        >
          {content}
        </ImageBackground>
      ) : (
        <View style={[styles.mapBackground, styles.mapBackgroundPlain]}>{content}</View>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    mapTile: {
      flex: 1,
      height: 176,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: palette.primaryOpacity20,
    },
    mapBackground: {
      width: "100%",
      height: "100%",
    },
    mapBackgroundImage: {
      borderRadius: borderRadius.xl,
      opacity: 0.4,
    },
    mapBackgroundPlain: {
      backgroundColor: palette.cardDark,
    },
    mapGradient: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(39, 41, 53, 0.85)",
    },
    mapContent: {
      flex: 1,
      padding: spacing.xl,
      justifyContent: "space-between",
    },
    mapIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: palette.primaryOpacity20,
      alignItems: "center",
      justifyContent: "center",
    },
    mapTitle: {
      fontSize: typography.lg,
      fontWeight: typography.bold,
      color: colors.white,
    },
    mapSubtitle: {
      fontSize: typography.xs,
      color: colors.slate400,
    },
    mapAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    mapActionText: {
      fontSize: 10,
      fontWeight: typography.bold,
      color: palette.primary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  });
