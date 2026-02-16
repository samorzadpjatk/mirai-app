import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '~/styles';
import { useAdminChallengesByTrip } from '~/hooks/admin/useAdminChallengesByTrip';
import { AdminHeader } from '~/components/admin/AdminHeader';
import { AddChallengeButton } from '~/components/admin/challenges/AddChallengeButton';
import { ChallengeListItem } from '~/components/admin/challenges/ChallengeListItem';
import type { ChallengeItem } from '~/hooks/admin/useAdminChallengesByTrip';

export default function AdminChallengesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0] ?? '';

  const {
    challenges,
    isLoading,
    deleteChallenge,
    stats,
  } = useAdminChallengesByTrip(tripId);

  const handleAddChallenge = useCallback(() => {
    if (!tripId) {
      Alert.alert('Error', 'No trip found to attach this challenge');
      return;
    }
    router.push({
      pathname: '/admin/challenges/new',
      params: { tripId },
    });
  }, [router, tripId]);

  const handleDeleteChallenge = useCallback((id: string) => {
    Alert.alert(
      'Delete Challenge',
      'Are you sure you want to delete this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteChallenge(id),
        },
      ],
    );
  }, [deleteChallenge]);

  const renderChallenge = useCallback(({ item }: { item: ChallengeItem }) => {
    return (
      <ChallengeListItem
        challenge={item}
        onDelete={deleteChallenge}
        onDeletePress={handleDeleteChallenge}
      />
    );
  }, [deleteChallenge, handleDeleteChallenge]);

  if (!tripId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, paddingTop: spacing.xl }}>
        <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />
        <AdminHeader title="Error" subtitle="Trip ID is required" />
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={{
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderDark,
      backgroundColor: colors.cardDark,
      alignItems: 'center',
    }}>
      <Text style={{ color: colors.textSecondary }}>No challenges found yet.</Text>
    </View>
  );

  const renderStats = () => (
    <View style={{
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    }}>
      <View style={{
        flex: 1,
        backgroundColor: colors.cardDark,
        borderWidth: 1,
        borderColor: colors.borderDark,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
      }}>
        <Text style={{
          fontSize: typography.xs,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 2,
          marginBottom: spacing.xs,
        }}>
          Total
        </Text>
        <Text style={{
          fontSize: typography.xl,
          fontWeight: typography.bold,
          color: colors.primary,
          lineHeight: 24,
        }}>
          {stats.totalChallenges}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: 96,
          paddingTop: spacing.xl
        }}
      >
        <AdminHeader
          title="Challenge Management"
          subtitle="Manage challenges and points"
        />

        <View style={{ marginBottom: spacing.lg }}>
          <AddChallengeButton onPress={handleAddChallenge} />
        </View>

        {renderStats()}

        <View style={{ marginBottom: spacing.md }}>
          <Text style={{
            fontSize: typography.lg,
            fontWeight: typography.bold,
            color: colors.white,
            letterSpacing: -0.5,
            marginBottom: spacing.md,
          }}>
            Existing Challenges
          </Text>
        </View>

        <FlatList
          data={challenges}
          renderItem={renderChallenge}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ gap: spacing.md }}
        />
      </ScrollView>
    </View>
  );
}
