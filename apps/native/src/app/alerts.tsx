import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../styles';

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function AlertsScreen() {
  const trpc = useTRPC();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    ...trpc.notification.getAllMy.queryOptions({
      page,
      pageSize,
    }),
  });

  const notifications = data?.notifications || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderNotification = (notification: Notification) => (
    <View key={notification.id} style={styles.notificationCard}>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications" size={20} color={colors.primary} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationBody}>{notification.body}</Text>
        <View style={styles.notificationFooter}>
          {notification.createdBy && (
            <Text style={styles.notificationAuthor}>
              From: {notification.createdBy.firstName} {notification.createdBy.lastName}
            </Text>
          )}
          <Text style={styles.notificationTime}>
            {formatDate(notification.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {notifications.length > 0 ? `${notifications.length} notifications` : 'No new notifications'}
          </Text>
        </View>

        {/* Notifications List */}
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading notifications...</Text>
          </View>
        ) : notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => renderNotification(notification))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="alert-circle" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You don't have any notifications yet.{'\n'}Check back later!
            </Text>
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Page {page} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
              onPress={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <Text style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  notificationsList: {
    gap: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: spacing.md,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 206, 209, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  notificationBody: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  notificationAuthor: {
    fontSize: typography.xs,
    color: colors.primary,
  },
  notificationTime: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  paginationButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.3)',
  },
  paginationButtonDisabled: {
    opacity: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paginationButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  paginationButtonTextDisabled: {
    color: colors.textMuted,
  },
  paginationText: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
});
