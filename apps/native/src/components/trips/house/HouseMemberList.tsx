import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";

export interface HouseMember {
  id: string;
  name: string;
  initials: string;
  isCurrentUser: boolean;
  avatarStoragePath?: string | null;
  wristNumber?: string | null;
}

interface HouseMemberListProps {
  members: HouseMember[];
  houseNumber: string;
}

function MemberAvatar({ member }: { member: HouseMember }) {
  const avatarQuery = useQuery({
    ...orpc.storage.createDownloadUrl.queryOptions({
      input: {
        storagePath: member.avatarStoragePath ?? "",
        expiresInSeconds: 60 * 60,
      },
    }),
    enabled: Boolean(member.avatarStoragePath),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  if (avatarQuery.data?.signedUrl) {
    return (
      <Image
        source={{ uri: avatarQuery.data.signedUrl }}
        style={styles.avatarImage}
        contentFit="cover"
      />
    );
  }

  return <Text style={styles.avatarText}>{member.initials}</Text>;
}

export function calculateHasMoreThanPreview(members: HouseMember[]): boolean {
  return members.length > 3;
}

export function calculateVisibleMembers(
  members: HouseMember[],
  isExpanded: boolean,
): HouseMember[] {
  return isExpanded ? members : members.slice(0, 3);
}

export function buildExpandButtonText(isExpanded: boolean): string {
  return isExpanded ? "Show Less" : "View All";
}

export function HouseMemberList({ members, houseNumber }: HouseMemberListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreThanPreview = calculateHasMoreThanPreview(members);
  const visibleMembers = useMemo(
    () => calculateVisibleMembers(members, isExpanded),
    [isExpanded, members],
  );

  return (
    <View style={styles.memberSection}>
      <View style={styles.memberHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.memberHeaderTitle}>House {houseNumber}</Text>
          <Text style={styles.memberHeaderSubtitle}>{members.length} occupants</Text>
        </View>
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
                testID={member.isCurrentUser ? "current-user-avatar" : "member-avatar"}
                style={[styles.avatar, member.isCurrentUser && styles.avatarCurrentUser]}
              >
                <MemberAvatar member={member} />
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>
                  {member.name}
                  {member.isCurrentUser && <Text style={styles.currentUserLabel}> (You)</Text>}
                </Text>
                {member.wristNumber ? (
                  <Text style={styles.memberWristNumber}>Wrist #{member.wristNumber}</Text>
                ) : null}
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
  headerLeft: {
    flexDirection: "column",
    gap: 2,
  },
  memberHeaderTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  memberHeaderSubtitle: {
    fontSize: typography.xs,
    color: colors.textTertiary,
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
  avatarCurrentUser: {
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
  currentUserLabel: {
    color: colors.primary,
  },
  memberWristNumber: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
});
