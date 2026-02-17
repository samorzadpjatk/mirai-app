import { View, Text } from 'react-native';
import { colors, spacing, typography } from '~/styles';
import { AdminModal, AdminModalButton } from '../AdminModal';
import type { User } from '~/hooks/admin/useAdminUsers';

interface AdminToggleModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onToggle: (userId: string, currentRole: string) => Promise<void>;
  loading?: boolean;
}

export function AdminToggleModal({
  visible,
  onClose,
  user,
  onToggle,
  loading = false,
}: AdminToggleModalProps) {
  const handleToggle = async () => {
    if (!user) return;
    
    try {
      await onToggle(user.id, user.role);
      onClose();
    } catch (error) {
      console.error('Failed to toggle admin status:', error);
    }
  };

  return (
    <AdminModal
      visible={visible}
      onClose={onClose}
      title="Admin Permissions"
      actions={
        <>
          <AdminModalButton
            title="Cancel"
            onPress={onClose}
            variant="cancel"
          />
          <AdminModalButton
            title={user?.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
            onPress={handleToggle}
            variant={user?.role === 'ADMIN' ? 'danger' : 'primary'}
            disabled={loading}
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
          <Text style={{ fontSize: typography.sm, color: colors.textSecondary }}>
            Current status:{' '}
            <Text style={user.role === 'ADMIN' ? { color: colors.warning, fontWeight: 'bold' } : { color: colors.success, fontWeight: 'bold' }}>
              {user.role}
            </Text>
          </Text>
        </View>
      )}
    </AdminModal>
  );
}
