import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../../../../styles";

export default function GroupsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();

  const [searchQuery, setSearchQuery] = useState("");

  const { data: groups, isLoading: groupsLoading } = useQuery({
    ...trpc.group.getAll.queryOptions({ tripId: tripId || '' }),
    enabled: !!tripId,
  });

  const filteredGroups = groups?.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!tripId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No trip selected</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Create Group Button */}
        <TouchableOpacity
          style={[styles.createButton, shadows.primaryGlow]}
          activeOpacity={0.9}
          onPress={() => router.push(`/trips/groups/create?tripId=${tripId}`)}
        >
          <Ionicons name="add-circle" size={20} color={colors.backgroundDark} />
          <Text style={styles.createButtonText}>CREATE GROUP</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={20} color={colors.primary} style={{ opacity: 0.6 }} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups by name..."
            placeholderTextColor="rgba(148, 163, 184, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Active Trip Clusters</Text>
          <Text style={styles.listHeaderCount}>
            {filteredGroups?.length || 0} Results
          </Text>
        </View>

        {/* Groups List */}
        {groupsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredGroups && filteredGroups.length > 0 ? (
          <View style={styles.groupsList}>
            {filteredGroups.map((group) => {
              const participantCount = group.participants.length;

              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/trips/groups/${group.id}`)}
                >
                  <View style={styles.groupImageContainer}>
                    <Image
                      source={{
                        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAS2zSMxTSKS4ahYOJMp2FPODvfnWpJWEx9wVJoEo-NKcKOJ3sToQUAvVyXxwV7M5kUP4YtUFW5ONJgD2pQvHLDnK_DmMoh89v7OnFKnNPTGk7XoT57atxbRKstTxXX-SxO3b9Vg0YDkpxvwIV6h3INZMiZkO7q-me9guXfO0PQKfepPR1UUWhTtyN_DkaPl0tGzOfpO66rVeit7Y6hAeigW4DJrqFN_RtUvpZRB2CC7eILz_EO85S_q_X7UvLXc3Zm8bgT_iWuww",
                      }}
                      style={styles.groupImage}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupCode}>{group.code}</Text>
                  </View>

                  <View style={styles.groupStats}>
                    <Text style={styles.groupMemberCount}>
                      {participantCount}
                    </Text>
                    <Text style={styles.groupMemberLabel}>MEMBERS</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No groups found</Text>
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  createButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
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
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    paddingLeft: 48,
    paddingRight: spacing.lg,
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  listHeaderTitle: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  listHeaderCount: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  loadingContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  groupsList: {
    gap: spacing.lg,
  },
  groupCard: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  groupImageContainer: {
    position: "relative",
  },
  groupImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  newBadge: {
    position: "absolute",
    top: -8,
    left: -8,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    textTransform: "uppercase",
  },
  groupInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  groupName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  groupCode: {
    fontSize: 12,
    fontWeight: typography.medium,
    color: colors.textMuted,
  },
  groupStats: {
    alignItems: "flex-end",
  },
  groupMemberCount: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  groupMemberLabel: {
    fontSize: 9,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: typography.base,
    color: colors.textMuted,
  },
});
