import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

interface GroupMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  isLeader: boolean;
}

interface GroupMemberListProps {
  members: GroupMember[];
}

export function GroupMemberList({ members }: GroupMemberListProps) {
  return (
    <View style={styles.memberSection}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberHeaderTitle}>Member Directory</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllButton}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.memberList}>
        {members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <View
                style={[styles.avatar, member.isLeader && styles.avatarLeader]}
              >
                <Text style={styles.avatarText}>{member.initials}</Text>
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text
                  style={[
                    styles.memberRole,
                    member.isLeader && styles.memberRoleLeader,
                  ]}
                >
                  {member.role.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  memberSection: {
    marginBottom: spacing.lg,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  memberHeaderTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  viewAllButton: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  memberList: {
    gap: spacing.sm,
  },
  memberCard: {
    backgroundColor: "rgba(39, 41, 53, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textMuted,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLeader: {
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.white,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  memberRoleLeader: {
    color: colors.primary,
  },
});
