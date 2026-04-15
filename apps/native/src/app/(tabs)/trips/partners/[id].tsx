import { Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSponsorById } from "~/hooks/sponsors/useSponsors";
import { usePartnerImageDownload } from "~/hooks/partners/usePartnerImageDownload";
import LoadingScreen from "~/components/LoadingScreen";
import { YStack, Text } from "@mirai-app/ui";

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [{ data: sponsorData, fetching: isLoading, error }] = useSponsorById(
    id ?? "",
  );
  const sponsor = sponsorData?.sponsor;
  const { imageUrl } = usePartnerImageDownload(sponsor?.logoPath);

  if (isLoading) {
    return <LoadingScreen message="Loading sponsor..." />;
  }

  if (error || !sponsor) {
    return (
      <YStack flex={1} backgroundColor="$backgroundDark">
        <Text
          fontSize="$4"
          color="$textTertiary"
          textAlign="center"
          marginTop="$8"
        >
          Sponsor not found
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$backgroundDark">
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 128,
          alignItems: "center",
          gap: 24,
        }}
      >
        <YStack
          width={220}
          height={220}
          alignItems="center"
          justifyContent="center"
          marginTop="$4"
        >
          <Image
            source={imageUrl ? { uri: imageUrl } : undefined}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "contain",
            }}
          />
        </YStack>

        <Text fontSize="$8" fontWeight="700" color="white" textAlign="center">
          {sponsor.name}
        </Text>

        <YStack
          backgroundColor="$cardDark"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$primaryOpacity10"
          padding="$4"
          width="100%"
          gap="$3"
          marginBottom="$8"
        >
          {sponsor.description.split("\n\n").map((paragraph: string) => (
            <Text
              key={paragraph}
              fontSize="$4"
              color="white"
              textAlign="center"
              lineHeight={28}
            >
              {paragraph}
            </Text>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
