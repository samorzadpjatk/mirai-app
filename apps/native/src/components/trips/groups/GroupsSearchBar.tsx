import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "~/styles";

interface GroupsSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function GroupsSearchBar({ value, onChangeText }: GroupsSearchBarProps) {
  return (
    <View testID="groups-search-bar-container" style={styles.searchContainer}>
      <View style={styles.searchIconContainer}>
        <Ionicons name="search" size={20} color={colors.primary} style={{ opacity: 0.6 }} />
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

const styles = StyleSheet.create({
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
    backgroundColor: colors.cardDark,
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
