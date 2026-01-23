import React, { type ComponentProps, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  iconColor: string;
  status: 'selected' | 'incomplete' | 'locked';
  fullDescription: string;
}

const challengesData: Record<string, Challenge> = {
  'snow-angel': {
    id: 'snow-angel',
    title: 'Snow Angel',
    description: 'Make a perfect snow angel and capture the moment',
    fullDescription: 'Create the perfect snow angel by lying down in fresh snow and moving your arms and legs to form wings and a dress. Make sure the snow is deep enough and take a photo from above to capture the full angel shape. Bonus points for creative poses!',
    points: 50,
    icon: 'ac-unit',
    iconColor: '#60a5fa',
    status: 'selected'
  },
  'peak-photo': {
    id: 'peak-photo',
    title: 'Peak Photo',
    description: 'Group selfie at the highest summit point',
    fullDescription: 'Gather your entire group at the highest point of your hiking trail or mountain summit. Take a group selfie with the scenic background showing the elevation and landscape. Make sure everyone is visible and the view behind you showcases the achievement of reaching the peak.',
    points: 100,
    icon: 'landscape',
    iconColor: '#00ced1',
    status: 'incomplete'
  },
  'team-toast': {
    id: 'team-toast',
    title: 'Team Toast',
    description: 'Celebrate with a group toast',
    fullDescription: 'Organize a celebratory toast with your team using local beverages or traditional drinks. Capture the moment when everyone raises their glasses together. This can be done at camp, a local restaurant, or any meaningful location during your adventure.',
    points: 30,
    icon: 'local-bar',
    iconColor: '#fb923c',
    status: 'incomplete'
  },
  'local-legend': {
    id: 'local-legend',
    title: 'Local Legend',
    description: 'Interview a local business owner about the town\'s history',
    fullDescription: 'Find and interview a local business owner, resident, or community member about the history and culture of the area you\'re visiting. Record a short video or take photos during the conversation. Learn about local traditions, historical events, or interesting stories about the place.',
    points: 150,
    icon: 'star',
    iconColor: '#eab308',
    status: 'incomplete'
  },
  'trail-blazer': {
    id: 'trail-blazer',
    title: 'Trail Blazer',
    description: 'Record a 5km hike through the valley path',
    fullDescription: 'Complete a 5-kilometer hike through designated valley trails. Document your journey with photos at key waypoints and capture the diverse landscape. Track your route and take pictures of interesting flora, fauna, or geological features you encounter along the way.',
    points: 80,
    icon: 'explore',
    iconColor: '#10b981',
    status: 'incomplete'
  },
  'fire-starter': {
    id: 'fire-starter',
    title: 'Fire Starter',
    description: 'Build and light a campfire safely',
    fullDescription: 'Demonstrate proper campfire building skills by safely constructing and lighting a fire using natural materials. Document the process from gathering materials to the final burning fire. Make sure to follow all safety guidelines and completely extinguish the fire afterwards.',
    points: 75,
    icon: 'local-fire-department',
    iconColor: '#ef4444',
    status: 'incomplete'
  },
  'night-watch': {
    id: 'night-watch',
    title: 'Night Watch',
    description: 'Stay awake and document the night sky',
    fullDescription: 'Spend time during the night hours documenting the stars, moon, and night sky. Take photos of celestial objects, constellations, or the Milky Way. Share your experience of being awake during the quiet night hours in nature.',
    points: 90,
    icon: 'bedtime',
    iconColor: '#a855f7',
    status: 'locked'
  },
  'city-sprint': {
    id: 'city-sprint',
    title: 'City Sprint',
    description: 'Complete an urban adventure run',
    fullDescription: 'Navigate through the local city or town completing a series of checkpoints in the shortest time possible. Take photos at each checkpoint and document your route. This challenge combines fitness with urban exploration and local discovery.',
    points: 60,
    icon: 'directions-run',
    iconColor: '#06b6d4',
    status: 'locked'
  },
};

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const challenge = challengesData[id];

  if (!challenge) {
    return (
      <View style={{ flex: 1, backgroundColor: '#17191c', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#17191c" />
        <Text style={{ color: 'white', fontSize: 18 }}>Challenge not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: '#00ced1', borderRadius: 8 }}>
          <Text style={{ color: '#17191c', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBackPress = () => {
    router.back();
  };

  const handleOpenCamera = async () => {
    setIsLoading(true);
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to complete this challenge.",
          [{ text: "OK" }]
        );
        return;
      }

      // Show options: Camera or Gallery
      Alert.alert(
        `${challenge.title} Challenge`,
        `Complete this challenge to earn ${challenge.points} points!`,
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
      `Congratulations! You've earned ${challenge.points} points for completing the ${challenge.title} challenge.`,
      [
        {
          text: "View Challenges",
          onPress: () => router.push('/challenges')
        },
        {
          text: "Stay Here",
          style: "cancel"
        }
      ]
    );
  };

  const isLocked = challenge.status === 'locked';
  const isSelected = challenge.status === 'selected';
  const isActive = isSelected;

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
          
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 12,
              fontWeight: 'bold',
              letterSpacing: 2,
              color: '#00ced1',
              textTransform: 'uppercase'
            }}>
              Challenge Details
            </Text>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#fff',
              letterSpacing: -0.5,
            }}>
              {challenge.title}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ maxWidth: 448, marginHorizontal: 'auto' }}>
          
          {/* Challenge Icon & Status */}
          <View style={{
            alignItems: 'center',
            marginBottom: 32,
            padding: 32,
            backgroundColor: '#23262b',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isActive ? '#00ced1' : 'rgba(255, 255, 255, 0.05)',
            shadowColor: isActive ? '#00ced1' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isActive ? 0.2 : 0,
            shadowRadius: isActive ? 15 : 0,
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: isLocked ? 'rgba(107, 114, 128, 0.1)' : `${challenge.iconColor}1a`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <MaterialIcons 
                name={challenge.icon} 
                size={48} 
                color={isLocked ? '#6b7280' : challenge.iconColor} 
              />
            </View>
            
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: 8
            }}>
              {challenge.title}
            </Text>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16
            }}>
              <Text style={{
                backgroundColor: isActive ? '#00ced1' : isLocked ? 'rgba(107, 114, 128, 0.2)' : 'rgba(0, 206, 209, 0.2)',
                color: isActive ? '#17191c' : isLocked ? '#6b7280' : '#00ced1',
                fontSize: 14,
                fontWeight: 'bold',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                {challenge.points} Points
              </Text>
              
              <Text style={{
                fontSize: 12,
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: 2,
                color: isActive ? '#00ced1' : isLocked ? '#6b7280' : '#9ca3af'
              }}>
                {challenge.status}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={{
            backgroundColor: '#23262b',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 12
            }}>
              Description
            </Text>
            
            <Text style={{
              fontSize: 16,
              lineHeight: 24,
              color: '#d1d5db',
              marginBottom: 16
            }}>
              {challenge.fullDescription}
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: '#9ca3af',
              fontStyle: 'italic'
            }}>
              "{challenge.description}"
            </Text>
          </View>

          {/* Captured Image */}
          {capturedImage && (
            <View style={{
              backgroundColor: '#23262b',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: 'rgba(0, 206, 209, 0.3)',
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#00ced1',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 16,
                textAlign: 'center'
              }}>
                Challenge Completed! ✅
              </Text>
              
              <Image 
                source={{ uri: capturedImage }}
                style={{
                  width: '100%',
                  aspectRatio: 4 / 3,
                  borderRadius: 12,
                  marginBottom: 16
                }}
                resizeMode="cover"
              />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setCapturedImage(null)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <MaterialIcons name="refresh" size={20} color="#ef4444" />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#ef4444',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    Retake
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => router.push('/challenges')}
                  style={{
                    flex: 1,
                    backgroundColor: '#00ced1',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <MaterialIcons name="check-circle" size={20} color="#17191c" />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#17191c',
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
          {!isLocked && !capturedImage && (
            <TouchableOpacity
              onPress={handleOpenCamera}
              disabled={isLoading}
              style={{
                backgroundColor: '#00ced1',
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                shadowColor: '#00ced1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <MaterialIcons name="camera-alt" size={24} color="#17191c" />
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#17191c',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                {isLoading ? 'Loading...' : 'Take Challenge Photo'}
              </Text>
            </TouchableOpacity>
          )}

          {isLocked && (
            <View style={{
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: 'rgba(107, 114, 128, 0.2)'
            }}>
              <MaterialIcons name="lock" size={24} color="#6b7280" />
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Challenge Locked
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}