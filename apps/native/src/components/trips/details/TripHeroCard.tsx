import { Image } from "react-native";
import { styled, Text, YStack, Card } from "@mirai-app/ui";
import { useTripBackgroundImageDownload } from "~/hooks/trips/useTripBackgroundImageDownload";

interface TripHeroCardProps {
  name: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  imageUrl?: string;
  backgroundImagePath?: string | null;
}

const getTripStatus = (startDate: Date | string, endDate: Date | string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now >= start && now <= end) return "Ongoing Trip";
  if (now < start) return "Future Trip";
  return "Past Trip";
};

const HeroCard = styled(Card, {
  name: "HeroCard",
  position: "relative",
  height: 192,
  marginTop: "$sm",
  marginBottom: "$lg",
  marginHorizontal: "$lg",
  borderRadius: "$md",
  overflow: "hidden",
  backgroundColor: "$primaryOpacity20",
  padding: 0,
});

const HeroGradient = styled(YStack, {
  name: "HeroGradient",
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(23, 24, 28, 0.6)",
  zIndex: 10,
});

const HeroImage = styled(Image, {
  name: "HeroImage",
  width: "100%",
  height: "100%",
});

const HeroContent = styled(YStack, {
  name: "HeroContent",
  position: "absolute",
  bottom: "$lg",
  left: "$lg",
  zIndex: 20,
});

const HeroBadge = styled(YStack, {
  name: "HeroBadge",
  backgroundColor: "$primaryOpacity20",
  paddingHorizontal: "$md",
  paddingVertical: "$xs",
  borderRadius: "$full",
  borderWidth: 1,
  borderColor: "$primaryOpacity30",
  alignSelf: "flex-start",
  marginBottom: "$sm",
});

const HeroBadgeText = styled(Text, {
  name: "HeroBadgeText",
  fontSize: "$xs",
  fontWeight: "$bold",
  color: "$primary",
  textTransform: "uppercase",
  letterSpacing: 2,
});

const HeroTitle = styled(Text, {
  name: "HeroTitle",
  fontSize: 34,
  fontWeight: "$bold",
  color: "$white",
});

const HeroSubtitle = styled(Text, {
  name: "HeroSubtitle",
  fontSize: "$base",
  fontWeight: "$medium",
  color: "$primaryOpacity80",
});

export function TripHeroCard({
  name,
  description,
  startDate,
  endDate,
  imageUrl,
  backgroundImagePath,
}: TripHeroCardProps) {
  const { imageUrl: backgroundImageUrl } =
    useTripBackgroundImageDownload(backgroundImagePath);
  const finalImageUrl = imageUrl ?? backgroundImageUrl ?? undefined;

  // Don't render the image if no URL is available
  if (!finalImageUrl) {
    return (
      <HeroCard>
        <HeroContent>
          <HeroBadge>
            <HeroBadgeText>{getTripStatus(startDate, endDate)}</HeroBadgeText>
          </HeroBadge>
          <HeroTitle>{name}</HeroTitle>
          {description ? <HeroSubtitle>{description}</HeroSubtitle> : null}
        </HeroContent>
      </HeroCard>
    );
  }

  return (
    <HeroCard>
      <HeroGradient />
      <HeroImage source={{ uri: finalImageUrl }} />
      <HeroContent>
        <HeroBadge>
          <HeroBadgeText>{getTripStatus(startDate, endDate)}</HeroBadgeText>
        </HeroBadge>
        <HeroTitle>{name}</HeroTitle>
        {description ? <HeroSubtitle>{description}</HeroSubtitle> : null}
      </HeroContent>
    </HeroCard>
  );
}
