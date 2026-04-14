import { styled, Text, YStack, XStack } from "@mirai-app/ui";
import type { RankedGroup } from "./types";
import { LeaderboardListItem } from "./LeaderboardListItem";

interface LeaderboardRankingsSectionProps {
  groups: RankedGroup[];
  onPressGroup?: (group: RankedGroup) => void;
}

const Container = styled(YStack, {
  name: "RankingsContainer",
  backgroundColor: "rgba(28, 31, 33, 0.3)",
  borderTopLeftRadius: "$xl",
  borderTopRightRadius: "$xl",
  marginTop: -"$lg",
  borderTopWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.05)",
  paddingHorizontal: "$lg",
  paddingTop: "$xl",
  paddingBottom: "$xl",
});

const Header = styled(XStack, {
  name: "RankingsHeader",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "$lg",
  paddingHorizontal: "$sm",
});

const Title = styled(Text, {
  name: "RankingsTitle",
  fontSize: "$lg",
  fontWeight: "$bold",
  color: "$white",
});

const Subtitle = styled(Text, {
  name: "RankingsSubtitle",
  fontSize: "$xs",
  fontWeight: "$medium",
  color: "rgba(255, 255, 255, 0.4)",
  textTransform: "uppercase",
  letterSpacing: 2,
});

const List = styled(YStack, {
  name: "RankingsList",
  gap: "$md",
});

const EmptyState = styled(YStack, {
  name: "RankingsEmptyState",
  padding: "$xl",
  alignItems: "center",
});

const EmptyTitle = styled(Text, {
  name: "RankingsEmptyTitle",
  fontSize: "$lg",
  fontWeight: "$bold",
  color: "$textMuted",
  textAlign: "center",
});

const EmptySubtitle = styled(Text, {
  name: "RankingsEmptySubtitle",
  fontSize: "$sm",
  color: "$textMuted",
  textAlign: "center",
  marginTop: "$sm",
});

export function LeaderboardRankingsSection({
  groups,
  onPressGroup,
}: LeaderboardRankingsSectionProps) {
  return (
    <Container>
      <Header>
        <Title>Full Rankings</Title>
        <Subtitle>Global Standings</Subtitle>
      </Header>

      <List>
        {groups.map((group) => (
          <LeaderboardListItem
            key={group.id}
            group={group}
            onPress={onPressGroup}
          />
        ))}
      </List>

      {groups.length === 0 && (
        <EmptyState>
          <EmptyTitle>No groups yet</EmptyTitle>
          <EmptySubtitle>
            Groups will appear here as they join the trip
          </EmptySubtitle>
        </EmptyState>
      )}
    </Container>
  );
}
