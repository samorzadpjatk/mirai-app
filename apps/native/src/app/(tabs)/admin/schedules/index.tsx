import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../../styles';
import { useAppSafeAreaInsets } from '../../../../contexts/SafeAreaInsetsContext';
import { useAdminSchedules } from '~/hooks/admin/useAdminSchedules';
import { AdminHeader } from '~/components/admin/AdminHeader';
import { ScheduleCard } from '~/components/admin/schedules/ScheduleCard';
import {
  CreateScheduleModal,
  EditScheduleModal,
  DeleteScheduleModal,
} from '~/components/admin/schedules/ScheduleModals';
import type { NotificationSchedule } from '~/hooks/admin/useAdminSchedules';

export default function AdminSchedulesScreen() {
  const insets = useAppSafeAreaInsets();

  // Use the custom hook for all schedule operations
  const {
    schedules,
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling,
  } = useAdminSchedules();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<NotificationSchedule | null>(null);

  // Event handlers
  const handleCreateSchedule = async (name: string, message: string, triggerTime: string) => {
    try {
      const [hours, minutes] = triggerTime.split(':');
      await createSchedule({ 
        name, 
        notificationTitle: name,
        notificationBody: message,
        hour: parseInt(hours ?? '9'),
        minute: parseInt(minutes ?? '0'),
        notificationType: 'custom' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create schedule');
    }
  };

  const handleUpdateSchedule = async (id: string, name: string, message: string, triggerTime: string) => {
    try {
      const [hours, minutes] = triggerTime.split(':');
      await updateSchedule({ 
        id,
        name,
        notificationTitle: name,
        notificationBody: message,
        hour: parseInt(hours ?? '9'),
        minute: parseInt(minutes ?? '0'),
      });
      setShowEditModal(false);
      setSelectedSchedule(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteSchedule(id);
      setShowDeleteModal(false);
      setSelectedSchedule(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete schedule');
    }
  };

  const handleToggleSchedule = async (schedule: NotificationSchedule) => {
    try {
      await toggleSchedule(schedule.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle schedule');
    }
  };

  const handleTriggerSchedule = (schedule: NotificationSchedule) => {
    Alert.alert(
      'Trigger Schedule',
      `Are you sure you want to trigger "${schedule.name}" now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger',
          style: 'default',
          onPress: () => {
            // For now, we'll show a placeholder since the manual trigger needs API verification
            Alert.alert('Info', 'Manual trigger functionality will be available soon');
          },
        },
      ]
    );
  };

  const openEditModal = (schedule: NotificationSchedule) => {
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  const openDeleteModal = (schedule: NotificationSchedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const renderSchedule = ({ item }: { item: NotificationSchedule }) => (
    <ScheduleCard
      schedule={item}
      onEdit={openEditModal}
      onDelete={openDeleteModal}
      onToggle={handleToggleSchedule}
      onTrigger={handleTriggerSchedule}
      isToggling={isToggling}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>No schedules found</Text>
      <TouchableOpacity
        style={styles.emptyCreateButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.emptyCreateButtonText}>Create your first schedule</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader
        title="Notification Schedules"
        subtitle="Manage automated notifications"
        rightComponent={
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      ) : (
        <FlatList
          data={Array.isArray(schedules) ? schedules : schedules?.schedules || []}
          renderItem={renderSchedule}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.schedulesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <CreateScheduleModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSchedule={handleCreateSchedule}
        isCreating={isCreating}
      />

      <EditScheduleModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        schedule={selectedSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        isUpdating={isUpdating}
      />

      <DeleteScheduleModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        schedule={selectedSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        isDeleting={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
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
  schedulesList: {
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
    marginBottom: spacing.lg,
  },
  emptyCreateButton: {
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
