import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface GroupsSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function GroupsSearchBar({ value, onChangeText }: GroupsSearchBarProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  return (
    <View testID="groups-search-bar-container" style={styles.searchContainer}>
      <View style={styles.searchIconContainer}>
        <Ionicons name="search" size={20} color={palette.primary} style={{ opacity: 0.6 }} />
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search groups by name..."
        placeholderTextColor="rgba(148, 163, 184, 0.4)"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
    searchContainer: {
      position: "relative",
      marginBottom: spacing.lg,
    },
    searchIconContainer: {
      position: "absolute",
      left: spacing.lg,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      zIndex: 1,
    },
    searchInput: {
      backgroundColor: palette.cardDark,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.lg,
      paddingLeft: 48,
      paddingRight: spacing.lg,
      color: colors.white,
      fontSize: typography.base,
      fontWeight: typography.medium,
    },
  });
