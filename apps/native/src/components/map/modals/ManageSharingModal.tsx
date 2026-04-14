import { Pressable } from "react-native";
import { MapModalShell } from "~/components/map/modals/MapModalShell";
import { MapModalUserItem } from "~/components/map/modals/MapModalUserItem";
import { useMapOverlayStore } from "~/stores/map";
import { YStack, Text, Spinner } from "@mirai-app/ui";

export function ManageSharingModal() {
  const {
    showManageModal,
    setShowManageModal,
    sharingSettings,
    isRemovingUser,
    handleRemoveUser,
  } = useMapOverlayStore();
  const users = sharingSettings?.usersToShareWith ?? [];

  return (
    <MapModalShell
      visible={showManageModal}
      title="Manage Location Sharing"
      onClose={() => setShowManageModal(false)}
      maxHeight="70%"
    >
      <YStack padding="$md" paddingTop="$sm">
        {users.length === 0 ? (
          <YStack paddingVertical="$xl" alignItems="center">
            <Text fontSize="$sm" color="$textSecondary" textAlign="center">
              You're not sharing your location with anyone
            </Text>
          </YStack>
        ) : (
          users.map((user) => {
            const fullName =
              `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

            return (
              <MapModalUserItem
                key={user.id}
                name={fullName}
                imageUrl={user.image}
                subtitle="Sharing location"
                bordered
                rightElement={
                  <Pressable
                    onPress={() => handleRemoveUser(user.id)}
                    disabled={isRemovingUser}
                  >
                    <YStack
                      paddingHorizontal="$md"
                      paddingVertical="$sm"
                      borderRadius="$sm"
                      backgroundColor="rgba(127, 29, 29, 0.3)"
                      borderWidth={1}
                      borderColor="rgba(239, 68, 68, 0.5)"
                    >
                      {isRemovingUser ? (
                        <Spinner size="small" color="rgba(239, 68, 68, 0.5)" />
                      ) : (
                        <Text
                          fontSize="$sm"
                          fontWeight={600}
                          color="rgba(239, 68, 68, 0.5)"
                        >
                          Remove
                        </Text>
                      )}
                    </YStack>
                  </Pressable>
                }
              />
            );
          })
        )}
      </YStack>
    </MapModalShell>
  );
}
