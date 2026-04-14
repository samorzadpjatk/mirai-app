import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { YStack, XStack, Text, Card, Button } from "@mirai-app/ui";
import { AppModalShell, AppModalFooter } from "~/components/common/ui";

interface UpdatePopupProps {
  visible: boolean;
  onUpdate: () => void;
  onSkip: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

export function UpdatePopup({
  visible,
  onUpdate,
  onSkip,
  isDownloading = false,
  downloadProgress = 0,
}: UpdatePopupProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  return (
    <AppModalShell
      visible={visible}
      title="Update Available"
      onClose={onSkip}
      variant="card"
      maxWidth={320}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          padding: 20,
          alignItems: "center",
        }}
      >
        <YStack marginBottom="$3">
          <YStack
            width={60}
            height={60}
            borderRadius={30}
            backgroundColor="rgba(23, 24, 28, 0.8)"
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize={24}>🔄</Text>
          </YStack>
        </YStack>

        <Text
          fontSize="$5"
          fontWeight="600"
          color="white"
          textAlign="center"
          marginBottom="$2"
        >
          Update Available
        </Text>
        <Text
          fontSize="$3"
          color="#9ca3af"
          textAlign="center"
          lineHeight={20}
          marginBottom="$5"
        >
          A new version of MIRAI is available with improvements and bug fixes.
        </Text>

        {isDownloading && (
          <YStack width="100%" marginBottom="$5">
            <YStack
              height={4}
              backgroundColor="rgba(23, 24, 28, 0.8)"
              borderRadius={2}
              overflow="hidden"
              marginBottom="$2"
            >
              <YStack
                height="100%"
                backgroundColor="#00ced1"
                borderRadius={2}
                width={`${downloadProgress * 100}%`}
              />
            </YStack>
            <Text fontSize="$2" color="#9ca3af" textAlign="center">
              Downloading... {Math.round(downloadProgress * 100)}%
            </Text>
          </YStack>
        )}
      </Animated.View>
      <AppModalFooter
        primaryLabel={isDownloading ? "Updating..." : "Update Now"}
        onPrimary={onUpdate}
        isPrimaryLoading={isDownloading}
        isPrimaryDisabled={isDownloading}
        secondaryLabel="Skip"
        onSecondary={onSkip}
      />
    </AppModalShell>
  );
}
