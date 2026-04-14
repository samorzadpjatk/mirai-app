import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack, Text, Spinner } from "@mirai-app/ui";
import { useAuth } from "@mirai-app/frameworks/auth/client";
import { useRouter } from "expo-router";
import { useNotifications } from "~/hooks/notifications";
import { useLocationContext } from "~/stores/location";

interface ProfileActionsSectionProps {
  onEditProfile?: () => void;
}

export function ProfileActionsSection({
  onEditProfile,
}: ProfileActionsSectionProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const { isSubscribed, isLoading, onTogglePress } = useNotifications();
  const {
    isLocationSharingEnabled,
    isLoading: isLocationLoading,
    toggleLocationSharing,
    isBackgroundLocationEnabled,
    isUpdatingBackgroundLocation,
    permissionStatus,
    backgroundPermissionStatus,
    toggleBackgroundLocationUpdates,
    openSystemLocationSettings,
  } = useLocationContext();

  const handleToggle = () => {
    onTogglePress();
  };

  const handleLocationToggle = () => {
    void toggleLocationSharing();
  };

  const handleBackgroundToggle = () => {
    void toggleBackgroundLocationUpdates();
  };

  const handleOpenSystemSettings = () => {
    void openSystemLocationSettings();
  };

  const permissionModeLabel =
    permissionStatus !== "granted"
      ? "Location access: Off"
      : backgroundPermissionStatus === "granted"
        ? "Access mode: Always"
        : "Access mode: While in use";
  const isBackgroundControlDisabled =
    !isLocationSharingEnabled ||
    isLocationLoading ||
    isUpdatingBackgroundLocation;
  const isBackgroundDisplayedOn =
    isLocationSharingEnabled && isBackgroundLocationEnabled;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/login");
  };

  // Helper for action button styling
  const getActionButtonStyle = (isActive: boolean, isDanger = false) => ({
    backgroundColor: "$surface" as const,
    borderWidth: 1,
    borderColor: isActive
      ? "rgba(0, 206, 209, 0.3)"
      : isDanger
        ? "rgba(239, 68, 68, 0.2)"
        : "rgba(255, 255, 255, 0.05)",
    borderRadius: "$5" as const,
    padding: "$4" as const,
  });

  return (
    <YStack marginBottom="$5">
      <Text
        variant="overline"
        color="muted"
        marginBottom="$3"
        paddingHorizontal="$1"
      >
        Actions
      </Text>

      {/* Edit Profile Button */}
      <XStack
        alignItems="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={onEditProfile}
        {...getActionButtonStyle(false)}
        marginBottom="$3"
      >
        <YStack
          width={40}
          height={40}
          borderRadius="$3"
          backgroundColor="rgba(0, 206, 209, 0.1)"
          alignItems="center"
          justifyContent="center"
          marginRight="$3"
        >
          <Ionicons name="person" size={20} color="white" />
        </YStack>
        <Text variant="body" fontWeight="$medium" flex={1} color="$color">
          Edit Profile
        </Text>
        <Ionicons name="chevron-forward" size={20} color="gray" />
      </XStack>

      {/* Notifications Button */}
      <XStack
        alignItems="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={() => void handleToggle()}
        disabled={isLoading}
        opacity={isLoading ? 0.5 : 1}
        {...getActionButtonStyle(isSubscribed)}
        marginBottom="$3"
      >
        <YStack
          width={40}
          height={40}
          borderRadius="$3"
          backgroundColor={
            isSubscribed ? "rgba(0, 206, 209, 0.2)" : "rgba(0, 206, 209, 0.1)"
          }
          alignItems="center"
          justifyContent="center"
          marginRight="$3"
        >
          {isSubscribed ? (
            <Ionicons name="notifications" size={20} color="#00ced1" />
          ) : (
            <Ionicons name="notifications-off" size={20} color="white" />
          )}
        </YStack>
        <Text variant="body" fontWeight="$medium" flex={1} color="$color">
          {isSubscribed ? "Notifications Enabled" : "Enable Notifications"}
        </Text>
        {isSubscribed && (
          <YStack
            backgroundColor="rgba(0, 206, 209, 1)"
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            borderRadius="$2"
          >
            <Text
              fontSize={10}
              fontWeight="$bold"
              color="black"
              letterSpacing={1}
            >
              ON
            </Text>
          </YStack>
        )}
      </XStack>

      {/* Location Sharing Button */}
      <XStack
        alignItems="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={handleLocationToggle}
        disabled={isLocationLoading}
        opacity={isLocationLoading ? 0.5 : 1}
        {...getActionButtonStyle(isLocationSharingEnabled)}
        marginBottom="$3"
      >
        <YStack
          width={40}
          height={40}
          borderRadius="$3"
          backgroundColor={
            isLocationSharingEnabled
              ? "rgba(0, 206, 209, 0.2)"
              : "rgba(0, 206, 209, 0.1)"
          }
          alignItems="center"
          justifyContent="center"
          marginRight="$3"
        >
          {isLocationSharingEnabled ? (
            <Ionicons name="location" size={20} color="#00ced1" />
          ) : (
            <Ionicons name="locate" size={20} color="white" />
          )}
        </YStack>
        <Text variant="body" fontWeight="$medium" flex={1} color="$color">
          {isLocationSharingEnabled
            ? "Location Sharing Enabled"
            : "Enable Location Sharing"}
        </Text>
        {isLocationSharingEnabled && (
          <YStack
            backgroundColor="rgba(0, 206, 209, 1)"
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            borderRadius="$2"
          >
            <Text
              fontSize={10}
              fontWeight="$bold"
              color="black"
              letterSpacing={1}
            >
              ON
            </Text>
          </YStack>
        )}
      </XStack>

      {/* Background Location Button */}
      <XStack
        alignItems="center"
        pressStyle={{ opacity: isBackgroundControlDisabled ? 1 : 0.8 }}
        onPress={handleBackgroundToggle}
        disabled={isBackgroundControlDisabled}
        opacity={isBackgroundControlDisabled ? 0.6 : 1}
        {...getActionButtonStyle(isBackgroundDisplayedOn)}
        marginBottom="$3"
      >
        <YStack
          width={40}
          height={40}
          borderRadius="$3"
          backgroundColor={
            isBackgroundControlDisabled
              ? "rgba(148, 163, 184, 0.12)"
              : isBackgroundDisplayedOn
                ? "rgba(0, 206, 209, 0.2)"
                : "rgba(0, 206, 209, 0.1)"
          }
          alignItems="center"
          justifyContent="center"
          marginRight="$3"
        >
          <Ionicons
            name={isBackgroundDisplayedOn ? "navigate" : "navigate-outline"}
            size={20}
            color={
              isBackgroundControlDisabled
                ? "#64748b"
                : isBackgroundDisplayedOn
                  ? "#00ced1"
                  : "white"
            }
          />
        </YStack>
        <YStack flex={1} gap="$0.5">
          <Text
            variant="body"
            fontWeight="$medium"
            color={isBackgroundControlDisabled ? "muted" : "default"}
          >
            Background Location
          </Text>
          <Text variant="caption" color="muted">
            {!isLocationSharingEnabled
              ? "Enable location sharing first"
              : permissionModeLabel}
          </Text>
        </YStack>
        {isUpdatingBackgroundLocation ? (
          <Spinner size="small" color="white" />
        ) : (
          <YStack
            backgroundColor={
              isBackgroundDisplayedOn
                ? "rgba(0, 206, 209, 1)"
                : "rgba(148, 163, 184, 0.2)"
            }
            paddingHorizontal="$2"
            paddingVertical="$0.5"
            borderRadius="$2"
          >
            <Text
              fontSize={10}
              fontWeight="$bold"
              color={isBackgroundDisplayedOn ? "black" : "white"}
              letterSpacing={1}
            >
              {isBackgroundDisplayedOn ? "ON" : "OFF"}
            </Text>
          </YStack>
        )}
      </XStack>

      {/* Settings Action */}
      <XStack
        alignItems="center"
        gap="$1"
        alignSelf="flex-start"
        marginTop="-$1"
        marginBottom="$3"
        paddingHorizontal="$2"
        paddingVertical="$1"
        borderRadius="$3"
        borderWidth={1}
        borderColor="rgba(0, 206, 209, 0.25)"
        backgroundColor="rgba(0, 206, 209, 0.08)"
        pressStyle={{ opacity: 0.8 }}
        onPress={handleOpenSystemSettings}
      >
        <Ionicons name="settings-outline" size={16} color="#00ced1" />
        <Text variant="caption" color="primary" fontWeight="$medium">
          Open system location settings
        </Text>
      </XStack>

      {/* Sign Out Button */}
      <XStack
        alignItems="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={() => void handleSignOut()}
        {...getActionButtonStyle(false, true)}
      >
        <YStack
          width={40}
          height={40}
          borderRadius="$3"
          backgroundColor="rgba(239, 68, 68, 0.1)"
          alignItems="center"
          justifyContent="center"
          marginRight="$3"
        >
          <Ionicons name="log-out" size={20} color="#ef4444" />
        </YStack>
        <Text variant="body" fontWeight="$medium" flex={1} color="#ef4444">
          Sign Out
        </Text>
      </XStack>
    </YStack>
  );
}
