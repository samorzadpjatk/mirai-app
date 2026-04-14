import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useLocationContext } from "~/stores/location";
import { useMapOverlayStore } from "~/stores/map";
import { XStack, YStack, Text, Spinner } from "@mirai-app/ui";

export function MapActionButtons() {
  const {
    isLocationSharingEnabled,
    isLoading,
    isUpdatingSharing,
    toggleLocationSharing,
    isBackgroundLocationEnabled,
    isUpdatingBackgroundLocation,
    toggleBackgroundLocationUpdates,
  } = useLocationContext();
  const { mapTheme, onRecenter, toggleTheme } = useMapOverlayStore();

  const isBackgroundDisplayedOn =
    isLocationSharingEnabled && isBackgroundLocationEnabled;
  const backgroundStatusLabel = isBackgroundDisplayedOn ? "On" : "Off";
  const isBackgroundControlDisabled =
    !isLocationSharingEnabled || isLoading || isUpdatingBackgroundLocation;

  return (
    <>
      <YStack position="absolute" left={16} top={16} width={170} gap={10}>
        <TouchableOpacity
          onPress={() => {
            void toggleBackgroundLocationUpdates();
          }}
          disabled={isBackgroundControlDisabled}
        >
          <XStack
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="rgba(15, 23, 42, 0.95)"
            borderColor={
              isBackgroundDisplayedOn
                ? "rgba(0, 206, 209, 0.35)"
                : "rgba(255,255,255,0.1)"
            }
            borderWidth={1}
            borderRadius={16}
            paddingHorizontal="$md"
            paddingVertical="$sm"
            gap="$xs"
            opacity={isBackgroundControlDisabled ? 0.55 : 1}
          >
            {isUpdatingBackgroundLocation ? (
              <Spinner size="small" color="$primary" />
            ) : (
              <>
                <Text
                  fontSize="$sm"
                  color={isBackgroundControlDisabled ? "$textMuted" : "$white"}
                  fontWeight={500}
                >
                  Background
                </Text>
                <Text
                  fontSize="$xs"
                  color={
                    isBackgroundControlDisabled ? "$textMuted" : "$textMuted"
                  }
                  marginLeft="auto"
                  marginRight="$sm"
                  textTransform="uppercase"
                  letterSpacing={1}
                >
                  {backgroundStatusLabel}
                </Text>
                <Ionicons
                  name={
                    isBackgroundDisplayedOn ? "navigate" : "navigate-outline"
                  }
                  size={18}
                  color={
                    isBackgroundControlDisabled
                      ? "#475569"
                      : isBackgroundDisplayedOn
                        ? "#00ced1"
                        : "#ffffff"
                  }
                />
              </>
            )}
          </XStack>
        </TouchableOpacity>
      </YStack>

      <YStack
        position="absolute"
        right={16}
        top={16}
        gap={12}
        alignItems="flex-end"
      >
        <TouchableOpacity
          onPress={() => {
            void toggleLocationSharing();
          }}
          disabled={isLoading || isUpdatingSharing}
        >
          <XStack
            flexDirection="row"
            alignItems="center"
            backgroundColor="rgba(15, 23, 42, 0.9)"
            paddingVertical="$sm"
            paddingHorizontal="$md"
            borderRadius={20}
            borderWidth={1}
            borderColor={
              isLocationSharingEnabled
                ? "rgba(0, 206, 209, 0.3)"
                : "rgba(255, 255, 255, 0.1)"
            }
          >
            {isUpdatingSharing ? (
              <Spinner size="small" color="$primary" />
            ) : (
              <>
                <Text
                  fontSize="$sm"
                  color="$white"
                  marginRight="$xs"
                  fontWeight={500}
                >
                  {isLocationSharingEnabled ? "On" : "Off"}
                </Text>
                <Ionicons
                  name={isLocationSharingEnabled ? "location" : "locate"}
                  size={20}
                  color={isLocationSharingEnabled ? "#00ced1" : "#ffffff"}
                />
              </>
            )}
          </XStack>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme}>
          <YStack
            backgroundColor="rgba(23, 24, 28, 0.9)"
            borderRadius={999}
            width={44}
            height={44}
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            borderColor="rgba(0, 206, 209, 0.35)"
          >
            <Ionicons
              name={mapTheme === "dark" ? "sunny" : "moon"}
              size={22}
              color="#00ced1"
            />
          </YStack>
        </TouchableOpacity>
        {isLocationSharingEnabled && (
          <TouchableOpacity onPress={onRecenter}>
            <YStack
              backgroundColor="rgba(23, 24, 28, 0.9)"
              borderRadius={999}
              width={44}
              height={44}
              alignItems="center"
              justifyContent="center"
              borderWidth={1}
              borderColor="rgba(0, 206, 209, 0.35)"
            >
              <Ionicons name="locate" size={20} color="#00ced1" />
            </YStack>
          </TouchableOpacity>
        )}
      </YStack>
    </>
  );
}
