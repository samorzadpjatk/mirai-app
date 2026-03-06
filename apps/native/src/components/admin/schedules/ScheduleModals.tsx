import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdminModal, AdminModalButton } from '../AdminModal';
import { colors, spacing, typography } from '~/styles';
import {
  FormField,
  ThemedTextInput,
} from '~/components/common/ui';
import type { NotificationSchedule } from '~/hooks/admin/useAdminSchedules';

interface CreateScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateSchedule: (name: string, message: string, triggerTime: string) => void;
  isCreating: boolean;
}

export function CreateScheduleModal({ 
  visible, 
  onClose, 
  onCreateSchedule, 
  isCreating 
}: CreateScheduleModalProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [triggerTime, setTriggerTime] = useState('');

  const handleCreate = () => {
    if (!name.trim() || !message.trim() || !triggerTime.trim()) {
      return;
    }
    onCreateSchedule(name.trim(), message.trim(), triggerTime.trim());
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setMessage('');
    setTriggerTime('');
  };

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title="Create Schedule"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={handleClose} variant="cancel" />
          <AdminModalButton 
            title="Create" 
            onPress={handleCreate} 
            disabled={!name.trim() || !message.trim() || !triggerTime.trim()}
            loading={isCreating}
          />
        </>
      }
    >
      <FormField label="Schedule Name" required>
        <ThemedTextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter schedule name..."
        />
      </FormField>

      <FormField label="Message" required>
        <ThemedTextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Enter notification message..."
          multiline
          numberOfLines={3}
        />
      </FormField>

      <FormField label="Trigger Time" required>
        <ThemedTextInput
          value={triggerTime}
          onChangeText={setTriggerTime}
          placeholder="e.g., 09:00, 14:30"
        />
      </FormField>
    </AdminModal>
  );
}

interface EditScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: NotificationSchedule | null;
  onUpdateSchedule: (id: string, name: string, message: string, triggerTime: string) => void;
  isUpdating: boolean;
}

export function EditScheduleModal({ 
  visible, 
  onClose, 
  schedule, 
  onUpdateSchedule, 
  isUpdating 
}: EditScheduleModalProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [triggerTime, setTriggerTime] = useState('');

  const resetForm = () => {
    setName('');
    setMessage('');
    setTriggerTime('');
  };

  React.useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setMessage(schedule.message);
      setTriggerTime(schedule.triggerTime);
    } else {
      resetForm();
    }
  }, [schedule]);

  const handleUpdate = () => {
    if (!schedule || !name.trim() || !message.trim() || !triggerTime.trim()) {
      return;
    }
    onUpdateSchedule(schedule.id, name.trim(), message.trim(), triggerTime.trim());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AdminModal
      visible={visible}
      onClose={handleClose}
      title="Edit Schedule"
      actions={
        <>
          <AdminModalButton title="Cancel" onPress={handleClose} variant="cancel" />
          <AdminModalButton 
            title="Update" 
            onPress={handleUpdate} 
            disabled={!schedule || !name.trim() || !message.trim() || !triggerTime.trim()}
            loading={isUpdating}
          />
        </>
      }
    >
      <FormField label="Schedule Name" required>
        <ThemedTextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter schedule name..."
        />
      </FormField>

      <FormField label="Message" required>
        <ThemedTextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Enter notification message..."
          multiline
          numberOfLines={3}
        />
      </FormField>

      <FormField label="Trigger Time" required>
        <ThemedTextInput
          value={triggerTime}
          onChangeText={setTriggerTime}
          placeholder="e.g., 09:00, 14:30"
        />
      </FormField>
    </AdminModal>
  );
}

interface DeleteScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: NotificationSchedule | null;
  onDeleteSchedule: (id: string) => void;
  isDeleting: boolean;
}

export function DeleteScheduleModal({ 
  visible, 
  onClose, 
  schedule, 
  onDeleteSchedule, 
  isDeleting 
}: DeleteScheduleModalProps) {
  const handleDelete = () => {
    if (!schedule) return;
    onDeleteSchedule(schedule.id);
  };

  return (
    <AdminModal
      visible={visible}
      onClose={onClose}
      title="Delete Schedule"
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
      {schedule && (
        <View style={styles.deleteContent}>
          <Text style={styles.deleteWarning}>
            Are you sure you want to delete the schedule "{schedule.name}"?
          </Text>
          <Text style={styles.deleteSubWarning}>
            This action cannot be undone and will stop all scheduled notifications.
          </Text>
        </View>
      )}
    </AdminModal>
  );
}

const styles = StyleSheet.create({
  deleteContent: {
    paddingBottom: spacing.md,
  },
  deleteWarning: {
    fontSize: typography.base,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  deleteSubWarning: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
