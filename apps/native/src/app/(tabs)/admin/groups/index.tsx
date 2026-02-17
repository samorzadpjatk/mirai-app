import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSafeAreaInsets } from '~/contexts/SafeAreaInsetsContext';
import { colors, spacing, borderRadius, typography } from '../../../../styles';
import { useAdminGroups } from '~/hooks/admin/useAdminGroups';
import { AdminHeader } from '~/components/admin/AdminHeader';
import { GroupsSearchBar } from '~/components/admin/groups/GroupsSearchBar';
import { GroupManagementCard } from '~/components/admin/groups/GroupManagementCard';
import {
  CreateGroupModal,
  EditGroupModal,
  DeleteGroupModal,
  AssignOrganizerModal,
} from '~/components/admin/groups/GroupModals';
import type { Group, User } from '~/hooks/admin/useAdminGroups';

export default function AdminGroupsScreen() {
  const insets = useAppSafeAreaInsets();
  const router = useRouter();
  
  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  
  // Use the custom hook for all group operations
  const {
    groups,
    groupsLoading,
    users,
    usersLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    isCreatingGroup,
    isUpdatingGroup,
    isDeletingGroup,
  } = useAdminGroups(tripId ?? '');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtered groups
  const filteredGroups = useMemo(() => {
    return groups?.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${group.organizer.firstName} ${group.organizer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
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
  const handleCreateGroup = async (name: string, code: string) => {
    try {
      await createGroup(name, code);
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleUpdateGroup = async (id: string, name: string) => {
    try {
      await updateGroup(id, name);
      setShowEditModal(false);
      setSelectedGroup(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteGroup(id);
      setShowDeleteModal(false);
      setSelectedGroup(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete group');
    }
  };

  const handleAssignOrganizer = async (groupId: string, organizerId: string) => {
    try {
      await updateGroup(groupId, '', organizerId);
      setShowOrganizerModal(false);
      setSelectedGroup(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to assign organizer');
    }
  };

  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setShowEditModal(true);
  };

  const openDeleteModal = (group: Group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const openOrganizerModal = (group: Group) => {
    setSelectedGroup(group);
    setShowOrganizerModal(true);
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <GroupManagementCard
      group={item}
      onEdit={openEditModal}
      onAssignOrganizer={openOrganizerModal}
      onDelete={openDeleteModal}
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
            onPress={() => setShowCreateModal(true)}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-circle" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No groups found' : 'No groups available'}
              </Text>
              {!searchTerm && (
                <TouchableOpacity
                  style={styles.emptyCreateButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Text style={styles.emptyCreateButtonText}>Create your first group</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
        isCreating={isCreatingGroup}
      />

      <EditGroupModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        group={selectedGroup}
        onUpdateGroup={handleUpdateGroup}
        isUpdating={isUpdatingGroup}
      />

      <DeleteGroupModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        group={selectedGroup}
        onDeleteGroup={handleDeleteGroup}
        isDeleting={isDeletingGroup}
      />

      <AssignOrganizerModal
        visible={showOrganizerModal}
        onClose={() => setShowOrganizerModal(false)}
        group={selectedGroup}
        users={users}
        onAssignOrganizer={handleAssignOrganizer}
        isAssigning={isUpdatingGroup}
      />
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
