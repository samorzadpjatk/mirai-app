import React, { type ComponentProps, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  category: 'standard' | 'wintegral' | 'special';
  icon: string;
  status: 'active' | 'draft';
}

const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Eco-Warrior',
    description: 'Complete environmental sustainability tasks',
    points: 500,
    category: 'standard',
    icon: 'eco',
    status: 'active'
  },
  {
    id: '2',
    title: 'Code Master',
    description: 'Complete programming challenges',
    points: 750,
    category: 'standard',
    icon: 'terminal',
    status: 'active'
  },
  {
    id: '3',
    title: 'Wintegral Explorer',
    description: 'Participate in the winter expedition',
    points: 1200,
    category: 'wintegral',
    icon: 'flight_takeoff',
    status: 'active'
  },
  {
    id: '4',
    title: 'Gym Legend',
    description: 'Complete fitness milestones',
    points: 300,
    category: 'standard',
    icon: 'fitness_center',
    status: 'draft'
  }
];

export default function AdminChallengesScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    points: '',
    category: 'standard' as Challenge['category'],
    icon: 'star'
  });

  const handleBackPress = () => {
    router.back();
  };

  const handleAddChallenge = () => {
    if (!newChallenge.title || !newChallenge.description || !newChallenge.points) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const challenge: Challenge = {
      id: Date.now().toString(),
      title: newChallenge.title,
      description: newChallenge.description,
      points: parseInt(newChallenge.points),
      category: newChallenge.category,
      icon: newChallenge.icon,
      status: 'active'
    };

    setChallenges([...challenges, challenge]);
    setNewChallenge({
      title: '',
      description: '',
      points: '',
      category: 'standard',
      icon: 'star'
    });
    setShowAddModal(false);

    Alert.alert('Success!', 'Challenge created successfully');
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
            setChallenges(challenges.filter(c => c.id !== id));
          }
        }
      ]
    );
  };

  const getChallengeIcon = (challenge: Challenge): ComponentProps<typeof MaterialIcons>['name'] => {
    const iconMap: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
      'eco': 'eco',
      'terminal': 'terminal',
      'flight_takeoff': 'flight-takeoff',
      'fitness_center': 'fitness-center',
      'star': 'star'
    };
    return iconMap[challenge.icon] ?? 'star';
  };

  const getCategoryColor = (category: Challenge['category']): string => {
    switch (category) {
      case 'wintegral': return '#00ced1';
      case 'special': return '#a855f7';
      default: return '#6b7280';
    }
  };

  const getCategoryLabel = (category: Challenge['category']) => {
    switch (category) {
      case 'wintegral': return 'Trip';
      case 'special': return 'Event';
      default: return 'Campus';
    }
  };

  const activeChallenges = challenges.filter(c => c.status === 'active').length;
  const wintegralChallenges = challenges.filter(c => c.category === 'wintegral').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#0f2323' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2323" />

      {/* Header */}
      <SafeAreaView>
        <View style={{
          backgroundColor: '#0f2323',
          padding: 24,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: '#162e2e',
                borderWidth: 1,
                borderColor: '#273a3a'
              }}
            >
              <MaterialIcons name="arrow-back-ios-new" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#fff',
              letterSpacing: -0.5
            }}>
              Manage Challenges
            </Text>
          </View>

          <View style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MaterialIcons name="shield" size={30} color="#00ced1" />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Button */}
        <View style={{ paddingVertical: 16 }}>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#00ced1',
              borderRadius: 12,
              height: 64,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              shadowColor: '#00ced1',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20
            }}
          >
            <MaterialIcons name="add-circle" size={24} color="#0f2323" />
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#0f2323',
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
            backgroundColor: '#162e2e',
            borderWidth: 1,
            borderColor: '#273a3a',
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
              Active
            </Text>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#00ced1',
              lineHeight: 24
            }}>
              {activeChallenges}
            </Text>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: '#162e2e',
            borderWidth: 1,
            borderColor: '#273a3a',
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
              Wintegral
            </Text>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#fff',
              lineHeight: 24
            }}>
              {wintegralChallenges}
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
          <Text style={{
            fontSize: 12,
            fontWeight: '500',
            color: '#9ca3af',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: '#162e2e',
            borderWidth: 1,
            borderColor: '#273a3a',
            textTransform: 'uppercase',
            letterSpacing: 2
          }}>
            PJAPP MIRAI
          </Text>
        </View>

        {/* Challenges List */}
        <View style={{ gap: 12 }}>
          {challenges.map((challenge) => (
            <View
              key={challenge.id}
              style={{
                backgroundColor: '#162e2e',
                borderWidth: challenge.category === 'wintegral' ? 2 : 1,
                borderColor: challenge.category === 'wintegral' ? 'rgba(0, 206, 209, 0.4)' : '#273a3a',
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                shadowColor: challenge.category === 'wintegral' ? '#00ced1' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: challenge.category === 'wintegral' ? 0.1 : 0,
                shadowRadius: challenge.category === 'wintegral' ? 15 : 0,
                opacity: challenge.status === 'draft' ? 0.6 : 1
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: challenge.category === 'wintegral' ? '#00ced1' : 'rgba(0, 206, 209, 0.1)',
                borderWidth: challenge.category === 'wintegral' ? 0 : 1,
                borderColor: challenge.category === 'wintegral' ? 'transparent' : 'rgba(0, 206, 209, 0.2)'
              }}>
                <MaterialIcons
                  name={getChallengeIcon(challenge)}
                  size={24}
                  color={challenge.category === 'wintegral' ? '#0f2323' : '#00ced1'}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    {challenge.title}
                  </Text>
                  {challenge.category === 'wintegral' && (
                    <Text style={{
                      backgroundColor: 'rgba(0, 206, 209, 0.2)',
                      color: '#00ced1',
                      fontSize: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      fontWeight: '900'
                    }}>
                      {getCategoryLabel(challenge.category)}
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{
                    color: '#00ced1',
                    fontSize: 14,
                    fontWeight: '600'
                  }}>
                    {challenge.points} PTS
                  </Text>
                  <Text style={{
                    color: challenge.status === 'draft' ? '#ef4444' : '#9ca3af',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    • {challenge.status === 'draft' ? 'DRAFT' : getCategoryLabel(challenge.category)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity
                  style={{ padding: 8 }}
                  onPress={() => {
                    // TODO: Implement edit functionality
                    Alert.alert('Edit Challenge', `Edit ${challenge.title}`);
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
        </View>
      </ScrollView>

      {/* Add Challenge Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#162e2e' }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 24,
              borderBottomWidth: 1,
              borderBottomColor: '#273a3a'
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
                    backgroundColor: '#0f2323',
                    borderWidth: 1,
                    borderColor: '#273a3a',
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

              {/* Points and Category Row */}
              <View style={{
                flexDirection: 'row',
                gap: 16,
                marginBottom: 20
              }}>
                <View style={{ flex: 1 }}>
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
                      backgroundColor: '#0f2323',
                      borderWidth: 1,
                      borderColor: '#273a3a',
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

                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    marginBottom: 8
                  }}>
                    Category
                  </Text>
                  <View style={{
                    backgroundColor: '#0f2323',
                    borderWidth: 1,
                    borderColor: '#273a3a',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12
                  }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>
                      {newChallenge.category === 'standard' ? 'Standard' :
                        newChallenge.category === 'wintegral' ? 'Wintegral Trip' :
                          'Special Event'}
                    </Text>
                  </View>
                </View>
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
                    backgroundColor: '#0f2323',
                    borderWidth: 1,
                    borderColor: '#273a3a',
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

              {/* Category Selection */}
              <View style={{ marginBottom: 32 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 12
                }}>
                  Challenge Type
                </Text>
                <View style={{ gap: 8 }}>
                  {[
                    { value: 'standard', label: 'Standard', desc: 'Regular campus challenge' },
                    { value: 'wintegral', label: 'Wintegral Trip', desc: 'Special expedition challenge' },
                    { value: 'special', label: 'Special Event', desc: 'One-time event challenge' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setNewChallenge({ ...newChallenge, category: option.value as Challenge['category'] })}
                      style={{
                        backgroundColor: newChallenge.category === option.value ? 'rgba(0, 206, 209, 0.1)' : '#0f2323',
                        borderWidth: 1,
                        borderColor: newChallenge.category === option.value ? '#00ced1' : '#273a3a',
                        borderRadius: 12,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: newChallenge.category === option.value ? '#00ced1' : '#6b7280',
                        backgroundColor: newChallenge.category === option.value ? '#00ced1' : 'transparent'
                      }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: '#fff',
                          marginBottom: 2
                        }}>
                          {option.label}
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: '#9ca3af'
                        }}>
                          {option.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleAddChallenge}
                style={{
                  backgroundColor: '#00ced1',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: '#00ced1',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  marginBottom: 24
                }}
              >
                <Text style={{
                  fontSize: 18,
                  fontWeight: '900',
                  color: '#0f2323',
                  textTransform: 'uppercase',
                  letterSpacing: 2
                }}>
                  Save Challenge
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}