import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";
import { GroupCard } from "./GroupCard";
import type { GroupListItem } from "./types";

interface GroupsListProps {
  groups: GroupListItem[];
  onSelectGroup: (group: GroupListItem) => void;
  myGroupId?: string | null;
}

export function GroupsList({ groups, onSelectGroup, myGroupId }: GroupsListProps) {
  const styles = useThemedStyles(makeStyles);
  if (groups.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No groups found</Text>
      </View>
    );
  }

  return (
    <View style={styles.groupsList} testID="groups-list">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onPress={onSelectGroup}
          isMyGroup={Boolean(myGroupId && group.id === myGroupId)}
        />
      ))}
    </View>
  );
}

function makeStyles(palette: ThemePalette) {
  return StyleSheet.create({
    groupsList: {
      gap: spacing.lg,
    },
    emptyState: {
      paddingVertical: spacing.xxxl,
      alignItems: "center",
    },
    emptyStateText: {
      fontSize: typography.base,
      color: palette.textMuted,
    },
  });
}
