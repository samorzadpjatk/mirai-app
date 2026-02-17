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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../../styles';
import { useAppSafeAreaInsets } from '../../../../contexts/SafeAreaInsetsContext';
import { useAdminNotifications } from '~/hooks/admin/useAdminNotifications';
import { AdminHeader } from '~/components/admin/AdminHeader';
import { NotificationFilters } from '~/components/admin/notifications/NotificationFilters';
import { NotificationCard } from '~/components/admin/notifications/NotificationCard';
import type { Notification } from '~/hooks/admin/useAdminNotifications';

export default function AdminNotificationsScreen() {
  const insets = useAppSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState('');

  // Use the custom hook for all notification operations
  const {
    notifications,
    pagination,
    isLoading,
    page,
    status,
    setPage,
    setStatus,
    retryNotification,
    deleteNotification,
    isRetrying,
    isDeleting,
  } = useAdminNotifications();

  // Memoized filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications || [];

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(notification => 
        notification.pushes.some(push => push.status === status)
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(term) ||
        notification.body.toLowerCase().includes(term) ||
        notification.createdBy.firstName?.toLowerCase().includes(term) ||
        notification.createdBy.lastName?.toLowerCase().includes(term)
      );
    }

    return filtered as Notification[];
  }, [notifications, status, searchTerm]);

  // Event handlers
  const handleRetry = async (notificationId: string) => {
    try {
      await retryNotification(notificationId);
    } catch {
      Alert.alert('Error', 'Failed to retry notification');
    }
  };

  const handleDelete = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNotification(notificationId).catch(() => {
              Alert.alert('Error', 'Failed to delete notification');
            });
          },
        },
      ]
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationCard
      notification={item}
      onRetry={handleRetry}
      onDelete={handleDelete}
      isRetrying={isRetrying}
      isDeleting={isDeleting}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        {searchTerm || status !== 'all' 
          ? 'No notifications found' 
          : 'No notifications available'}
      </Text>
    </View>
  );

  const renderPagination = () => {
    if (!pagination) return null;
    
    const hasPrevious = page > 1;
    const hasNext = page < pagination.totalPages;
    
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, !hasPrevious && styles.paginationButtonDisabled]}
          onPress={() => setPage(page - 1)}
          disabled={!hasPrevious}
        >
          <Ionicons name="chevron-back" size={16} color={hasPrevious ? colors.white : colors.textSecondary} />
        </TouchableOpacity>
        
        <Text style={styles.paginationText}>
          Page {page} of {pagination.totalPages}
        </Text>
        
        <TouchableOpacity
          style={[styles.paginationButton, !hasNext && styles.paginationButtonDisabled]}
          onPress={() => setPage(page + 1)}
          disabled={!hasNext}
        >
          <Ionicons name="chevron-forward" size={16} color={hasNext ? colors.white : colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: spacing.xl, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <AdminHeader
        title="Notifications"
        subtitle="Manage push notifications"
      />

      <NotificationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        status={status}
        onStatusChange={setStatus}
      />

      {/* Pagination controls - show only when notifications exist */}
      {!isLoading && filteredNotifications.length > 0 && renderPagination()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
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
  notificationsList: {
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
  paginationContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    width: '100%',
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  paginationButtonDisabled: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  paginationText: {
    fontSize: typography.base,
    color: colors.white,
    fontWeight: typography.medium,
    minWidth: 100,
    textAlign: 'center' as const,
  },
});
