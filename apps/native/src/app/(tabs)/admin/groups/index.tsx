import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../../../styles';
import { useAdminGroups } from '@mirai-app/admin-hooks';
import { AdminHeader } from '~/components/admin/AdminHeader';
import { GroupsSearchBar } from '~/components/admin/groups/GroupsSearchBar';
import { GroupManagementCard } from '~/components/admin/groups/GroupManagementCard';
import type { Group } from '@mirai-app/admin-hooks';

export default function AdminGroupsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  
  // Use the custom hook for all group operations
  const {
    groups,
    groupsLoading,
    groupsRefetching,
    groupsHasNextPage,
    groupsFetchingNextPage,
    fetchMoreGroups,
    refetchGroups,
  } = useAdminGroups(tripId ?? '');
  
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtered groups
  const filteredGroups = useMemo(() => {
    return groups?.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${group.organizer?.firstName ?? ''} ${group.organizer?.lastName ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [groups, searchTerm]);

  if (!tripId) {
    return (
      <View style={[styles.container, { paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.subtitle}>Trip ID is required</Text>
        </View>
      </View>
    );
  }

  // Event handlers
  const handleCreateGroup = () => {
    router.push({
      pathname: "/admin/groups/new",
      params: { tripId },
    });
  };

  const openEditModal = (group: Group) => {
    router.push({
      pathname: "/admin/groups/edit/[groupId]",
      params: { groupId: group.id, tripId },
    });
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <GroupManagementCard
      group={item}
      onEdit={openEditModal}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader
        title="Group Management"
        subtitle="Manage teams and roles"
        rightComponent={
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateGroup}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <GroupsSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search groups..."
      />

      {groupsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groupsList}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (groupsHasNextPage && !groupsFetchingNextPage && !groupsLoading) {
              void fetchMoreGroups();
            }
          }}
          onEndReachedThreshold={0.35}
          refreshing={groupsRefetching && !groupsFetchingNextPage}
          onRefresh={() => {
            void refetchGroups();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-circle" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No groups found' : 'No groups available'}
              </Text>
              {!searchTerm && (
                <TouchableOpacity
                  style={styles.emptyCreateButton}
                  onPress={handleCreateGroup}
                >
                  <Text style={styles.emptyCreateButtonText}>Create your first group</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            groupsFetchingNextPage ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs }}>
                  Loading more groups...
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  groupsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  emptyCreateButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  emptyCreateButtonText: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.medium,
  },
});
