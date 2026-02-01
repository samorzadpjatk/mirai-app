import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing } from "../../../../styles";
import { useAppSafeAreaInsets } from "~/contexts/safeArea";
import { useTRPC } from "@integral-2025-app/trpc/client";
import { EditGroupButton } from "~/components/trips/groups/details/EditGroupButton";
import { GroupDetailsHero } from "~/components/trips/groups/details/GroupDetailsHero";
import { GroupDetailsLoadingState } from "~/components/trips/groups/details/GroupDetailsLoadingState";
import { GroupMemberList } from "~/components/trips/groups/details/GroupMemberList";
import { GroupNotFoundState } from "~/components/trips/groups/details/GroupNotFoundState";
import { GroupStatsGrid } from "~/components/trips/groups/details/GroupStatsGrid";

export default function GroupDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const groupId = typeof params.id === "string" ? params.id : params.id?.[0];
  const trpc = useTRPC();

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const { data: group, isLoading: groupLoading } = useQuery({
    ...trpc.group.getById.queryOptions({ id: groupId ?? "" }),
    enabled: !!groupId,
  });

  const insets = useAppSafeAreaInsets();

  if (!groupId || groupLoading) {
    return <GroupDetailsLoadingState />;
  }

  if (!group) {
    return <GroupNotFoundState onGoBack={() => router.back()} />;
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const f = (firstName ?? "")[0] ?? "";
    const l = (lastName ?? "")[0] ?? "";
    const initials = `${f}${l}`.toUpperCase();
    return initials || "?";
  };

  const organizerId = group.organizer?.id;
  const isOrganizer = currentUser?.id === organizerId;
  const memberList = group.participants.map((p) => ({
    id: p.user.id,
    name: `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim(),
    initials: getInitials(p.user.firstName, p.user.lastName),
    role: p.user.id === organizerId ? "Group Leader" : "Member",
    isLeader: p.user.id === organizerId,
  }));

  return (
    <View style={styles.container}>
      {isOrganizer && (
        <EditGroupButton
          onPress={() => router.push(`/trips/groups/edit/${groupId}`)}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <GroupDetailsHero
          code={group.code}
          name={group.name}
          imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuA8MAn8n3IaJjswDB2lqdVHYTyTtFC8mwYu-awTF4un03oNlmalYjpkjc9-KM5Ubufvl0KjHQ0tI7V6132RUpatGBP-QJm0cvZfemroos1IpzBKk09xZeP1zgX9tQoehd2iEk9xA9kAjF6acqqU8MPs1B7FIDwwVsZlcGyMaGYHFXTrcMnKikjKb1LzTgqBAoEpHT1W-TJu1ZGnoO2c4NYpUtkvVnS8AdKtykcAJTzT3OClIuUhZrCXpUyXtMYInV77lFDe8UCdkik"
        />

        {/* Stats Grid */}
        <GroupStatsGrid
          membersCount={group._count.participants}
          points={group.coins}
          code={group.code}
        />

        {/* Member Directory */}
        <GroupMemberList members={memberList} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
