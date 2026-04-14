import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { XStack, YStack, Text } from "@mirai-app/ui";
import { UserAvatar } from "~/components/map/ui/UserAvatar";
import { formatRelativeTime } from "~/utils/format";
import { useMapOverlayStore } from "~/stores/map";

export function UsersListPanel() {
  const {
    users,
    currentUserId,
    usersListStyle,
    onToggleExpand,
    onAddPress,
    onManagePress,
    onSelectUser,
  } = useMapOverlayStore();

  return (
    <>
      <YStack
        width={36}
        height={4}
        backgroundColor="rgba(0, 206, 209, 0.4)"
        borderRadius={2}
        alignSelf="center"
        marginBottom={16}
      />
      <Pressable onPress={onToggleExpand}>
        <XStack
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={12}
        >
          <Text fontSize={20} fontWeight="700" color="#F8FAFC">
            People
          </Text>
          <XStack flexDirection="row" alignItems="center" gap={12}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onManagePress();
              }}
            >
              <YStack
                width={32}
                height={32}
                borderRadius={16}
                backgroundColor="rgba(0, 206, 209, 0.2)"
                borderWidth={1}
                borderColor="rgba(0, 206, 209, 0.5)"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="settings-outline" size={16} color="#00ced1" />
              </YStack>
            </Pressable>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onAddPress();
              }}
            >
              <YStack
                width={32}
                height={32}
                borderRadius={16}
                backgroundColor="rgba(0, 206, 209, 0.2)"
                borderWidth={1}
                borderColor="rgba(0, 206, 209, 0.5)"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="add" size={20} color="#00ced1" />
              </YStack>
            </Pressable>
          </XStack>
        </XStack>
      </Pressable>
      <Animated.View style={[{ overflow: "hidden" }, usersListStyle]}>
        <Animated.ScrollView showsVerticalScrollIndicator={false}>
          {users.map((user) => {
            const isMe = user.id === currentUserId;
            return (
              <Pressable
                key={user.id}
                onPress={() => {
                  if (isMe) return;
                  onSelectUser(user);
                }}
              >
                <XStack
                  flexDirection="row"
                  alignItems="center"
                  gap={12}
                  paddingVertical={12}
                  borderBottomWidth={1}
                  borderBottomColor="rgba(255, 255, 255, 0.06)"
                >
                  <YStack
                    width={52}
                    height={52}
                    borderRadius={26}
                    borderWidth={isMe ? 0 : 2}
                    borderColor="rgba(0, 206, 209, 0.4)"
                    overflow="hidden"
                    backgroundColor="rgba(23, 24, 28, 0.8)"
                    padding={2}
                  >
                    <UserAvatar
                      imageUrl={user.avatarUrl}
                      name={user.name}
                      size={48}
                    />
                  </YStack>
                  <YStack flex={1}>
                    <XStack
                      flexDirection="row"
                      justifyContent="space-between"
                      alignItems="center"
                      marginBottom={4}
                    >
                      <Text fontSize={16} fontWeight="600" color="#F8FAFC">
                        {isMe ? "Me" : user.name}
                      </Text>
                      <Text fontSize={11} color="rgba(226,232,240,0.5)">
                        {isMe
                          ? "My Location"
                          : formatRelativeTime(new Date(user.lastActiveAt))}
                      </Text>
                    </XStack>
                    <Text
                      fontSize={13}
                      color="rgba(226,232,240,0.7)"
                      marginTop={2}
                    >
                      {user.address ?? "-"}
                    </Text>
                  </YStack>
                </XStack>
              </Pressable>
            );
          })}
        </Animated.ScrollView>
      </Animated.View>
    </>
  );
}
