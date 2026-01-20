import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors, spacing, borderRadius, typography } from '../../../../styles';

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
  if (points >= 150) return '#eab308';
  if (points >= 100) return '#00ced1';
  if (points >= 75) return '#ef4444';
  if (points >= 50) return '#60a5fa';
  return '#fb923c';
};

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const challengeId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const tripId = typeof params.tripId === 'string' ? params.tripId : params.tripId?.[0];
  const trpc = useTRPC();

  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    ...trpc.challenge.getById.queryOptions({
      id: challengeId ?? '',
      tripId: tripId ?? ''
    }),
    enabled: !!challengeId && !!tripId,
  });

  const { data: currentUser } = useQuery(trpc.user.getMy.queryOptions());

  const handleBackPress = () => {
    router.back();
  };

  const handleOpenCamera = async () => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to complete this challenge.",
          [{ text: "OK" }]
        );
        return;
      }

      Alert.alert(
        `${challenge?.name} Challenge`,
        `Complete this challenge to earn ${challenge?.points} points!`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Choose from Gallery",
            onPress: () => void pickImageFromGallery()
          },
          {
            text: "Take Photo",
            onPress: () => void takePhoto()
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to access camera");
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        showSuccessAlert();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        showSuccessAlert();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const showSuccessAlert = () => {
    Alert.alert(
      "Challenge Completed! 🎉",
      `Congratulations! You've earned ${challenge?.points} points for completing the ${challenge?.name} challenge.`,
      [
        {
          text: "View Challenges",
          onPress: () => router.push(`/trips/challenges?tripId=${tripId}`)
        },
        {
          text: "Stay Here",
          style: "cancel"
        }
      ]
    );
  };

  if (!challengeId || !tripId || challengeLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Text style={{ color: colors.white, fontSize: typography.xl, fontWeight: typography.bold, marginBottom: spacing.md }}>
            Challenge not found
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md }}>
            <Text style={{ color: colors.backgroundDark, fontWeight: typography.bold }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const icon = getIconForChallenge(challenge.name);
  const iconColor = getColorForPoints(challenge.points);
  const isAssignedToUser = currentUser ? challenge.groups.some(g =>
    g.group.organizer?.id === currentUser.id ||
    g.group.participants?.some((p: any) => p.userId === currentUser.id)
  ) : false;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Icon & Status */}
        <View style={{
          alignItems: 'center',
          marginBottom: spacing.xl * 2,
          padding: spacing.xl * 2,
          backgroundColor: colors.cardDark,
          borderRadius: borderRadius.xl,
          borderWidth: 1,
          borderColor: isAssignedToUser ? colors.primary : 'rgba(255, 255, 255, 0.05)',
          shadowColor: isAssignedToUser ? colors.primary : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isAssignedToUser ? 0.2 : 0,
          shadowRadius: isAssignedToUser ? 15 : 0,
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: borderRadius.lg,
            backgroundColor: `${iconColor}1a`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg
          }}>
            <MaterialIcons name={icon as any} size={48} color={iconColor} />
          </View>

          <Text style={{
            fontSize: 28,
            fontWeight: typography.bold,
            color: colors.white,
            textAlign: 'center',
            marginBottom: spacing.sm
          }}>
            {challenge.name}
          </Text>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.lg
          }}>
            <Text style={{
              backgroundColor: isAssignedToUser ? colors.primary : 'rgba(0, 206, 209, 0.2)',
              color: isAssignedToUser ? colors.backgroundDark : colors.primary,
              fontSize: 14,
              fontWeight: typography.bold,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.md,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              {challenge.points} Points
            </Text>

            {isAssignedToUser && (
              <Text style={{
                fontSize: 12,
                textTransform: 'uppercase',
                fontWeight: typography.bold,
                letterSpacing: 2,
                color: colors.primary
              }}>
                SELECTED
              </Text>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={{
          backgroundColor: colors.cardDark,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          marginBottom: spacing.xl,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.05)'
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: typography.bold,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: spacing.md
          }}>
            Description
          </Text>

          <Text style={{
            fontSize: typography.base,
            lineHeight: typography.base * 1.5,
            color: colors.textSecondary,
            marginBottom: spacing.lg
          }}>
            {challenge.description ?? 'Complete this challenge to earn points for your group!'}
          </Text>

          {challenge.image && (
            <Image
              source={{ uri: challenge.image }}
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                borderRadius: borderRadius.lg,
                marginTop: spacing.md
              }}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Assigned Groups */}
        {challenge.groups.length > 0 && (
          <View style={{
            backgroundColor: colors.cardDark,
            borderRadius: borderRadius.xl,
            padding: spacing.xl,
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: typography.bold,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: spacing.md
            }}>
              Assigned to Groups
            </Text>

            {challenge.groups.map((cg) => (
              <View
                key={cg.id}
                style={{
                  backgroundColor: 'rgba(39, 41, 53, 0.5)',
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  marginBottom: spacing.sm,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <Text style={{
                  fontSize: typography.base,
                  fontWeight: typography.bold,
                  color: colors.white,
                }}>
                  {cg.group.name}
                </Text>
                {cg.group.organizer && (
                  <Text style={{
                    fontSize: typography.sm,
                    color: colors.textMuted,
                    marginTop: 4
                  }}>
                    Leader: {cg.group.organizer.firstName} {cg.group.organizer.lastName}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Captured Image */}
        {capturedImage && (
          <View style={{
            backgroundColor: colors.cardDark,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: 'rgba(0, 206, 209, 0.3)',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: typography.bold,
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: spacing.lg,
              textAlign: 'center'
            }}>
              Challenge Completed! ✅
            </Text>

            <Image
              source={{ uri: capturedImage }}
              style={{
                width: '100%',
                aspectRatio: 4 / 3,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.lg
              }}
              resizeMode="cover"
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setCapturedImage(null)}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)'
                }}
              >
                <MaterialIcons name="refresh" size={20} color="#ef4444" />
                <Text style={{
                  fontSize: typography.sm,
                  fontWeight: typography.bold,
                  color: '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Retake
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push(`/trips/challenges?tripId=${tripId}`)}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                }}
              >
                <MaterialIcons name="check-circle" size={20} color={colors.backgroundDark} />
                <Text style={{
                  fontSize: typography.sm,
                  fontWeight: typography.bold,
                  color: colors.backgroundDark,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Camera Button */}
        {!capturedImage && (
          <TouchableOpacity
            onPress={() => void handleOpenCamera()}
            disabled={isLoading}
            style={{
              backgroundColor: colors.primary,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.md,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              opacity: isLoading ? 0.7 : 1
            }}
          >
            <MaterialIcons name="camera-alt" size={24} color={colors.backgroundDark} />
            <Text style={{
              fontSize: typography.lg,
              fontWeight: typography.bold,
              color: colors.backgroundDark,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              {isLoading ? 'Loading...' : 'Take Challenge Photo'}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 100,
  },
});
