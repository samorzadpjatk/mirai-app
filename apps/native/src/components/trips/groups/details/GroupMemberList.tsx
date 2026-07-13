import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CachedImage } from "~/components/common/CachedImage";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type ThemePalette, useThemedStyles } from "~/theme/TripThemeProvider";

export interface GroupMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  isLeader: boolean;
  avatarStoragePath?: string | null;
}

interface GroupMemberListProps {
  members: GroupMember[];
}

function MemberAvatar({ member }: { member: GroupMember }) {
  const styles = useThemedStyles(makeStyles);
  if (member.avatarStoragePath) {
    return (
      <CachedImage
        storagePath={member.avatarStoragePath}
        style={styles.avatarImage}
        contentFit="cover"
        fallback={<Text style={styles.avatarText}>{member.initials}</Text>}
      />
    );
  }

  return <Text style={styles.avatarText}>{member.initials}</Text>;
}

export function calculateHasMoreThanPreview(members: GroupMember[]): boolean {
  return members.length > 3;
}

export function calculateVisibleMembers(
  members: GroupMember[],
  isExpanded: boolean,
): GroupMember[] {
  return isExpanded ? members : members.slice(0, 3);
}

export function buildExpandButtonText(isExpanded: boolean): string {
  return isExpanded ? "Show Less" : "View All";
}

export function formatMemberRole(role: string): string {
  return role.toUpperCase();
}

export function GroupMemberList({ members }: GroupMemberListProps) {
  const styles = useThemedStyles(makeStyles);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreThanPreview = calculateHasMoreThanPreview(members);
  const visibleMembers = useMemo(
    () => calculateVisibleMembers(members, isExpanded),
    [isExpanded, members],
  );

  return (
    <View style={styles.memberSection}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberHeaderTitle}>Member Directory</Text>
        {hasMoreThanPreview ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setIsExpanded((prev) => !prev)}>
            <Text style={styles.viewAllButton}>{buildExpandButtonText(isExpanded)}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.memberList}>
        {visibleMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <View
                testID={member.isLeader ? "leader-avatar" : "member-avatar"}
                style={[styles.avatar, member.isLeader && styles.avatarLeader]}
              >
                <MemberAvatar member={member} />
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={[styles.memberRole, member.isLeader && styles.memberRoleLeader]}>
                  {formatMemberRole(member.role)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (palette: ThemePalette) =>
  StyleSheet.create({
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
      color: palette.primary,
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
      overflow: "hidden",
      backgroundColor: colors.textMuted,
      borderWidth: 2,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: borderRadius.full,
    },
    avatarLeader: {
      borderColor: palette.primary,
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
      color: palette.primary,
    },
  });
