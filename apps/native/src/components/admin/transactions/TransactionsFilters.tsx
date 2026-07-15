import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

interface GroupOption {
  id: string;
  name: string;
}

interface TransactionsFiltersProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  groups: GroupOption[];
}

export function TransactionsFilters({
  searchTerm,
  onSearchChange,
  selectedGroupId,
  onGroupChange,
  groups,
}: TransactionsFiltersProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchTerm}
            onChangeText={onSearchChange}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.groupSelector}
        contentContainerStyle={styles.groupSelectorContent}
      >
        <TouchableOpacity
          style={[styles.groupOption, selectedGroupId === "all" && styles.groupOptionSelected]}
          onPress={() => onGroupChange("all")}
        >
          <Text
            style={[
              styles.groupOptionText,
              selectedGroupId === "all" && styles.groupOptionTextSelected,
            ]}
          >
            All Groups
          </Text>
        </TouchableOpacity>

        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[styles.groupOption, selectedGroupId === group.id && styles.groupOptionSelected]}
            onPress={() => onGroupChange(group.id)}
          >
            <Text
              style={[
                styles.groupOptionText,
                selectedGroupId === group.id && styles.groupOptionTextSelected,
              ]}
            >
              {group.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    searchSection: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
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
      color: colors.white,
    },
    groupSelector: {
      paddingHorizontal: spacing.lg,
    },
    groupSelectorContent: {
      paddingRight: spacing.lg,
    },
    groupOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: palette.cardDark,
      borderRadius: borderRadius.full,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: palette.borderDark,
    },
    groupOptionSelected: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    groupOptionText: {
      fontSize: typography.sm,
      color: colors.textSecondary,
      fontWeight: typography.medium,
    },
    groupOptionTextSelected: {
      color: colors.white,
    },
  });
}
