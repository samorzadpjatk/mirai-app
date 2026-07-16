import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface EditMembersSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function EditMembersSearchBar({ value, onChangeText }: EditMembersSearchBarProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette } = useTripTheme();
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchIconContainer}>
        <Ionicons name="search" size={20} color={palette.textMuted} />
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name"
        placeholderTextColor="rgba(148, 163, 184, 0.4)"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
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
      borderColor: "rgba(48, 54, 61, 1)",
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingLeft: 48,
      paddingRight: spacing.lg,
      color: colors.white,
      fontSize: typography.sm,
    },
  });
}
