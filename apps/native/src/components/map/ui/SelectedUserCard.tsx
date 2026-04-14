import { Pressable } from "react-native";
import { XStack, YStack, Text } from "@mirai-app/ui";
import { UserAvatar } from "~/components/map/ui/UserAvatar";
import { useMapOverlayStore } from "~/stores/map";
import { formatRelativeTime } from "~/utils/format";

export function SelectedUserCard() {
  const {
    selectedUser,
    sharingUserIds,
    canStopSharing,
    onBackToList,
    onStopSharing,
  } = useMapOverlayStore();

  if (!selectedUser) return null;

  const displayName =
    selectedUser.name && selectedUser.name.trim() !== ""
      ? selectedUser.name
      : "Unknown user";
  const displaySurname = displayName.split(" ").slice(1).join(" ") || "-";
  const firstName = displayName.split(" ")[0] ?? displayName;
  const isSharingWithSelected = sharingUserIds.includes(selectedUser.id);

  return (
    <>
      <XStack
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        marginBottom={14}
      >
        <Pressable onPress={onBackToList}>
          <YStack paddingHorizontal={8} paddingVertical={4}>
            <Text color="#EDE9FE" fontSize={20} fontWeight="600">
              ←
            </Text>
          </YStack>
        </Pressable>
        <XStack flexDirection="row" alignItems="center" gap={12} flex={1}>
          <YStack
            width={64}
            height={64}
            borderRadius={32}
            borderWidth={2}
            borderColor="white"
            overflow="hidden"
            backgroundColor="rgba(15, 23, 42, 0.9)"
            shadowColor="#000"
            shadowOpacity={0.35}
            shadowRadius={8}
            shadowOffset={{ width: 0, height: 4 }}
          >
            <UserAvatar
              imageUrl={selectedUser.avatarUrl}
              name={displayName}
              size={60}
            />
          </YStack>
          <YStack flex={1}>
            <Text fontSize={18} fontWeight="600" color="#F8FAFC">
              {firstName}
            </Text>
            <Text fontSize={14} color="rgba(226,232,240,0.8)" marginTop={2}>
              {displaySurname}
            </Text>
          </YStack>
        </XStack>
      </XStack>

      <YStack marginBottom={16}>
        <Text
          fontSize={12}
          color="rgba(226,232,240,0.75)"
          textTransform="uppercase"
          letterSpacing={0.6}
          marginBottom={4}
        >
          Last active
        </Text>
        <Text fontSize={14} color="#F1F5F9">
          {formatRelativeTime(new Date(selectedUser.lastActiveAt))}
        </Text>
      </YStack>

      <YStack marginBottom={16}>
        <Text
          fontSize={12}
          color="rgba(226,232,240,0.75)"
          textTransform="uppercase"
          letterSpacing={0.6}
          marginBottom={4}
        >
          Location Sharing
        </Text>
        <Text fontSize={14} color="#F1F5F9">
          {isSharingWithSelected
            ? "You share your location with this person"
            : "This person shares their location with you"}
        </Text>
      </YStack>

      <YStack marginBottom={16}>
        <Text
          fontSize={12}
          color="rgba(226,232,240,0.75)"
          textTransform="uppercase"
          letterSpacing={0.6}
          marginBottom={4}
        >
          Group
        </Text>
        <Text fontSize={14} color="#F1F5F9">
          -
        </Text>
      </YStack>

      {canStopSharing && (
        <Pressable onPress={onStopSharing}>
          <YStack
            backgroundColor="rgba(239, 68, 68, 0.1)"
            borderRadius={16}
            paddingVertical={14}
            paddingHorizontal={20}
            marginTop={16}
            borderWidth={1}
            borderColor="rgba(239, 68, 68, 0.25)"
            alignItems="center"
          >
            <Text
              color="#ff6b6b"
              fontSize={15}
              fontWeight="600"
              letterSpacing={-0.3}
            >
              Stop Sharing My Location
            </Text>
          </YStack>
        </Pressable>
      )}
    </>
  );
}
