import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '~/styles';
import { AdminModal, AdminModalButton } from '../AdminModal';
import type { User, Group } from '~/hooks/admin/useAdminUsers';

interface GroupAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  groups: Group[];
  onAssign: (userId: string, groupId: string) => Promise<{ id: string; createdAt: Date; updatedAt: Date; tripId: string; groupId: string | null; userId: string; wristNumber: string | null; houseNumber: string | null }>;
  loading?: boolean;
}

export function GroupAssignmentModal({
  visible,
  onClose,
  user,
  groups,
  onAssign,
  loading = false,
}: GroupAssignmentModalProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleAssign = async () => {
    if (!user || !selectedGroup) return;
    
    try {
      await onAssign(user.id, selectedGroup.id);
      setSelectedGroup(null);
      onClose();
    } catch (error) {
      console.error('Failed to assign to group:', error);
    }
  };

  const handleClose = () => {
    setSelectedGroup(null);
    onClose();
  };

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title="Assign to Group"
      actions={
        <>
          <AdminModalButton
            title="Cancel"
            onPress={handleClose}
            variant="cancel"
          />
          <AdminModalButton
            title="Assign"
            onPress={handleAssign}
            disabled={!selectedGroup || loading}
            loading={loading}
          />
        </>
      }
    >
      {user && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={{ fontSize: typography.base, fontWeight: 'bold', color: colors.white, marginBottom: spacing.xs }}>
            {[user.firstName, user.lastName].filter(Boolean).join(' ') ?? user.email ?? 'Unknown User'}
          </Text>
          <Text style={{ fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
            {user.email}
          </Text>
          {user.group && (
            <Text style={{ fontSize: typography.sm, color: colors.primary }}>
              Current: {user.group.name}
            </Text>
          )}
        </View>
      )}

      <ScrollView style={{ maxHeight: 300 }}>
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderWhite5,
              },
              selectedGroup?.id === group.id && {
                backgroundColor: colors.primaryOpacity10,
              },
            ]}
            onPress={() => setSelectedGroup(group)}
          >
            <Text style={[
              { fontSize: typography.base, color: colors.white, flex: 1 },
              selectedGroup?.id === group.id && {
                color: colors.primary,
                fontWeight: typography.medium,
              },
            ]}>
              {group.name}
            </Text>
            {selectedGroup?.id === group.id && (
              <Ionicons name="checkmark" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </AdminModal>
  );
}
