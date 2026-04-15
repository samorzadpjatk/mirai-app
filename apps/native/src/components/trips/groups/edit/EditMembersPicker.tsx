import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Spinner } from "@mirai-app/ui";

interface ParticipantUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

interface Participant {
  user: ParticipantUser;
}

interface EditMembersPickerProps {
  participants: Participant[];
  selectedMembers: Set<string>;
  isLoading: boolean;
  organizerId?: string | null;
  onToggleMember: (userId: string) => void;
}

export function EditMembersPicker({
  participants,
  selectedMembers,
  isLoading,
  organizerId,
  onToggleMember,
}: EditMembersPickerProps) {
  if (isLoading) {
    return (
      <YStack paddingVertical="$8" alignItems="center">
        <Spinner size="large" color="primary" />
      </YStack>
    );
  }

  return (
    <YStack
      backgroundColor="rgba(33, 38, 45, 1)"
      borderWidth={1}
      borderColor="rgba(48, 54, 61, 1)"
      borderRadius="$6"
      overflow="hidden"
    >
      <ScrollView
        style={{ maxHeight: 340 }}
        showsVerticalScrollIndicator={false}
      >
        {participants.length > 0 ? (
          participants.map((participant) => {
            const isSelected = selectedMembers.has(participant.user.id);
            const isOrganizerUser = participant.user.id === organizerId;
            const initials =
              `${participant.user.firstName?.charAt(0) ?? ""}${participant.user.lastName?.charAt(0) ?? ""}`.toUpperCase() ||
              "?";

            return (
              <TouchableOpacity
                key={participant.user.id}
                onPress={() => onToggleMember(participant.user.id)}
                activeOpacity={0.7}
                disabled={isOrganizerUser}
              >
                <XStack
                  alignItems="center"
                  gap="$4"
                  padding="$4"
                  borderBottomWidth={1}
                  borderBottomColor="rgba(255, 255, 255, 0.05)"
                >
                  <YStack
                    width={44}
                    height={44}
                    borderRadius="$full"
                    backgroundColor="#475569"
                    borderWidth={1}
                    borderColor="rgba(255, 255, 255, 0.1)"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize={14} fontWeight="700" color="white">
                      {initials}
                    </Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text
                      fontSize={14}
                      fontWeight="600"
                      color="white"
                      marginBottom={2}
                    >
                      {participant.user.firstName} {participant.user.lastName}
                    </Text>
                    <Text fontSize={12} color="#475569">
                      {participant.user.email}
                      {isOrganizerUser && " (Organizer)"}
                    </Text>
                  </YStack>
                  <YStack
                    width={20}
                    height={20}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={isSelected ? "#00ced1" : "rgba(48, 54, 61, 1)"}
                    backgroundColor={
                      isSelected ? "#00ced1" : "rgba(23, 24, 28, 1)"
                    }
                    alignItems="center"
                    justifyContent="center"
                    opacity={isOrganizerUser ? 0.5 : 1}
                  >
                    {isSelected && (
                      <YStack
                        width={10}
                        height={10}
                        borderRadius={3}
                        backgroundColor="rgba(23, 24, 28, 1)"
                      />
                    )}
                  </YStack>
                </XStack>
              </TouchableOpacity>
            );
          })
        ) : (
          <YStack paddingVertical="$8" alignItems="center">
            <Text fontSize={14} color="#475569">
              No participants found
            </Text>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
