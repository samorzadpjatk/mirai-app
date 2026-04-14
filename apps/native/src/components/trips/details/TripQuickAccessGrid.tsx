import { Ionicons } from "@expo/vector-icons";
import { styled, Text, YStack, XStack, Card } from "@mirai-app/ui";

interface TripQuickAccessGridProps {
  isTripPast?: boolean;
  onOpenGroups: () => void;
  onOpenMap: () => void;
  onOpenChallenges: () => void;
  onOpenLeaderboard: () => void;
  onOpenRewards: () => void;
  onOpenInfo: () => void;
}

const GridContainer = styled(XStack, {
  name: "GridContainer",
  flexWrap: "wrap",
  paddingHorizontal: "$lg",
  gap: "$md",
});

const GridCard = styled(Card, {
  name: "GridCard",
  width: "48%",
  backgroundColor: "$cardDark",
  padding: "$lg",
  borderRadius: "$md",
  borderWidth: 1,
  borderColor: "$primaryOpacity10",
  gap: "$lg",
});

const GridCardGlow = styled(GridCard, {
  name: "GridCardGlow",
  shadowColor: "$primary",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 15,
  elevation: 4,
});

const GridIconWrapper = styled(YStack, {
  name: "GridIconWrapper",
  width: 40,
  height: 40,
  borderRadius: "$sm",
  backgroundColor: "$primaryOpacity10",
  alignItems: "center",
  justifyContent: "center",
});

const GridCardContent = styled(YStack, {
  name: "GridCardContent",
  gap: 2,
});

const GridCardTitle = styled(Text, {
  name: "GridCardTitle",
  fontSize: "$lg",
  fontWeight: "$bold",
  color: "$white",
  lineHeight: 22,
});

const GridCardSubtitle = styled(Text, {
  name: "GridCardSubtitle",
  fontSize: "$xs",
  color: "$textTertiary",
});

export function TripQuickAccessGrid({
  isTripPast,
  onOpenGroups,
  onOpenMap,
  onOpenChallenges,
  onOpenLeaderboard,
  onOpenRewards,
  onOpenInfo,
}: TripQuickAccessGridProps) {
  return (
    <GridContainer>
      <GridCardGlow onPress={onOpenGroups}>
        <GridIconWrapper>
          <Ionicons name="grid" size={24} color="#00CED1" />
        </GridIconWrapper>
        <GridCardContent>
          <GridCardTitle>Groups</GridCardTitle>
          <GridCardSubtitle>Team Roster</GridCardSubtitle>
        </GridCardContent>
      </GridCardGlow>

      {!isTripPast && (
        <GridCard onPress={onOpenMap}>
          <GridIconWrapper>
            <Ionicons name="map" size={24} color="#00CED1" />
          </GridIconWrapper>
          <GridCardContent>
            <GridCardTitle>Map</GridCardTitle>
            <GridCardSubtitle>Trip Locations</GridCardSubtitle>
          </GridCardContent>
        </GridCard>
      )}

      <GridCard onPress={onOpenChallenges}>
        <GridIconWrapper>
          <Ionicons name="trophy" size={24} color="#00CED1" />
        </GridIconWrapper>
        <GridCardContent>
          <GridCardTitle>Challenges</GridCardTitle>
          <GridCardSubtitle>Daily Quests</GridCardSubtitle>
        </GridCardContent>
      </GridCard>

      <GridCard onPress={onOpenRewards}>
        <GridIconWrapper>
          <Ionicons name="gift" size={24} color="#00CED1" />
        </GridIconWrapper>
        <GridCardContent>
          <GridCardTitle>Rewards</GridCardTitle>
          <GridCardSubtitle>Prize Store</GridCardSubtitle>
        </GridCardContent>
      </GridCard>

      <GridCard onPress={onOpenLeaderboard}>
        <GridIconWrapper>
          <Ionicons name="ribbon" size={24} color="#00CED1" />
        </GridIconWrapper>
        <GridCardContent>
          <GridCardTitle>Leaderboard</GridCardTitle>
          <GridCardSubtitle>Quest Rankings</GridCardSubtitle>
        </GridCardContent>
      </GridCard>

      <GridCard onPress={onOpenInfo}>
        <GridIconWrapper>
          <Ionicons name="information-circle" size={24} color="#00CED1" />
        </GridIconWrapper>
        <GridCardContent>
          <GridCardTitle>Trip Info</GridCardTitle>
          <GridCardSubtitle>Schedules & Rules</GridCardSubtitle>
        </GridCardContent>
      </GridCard>
    </GridContainer>
  );
}
