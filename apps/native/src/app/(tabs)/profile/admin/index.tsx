import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Logo from '~/components/Logo';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors, spacing, borderRadius, typography } from '../../../../styles';
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

const tiles = [
  {
    key: 'users',
    title: 'Users',
    subtitle: 'Manage accounts',
    icon: 'people',
    accent: colors.primary,
    accentBg: colors.primaryOpacity10,
    route: null,
  },
  {
    key: 'notifications',
    title: 'Notifications',
    subtitle: 'Schedules & alerts',
    icon: 'notifications',
    accent: colors.accentMagenta,
    accentBg: colors.magentaOpacity10,
    route: '/notifications',
  },
  {
    key: 'challenges',
    title: 'Challenges',
    subtitle: 'Points & tasks',
    icon: 'trophy',
    accent: colors.primary,
    accentBg: colors.primaryOpacity10,
    route: '/profile/admin/challenges',
  },
  {
    key: 'groups',
    title: 'Groups',
    subtitle: 'Teams & roles',
    icon: 'people-circle',
    accent: colors.slate400,
    accentBg: colors.cardDarkOpacity40,
    route: '/groups',
  },
];

export default function AdminPanelScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();
  const [isTripPickerOpen, setIsTripPickerOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const { data: trips, isLoading: tripsLoading } = useQuery(
    trpc.trip.getAll.queryOptions()
  );

  useEffect(() => {
    if (!selectedTripId && trips && trips.length > 0) {
      setSelectedTripId(trips[0].id);
    }
  }, [selectedTripId, trips]);

  const selectedTrip = useMemo(() => {
    if (!trips || !selectedTripId) return null;
    return trips.find((trip) => trip.id === selectedTripId) ?? null;
  }, [trips, selectedTripId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.logoContainer}>
            <Logo size={40} />
          </View>
          <Text style={styles.appName}>PJapp</Text>
        </View>
        <Text style={styles.adminLabel}>Admin Panel</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Control Center</Text>
            <TouchableOpacity
              style={styles.tripPicker}
              onPress={() => setIsTripPickerOpen(true)}
              activeOpacity={0.85}
            >
              {tripsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.tripPickerText}>
                    {selectedTrip?.name ?? 'Select trip'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.primary} />
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Quick access to admin tools</Text>
        </View>

        <View style={styles.tileGrid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={styles.tile}
              activeOpacity={0.9}
              onPress={() => {
                if (!tile.route) {
                  Alert.alert('Coming soon', 'This section is not available yet.');
                  return;
                }

                if (!selectedTripId) {
                  Alert.alert('Select trip', 'Choose a trip to manage before continuing.');
                  return;
                }

                const query = `?tripId=${encodeURIComponent(selectedTripId)}`;
                router.push(`${tile.route}${query}`);
              }}
            >
              <View style={[styles.tileIcon, { backgroundColor: tile.accentBg, borderColor: tile.accent }]}
              >
                <Ionicons name={tile.icon} size={24} color={tile.accent} />
              </View>
              <Text style={styles.tileTitle}>{tile.title}</Text>
              <Text style={styles.tileSubtitle}>{tile.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={isTripPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTripPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select trip</Text>
              <TouchableOpacity onPress={() => setIsTripPickerOpen(false)}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalList}>
              {(trips ?? []).map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedTripId(trip.id);
                    setIsTripPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{trip.name}</Text>
                  {selectedTripId === trip.id && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {(trips ?? []).length === 0 && !tripsLoading && (
                <Text style={styles.modalEmpty}>No trips available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundDarkOpacity80,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  adminLabel: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: '47%',
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderWhite5,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  tileTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  tileSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  tripPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
    maxWidth: 180,
  },
  tripPickerText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.blackOpacity40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.cardDark,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWhite5,
  },
  modalItemText: {
    color: colors.white,
    fontSize: typography.base,
    flex: 1,
    paddingRight: spacing.sm,
  },
  modalEmpty: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
