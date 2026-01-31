import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

export function useChallengeCapture() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const showSuccessAlert = (
    challengeName?: string,
    points?: number,
    tripId?: string | null,
  ) => {
    Alert.alert(
      "Challenge Completed! 🎉",
      `Congratulations! You've earned ${points ?? 0} points for completing the ${challengeName ?? "challenge"}.`,
      [
        {
          text: "View Challenges",
          onPress: () => router.push(`/trips/challenges?tripId=${tripId}`),
        },
        {
          text: "Stay Here",
          style: "cancel",
        },
      ],
    );
  };

  const takePhoto = async (onSuccess?: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        onSuccess?.(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImageFromGallery = async (onSuccess?: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        onSuccess?.(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleOpenCamera = async (
    challengeName?: string,
    points?: number,
    tripId?: string | null,
  ) => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to complete this challenge.",
          [{ text: "OK" }],
        );
        return;
      }

      Alert.alert(
        `${challengeName ?? "Challenge"}`,
        `Complete this challenge to earn ${points ?? 0} points!`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Choose from Gallery",
            onPress: () =>
              void pickImageFromGallery((_uri) =>
                showSuccessAlert(challengeName, points, tripId),
              ),
          },
          {
            text: "Take Photo",
            onPress: () =>
              void takePhoto((_uri) =>
                showSuccessAlert(challengeName, points, tripId),
              ),
          },
        ],
      );
    } catch {
      Alert.alert("Error", "Failed to access camera");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    capturedImage,
    setCapturedImage,
    handleOpenCamera,
    takePhoto,
    pickImageFromGallery,
    showSuccessAlert,
  };
}
