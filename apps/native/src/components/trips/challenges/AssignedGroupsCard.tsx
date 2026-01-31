import { StyleSheet, Text, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface AssignedGroup {
  id: string;
  group: {
    name: string;
    organizer?: {
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  };
}

interface AssignedGroupsCardProps {
  groups: AssignedGroup[];
}

export function AssignedGroupsCard({ groups }: AssignedGroupsCardProps) {
  if (groups.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assigned to Groups</Text>
      {groups.map((group) => (
        <View key={group.id} style={styles.groupRow}>
          <Text style={styles.groupName}>{group.group.name}</Text>
          {group.group.organizer && (
            <Text style={styles.groupLeader}>
              Leader: {group.group.organizer.firstName}{" "}
              {group.group.organizer.lastName}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  groupRow: {
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  groupName: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
  },
  groupLeader: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
});
