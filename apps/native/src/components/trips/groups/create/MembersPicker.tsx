import { ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text } from "@mirai-app/ui";

interface ParticipantUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

interface Participant {
  user: ParticipantUser;
}

interface MembersPickerProps {
  participants: Participant[];
  selectedMembers: Set<string>;
  isLoading: boolean;
  onToggleMember: (userId: string) => void;
}

export function MembersPicker({
  participants,
  selectedMembers,
  isLoading,
  onToggleMember,
}: MembersPickerProps) {
  if (isLoading) {
    return (
      <YStack paddingVertical="$xxxl" alignItems="center">
        <ActivityIndicator size="large" color="#00ced1" />
      </YStack>
    );
  }

  return (
    <YStack
      backgroundColor="$cardDark"
      borderWidth={1}
      borderColor="$borderZinc700"
      borderRadius="$xl"
      overflow="hidden"
    >
      <ScrollView
        style={{ maxHeight: 340 }}
        showsVerticalScrollIndicator={false}
      >
        {participants.length > 0 ? (
          participants.map((participant) => {
            const isSelected = selectedMembers.has(participant.user.id);
            const firstInitial = participant.user.firstName?.[0] ?? "";
            const lastInitial = participant.user.lastName?.[0] ?? "";
            const initials =
              `${firstInitial}${lastInitial}`.toUpperCase() || "?";

            return (
              <TouchableOpacity
                key={participant.user.id}
                onPress={() => onToggleMember(participant.user.id)}
                activeOpacity={0.7}
              >
                <XStack
                  alignItems="center"
                  gap="$lg"
                  padding="$lg"
                  borderBottomWidth={1}
                  borderBottomColor="$borderWhite5"
                >
                  <YStack
                    width={44}
                    height={44}
                    borderRadius="$full"
                    backgroundColor="$textMuted"
                    borderWidth={1}
                    borderColor="$borderWhite10"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="$sm" fontWeight="bold" color="$white">
                      {initials}
                    </Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text
                      fontSize="$sm"
                      fontWeight="600"
                      color="$white"
                      marginBottom={2}
                    >
                      {(participant.user.firstName ?? "") +
                        " " +
                        (participant.user.lastName ?? "")}
                    </Text>
                    <Text fontSize={12} color="$textMuted">
                      {participant.user.email}
                    </Text>
                  </YStack>
                  <YStack
                    width={20}
                    height={20}
                    borderRadius={6}
                    borderWidth={1}
                    borderColor={isSelected ? "$primary" : "$borderZinc700"}
                    backgroundColor={
                      isSelected ? "$primary" : "$backgroundDark"
                    }
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isSelected && (
                      <YStack
                        width={10}
                        height={10}
                        borderRadius={3}
                        backgroundColor="$backgroundDark"
                      />
                    )}
                  </YStack>
                </XStack>
              </TouchableOpacity>
            );
          })
        ) : (
          <YStack paddingVertical="$xxxl" alignItems="center">
            <Text fontSize="$base" color="$textMuted">
              No participants found
            </Text>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
