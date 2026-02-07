import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors } from '../../../../../styles';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface ChallengeItem {
  id: string;
  title: string;
  description: string | null;
  basePoints: number;
  status: string;
  tripId: string;
}

export default function AdminChallengesScreen() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0] ?? '';

  const challengeQueryOptions = trpc.challenge.getAllByTrip.queryOptions({ tripId });
  const { data: challengesData, isLoading } = useQuery({
    ...challengeQueryOptions,
    enabled: !!tripId,
  });

  const challenges: ChallengeItem[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((challenge) => ({
      id: challenge.id,
      title: challenge.name,
      description: challenge.description ?? null,
      basePoints: challenge.basePoints ?? 0,
      status: challenge.status ?? 'HIDDEN',
      tripId: challenge.tripId,
    }));
  }, [challengesData]);

  const deleteChallengeMutation = useMutation(
    trpc.challenge.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: challengeQueryOptions.queryKey });
      },
      onError: (error) => {
        Alert.alert('Error', `Failed to delete challenge: ${error.message}`);
      },
    }),
  );

  const handleAddChallenge = () => {
    if (!tripId) {
      Alert.alert('Error', 'No trip found to attach this challenge');
      return;
    }
    router.push(`/profile/admin/challenges/new?tripId=${encodeURIComponent(tripId)}`);
  };

  const handleDeleteChallenge = (id: string) => {
    Alert.alert(
      'Delete Challenge',
      'Are you sure you want to delete this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteChallengeMutation.mutate({ id, tripId });
          },
        },
      ],
    );
  };

  const totalChallenges = challenges.length;

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
        style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button */}
        <View style={{ paddingVertical: 16 }}>
          <TouchableOpacity
            onPress={handleAddChallenge}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              height: 64,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            }}
          >
            <MaterialIcons name="add-circle" size={24} color={colors.backgroundDark} />
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.backgroundDark,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Add New Challenge
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 24,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: colors.cardDark,
            borderWidth: 1,
            borderColor: colors.borderDark,
            padding: 16,
            borderRadius: 12,
          }}>
            <Text style={{
              fontSize: 12,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 4,
            }}>
              Total
            </Text>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: colors.primary,
              lineHeight: 24,
            }}>
              {totalChallenges}
            </Text>
          </View>
        </View>

        {/* List Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
            letterSpacing: -0.5,
          }}>
            Existing Challenges
          </Text>
        </View>

        {/* Challenges List */}
        <View style={{ gap: 12 }}>
          {challenges.map((challenge) => (
            <View
              key={challenge.id}
              style={{
                backgroundColor: colors.cardDark,
                borderWidth: 1,
                borderColor: colors.borderDark,
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: 'rgba(0, 206, 209, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(0, 206, 209, 0.2)',
              }}>
                <MaterialIcons name="emoji-events" size={24} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: 4,
                }}>
                  {challenge.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    {challenge.basePoints} PTS
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}>
                    {challenge.status.replace(/_/g, ' ')}
                  </Text>
                  {!!challenge.description && (
                    <Text
                      numberOfLines={1}
                      style={{
                        color: '#9ca3af',
                        fontSize: 12,
                        flex: 1,
                      }}
                    >
                      {challenge.description}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => {
                    router.push(`/profile/admin/challenges/${challenge.id}?tripId=${encodeURIComponent(tripId)}`);
                  }}
                >
                  <MaterialIcons name="edit-square" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => handleDeleteChallenge(challenge.id)}
                >
                  <MaterialIcons name="delete-forever" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {challenges.length === 0 && (
            <View style={{
              padding: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.borderDark,
              backgroundColor: colors.cardDark,
              alignItems: 'center',
            }}>
              <Text style={{ color: '#9ca3af' }}>No challenges found yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
