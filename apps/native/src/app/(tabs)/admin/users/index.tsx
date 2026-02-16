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
import { AdminToggleModal } from '~/components/admin/common/AdminToggleModal';
import type { User } from '~/hooks/admin/useAdminUsers';

export default function AdminUsersScreen() {
  const insets = useAppSafeAreaInsets();
  
  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedField, setSelectedField] = useState<'firstName' | 'lastName' | 'email' | 'wristNumber' | 'houseNumber' | 'groupName'>('firstName');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    usersLoading,
    groups,
    useSearchUsers,
    assignToGroup,
    toggleAdmin,
    updateWristNumber,
    updateHouseNumber,
    isAssigningToGroup,
    isTogglingAdmin,
  } = useAdminUsers(tripId ?? '');

  const { data: searchedUsers } = useSearchUsers(searchTerm, currentPage, selectedField);

  const handleAssignGroup = useCallback((user: User) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  }, []);

  const handleToggleAdmin = useCallback((user: User) => {
    setSelectedUser(user);
    setShowAdminModal(true);
  }, []);

  const handleUpdateWristNumber = useCallback((userId: string, wristNumber: string) => {
    updateWristNumber(userId, wristNumber).catch((error) => {
      Alert.alert('Error', `Failed to update wrist number: ${error.message}`);
    });
  }, [updateWristNumber]);

  const handleUpdateHouseNumber = useCallback((userId: string, houseNumber: string) => {
    updateHouseNumber(userId, houseNumber).catch((error) => {
      Alert.alert('Error', `Failed to update house number: ${error.message}`);
    });
  }, [updateHouseNumber]);

  const renderUser = useCallback(({ item }: { item: User }) => {
    return (
      <UserCard
        user={item}
        onUpdateWristNumber={handleUpdateWristNumber}
        onUpdateHouseNumber={handleUpdateHouseNumber}
        onAssignGroup={handleAssignGroup}
        onToggleAdmin={handleToggleAdmin}
      />
    );
  }, [handleUpdateWristNumber, handleUpdateHouseNumber, handleAssignGroup, handleToggleAdmin]);

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

      <AdminHeader title="User Management" subtitle="Manage accounts and permissions" />

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

      <AdminToggleModal
        visible={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        user={selectedUser}
        onToggle={toggleAdmin}
        loading={isTogglingAdmin}
      />
    </View>
  );
}

