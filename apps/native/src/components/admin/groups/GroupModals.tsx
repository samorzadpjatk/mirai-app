import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '~/styles';
import { AdminModal, AdminModalButton } from '../AdminModal';
import type { Group, User } from '~/hooks/admin/useAdminGroups';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, code: string) => void;
  isCreating: boolean;
}

export function CreateGroupModal({ visible, onClose, onCreateGroup, isCreating }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');

  const handleCreate = () => {
    if (!groupName.trim()) return;
    const code = groupName.trim().toUpperCase().slice(0, 4);
    onCreateGroup(groupName.trim(), code);
    setGroupName('');
  };

  const handleClose = () => {
    setGroupName('');
    onClose();
  };

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title="Create Group"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={handleClose} variant="cancel" />
          <AdminModalButton 
            title="Create" 
            onPress={handleCreate} 
            disabled={!groupName.trim()}
            loading={isCreating}
          />
        </>
      }
    >
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Group Name</Text>
        <TextInput
          style={styles.textInput}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </AdminModal>
  );
}

interface EditGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group | null;
  onUpdateGroup: (id: string, name: string) => void;
  isUpdating: boolean;
}

export function EditGroupModal({ visible, onClose, group, onUpdateGroup, isUpdating }: EditGroupModalProps) {
  const [groupName, setGroupName] = useState('');

  React.useEffect(() => {
    if (group) {
      setGroupName(group.name);
    } else {
      setGroupName('');
    }
  }, [group]);

  const handleUpdate = () => {
    if (!group || !groupName.trim()) return;
    onUpdateGroup(group.id, groupName.trim());
  };

  const handleClose = () => {
    setGroupName('');
    onClose();
  };

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title="Edit Group"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={handleClose} variant="cancel" />
          <AdminModalButton 
            title="Update" 
            onPress={handleUpdate} 
            disabled={!groupName.trim()}
            loading={isUpdating}
          />
        </>
      }
    >
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Group Name</Text>
        <TextInput
          style={styles.textInput}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Enter group name..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </AdminModal>
  );
}

interface DeleteGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group | null;
  onDeleteGroup: (id: string) => void;
  isDeleting: boolean;
}

export function DeleteGroupModal({ visible, onClose, group, onDeleteGroup, isDeleting }: DeleteGroupModalProps) {
  const handleDelete = () => {
    if (!group) return;
    onDeleteGroup(group.id);
  };

  return (
    <AdminModal
      visible={visible}
      onClose={onClose}
      title="Delete Group"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={onClose} variant="cancel" />
          <AdminModalButton 
            title="Delete" 
            onPress={handleDelete} 
            variant="danger"
            loading={isDeleting}
          />
        </>
      }
    >
      {group && (
        <View style={styles.deleteContent}>
          <Text style={styles.deleteWarning}>
            Are you sure you want to delete the group "{group.name}"?
          </Text>
          <Text style={styles.deleteSubWarning}>
            This action cannot be undone and will remove all members from the group.
          </Text>
          {group._count.participants > 0 && (
            <Text style={styles.memberCount}>
              {group._count.participants} participants will be affected.
            </Text>
          )}
        </View>
      )}
    </AdminModal>
  );
}

interface AssignOrganizerModalProps {
  visible: boolean;
  onClose: () => void;
  group: Group | null;
  users: User[];
  onAssignOrganizer: (groupId: string, organizerId: string) => void;
  isAssigning: boolean;
}

export function AssignOrganizerModal({ 
  visible, 
  onClose, 
  group, 
  users, 
  onAssignOrganizer, 
  isAssigning 
}: AssignOrganizerModalProps) {
  const [selectedOrganizer, setSelectedOrganizer] = useState<User | null>(null);

  React.useEffect(() => {
    if (!visible) {
      setSelectedOrganizer(null);
    }
  }, [visible]);

  const handleAssign = () => {
    if (!group || !selectedOrganizer) return;
    onAssignOrganizer(group.id, selectedOrganizer.id);
  };

  return (
    <AdminModal
      visible={visible}
      onClose={onClose}
      title="Assign Organizer"
      maxHeight={500}
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={onClose} variant="cancel" />
          <AdminModalButton 
            title="Assign" 
            onPress={handleAssign} 
            disabled={!selectedOrganizer}
            loading={isAssigning}
          />
        </>
      }
    >
      {group && (
        <>
          <View style={styles.modalUserInfo}>
            <Text style={styles.modalGroupName}>{group.name}</Text>
            <Text style={styles.currentOrganizer}>
              Current organizer: {group.organizer.firstName} {group.organizer.lastName}
            </Text>
          </View>

          <ScrollView style={styles.usersList}>
            {users?.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userOption,
                  selectedOrganizer?.id === user.id && styles.userOptionSelected,
                ]}
                onPress={() => setSelectedOrganizer(user)}
              >
                <View style={styles.userOptionInfo}>
                  <Text style={[
                    styles.userOptionName,
                    selectedOrganizer?.id === user.id && styles.userOptionNameSelected,
                  ]}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={styles.userOptionEmail}>{user.email}</Text>
                </View>
                {selectedOrganizer?.id === user.id && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </AdminModal>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    paddingBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  deleteContent: {
    paddingBottom: spacing.md,
  },
  deleteWarning: {
    fontSize: typography.base,
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  deleteSubWarning: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  memberCount: {
    fontSize: typography.sm,
    color: colors.warning,
    textAlign: 'center',
    fontWeight: typography.medium,
  },
  modalUserInfo: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite5,
  },
  modalGroupName: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  currentOrganizer: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  usersList: {
    maxHeight: 300,
  },
  userOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite5,
  },
  userOptionSelected: {
    backgroundColor: colors.primaryOpacity10,
  },
  userOptionInfo: {
    flex: 1,
  },
  userOptionName: {
    fontSize: typography.base,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  userOptionNameSelected: {
    color: colors.primary,
    fontWeight: typography.medium,
  },
  userOptionEmail: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
});
