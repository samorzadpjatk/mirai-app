import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Alert } from "react-native";

const MAX_SIZE = 300;

async function prepareImage(uri: string): Promise<string> {
  const resized = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
    { compress: 0.9, format: SaveFormat.JPEG },
  );
  return resized.uri;
}

export function useGroupImagePicker(initialImage?: string | null) {
  const [image, setImage] = useState<string | null>(initialImage ?? null);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to take a photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const preparedImageUri = await prepareImage(result.assets[0].uri);
        setImage(preparedImageUri);
      }
    } catch (e) {
      console.error("takePhoto error:", e);
      Alert.alert("Error", `Failed to take photo: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const preparedImageUri = await prepareImage(result.assets[0].uri);
        setImage(preparedImageUri);
      }
    } catch (e) {
      console.error("pickFromGallery error:", e);
      Alert.alert("Error", `Failed to pick image: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const pickImage = () => {
    Alert.alert("Group Photo", "Choose a photo source", [
      { text: "Cancel", style: "cancel" },
      { text: "Choose from Gallery", onPress: () => void pickFromGallery() },
      { text: "Take Photo", onPress: () => void takePhoto() },
    ]);
  };

  const clearImage = () => setImage(null);

  return { image, setImage, pickImage, clearImage } as const;
}
