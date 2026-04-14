import { Image } from "react-native";
import { useRouter } from "expo-router";
import { styled, Text, YStack, XStack, Card } from "@mirai-app/ui";
import { usePartnerImageDownload } from "~/hooks/partners/usePartnerImageDownload";

function PartnerLogo({ sponsor }: { sponsor: Partner }) {
  const { imageUrl } = usePartnerImageDownload(sponsor.logoPath);

  return (
    <Image
      source={imageUrl ? { uri: imageUrl } : undefined}
      style={{
        width: "100%",
        height: sponsor.height ?? 28,
        resizeMode: "contain",
        transform: [
          { translateX: sponsor.offsetX ?? 0 },
          { translateY: sponsor.offsetY ?? 0 },
        ],
      }}
    />
  );
}

export interface Partner {
  id: string;
  name: string;
  logoPath: string;
  description: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
}

interface PartnersSectionProps {
  sponsors?: Partner[];
}

const Container = styled(YStack, {
  name: "PartnersContainer",
  alignItems: "center",
  gap: "$sm",
  marginTop: "$md",
  marginBottom: "$xxxl",
  paddingHorizontal: "$lg",
});

const Label = styled(Text, {
  name: "PartnersLabel",
  fontSize: 11,
  fontWeight: "$semibold",
  color: "$textMuted",
  textTransform: "uppercase",
  letterSpacing: 3,
});

const Row = styled(XStack, {
  name: "PartnersRow",
  alignItems: "center",
  gap: "$sm",
  width: "100%",
});

const Slot = styled(Card, {
  name: "PartnerSlot",
  flex: 1,
  height: 28,
  alignItems: "center",
  justifyContent: "center",
  overflow: "visible",
  backgroundColor: "transparent",
  borderWidth: 0,
  padding: 0,
});

export function PartnersSection({ sponsors }: PartnersSectionProps) {
  const router = useRouter();

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <Container>
      <Label>Partners</Label>
      <Row>
        {sponsors.map((sponsor) => (
          <Slot
            key={sponsor.id}
            onPress={() =>
              router.push(`/trips/partners/${sponsor.id}` as const)
            }
            pressStyle={{ opacity: 0.6 }}
          >
            <PartnerLogo sponsor={sponsor} />
          </Slot>
        ))}
      </Row>
    </Container>
  );
}
