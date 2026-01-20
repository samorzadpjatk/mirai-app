import { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors, spacing, borderRadius, typography } from '../../../../styles';
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

const MEDAL_COLORS = {
  gold: '#FFCC00',
  silver: '#BFBFBF',
  bronze: '#B36F2E',
};

interface RankedGroup {
  id: string;
  name: string;
  coins: number;
  memberCount: number;
  rank: number;
  isCurrentUserGroup: boolean;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();
  const insets = useAppSafeAreaInsets();

  const { data: trip, isLoading: tripLoading } = useQuery({
    ...trpc.trip.getById.queryOptions({ id: tripId ?? '' }),
    enabled: !!tripId,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  // Calculate rankings
  const rankedGroups: RankedGroup[] = useMemo(() => {
    if (!trip?.groups) return [];

    const userGroupId = trip.participants.find(p => p.user.id === currentUser?.id)?.group?.id;

    const sorted = [...trip.groups]
      .sort((a, b) => b.coins - a.coins)
      .map((group, index) => ({
        id: group.id,
        name: group.name,
        coins: group.coins,
        memberCount: group._count?.participants ?? 0,
        rank: index + 1,
        isCurrentUserGroup: group.id === userGroupId,
      }));

    return sorted;
  }, [trip, currentUser?.id]);

  const topThree = rankedGroups.slice(0, 3);
  const restOfGroups = rankedGroups.slice(3);

  if (!tripId || tripLoading) {
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

  const renderPodiumPlace = (group: RankedGroup | undefined, position: 1 | 2 | 3) => {
    if (!group) {
      return (
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: spacing.md }} />
          <View style={{
            width: '100%',
            height: position === 1 ? 176 : position === 2 ? 128 : 96,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
          }} />
        </View>
      );
    }

    const medalColor = position === 1 ? MEDAL_COLORS.gold : position === 2 ? MEDAL_COLORS.silver : MEDAL_COLORS.bronze;
    const avatarSize = position === 1 ? 80 : position === 2 ? 64 : 56;
    const podiumHeight = position === 1 ? 176 : position === 2 ? 128 : 96;
    const borderColor = position === 1 ? 'rgba(255, 204, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';

    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ position: 'relative', marginBottom: spacing.md }}>
          <View style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth: 2,
            borderColor: medalColor,
            backgroundColor: colors.cardDark,
            alignItems: 'center',
            justifyContent: 'center',
            ...(position === 1 && {
              shadowColor: medalColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            })
          }}>
            <Text style={{ fontSize: 24, fontWeight: typography.bold, color: medalColor }}>
              {group.name.charAt(0)}
            </Text>
          </View>

          {position === 1 && (
            <View style={{ position: 'absolute', top: -24, left: '50%', transform: [{ translateX: -15 }] }}>
              <MaterialIcons name="military-tech" size={30} color={MEDAL_COLORS.gold} />
            </View>
          )}

          <View style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            backgroundColor: medalColor,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: borderRadius.full,
          }}>
            <Text style={{ fontSize: 10, fontWeight: typography.bold, color: colors.backgroundDark }}>
              {position === 1 ? '1ST' : position === 2 ? '2ND' : '3RD'}
            </Text>
          </View>
        </View>

        <View style={{
          width: '100%',
          height: podiumHeight,
          backgroundColor: 'rgba(28, 31, 33, 0.5)',
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: borderColor,
          paddingTop: spacing.lg,
          alignItems: 'center',
        }}>
          <MaterialIcons
            name="emoji-events"
            size={position === 1 ? 32 : 24}
            color={medalColor}
            style={{ marginBottom: spacing.xs }}
          />
          <Text style={{
            fontSize: position === 1 ? typography.sm : typography.xs,
            fontWeight: typography.bold,
            color: colors.white,
            textAlign: 'center',
            paddingHorizontal: spacing.sm,
          }} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={{
            fontSize: position === 1 ? typography.lg : typography.sm,
            fontWeight: typography.bold,
            color: colors.primary,
            marginTop: spacing.xs,
          }}>
            {group.coins.toLocaleString()} pts
          </Text>
        </View>
      </View>
    );
  };

  const renderRankingItem = (group: RankedGroup) => {
    return (
      <View
        key={group.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          backgroundColor: group.isCurrentUserGroup ? 'rgba(0, 206, 209, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.xl,
          borderWidth: 1,
          borderColor: group.isCurrentUserGroup ? 'rgba(0, 206, 209, 0.3)' : 'rgba(255, 255, 255, 0.05)',
          ...(group.isCurrentUserGroup && {
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
          })
        }}
      >
        <View style={{ width: 32, alignItems: 'center' }}>
          <Text style={{
            fontSize: typography.sm,
            fontWeight: typography.bold,
            color: group.isCurrentUserGroup ? colors.primary : 'rgba(255, 255, 255, 0.6)',
          }}>
            {group.rank}
          </Text>
        </View>

        <View style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.cardDark,
          borderWidth: group.isCurrentUserGroup ? 2 : 0,
          borderColor: 'rgba(0, 206, 209, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: typography.lg, fontWeight: typography.bold, color: colors.white }}>
            {group.name.charAt(0)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={{
              fontSize: typography.base,
              fontWeight: typography.bold,
              color: colors.white,
            }}>
              {group.name}
            </Text>
            {group.isCurrentUserGroup && (
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: borderRadius.sm,
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: typography.bold,
                  color: colors.backgroundDark,
                  textTransform: 'uppercase',
                }}>
                  YOUR GROUP
                </Text>
              </View>
            )}
          </View>
          <Text style={{
            fontSize: typography.xs,
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: 2,
          }}>
            {group.memberCount} Members active
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: typography.base,
            fontWeight: typography.bold,
            color: group.isCurrentUserGroup ? colors.primary : 'rgba(255, 255, 255, 0.8)',
          }}>
            {group.coins.toLocaleString()} pts
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Podium Section */}
        <View style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl * 3,
          paddingBottom: spacing.xl,
          position: 'relative',
        }}>
          {/* Decorative glow */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 300,
            height: 300,
            backgroundColor: colors.primary,
            borderRadius: 150,
            opacity: 0.1,
            transform: [{ translateX: -150 }],
            ...(Platform.OS !== 'web' && {
              // Only apply blur on native
            })
          }} />

          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: spacing.md,
            height: 280,
          }}>
            {/* 2nd Place */}
            {renderPodiumPlace(topThree[1], 2)}

            {/* 1st Place */}
            <View style={{ transform: [{ translateY: -16 }] }}>
              {renderPodiumPlace(topThree[0], 1)}
            </View>

            {/* 3rd Place */}
            {renderPodiumPlace(topThree[2], 3)}
          </View>
        </View>

        {/* Rankings List */}
        <View style={{
          backgroundColor: 'rgba(28, 31, 33, 0.3)',
          borderTopLeftRadius: borderRadius.xl * 2.5,
          borderTopRightRadius: borderRadius.xl * 2.5,
          marginTop: -spacing.lg,
          borderTopWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.05)',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
            paddingHorizontal: spacing.sm,
          }}>
            <Text style={{
              fontSize: typography.lg,
              fontWeight: typography.bold,
              color: colors.white,
            }}>
              Full Rankings
            </Text>
            <Text style={{
              fontSize: typography.xs,
              fontWeight: typography.medium,
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              Global Standings
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            {restOfGroups.map(renderRankingItem)}
          </View>

          {rankedGroups.length === 0 && (
            <View style={{
              padding: spacing.xl * 2,
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: typography.lg,
                fontWeight: typography.bold,
                color: colors.textMuted,
                textAlign: 'center',
              }}>
                No groups yet
              </Text>
              <Text style={{
                fontSize: typography.sm,
                color: colors.textMuted,
                textAlign: 'center',
                marginTop: spacing.sm,
              }}>
                Groups will appear here as they join the trip
              </Text>
            </View>
          )}
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
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
