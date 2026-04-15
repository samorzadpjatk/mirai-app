import { ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack, Text } from "@mirai-app/ui";

interface GroupImagePickerProps {
  imageUri: string | null;
  onPickImage: () => void;
  isUploading?: boolean;
  uploadPercent?: number | null;
}

export function GroupImagePicker({
  imageUri,
  onPickImage,
  isUploading = false,
  uploadPercent = null,
}: GroupImagePickerProps) {
  return (
    <YStack marginBottom="$xl">
      <Text
        fontSize="$2"
        fontWeight="bold"
        color="$colorMuted"
        style={{
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 4,
          marginLeft: 2,
        }}
      >
        Group Image
      </Text>
      <TouchableOpacity
        style={{
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(48, 54, 61, 1)",
        }}
        activeOpacity={0.85}
        onPress={onPickImage}
        disabled={isUploading}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: 180 }}
            resizeMode="cover"
          />
        ) : (
          <YStack
            height={160}
            alignItems="center"
            justifyContent="center"
            gap="$sm"
            backgroundColor="rgba(39, 41, 53, 0.65)"
          >
            <Ionicons
              name="images-outline"
              size={28}
              color="hsl(var(--color-primary))"
            />
            <Text
              fontSize="$3"
              fontWeight="500"
              color="$colorMuted"
              textTransform="uppercase"
              letterSpacing={0.8}
            >
              No image selected
            </Text>
          </YStack>
        )}

        <XStack
          alignItems="center"
          justifyContent="center"
          gap="$xs"
          paddingVertical="$md"
          backgroundColor="rgba(0, 0, 0, 0.45)"
          borderTopWidth={1}
          borderTopColor="rgba(255, 255, 255, 0.08)"
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text
                fontSize="$3"
                fontWeight="bold"
                color="$white"
                textTransform="uppercase"
                letterSpacing={0.6}
              >
                {uploadPercent != null
                  ? `Uploading ${uploadPercent}%`
                  : "Uploading..."}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
              <Text
                fontSize="$3"
                fontWeight="bold"
                color="$white"
                textTransform="uppercase"
                letterSpacing={0.6}
              >
                {imageUri ? "Change Photo" : "Add Photo"}
              </Text>
            </>
          )}
        </XStack>
      </TouchableOpacity>
    </YStack>
  );
}
