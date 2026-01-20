import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { useAuth } from '@integral-2025-app/auth/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { colors, spacing, borderRadius, typography } from '../../styles';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function ProfileScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [notificationStatus, setNotificationStatus] = useState<'loading' | 'granted' | 'denied' | 'undetermined'>('loading');

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());
  const { data: subscriptionStatus } = useQuery(trpc.notification.getSubscriptionStatus.queryOptions());

  const subscribeMutation = useMutation({
    ...trpc.notification.subscribe.mutationOptions(),
    onSuccess: () => {
      Alert.alert('Success', 'Push notifications enabled!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to subscribe: ${error.message}`);
    },
  });

  const unsubscribeMutation = useMutation({
    ...trpc.notification.unsubscribe.mutationOptions(),
    onSuccess: () => {
      Alert.alert('Success', 'Push notifications disabled');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to unsubscribe: ${error.message}`);
    },
  });

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    try {
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      const finalStatus = existingStatus;

      setNotificationStatus(existingStatus);

      // If not granted, request permission (but don't auto-subscribe)
      if (existingStatus !== 'granted') {
        return;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Auto-subscribe if permission already granted
      if (tokenData.data && !subscriptionStatus?.isSubscribed) {
        await subscribeMutation.mutateAsync({ token: tokenData.data });
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      if (subscriptionStatus?.isSubscribed) {
        // Unsubscribe
        await unsubscribeMutation.mutateAsync();
      } else {
        // Request permission if needed
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          setNotificationStatus(status);
        }

        if (finalStatus !== 'granted') {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings');
          return;
        }

        // Get token and subscribe
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        if (tokenData.data) {
          await subscribeMutation.mutateAsync({ token: tokenData.data });
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.accentMagenta;
      case 'moderator':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'moderator':
        return 'Moderator';
      default:
        return 'User';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
            </Text>
          </View>

          <Text style={styles.userName}>
            {currentUser?.firstName} {currentUser?.lastName}
          </Text>

          <View style={styles.roleBadge}>
            <Ionicons name="shield" size={14} color={getRoleColor(currentUser?.role || 'user')} />
            <Text style={[styles.roleText, { color: getRoleColor(currentUser?.role || 'user') }]}>
              {getRoleLabel(currentUser?.role || 'user')}
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{currentUser?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {currentUser?.id}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="person" size={20} color={colors.white} />
            </View>
            <Text style={styles.actionText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              subscriptionStatus?.isSubscribed && styles.activeButton
            ]}
            onPress={handleToggleNotifications}
          >
            <View style={[
              styles.actionIcon,
              subscriptionStatus?.isSubscribed && styles.activeIcon
            ]}>
              {subscriptionStatus?.isSubscribed ? (
                <Ionicons name="notifications" size={20} color={colors.primary} />
              ) : (
                <Ionicons name="notifications-off" size={20} color={colors.white} />
              )}
            </View>
            <Text style={styles.actionText}>
              {subscriptionStatus?.isSubscribed ? 'Notifications Enabled' : 'Enable Notifications'}
            </Text>
            {subscriptionStatus?.isSubscribed && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ON</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleSignOut}>
            <View style={[styles.actionIcon, styles.dangerIcon]}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.actionText, styles.dangerText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>PJapp v1.0.0</Text>
          <Text style={styles.appInfoText}>© 2025 PJATK</Text>
        </View>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardDark,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  userName: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 206, 209, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 206, 209, 0.3)',
  },
  roleText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 206, 209, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardDark,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 206, 209, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
  },
  dangerButton: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  dangerIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  dangerText: {
    color: '#ef4444',
  },
  activeButton: {
    borderColor: 'rgba(0, 206, 209, 0.3)',
  },
  activeIcon: {
    backgroundColor: 'rgba(0, 206, 209, 0.2)',
  },
  activeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: colors.backgroundDark,
    letterSpacing: 1,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  appInfoText: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
});
