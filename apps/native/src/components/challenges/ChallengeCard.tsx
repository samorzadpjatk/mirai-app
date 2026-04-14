import { Card, Text, XStack, YStack, Image } from "@mirai-app/ui";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Challenge, ChallengeStatus } from "../../types/challenges";

interface ChallengeCardProps {
  challenge: Challenge;
  onPress?: (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const isLocked = challenge.status === ChallengeStatus.LOCKED;
  const isActive = challenge.status === ChallengeStatus.SELECTED;

  const getStatusText = () => {
    switch (challenge.status) {
      case ChallengeStatus.SELECTED:
        return "Selected";
      case ChallengeStatus.COMPLETED:
        return "Completed";
      case ChallengeStatus.LOCKED:
        return "Locked";
      case ChallengeStatus.INCOMPLETE:
      default:
        return "Incomplete";
    }
  };

  return (
    <TouchableOpacity
      onPress={() => !isLocked && onPress?.(challenge)}
      disabled={isLocked}
      activeOpacity={0.8}
    >
      <Card
        bordered
        elevation={isActive ? "lg" : "sm"}
        opacity={isLocked ? 0.6 : 1}
        borderWidth={isActive ? 2 : 1}
        borderColor={isActive ? "$primary" : "$borderWhite5"}
        minHeight={challenge.size === "tall" ? 280 : undefined}
        padding="0"
      >
        {/* Layout for wide tiles */}
        {challenge.size === "wide" && (
          <XStack alignItems="center" gap="$4" padding="$4">
            {/* Icon */}
            <YStack
              width={56}
              height={56}
              borderRadius="$md"
              backgroundColor={`${challenge.iconColor}1a`}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons
                name={challenge.icon}
                size={30}
                color={challenge.iconColor}
              />
            </YStack>

            {/* Content */}
            <YStack flex={1}>
              <XStack
                alignItems="center"
                justifyContent="space-between"
                marginBottom="$1"
              >
                <Text variant="h5" color="white" numberOfLines={1}>
                  {challenge.title}
                </Text>
                {isLocked ? (
                  <Ionicons name="lock-closed" size={16} color="#475569" />
                ) : (
                  <PointsBadge isActive={isActive} points={challenge.points} />
                )}
              </XStack>
              {challenge.description && (
                <Text variant="caption" color="muted">
                  {challenge.description}
                </Text>
              )}
            </YStack>
          </XStack>
        )}

        {/* Layout for normal tiles */}
        {challenge.size === "normal" && (
          <YStack justifyContent="space-between" height="100%" padding="$4">
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="flex-start">
              <YStack
                width={40}
                height={40}
                borderRadius="$sm"
                backgroundColor={`${challenge.iconColor}1a`}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons
                  name={challenge.icon}
                  size={24}
                  color={challenge.iconColor}
                />
              </YStack>
              {isLocked ? (
                <Ionicons name="lock-closed" size={16} color="#475569" />
              ) : (
                <PointsBadge isActive={isActive} points={challenge.points} />
              )}
            </XStack>

            {/* Content */}
            <YStack flex={1} justifyContent="flex-end">
              <Text
                variant="body"
                color="white"
                fontWeight="$bold"
                lineHeight={20}
              >
                {challenge.title}
              </Text>
              <Text
                variant="caption"
                color={isActive ? "primary" : "muted"}
                textTransform="uppercase"
                fontWeight="$bold"
                letterSpacing={2}
                marginTop="$1"
              >
                {getStatusText()}
              </Text>
            </YStack>
          </YStack>
        )}

        {/* Layout for tall tiles */}
        {challenge.size === "tall" && (
          <YStack flex={1} justifyContent="space-between" padding="$4">
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="flex-start">
              <YStack
                width={40}
                height={40}
                borderRadius="$sm"
                backgroundColor={`${challenge.iconColor}1a`}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons
                  name={challenge.icon}
                  size={24}
                  color={challenge.iconColor}
                />
              </YStack>
              {isLocked ? (
                <Ionicons name="lock-closed" size={16} color="#475569" />
              ) : (
                <PointsBadge isActive={isActive} points={challenge.points} />
              )}
            </XStack>

            {/* Content */}
            <YStack marginTop="$4">
              <Text
                variant="h5"
                color="white"
                fontWeight="$bold"
                lineHeight={22}
                marginBottom="$2"
              >
                {challenge.title}
              </Text>
              {challenge.description && (
                <Text variant="caption" color="muted">
                  {challenge.description}
                </Text>
              )}
            </YStack>

            {/* Participants (if any) */}
            {challenge.participantAvatars &&
              challenge.participantAvatars.length > 0 && (
                <YStack
                  marginTop="$4"
                  paddingTop="$4"
                  borderTopWidth={1}
                  borderTopColor="#ffffff0d"
                >
                  <XStack marginLeft={-4}>
                    {challenge.participantAvatars
                      .slice(0, 2)
                      .map((avatar, index) => (
                        <YStack
                          key={index}
                          width={24}
                          height={24}
                          borderRadius={12}
                          borderWidth={2}
                          borderColor="#1b2828"
                          backgroundColor="#475569"
                          overflow="hidden"
                          marginLeft={-4}
                        >
                          <Image
                            source={{ uri: avatar }}
                            width={24}
                            height={24}
                            resizeMode="cover"
                          />
                        </YStack>
                      ))}
                    {challenge.additionalParticipants &&
                      challenge.additionalParticipants > 0 && (
                        <YStack
                          width={24}
                          height={24}
                          borderRadius={12}
                          borderWidth={2}
                          borderColor="#1b2828"
                          backgroundColor="#00ced1"
                          alignItems="center"
                          justifyContent="center"
                          marginLeft={-4}
                        >
                          <Text
                            fontSize={10}
                            fontWeight="$bold"
                            color="#17181c"
                          >
                            +{challenge.additionalParticipants}
                          </Text>
                        </YStack>
                      )}
                  </XStack>
                </YStack>
              )}
          </YStack>
        )}
      </Card>
    </TouchableOpacity>
  );
}

interface PointsBadgeProps {
  isActive: boolean;
  points: number;
}

function PointsBadge({ isActive, points }: PointsBadgeProps) {
  if (isActive) {
    return (
      <YStack
        paddingHorizontal="$2"
        paddingVertical="$1"
        borderRadius="$sm"
        backgroundColor="#00ced1"
      >
        <Text
          fontSize={10}
          fontWeight="$bold"
          textTransform="uppercase"
          letterSpacing={1}
          color="#17181c"
        >
          +{points}
        </Text>
      </YStack>
    );
  }

  return (
    <YStack
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$sm"
      backgroundColor="#00ced133"
      borderWidth={1}
      borderColor="#00ced14d"
    >
      <Text
        fontSize={10}
        fontWeight="$bold"
        textTransform="uppercase"
        letterSpacing={1}
        color="#00ced1"
      >
        +{points}
      </Text>
    </YStack>
  );
}
