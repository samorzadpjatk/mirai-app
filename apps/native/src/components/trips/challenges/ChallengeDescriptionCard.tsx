import { Card, Text, Image } from "@mirai-app/ui";

interface ChallengeDescriptionCardProps {
  description?: string | null;
  imageUrl?: string | null;
}

export function ChallengeDescriptionCard({
  description,
  imageUrl,
}: ChallengeDescriptionCardProps) {
  return (
    <Card
      marginBottom="$5"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.05)"
    >
      <Text variant="body" color="muted" lineHeight={24} marginBottom="$4">
        {description ??
          "Complete this challenge to earn points for your group!"}
      </Text>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          width="100%"
          aspectRatio={16 / 9}
          borderRadius="$lg"
          marginTop="$3"
          resizeMode="cover"
        />
      ) : null}
    </Card>
  );
}
