import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@integral-2025-app/trpc/client';
import { colors } from '../../../../../styles';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';

interface ChallengeItem {
  id: string;
  title: string;
  description: string | null;
  points: number;
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
      points: challenge.points,
      tripId: challenge.tripId,
    }));
  }, [challengesData]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    points: '',
  });

  const createChallengeMutation = useMutation(
    trpc.challenge.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: challengeQueryOptions.queryKey });
        setNewChallenge({ title: '', description: '', points: '' });
        setShowAddModal(false);
        Alert.alert('Success!', 'Challenge created successfully');
      },
      onError: (error) => {
        Alert.alert('Error', `Failed to create challenge: ${error.message}`);
      },
    }),
  );

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
    if (!newChallenge.title || !newChallenge.description || !newChallenge.points) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!tripId) {
      Alert.alert('Error', 'No trip found to attach this challenge');
      return;
    }

    createChallengeMutation.mutate({
      tripId,
      name: newChallenge.title.trim(),
      description: newChallenge.description.trim(),
      points: parseInt(newChallenge.points, 10),
    });
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
            onPress={() => setShowAddModal(true)}
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
              shadowRadius: 20
            }}
          >
            <MaterialIcons name="add-circle" size={24} color={colors.backgroundDark} />
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.backgroundDark,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              Add New Challenge
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 24
        }}>
          <View style={{
            flex: 1,
            backgroundColor: colors.cardDark,
            borderWidth: 1,
            borderColor: colors.borderDark,
            padding: 16,
            borderRadius: 12
          }}>
            <Text style={{
              fontSize: 12,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 4
            }}>
              Total
            </Text>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: colors.primary,
              lineHeight: 24
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
          marginBottom: 16
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
            letterSpacing: -0.5
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
                gap: 16
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
                borderColor: 'rgba(0, 206, 209, 0.2)'
              }}>
                <MaterialIcons
                  name="emoji-events"
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: 4
                }}>
                  {challenge.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    {challenge.points} PTS
                  </Text>
                  {!!challenge.description && (
                    <Text
                      numberOfLines={1}
                      style={{
                        color: '#9ca3af',
                        fontSize: 12,
                        flex: 1
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
              alignItems: 'center'
            }}>
              <Text style={{ color: '#9ca3af' }}>No challenges found yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Challenge Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.cardDark }}>
          <View style={{ flex: 1 }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 24,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderDark
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#fff'
              }}>
                New Challenge
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 24 }}>
              {/* Challenge Title */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 8
                }}>
                  Challenge Title
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.backgroundDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#fff',
                    fontSize: 16
                  }}
                  placeholder="e.g. Campus Marathon"
                  placeholderTextColor="#6b7280"
                  value={newChallenge.title}
                  onChangeText={(text) => setNewChallenge({ ...newChallenge, title: text })}
                />
              </View>

              {/* Points */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 8
                }}>
                  Reward PTS
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.backgroundDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#fff',
                    fontSize: 16
                  }}
                  placeholder="500"
                  placeholderTextColor="#6b7280"
                  value={newChallenge.points}
                  onChangeText={(text) => setNewChallenge({ ...newChallenge, points: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Description */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 8
                }}>
                  Description
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.backgroundDark,
                    borderWidth: 1,
                    borderColor: colors.borderDark,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#fff',
                    fontSize: 16,
                    textAlignVertical: 'top'
                  }}
                  placeholder="Describe the goal of this challenge..."
                  placeholderTextColor="#6b7280"
                  value={newChallenge.description}
                  onChangeText={(text) => setNewChallenge({ ...newChallenge, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleAddChallenge}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  marginBottom: 24
                }}
              >
                <Text style={{
                  fontSize: 18,
                  fontWeight: '900',
                  color: colors.backgroundDark,
                  textTransform: 'uppercase',
                  letterSpacing: 2
                }}>
                  Save Challenge
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
