import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors, spacing, borderRadius, typography } from '../../../../styles';

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

export default function ChallengesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? '' }),
    enabled: !!tripId,
  });

  const { data: challengesData, isLoading: challengesLoading } = useQuery({
    ...trpc.challenge.getAllByTrip.queryOptions({ tripId: tripId ?? '' }),
    enabled: !!tripId,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  // Find user's group in this trip
  const userGroup = useMemo(() => {
    if (!currentUser || !trip?.participants) return null;
    const participant = trip.participants.find(p => p.user.id === currentUser.id);
    return participant?.group ?? null;
  }, [currentUser, trip]);

  // Calculate leaderboard position and points difference
  const leaderboardInfo = useMemo(() => {
    if (!userGroup || !trip?.groups) return null;

    // Sort groups by coins (descending)
    const sortedGroups = [...trip.groups].sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0));

    // Find user's group position (1-indexed)
    const position = sortedGroups.findIndex(g => g.id === userGroup.id) + 1;

    // Find points difference
    let pointsDifference = 0;
    if (position === 1 && sortedGroups.length > 1) {
      // If first place, show lead over 2nd place
      const secondPlace = sortedGroups[1];
      pointsDifference = (userGroup.coins ?? 0) - (secondPlace?.coins ?? 0);
    } else if (position > 1) {
      // If not first, show how many points behind the group ahead
      const groupAhead = sortedGroups[position - 2]; // position - 1 - 1 (zero-indexed)
      pointsDifference = (groupAhead?.coins ?? 0) - (userGroup.coins ?? 0);
    }

    return { position, pointsDifference, totalGroups: sortedGroups.length };
  }, [userGroup, trip]);

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
        icon: 'stars',
        iconColor: colors.primary,
        status: isAssignedToUserGroup ? 'selected' : (index >= 6 ? 'locked' : 'incomplete'),
        description: dbChallenge.description ?? undefined,
        image: dbChallenge.image ?? undefined,
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
                  Position
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 24, fontWeight: typography.bold, color: colors.primary }}>
                    {leaderboardInfo?.position ?? '-'}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: typography.bold, color: 'rgba(0, 206, 209, 0.7)', textTransform: 'uppercase' }}>
                    / {leaderboardInfo?.totalGroups ?? 0}
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
                  {leaderboardInfo?.position === 1 ? 'Leading By' : 'Behind By'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 24, fontWeight: typography.bold, color: leaderboardInfo?.position === 1 ? '#10b981' : '#ef4444' }}>
                    {leaderboardInfo?.pointsDifference ?? 0}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: typography.bold, color: colors.textMuted, textTransform: 'uppercase' }}>
                    pts
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
    paddingTop: 70, // Space for BackNavbar
    paddingBottom: 100,
  },
});
