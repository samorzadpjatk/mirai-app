import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSafeAreaInsets } from '~/contexts/safeArea';

interface Challenge {
  id: string;
  title: string;
  points: number;
  icon: string;
  iconColor: string;
  status: 'selected' | 'incomplete' | 'locked';
}

const challenges: Challenge[] = [
  { id: 'snow-angel', title: 'Snow Angel', points: 50, icon: 'ac_unit', iconColor: '#60a5fa', status: 'selected' },
  { id: 'peak-photo', title: 'Peak Photo', points: 100, icon: 'landscape', iconColor: '#00ced1', status: 'incomplete' },
  { id: 'team-toast', title: 'Team Toast', points: 30, icon: 'local_bar', iconColor: '#fb923c', status: 'incomplete' },
  { id: 'local-legend', title: 'Local Legend', points: 150, icon: 'star', iconColor: '#eab308', status: 'incomplete' },
  { id: 'trail-blazer', title: 'Trail Blazer', points: 80, icon: 'explore', iconColor: '#10b981', status: 'incomplete' },
  { id: 'fire-starter', title: 'Fire Starter', points: 75, icon: 'local_fire_department', iconColor: '#ef4444', status: 'incomplete' },
  { id: 'night-watch', title: 'Night Watch', points: 90, icon: 'bedtime', iconColor: '#a855f7', status: 'locked' },
  { id: 'city-sprint', title: 'City Sprint', points: 60, icon: 'directions_run', iconColor: '#06b6d4', status: 'locked' },
];

export default function ChallengesScreen() {
  const router = useRouter();
  const insets = useAppSafeAreaInsets();

  const handleBackPress = () => {
    router.back();
  };

  const handleChallengePress = (challenge: Challenge) => {
    if (challenge.status !== 'locked') {
      router.push(`/challenge/${challenge.id}`);
    }
  };

  const renderChallenge = (challenge: Challenge) => {
    const isActive = challenge.status === 'selected';
    const isLocked = challenge.status === 'locked';

    return (
      <TouchableOpacity
        onPress={() => handleChallengePress(challenge)}
        disabled={isLocked}
        style={{
          backgroundColor: '#23262b',
          borderRadius: 12,
          padding: 20,
          aspectRatio: 1,
          borderWidth: 1,
          borderColor: isActive ? '#00ced1' : 'transparent',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: isLocked ? 0.6 : 1,
          shadowColor: isActive ? '#00ced1' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isActive ? 0.2 : 0,
          shadowRadius: isActive ? 15 : 0,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: isLocked ? 'rgba(107, 114, 128, 0.1)' : `${challenge.iconColor}1a`,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MaterialIcons 
              name={challenge.icon as any} 
              size={24} 
              color={isLocked ? '#6b7280' : challenge.iconColor} 
            />
          </View>
          
          {isLocked ? (
            <MaterialIcons name="lock" size={16} color="#6b7280" />
          ) : (
            <Text style={{
              backgroundColor: isActive ? '#00ced1' : 'rgba(0, 206, 209, 0.2)',
              color: isActive ? '#17191c' : '#00ced1',
              fontSize: 10,
              fontWeight: 'bold',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
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
            fontSize: 16,
            fontWeight: 'bold',
            color: 'white',
            lineHeight: 20
          }}>
            {challenge.title}
          </Text>
          <Text style={{
            fontSize: 10,
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: 2,
            marginTop: 4,
            color: isActive ? '#00ced1' : '#6b7280'
          }}>
            {challenge.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#17191c' }}>
      <StatusBar barStyle="light-content" backgroundColor="#17191c" />
      
      {/* Header */}
      <SafeAreaView>
        <View style={{
          backgroundColor: 'rgba(23, 25, 28, 0.8)',
          paddingHorizontal: 24,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(156, 163, 175, 0.2)',
          zIndex: 50
        }}>
          <TouchableOpacity 
            onPress={handleBackPress}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              backgroundColor: '#23262b'
            }}
          >
            <MaterialIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View>
            <Text style={{
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 2,
              color: '#00ced1',
              textTransform: 'uppercase'
            }}>
              Wintegral Trip
            </Text>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#fff',
              letterSpacing: -0.5,
              textTransform: 'uppercase'
            }}>
              Challenges
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
        <View style={{ maxWidth: 448, marginHorizontal: 'auto' }}>
          {/* Group Info Card */}
          <View style={{
            marginBottom: 32,
            padding: 24,
            backgroundColor: '#23262b',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 32
          }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 10,
                fontWeight: 'bold',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4
              }}>
                Group Name
              </Text>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: -0.5
              }}>
                The Snow Tigers
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'row',
              gap: 16
            }}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(42, 46, 53, 0.5)',
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 4
                }}>
                  Group Score
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#00ced1' }}>
                    2,450
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'rgba(0, 206, 209, 0.7)', textTransform: 'uppercase' }}>
                    pts
                  </Text>
                </View>
              </View>
              
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(42, 46, 53, 0.5)',
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  marginBottom: 4
                }}>
                  Group Rank
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                    3rd
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase' }}>
                    place
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Challenges Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 40
          }}>
            {challenges.map((challenge, index) => (
              <View key={challenge.id} style={{ width: '48%' }}>
                {renderChallenge(challenge)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}