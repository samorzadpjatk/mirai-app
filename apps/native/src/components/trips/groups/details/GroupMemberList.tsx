import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { graphqlClient } from "~/lib/graphql-client";

interface GroupMember {
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
  const avatarQuery = useQuery({
    queryKey: ["createDownloadUrl", member.avatarStoragePath],
    queryFn: async () => {
      if (!member.avatarStoragePath) return null;
      const result = await graphqlClient.request<{
        createDownloadUrl?: {
          signedUrl?: string;
        };
      }>(
        `
        query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
          createDownloadUrl(input: $input) {
            signedUrl
          }
        }
        `,
        {
          input: {
            storagePath: member.avatarStoragePath,
            expiresInSeconds: 60 * 60,
          },
        },
      );
      return result.createDownloadUrl?.signedUrl ?? null;
    },
    enabled: Boolean(member.avatarStoragePath),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  if (avatarQuery.data) {
    return (
      <Image
        source={{ uri: avatarQuery.data }}
        style={styles.avatarImage}
        contentFit="cover"
      />
    );
  }

  return <Text style={styles.avatarText}>{member.initials}</Text>;
}

export function GroupMemberList({ members }: GroupMemberListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreThanPreview = members.length > 3;
  const visibleMembers = useMemo(
    () => (isExpanded ? members : members.slice(0, 3)),
    [isExpanded, members],
  );

  return (
    <View style={styles.memberSection}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberHeaderTitle}>Member Directory</Text>
        {hasMoreThanPreview ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsExpanded((prev) => !prev)}
          >
            <Text style={styles.viewAllButton}>
              {isExpanded ? "Show Less" : "View All"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.memberList}>
        {visibleMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <View
                style={[styles.avatar, member.isLeader && styles.avatarLeader]}
              >
                <MemberAvatar member={member} />
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
