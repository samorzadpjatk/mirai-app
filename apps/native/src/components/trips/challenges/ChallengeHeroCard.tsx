import { ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { styled, Text, YStack, XStack, Card } from "@mirai-app/ui";
import { getIconForChallenge, getColorForPoints } from "./challengeStyles";

interface ChallengeHeroCardProps {
  name: string;
  points: number;
  isSelected: boolean;
  imageUrl?: string | null;
  submissionType?: string | null;
  scoringCategory?: string | null;
  status?: string | null;
  endTime?: Date | string | null;
  isRecurring?: boolean;
  firstPlacePoints?: number | null;
  secondPlacePoints?: number | null;
  thirdPlacePoints?: number | null;
}

const submissionTypeLabels: Record<string, string> = {
  IMAGE: "Photo",
  MULTI_IMAGE: "Multi Photo",
  VIDEO: "Video",
  TEXT: "Text",
  IMAGE_LOCATION: "Photo + GPS",
  LOCATION: "GPS",
  QR_CODE: "QR Code",
};

const scoringLabels: Record<string, string> = {
  SPEED: "Speed",
  UNLIMITED: "Unlimited",
  JUDGED_STAFF: "Staff Judged",
  PEER_VOTING: "Peer Voting",
};

const statusLabels: Record<string, string> = {
  HIDDEN: "Hidden",
  VISIBLE: "Visible",
  ACTIVE: "Active",
  VOTING_PHASE: "Voting",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusTone: Record<string, string> = {
  HIDDEN: "#94a3b8",
  VISIBLE: "#00CED1",
  ACTIVE: "#00CED1",
  VOTING_PHASE: "#f59e0b",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

const getEndsLabel = (isRecurring?: boolean) =>
  isRecurring ? "Recurring" : "One-time";

const Wrapper = styled(YStack, {
  name: "ChallengeHeroWrapper",
  marginBottom: "$lg",
});

const HeroContainer = styled(Card, {
  name: "ChallengeHeroContainer",
  borderRadius: "$xl",
  borderWidth: 1,
  borderColor: "$borderWhite10",
  overflow: "hidden",
  padding: 0,
});

const HeroSelected = styled(HeroContainer, {
  name: "ChallengeHeroSelected",
  borderColor: "$primary",
  shadowColor: "$primary",
  shadowOpacity: 0.22,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
});

const HeroImage = styled(ImageBackground, {
  name: "ChallengeHeroImage",
  height: 300,
  width: "100%",
});

const HeroOverlay = styled(LinearGradient, {
  name: "ChallengeHeroOverlay",
  flex: 1,
  padding: "$lg",
  justifyContent: "space-between",
});

const HeroTopRow = styled(XStack, {
  name: "ChallengeHeroTopRow",
  alignItems: "flex-start",
  justifyContent: "space-between",
});

const StatusBadge = styled(XStack, {
  name: "ChallengeStatusBadge",
  borderWidth: 1,
  borderRadius: "$md",
  paddingHorizontal: "$sm",
  paddingVertical: "$xs",
  backgroundColor: "rgba(10,11,13,0.58)",
});

const PointsBadge = styled(XStack, {
  name: "ChallengePointsBadge",
  borderRadius: "$md",
  backgroundColor: "rgba(10,11,13,0.68)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.34)",
  paddingHorizontal: "$sm",
  paddingVertical: "$xs",
});

const PointsText = styled(Text, {
  name: "ChallengePointsText",
  color: "$white",
  fontSize: "$xs",
  fontWeight: "$bold",
  textTransform: "uppercase",
  letterSpacing: 1,
});

const PointsStack = styled(YStack, {
  name: "ChallengePointsStack",
  alignItems: "flex-end",
  gap: 4,
});

const PodiumInline = styled(XStack, {
  name: "ChallengePodiumInline",
  flexDirection: "row",
  gap: "$xs",
  backgroundColor: "rgba(10,11,13,0.72)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.25)",
  borderRadius: "$md",
  paddingHorizontal: "$xs",
  paddingVertical: 4,
});

const PodiumChip = styled(XStack, {
  name: "ChallengePodiumChip",
  flexDirection: "row",
  alignItems: "center",
  gap: 3,
  borderWidth: 1,
  borderRadius: 999,
  paddingHorizontal: 5,
  paddingVertical: 2,
});

const PodiumPlaceText = styled(Text, {
  name: "ChallengePodiumPlaceText",
  color: "rgba(255,255,255,0.9)",
  fontSize: 9,
  fontWeight: "$bold",
  textTransform: "uppercase",
  letterSpacing: 0.5,
});

const PodiumPointsText = styled(Text, {
  name: "ChallengePodiumPointsText",
  color: "$white",
  fontSize: 10,
  fontWeight: "$bold",
});

const HeroBottom = styled(YStack, {
  name: "ChallengeHeroBottom",
  gap: "$sm",
});

const IconWrapper = styled(YStack, {
  name: "ChallengeIconWrapper",
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
});

const Title = styled(Text, {
  name: "ChallengeTitle",
  fontSize: 34,
  fontWeight: "$bold",
  color: "$white",
  letterSpacing: -0.6,
});

const MetaGrid = styled(XStack, {
  name: "ChallengeMetaGrid",
  flexDirection: "row",
  gap: "$sm",
  marginTop: "$sm",
});

const MetaCard = styled(YStack, {
  name: "ChallengeMetaCard",
  flex: 1,
  backgroundColor: "rgba(255,255,255,0.04)",
  borderWidth: 1,
  borderColor: "$borderWhite10",
  borderRadius: "$lg",
  paddingVertical: "$sm",
  paddingHorizontal: "$xs",
  alignItems: "center",
  gap: 2,
});

const MetaLabel = styled(Text, {
  name: "ChallengeMetaLabel",
  color: "$textMuted",
  fontSize: 9,
  fontWeight: "$bold",
  textTransform: "uppercase",
  letterSpacing: 1.1,
});

const MetaValue = styled(Text, {
  name: "ChallengeMetaValue",
  color: "$white",
  fontSize: "$sm",
  fontWeight: "$bold",
  textAlign: "center",
});

function MetaCardComponent({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <MetaCard>
      <Ionicons name={icon} size={18} color="#00CED1" />
      <MetaLabel>{label}</MetaLabel>
      <MetaValue>{value}</MetaValue>
    </MetaCard>
  );
}

export function ChallengeHeroCard({
  name,
  points,
  isSelected,
  imageUrl,
  submissionType,
  scoringCategory,
  status,
  isRecurring,
  firstPlacePoints,
  secondPlacePoints,
  thirdPlacePoints,
}: ChallengeHeroCardProps) {
  const icon = getIconForChallenge(name);
  const iconColor = getColorForPoints(points);
  const statusValue = status ?? (isSelected ? "ACTIVE" : "VISIBLE");
  const statusColor = statusTone[statusValue] ?? "#00CED1";
  const statusText = statusLabels[statusValue] ?? statusValue;
  const typeText = submissionType
    ? (submissionTypeLabels[submissionType] ?? submissionType)
    : "Photo";
  const scoringText = scoringCategory
    ? (scoringLabels[scoringCategory] ?? scoringCategory)
    : "Speed";
  const endsText = getEndsLabel(isRecurring);
  const hasPodium =
    firstPlacePoints != null ||
    secondPlacePoints != null ||
    thirdPlacePoints != null;
  const podiumItems = [
    {
      place: "1st",
      points: firstPlacePoints ?? 0,
      iconColor: "#facc15",
      borderColor: "#facc1599",
      backgroundColor: "#facc152E",
    },
    {
      place: "2nd",
      points: secondPlacePoints ?? 0,
      iconColor: "#94a3b8",
      borderColor: "#94a3b899",
      backgroundColor: "#94a3b829",
    },
    {
      place: "3rd",
      points: thirdPlacePoints ?? 0,
      iconColor: "#f97316",
      borderColor: "#f9731699",
      backgroundColor: "#f9731629",
    },
  ];
  const heroFallbackColor = `${iconColor}30`;

  const HeroComponent = isSelected ? HeroSelected : HeroContainer;

  return (
    <Wrapper>
      <HeroComponent>
        <HeroImage
          source={imageUrl ? { uri: imageUrl } : undefined}
          style={[!imageUrl && { backgroundColor: heroFallbackColor }]}
          imageStyle={{ borderRadius: 20 }}
          resizeMode="cover"
        >
          <HeroOverlay
            colors={[
              "rgba(10,11,13,0.08)",
              "rgba(10,11,13,0.36)",
              "rgba(10,11,13,0.9)",
            ]}
          >
            <HeroTopRow>
              <StatusBadge borderColor={`${statusColor}66`}>
                <Text
                  fontSize="$xs"
                  fontWeight="$bold"
                  letterSpacing={1}
                  textTransform="uppercase"
                  color={statusColor}
                >
                  {statusText}
                </Text>
              </StatusBadge>
              <PointsStack>
                <PointsBadge>
                  <PointsText>{points} pts</PointsText>
                </PointsBadge>
                {hasPodium && (
                  <PodiumInline>
                    {podiumItems.map((item) => (
                      <PodiumChip
                        key={item.place}
                        borderColor={item.borderColor}
                        backgroundColor={item.backgroundColor}
                      >
                        <Ionicons
                          name="medal-outline"
                          size={10}
                          color={item.iconColor}
                        />
                        <PodiumPlaceText>{item.place}</PodiumPlaceText>
                        <PodiumPointsText>{item.points}</PodiumPointsText>
                      </PodiumChip>
                    ))}
                  </PodiumInline>
                )}
              </PointsStack>
            </HeroTopRow>

            <HeroBottom>
              <IconWrapper backgroundColor={`${iconColor}20`}>
                <Ionicons name={icon} size={22} color={iconColor} />
              </IconWrapper>
              <Title numberOfLines={2}>{name}</Title>
            </HeroBottom>
          </HeroOverlay>
        </HeroImage>
      </HeroComponent>

      <MetaGrid>
        <MetaCardComponent
          icon="camera-outline"
          label="Type"
          value={typeText}
        />
        <MetaCardComponent
          icon="speedometer-outline"
          label="Scoring"
          value={scoringText}
        />
        <MetaCardComponent
          icon="calendar-outline"
          label="Ends"
          value={endsText}
        />
      </MetaGrid>
    </Wrapper>
  );
}
