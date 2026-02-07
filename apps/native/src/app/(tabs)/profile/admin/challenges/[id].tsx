import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors, spacing, borderRadius, typography } from '../../../../../styles';

export default function EditChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const challengeId = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0] ?? '';

  const { data: challenge, isLoading } = useQuery({
    ...trpc.challenge.getById.queryOptions({ id: challengeId, tripId }),
    enabled: !!challengeId && !!tripId,
  });

  const [title, setTitle] = useState('');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!challenge) return;
    setTitle(challenge.name ?? '');
    setPoints(String(challenge.points ?? ''));
    setDescription(challenge.description ?? '');
  }, [challenge]);

  const updateMutation = useMutation(
    trpc.challenge.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.challenge.getAllByTrip.queryOptions({ tripId }).queryKey,
        });
        router.back();
      },
      onError: (error) => {
        Alert.alert('Error', `Failed to update challenge: ${error.message}`);
      },
    }),
  );

  const handleSave = () => {
    if (!title.trim() || !points.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    updateMutation.mutate({
      id: challengeId,
      tripId,
      name: title.trim(),
      description: description.trim() || undefined,
      points: parseInt(points, 10),
    });
  };

  if (!tripId || !challengeId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Missing challenge context.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
      <StatusBar style="light" />
      <ScrollView style={{ flex: 1, padding: spacing.lg }}>
        <Text style={{
          fontSize: typography.xxl,
          fontWeight: typography.bold,
          color: colors.white,
          marginBottom: spacing.lg,
        }}>
          Edit Challenge
        </Text>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Challenge Title
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
            }}
            placeholder="e.g. Campus Marathon"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Reward PTS
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
            }}
            placeholder="500"
            placeholderTextColor={colors.textTertiary}
            value={points}
            onChangeText={setPoints}
            keyboardType="numeric"
          />
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: typography.xs,
            fontWeight: typography.bold,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.sm,
          }}>
            Description
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.cardDark,
              borderWidth: 1,
              borderColor: colors.borderDark,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: colors.white,
              fontSize: typography.base,
              textAlignVertical: 'top',
              minHeight: 120,
            }}
            placeholder="Describe the goal of this challenge..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: colors.primary,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }}
        >
          <Text style={{
            fontSize: typography.lg,
            fontWeight: typography.bold,
            color: colors.backgroundDark,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
