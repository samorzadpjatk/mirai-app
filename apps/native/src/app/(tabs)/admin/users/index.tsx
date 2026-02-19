import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '~/styles';
import { useAppSafeAreaInsets } from '~/contexts/SafeAreaInsetsContext';
import { useAdminUsers } from '~/hooks/admin/useAdminUsers';
import { AdminHeader } from '~/components/admin/AdminHeader';
import { AdminSearchBar } from '~/components/admin/AdminSearchBar';
import { UserCard } from '~/components/admin/users/UserCard';
import { GroupAssignmentModal } from '~/components/admin/groups/GroupAssignmentModal';
import { CreateUserModal } from '~/components/admin/users/CreateUserModal';
import { EditUserModal } from '~/components/admin/users/EditUserModal';
import { AdminAddFab } from '~/components/admin/common/AdminAddFab';
import type { User } from '~/hooks/admin/useAdminUsers';

export default function AdminUsersScreen() {
  const insets = useAppSafeAreaInsets();

  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState<'firstName' | 'lastName' | 'email' | 'wristNumber' | 'houseNumber' | 'groupName'>('firstName');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    usersLoading,
    groups,
    useSearchUsers,
    assignToGroup,
    updateName,
    updateWristNumber,
    updateHouseNumber,
    createUser,
    banUserUntil,
    deleteUser,
    isAssigningToGroup,
    isCreatingUser,
    isBanningUser,
    isDeletingUser,
    isUpdatingName,
    isUpdatingWristNumber,
    isUpdatingHouseNumber,
  } = useAdminUsers(tripId ?? '');

  const { data: searchedUsers } = useSearchUsers(searchTerm, currentPage, selectedField);

  const handleAssignGroup = useCallback((user: User) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  }, []);

  const renderUser = useCallback(({ item }: { item: User }) => {
    return (
      <UserCard
        user={item}
        onAssignGroup={handleAssignGroup}
        onEdit={handleEditUser}
      />
    );
  }, [handleAssignGroup, handleEditUser]);

  const handleCreateUser = useCallback(async (input: { firstName: string; lastName: string; email: string }) => {
    if (!tripId) return;
    try {
      await createUser({ ...input, tripId });
      setShowCreateUserModal(false);
      Alert.alert('User created', 'New user has been created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      Alert.alert('Error', message);
    }
  }, [createUser, tripId]);

  const handleSaveUser = useCallback(async (
    userId: string,
    firstName: string,
    lastName: string,
    wristNumber: string,
    houseNumber: string
  ) => {
    try {
      await Promise.all([
        updateName({ userId, firstName, lastName }),
        updateWristNumber(userId, wristNumber),
        updateHouseNumber(userId, houseNumber),
      ]);
      setShowEditUserModal(false);
      Alert.alert('Saved', 'User has been updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      Alert.alert('Error', message);
    }
  }, [updateName, updateWristNumber, updateHouseNumber]);

  const handleDeleteUser = useCallback((userId: string) => {
    if (!tripId) return;
    Alert.alert('Delete user', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser({ userId, tripId });
            setShowEditUserModal(false);
            Alert.alert('Deleted', 'User has been deleted.');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete user';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  }, [deleteUser, tripId]);

  const handleBanUser = useCallback((userId: string, bannedUntilMs: number, reason: string) => {
    Alert.alert('Ban user', 'Ban this user until the selected date and time?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Ban',
        style: 'destructive',
        onPress: async () => {
          try {
            await banUserUntil({ userId, bannedUntilMs, reason });
            setShowEditUserModal(false);
            Alert.alert('Banned', 'User has been banned.');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to ban user';
            Alert.alert('Error', message);
          }
        },
      },
    ]);
  }, [banUserUntil]);

  if (!tripId) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.backgroundDark, paddingTop: spacing.xl }]}>
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="Trip ID is required" />
      </View>
    );
  }

  const fieldOptions = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'wristNumber', label: 'Wrist Number' },
    { key: 'houseNumber', label: 'House Number' },
    { key: 'groupName', label: 'Group Name' },
  ];

  return (
    <View style={[{ flex: 1, backgroundColor: colors.backgroundDark, paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader
        title="User Management"
        subtitle="Manage accounts and permissions"
      />

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedField={selectedField}
        onFieldChange={setSelectedField}
        fields={fieldOptions}
      />

      {usersLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchedUsers?.users ?? []}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: spacing.md }}>No users found</Text>
            </View>
          }
        />
      )}

      <GroupAssignmentModal
        visible={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        user={selectedUser}
        groups={groups}
        onAssign={assignToGroup}
        loading={isAssigningToGroup}
      />

      <CreateUserModal
        visible={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onCreate={handleCreateUser}
        isCreating={isCreatingUser}
      />

      <EditUserModal
        visible={showEditUserModal}
        user={selectedUser}
        onClose={() => setShowEditUserModal(false)}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
        onBan={handleBanUser}
        isSaving={isUpdatingName || isUpdatingWristNumber || isUpdatingHouseNumber}
        isDeleting={isDeletingUser}
        isBanning={isBanningUser}
      />

      <AdminAddFab
        onPress={() => setShowCreateUserModal(true)}
        accessibilityLabel="Add user"
      />
    </View>
  );
}
