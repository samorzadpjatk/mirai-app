import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { borderRadius, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles, useTripTheme } from "~/theme/TripThemeProvider";

interface GroupsSearchBarProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
}

export function GroupsSearchBar({ searchTerm, onSearchChange, placeholder }: GroupsSearchBarProps) {
  const { palette } = useTripTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={palette.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder ?? "Search groups..."}
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholderTextColor={palette.textSecondary}
        />
      </View>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    searchSection: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    searchBar: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: palette.borderDark,
    },
    searchInput: {
      flex: 1,
      marginLeft: spacing.sm,
      fontSize: typography.base,
      color: palette.white,
    },
  });
}
