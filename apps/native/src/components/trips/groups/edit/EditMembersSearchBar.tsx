import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface EditMembersSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function EditMembersSearchBar({ value, onChangeText }: EditMembersSearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchIconContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
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
    borderColor: "rgba(48, 54, 61, 1)",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingLeft: 48,
    paddingRight: spacing.lg,
    color: colors.white,
    fontSize: typography.sm,
  },
});
