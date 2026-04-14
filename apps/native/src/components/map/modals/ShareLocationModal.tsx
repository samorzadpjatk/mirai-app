import { Pressable, ScrollView } from "react-native";
import { MapModalShell } from "~/components/map/modals/MapModalShell";
import { MapModalUserItem } from "~/components/map/modals/MapModalUserItem";
import { useMapOverlayStore } from "~/stores/map";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { ThemedTextInput } from "~/components/common/ui";

export function ShareLocationModal() {
  const { shareModal, allAvailableUsers, sharingUserIds } =
    useMapOverlayStore();
  const {
    open,
    searchQuery,
    selectedUsers,
    setSearchQuery,
    toggleSelectedUser,
    reset,
    closeModal,
    confirm,
  } = shareModal;

  const users = allAvailableUsers;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const minimumQueryLength = 2;
  const shouldShowSearchResults = normalizedQuery.length >= minimumQueryLength;
  const filteredUsers = shouldShowSearchResults
    ? users?.filter((user) => {
        const fullName =
          `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
        return fullName.includes(normalizedQuery);
      })
    : [];

  return (
    <MapModalShell
      visible={open}
      title="Share Location With"
      onClose={closeModal}
    >
      <YStack padding="$md" paddingTop="$sm" paddingBottom="$sm">
        <ThemedTextInput
          placeholder="Type at least 2 characters to search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </YStack>

      {selectedUsers.size > 0 && (
        <XStack
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          backgroundColor="rgba(0, 206, 209, 0.1)"
          borderTopWidth={1}
          borderBottomWidth={1}
          borderColor="rgba(0, 206, 209, 0.2)"
        >
          <Text fontSize="$sm" fontWeight={600} color="$white">
            {selectedUsers.size} selected
          </Text>
          <Pressable onPress={reset}>
            <YStack paddingHorizontal="$sm" paddingVertical="$xs">
              <Text fontSize="$sm" fontWeight={600} color="$textSecondary">
                Clear
              </Text>
            </YStack>
          </Pressable>
        </XStack>
      )}

      <ScrollView style={{ padding: 16, paddingTop: 8, flex: 1 }}>
        {!shouldShowSearchResults ? (
          <YStack paddingVertical="$md" alignItems="center">
            <Text fontSize="$sm" color="$textSecondary" textAlign="center">
              Type at least 2 characters to search for a person.
            </Text>
          </YStack>
        ) : filteredUsers?.length === 0 ? (
          <YStack paddingVertical="$md" alignItems="center">
            <Text fontSize="$sm" color="$textSecondary" textAlign="center">
              No matching users found.
            </Text>
          </YStack>
        ) : (
          filteredUsers?.map((user) => {
            const isAlreadySharing = sharingUserIds.includes(user.id);
            const isSelected = selectedUsers.has(user.id);
            const fullName =
              `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

            return (
              <MapModalUserItem
                key={user.id}
                name={fullName}
                imageUrl={user.image}
                subtitle={isAlreadySharing ? "Already sharing" : undefined}
                selected={isAlreadySharing || isSelected}
                onPress={() => {
                  if (isAlreadySharing) return;
                  toggleSelectedUser(user.id);
                }}
                rightElement={
                  isAlreadySharing || isSelected ? (
                    <Text
                      fontSize={20}
                      color="rgba(34, 197, 94, 0.9)"
                      fontWeight={700}
                    >
                      ✓
                    </Text>
                  ) : undefined
                }
              />
            );
          })
        )}
      </ScrollView>

      {selectedUsers.size > 0 && (
        <YStack
          padding="$md"
          borderTopWidth={1}
          borderTopColor="rgba(255, 255, 255, 0.05)"
        >
          <Pressable onPress={confirm}>
            <YStack
              backgroundColor="rgba(0, 206, 209, 0.8)"
              borderRadius="$md"
              paddingVertical="$sm"
              alignItems="center"
              borderWidth={1}
              borderColor="rgba(0, 206, 209, 1)"
            >
              <Text
                fontSize="$base"
                fontWeight={700}
                color="rgba(23, 24, 28, 1)"
                letterSpacing={-0.3}
              >
                Add {selectedUsers.size}{" "}
                {selectedUsers.size === 1 ? "person" : "people"}
              </Text>
            </YStack>
          </Pressable>
        </YStack>
      )}
    </MapModalShell>
  );
}
