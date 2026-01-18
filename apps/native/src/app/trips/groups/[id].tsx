import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Pencil } from "@tamagui/lucide-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../../../styles";
import BackNavbar from "../../../components/BackNavbar";
import BottomMenu from "../../../components/BottomMenu";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { useAuth } from "@integral-2025-app/auth/client";

export default function GroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const trpc = useTRPC();
  const { session } = useAuth();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const { data: group, isLoading: groupLoading } = useQuery({
    ...trpc.group.getById.queryOptions({ id: groupId || '' }),
    enabled: !!groupId,
  });

  if (!groupId || groupLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const organizerId = group.organizer?.id;
  const isOrganizer = currentUser?.id === organizerId;
  const memberList = group.participants.map((p) => ({
    id: p.user.id,
    name: `${p.user.firstName} ${p.user.lastName}`,
    initials: getInitials(p.user.firstName, p.user.lastName),
    role: p.user.id === organizerId ? "Group Leader" : "Member",
    isLeader: p.user.id === organizerId,
  }));

  return (
    <View style={styles.container}>
      <BackNavbar
        title={group.name}
        rightAction={
          isOrganizer ? (
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() => router.push(`/trips/groups/edit/${groupId}`)}
            >
              <Pencil size={20} color={colors.white} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, shadows.primaryGlow]}>
          <View style={styles.heroImageContainer}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8MAn8n3IaJjswDB2lqdVHYTyTtFC8mwYu-awTF4un03oNlmalYjpkjc9-KM5Ubufvl0KjHQ0tI7V6132RUpatGBP-QJm0cvZfemroos1IpzBKk09xZeP1zgX9tQoehd2iEk9xA9kAjF6acqqU8MPs1B7FIDwwVsZlcGyMaGYHFXTrcMnKikjKb1LzTgqBAoEpHT1W-TJu1ZGnoO2c4NYpUtkvVnS8AdKtykcAJTzT3OClIuUhZrCXpUyXtMYInV77lFDe8UCdkik" }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroGradient} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTextSection}>
                <Text style={styles.squadLabel}>{group.code}</Text>
                <Text style={styles.groupName}>{group.name}</Text>
              </View>
              <View style={styles.shieldBadge}>
                <Shield size={32} color={colors.primary} />
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Members</Text>
            <Text style={styles.statValue}>
              {group._count.participants}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Points</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {group.coins.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Code</Text>
            <Text style={[styles.statValue, { color: colors.accentMagenta, fontSize: typography.base }]}>
              {group.code}
            </Text>
          </View>
        </View>

        {/* Member Directory */}
        <View style={styles.memberSection}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberHeaderTitle}>Member Directory</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.memberList}>
            {memberList.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <View
                    style={[
                      styles.avatar,
                      member.isLeader && styles.avatarLeader
                    ]}
                  >
                    <Text style={styles.avatarText}>{member.initials}</Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text
                      style={[
                        styles.memberRole,
                        member.isLeader && styles.memberRoleLeader
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
      </ScrollView>

      <BottomMenu activeTab="trips" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: typography.lg,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 80, // Space for BackNavbar
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.2)",
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroImageContainer: {
    height: 192,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(23, 24, 28, 0)",
    background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(23,24,28,1) 100%)",
  },
  heroContent: {
    padding: spacing.xl,
    marginTop: -48,
    position: "relative",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.lg,
  },
  heroTextSection: {
    flex: 1,
  },
  squadLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  groupName: {
    fontSize: 28,
    fontWeight: typography.bold,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: -1,
    lineHeight: 28,
  },
  groupMotto: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  shieldBadge: {
    backgroundColor: "rgba(0, 206, 209, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 206, 209, 0.3)",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    lineHeight: typography.xl,
  },
  statValueSecondary: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
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
