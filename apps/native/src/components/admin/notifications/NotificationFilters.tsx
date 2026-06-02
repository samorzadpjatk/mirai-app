import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "~/styles";
import { FilterChip, FilterChipRow } from "~/components/common/ui";
import type { NotificationStatus } from "~/hooks/admin/useAdminNotifications";

interface NotificationFiltersProps {
  searchTerm: string;
  onSearchChange: (text: string) => void;
  status: NotificationStatus;
  onStatusChange: (status: NotificationStatus) => void;
  groups: { id: string; name: string }[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
}

const statusOptions: { key: NotificationStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Failed" },
];

export function NotificationFilters({
  searchTerm,
  onSearchChange,
  status,
  onStatusChange,
  groups,
  selectedGroupId,
  onGroupChange,
}: NotificationFiltersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            value={searchTerm}
            onChangeText={onSearchChange}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <FilterChipRow style={styles.statusSelector} horizontalSpacing={spacing.sm}>
        {statusOptions.map((option) => (
          <FilterChip
            key={option.key}
            label={option.label}
            selected={status === option.key}
            onPress={() => onStatusChange(option.key)}
          />
        ))}
      </FilterChipRow>

      {groups.length ? (
        <FilterChipRow style={styles.groupSelector} horizontalSpacing={spacing.sm}>
          <FilterChip
            label="All groups"
            selected={selectedGroupId === "all"}
            onPress={() => onGroupChange("all")}
          />
          {groups.map((group) => (
            <FilterChip
              key={group.id}
              label={group.name}
              selected={selectedGroupId === group.id}
              onPress={() => onGroupChange(group.id)}
            />
          ))}
        </FilterChipRow>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.base,
    color: colors.white,
  },
  statusSelector: {
    paddingHorizontal: spacing.lg,
  },
  groupSelector: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
});
