import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors, spacing, borderRadius, typography } from '../../../styles';
import BottomMenu from '../../../components/BottomMenu';

interface Challenge {
  id: string;
  title: string;
  points: number;
  icon: string;
  iconColor: string;
  status: 'selected' | 'incomplete' | 'locked';
  description?: string;
  image?: string;
}

// Default icon mapping for challenges
const getIconForChallenge = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('snow') || lowerName.includes('angel')) return 'ac_unit';
  if (lowerName.includes('photo') || lowerName.includes('peak')) return 'landscape';
  if (lowerName.includes('toast') || lowerName.includes('team')) return 'local_bar';
  if (lowerName.includes('legend') || lowerName.includes('local')) return 'star';
  if (lowerName.includes('trail') || lowerName.includes('blazer')) return 'explore';
  if (lowerName.includes('fire') || lowerName.includes('starter')) return 'local_fire_department';
  if (lowerName.includes('night') || lowerName.includes('watch')) return 'bedtime';
  if (lowerName.includes('city') || lowerName.includes('sprint')) return 'directions_run';
  return 'emoji_events';
};

const getColorForPoints = (points: number): string => {
  if (points >= 150) return '#eab308'; // gold
  if (points >= 100) return '#00ced1'; // cyan
  if (points >= 75) return '#ef4444'; // red
  if (points >= 50) return '#60a5fa'; // blue
  return '#fb923c'; // orange
};

export default function ChallengesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId || '' }),
    enabled: !!tripId,
  });

  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    ...trpc.challenge.getAllByTrip.queryOptions({ tripId: tripId || '' }),
    enabled: !!tripId,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  // Find user's group in this trip
  const userGroup = useMemo(() => {
    if (!currentUser || !trip?.participants) return null;
    const participant = trip.participants.find(p => p.user.id === currentUser.id);
    return participant?.group || null;
  }, [currentUser, trip]);

  // Map database challenges to UI format
  const challenges: Challenge[] = useMemo(() => {
    if (!challengesData) return [];

    return challengesData.map((dbChallenge, index) => {
      const isAssignedToUserGroup = userGroup
        ? dbChallenge.groups.some(g => g.group.id === userGroup.id)
        : false;

      return {
        id: dbChallenge.id,
        title: dbChallenge.name,
        points: dbChallenge.points,
        icon: getIconForChallenge(dbChallenge.name),
        iconColor: getColorForPoints(dbChallenge.points),
        status: isAssignedToUserGroup ? 'selected' : (index >= 6 ? 'locked' : 'incomplete'),
        description: dbChallenge.description || undefined,
        image: dbChallenge.image || undefined,
      };
    });
  }, [challengesData, userGroup]);

  const handleChallengePress = (challenge: Challenge) => {
    if (challenge.status !== 'locked') {
      router.push(`/trips/challenges/${challenge.id}?tripId=${tripId}`);
    }
  };

  if (!tripId || tripLoading || challengesLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: typography.lg }}>Trip not found</Text>
      </View>
    );
  }

  const renderChallenge = (challenge: Challenge) => {
    const isActive = challenge.status === 'selected';
    const isLocked = challenge.status === 'locked';

    return (
      <TouchableOpacity
        onPress={() => handleChallengePress(challenge)}
        disabled={isLocked}
        style={{
          backgroundColor: colors.cardDark,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          aspectRatio: 1,
          borderWidth: 1,
          borderColor: isActive ? colors.primary : 'rgba(255, 255, 255, 0.05)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: isLocked ? 0.6 : 1,
          shadowColor: isActive ? colors.primary : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isActive ? 0.2 : 0,
          shadowRadius: isActive ? 15 : 0,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.md,
            backgroundColor: isLocked ? 'rgba(107, 114, 128, 0.1)' : `${challenge.iconColor}1a`,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MaterialIcons
              name={challenge.icon as any}
              size={24}
              color={isLocked ? colors.textMuted : challenge.iconColor}
            />
          </View>

          {isLocked ? (
            <MaterialIcons name="lock" size={16} color={colors.textMuted} />
          ) : (
            <Text style={{
              backgroundColor: isActive ? colors.primary : 'rgba(0, 206, 209, 0.2)',
              color: isActive ? colors.backgroundDark : colors.primary,
              fontSize: 10,
              fontWeight: typography.bold,
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
              borderRadius: borderRadius.sm,
              textTransform: 'uppercase',
              letterSpacing: 1,
              borderWidth: isActive ? 0 : 1,
              borderColor: isActive ? 'transparent' : 'rgba(0, 206, 209, 0.3)'
            }}>
              +{challenge.points}
            </Text>
          )}
        </View>

        <View>
          <Text style={{
            fontSize: typography.base,
            fontWeight: typography.bold,
            color: colors.white,
            lineHeight: 20
          }}>
            {challenge.title}
          </Text>
          <Text style={{
            fontSize: 10,
            textTransform: 'uppercase',
            fontWeight: typography.bold,
            letterSpacing: 2,
            marginTop: 4,
            color: isActive ? colors.primary : colors.textMuted
          }}>
            {challenge.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
      {/* Header */}
      <View style={{
        backgroundColor: 'rgba(23, 24, 28, 0.8)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>

        <View>
          <Text style={{
            fontSize: 12,
            fontWeight: typography.bold,
            letterSpacing: 2,
            color: colors.primary,
            textTransform: 'uppercase'
          }}>
            {trip.name}
          </Text>
          <Text style={{
            fontSize: typography.xl,
            fontWeight: typography.bold,
            color: colors.white,
            letterSpacing: -0.5,
            textTransform: 'uppercase'
          }}>
            Challenges
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Card */}
        {userGroup && (
          <View style={{
            marginBottom: spacing.xl * 2,
            padding: spacing.xl,
            backgroundColor: colors.cardDark,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)',
          }}>
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontSize: 10,
                fontWeight: typography.bold,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4
              }}>
                Your Group
              </Text>
              <Text style={{
                fontSize: 24,
                fontWeight: typography.bold,
                color: colors.white,
                letterSpacing: -0.5
              }}>
                {userGroup.name}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              gap: spacing.md
            }}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(39, 41, 53, 0.5)',
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: typography.bold,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 4
                }}>
                  Group Score
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 24, fontWeight: typography.bold, color: colors.primary }}>
                    {userGroup.coins?.toLocaleString() || 0}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: typography.bold, color: 'rgba(0, 206, 209, 0.7)', textTransform: 'uppercase' }}>
                    pts
                  </Text>
                </View>
              </View>

              <View style={{
                flex: 1,
                backgroundColor: 'rgba(39, 41, 53, 0.5)',
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: typography.bold,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 4
                }}>
                  Members
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 24, fontWeight: typography.bold, color: colors.white }}>
                    {userGroup._count?.participants || 0}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: typography.bold, color: colors.textMuted, textTransform: 'uppercase' }}>
                    people
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Challenges Grid */}
        {challenges.length > 0 ? (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: spacing.md,
            marginBottom: 40
          }}>
            {challenges.map((challenge) => (
              <View key={challenge.id} style={{ width: '48%' }}>
                {renderChallenge(challenge)}
              </View>
            ))}
          </View>
        ) : (
          <View style={{
            padding: spacing.xxl,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: typography.lg,
              fontWeight: typography.bold,
              color: colors.textMuted,
              textAlign: 'center',
            }}>
              No challenges available yet
            </Text>
            <Text style={{
              fontSize: typography.sm,
              color: colors.textMuted,
              textAlign: 'center',
              marginTop: spacing.sm,
            }}>
              Check back later for new challenges!
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomMenu activeTab="trips" />
    </View>
  );
}
