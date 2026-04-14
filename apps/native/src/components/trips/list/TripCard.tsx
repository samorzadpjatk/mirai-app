import { ImageBackground } from "react-native";
import { Image } from "expo-image";
import { styled, Text, YStack, Card } from "@mirai-app/ui";
import miraiLogo from "../../../../assets/mirai_logo.png";
import type { TripListItem } from "./types";
import { useTripBackgroundImageDownload } from "~/hooks/trips/useTripBackgroundImageDownload";

interface TripCardProps {
  trip: TripListItem;
  imageUrl?: string;
  onPress: () => void;
}

const formatDateRange = (startDate: Date | string, endDate: Date | string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
};

const getTripStatus = (startDate: Date | string, endDate: Date | string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now >= start && now <= end) return "Ongoing";
  if (now < start) return "Upcoming";
  return "Past";
};

const StyledCard = styled(Card, {
  name: "TripCard",
  borderWidth: 1,
  borderColor: "$primaryOpacity10",
  overflow: "hidden",
  padding: 0,
});

const StyledCardNoImage = styled(Card, {
  name: "TripCardNoImage",
  borderWidth: 1,
  borderColor: "$primaryOpacity10",
  backgroundColor: "$cardDark",
  padding: 0,
});

const TripContent = styled(YStack, {
  name: "TripContent",
  padding: "$xl",
});

const BadgeRow = styled(YStack, {
  name: "BadgeRow",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "$md",
});

const TripBadge = styled(YStack, {
  name: "TripBadge",
  backgroundColor: "$primaryOpacity20",
  paddingHorizontal: "$md",
  paddingVertical: "$xs",
  borderRadius: "$full",
  borderWidth: 1,
  borderColor: "$primaryOpacity30",
  alignSelf: "flex-start",
});

const TripBadgeText = styled(Text, {
  name: "TripBadgeText",
  fontSize: "$xs",
  fontWeight: "$bold",
  color: "$primary",
  textTransform: "uppercase",
  letterSpacing: 2,
});

const TripTitle = styled(Text, {
  name: "TripTitle",
  fontSize: "$xxl",
  fontWeight: "$bold",
  color: "$white",
  marginBottom: "$xs",
});

const TripSubtitle = styled(Text, {
  name: "TripSubtitle",
  fontSize: "$base",
  color: "$primaryOpacity80",
  marginBottom: "$sm",
});

const TripDate = styled(Text, {
  name: "TripDate",
  fontSize: "$sm",
  color: "$textTertiary",
  marginBottom: "$xs",
});

const TripGroups = styled(Text, {
  name: "TripGroups",
  fontSize: "$sm",
  color: "$textSecondary",
  fontWeight: "$medium",
});

const TripLogoBadge = styled(YStack, {
  name: "TripLogoBadge",
  position: "absolute",
  top: "$md",
  left: "$md",
  width: 36,
  height: 36,
  borderRadius: "$full",
  backgroundColor: "rgba(0,0,0,0.28)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.2)",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
});

const TripOverlay = styled(YStack, {
  name: "TripOverlay",
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(23, 24, 28, 0.7)",
});

export function TripCard({ trip, onPress }: TripCardProps) {
  const status = getTripStatus(trip.startDate, trip.endDate);
  const { imageUrl } = useTripBackgroundImageDownload(trip.backgroundImagePath);
  const isPast = status === "Past";

  // Don't render the image background if no URL is available
  if (!imageUrl) {
    return (
      <StyledCardNoImage
        onPress={onPress}
        pressStyle={{ opacity: 0.7 }}
        style={isPast ? { opacity: 0.6 } : undefined}
      >
        <TripContent>
          <BadgeRow>
            <TripBadge>
              <TripBadgeText>{status}</TripBadgeText>
            </TripBadge>
          </BadgeRow>
          <TripTitle>{trip.name}</TripTitle>
          {trip.description ? (
            <TripSubtitle>{trip.description}</TripSubtitle>
          ) : null}
          <TripDate>{formatDateRange(trip.startDate, trip.endDate)}</TripDate>
          {trip.groups && trip.groups.length > 0 && (
            <TripGroups>
              {trip.groups.length}{" "}
              {trip.groups.length === 1 ? "group" : "groups"}
            </TripGroups>
          )}
        </TripContent>
      </StyledCardNoImage>
    );
  }

  return (
    <StyledCard
      onPress={onPress}
      pressStyle={{ opacity: 0.7 }}
      style={isPast ? { opacity: 0.6 } : undefined}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={{ width: "100%", minHeight: 180 }}
        imageStyle={{ borderRadius: 12 }}
      >
        <TripOverlay />
        <TripLogoBadge>
          <Image
            source={miraiLogo}
            style={{ width: 28, height: 28 }}
            contentFit="contain"
          />
        </TripLogoBadge>
        <TripContent>
          <BadgeRow>
            <TripBadge>
              <TripBadgeText>{status}</TripBadgeText>
            </TripBadge>
          </BadgeRow>
          <TripTitle>{trip.name}</TripTitle>
          {trip.description ? (
            <TripSubtitle>{trip.description}</TripSubtitle>
          ) : null}
          <TripDate>{formatDateRange(trip.startDate, trip.endDate)}</TripDate>
          {trip.groups && trip.groups.length > 0 && (
            <TripGroups>
              {trip.groups.length}{" "}
              {trip.groups.length === 1 ? "group" : "groups"}
            </TripGroups>
          )}
        </TripContent>
      </ImageBackground>
    </StyledCard>
  );
}
