import { Ionicons } from "@expo/vector-icons";
import { Image, Text, type TextStyle, TouchableOpacity, View, type ViewStyle } from "react-native";
import { borderRadius, colors, spacing, typography } from "~/styles";
import { type Challenge, ChallengeStatus } from "../../types/challenges";

interface ChallengeCardProps {
  challenge: Challenge;
  onPress?: (challenge: Challenge) => void;
}

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const isLocked = challenge.status === ChallengeStatus.LOCKED;
  const isActive = challenge.status === ChallengeStatus.SELECTED;

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.cardDark,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: "transparent",
    };

    if (isActive) {
      baseStyle.borderColor = colors.primary;
      baseStyle.shadowColor = colors.primary;
      baseStyle.shadowOffset = { width: 0, height: 0 };
      baseStyle.shadowOpacity = 0.2;
      baseStyle.shadowRadius = 15;
    } else if (isLocked) {
      baseStyle.opacity = 0.6;
    }

    if (challenge.size === "tall") {
      baseStyle.minHeight = 280;
    }

    return baseStyle;
  };

  const getStatusText = () => {
    switch (challenge.status) {
      case ChallengeStatus.SELECTED:
        return "Selected";
      case ChallengeStatus.COMPLETED:
        return "Completed";
      case ChallengeStatus.LOCKED:
        return "Locked";
      default:
        return "Incomplete";
    }
  };

  const getPointsBadgeStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      fontSize: typography.xs,
      fontWeight: typography.bold,
      textTransform: "uppercase",
      letterSpacing: 1,
    };

    if (isActive) {
      return {
        ...baseStyle,
        backgroundColor: colors.primary,
        color: colors.backgroundDark,
      };
    }
    if (isLocked) {
      return {
        ...baseStyle,
        backgroundColor: `${colors.gray500}20`,
        color: colors.textSecondary,
      };
    }
    return {
      ...baseStyle,
      backgroundColor: colors.primaryOpacity20,
      color: colors.primary,
      borderWidth: 1,
      borderColor: colors.primaryOpacity30,
    };
  };

  return (
    <TouchableOpacity
      testID="challenge-card"
      style={getCardStyle()}
      onPress={() => !isLocked && onPress?.(challenge)}
      disabled={isLocked}
    >
      {/* Layout for wide tiles */}
      {challenge.size === "wide" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          {/* Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: borderRadius.md,
              backgroundColor: `${challenge.iconColor}1a`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={challenge.icon} size={30} color={challenge.iconColor} />
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: typography.lg,
                  fontWeight: typography.bold,
                  color: colors.white,
                }}
              >
                {challenge.title}
              </Text>
              {isLocked ? (
                <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
              ) : (
                <Text style={getPointsBadgeStyle()}>+{challenge.points}</Text>
              )}
            </View>
            {challenge.description && (
              <Text style={{ fontSize: typography.sm, color: colors.textSecondary }}>
                {challenge.description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Layout for normal tiles */}
      {challenge.size === "normal" && (
        <View style={{ flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.sm,
                backgroundColor: `${challenge.iconColor}1a`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={challenge.icon} size={24} color={challenge.iconColor} />
            </View>
            {isLocked ? (
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            ) : (
              <Text style={getPointsBadgeStyle()}>+{challenge.points}</Text>
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Text
              style={{
                fontSize: typography.base,
                fontWeight: typography.bold,
                color: colors.white,
                lineHeight: 20,
              }}
            >
              {challenge.title}
            </Text>
            <Text
              style={{
                fontSize: typography.xs,
                textTransform: "uppercase",
                fontWeight: typography.bold,
                letterSpacing: 2,
                marginTop: spacing.xs,
                color: isActive ? colors.primary : colors.textSecondary,
              }}
            >
              {getStatusText()}
            </Text>
          </View>
        </View>
      )}

      {/* Layout for tall tiles */}
      {challenge.size === "tall" && (
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.sm,
                backgroundColor: `${challenge.iconColor}1a`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={challenge.icon} size={24} color={challenge.iconColor} />
            </View>
            {isLocked ? (
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            ) : (
              <Text style={getPointsBadgeStyle()}>+{challenge.points}</Text>
            )}
          </View>

          {/* Content */}
          <View style={{ marginTop: spacing.md }}>
            <Text
              style={{
                fontSize: typography.lg,
                fontWeight: typography.bold,
                color: colors.white,
                lineHeight: 22,
                marginBottom: spacing.sm,
              }}
            >
              {challenge.title}
            </Text>
            {challenge.description && (
              <Text style={{ fontSize: typography.xs, color: colors.textSecondary }}>
                {challenge.description}
              </Text>
            )}
          </View>

          {/* Participants (if any) */}
          {challenge.participantAvatars && challenge.participantAvatars.length > 0 && (
            <View
              style={{
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.borderWhite5,
              }}
            >
              <View style={{ flexDirection: "row", marginLeft: -4 }}>
                {challenge.participantAvatars.slice(0, 2).map((avatar, index) => (
                  <View
                    key={index}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: colors.cardDark,
                      backgroundColor: colors.textSecondary,
                      overflow: "hidden",
                      marginLeft: -4,
                    }}
                  >
                    <Image
                      source={{ uri: avatar }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
                {challenge.additionalParticipants && challenge.additionalParticipants > 0 && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: colors.cardDark,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: -4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: typography.xs,
                        fontWeight: typography.bold,
                        color: colors.backgroundDark,
                      }}
                    >
                      +{challenge.additionalParticipants}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
