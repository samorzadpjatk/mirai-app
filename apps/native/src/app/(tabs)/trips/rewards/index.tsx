import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import RewardsView from "~/components/rewards/RewardsView";

export default function RewardsPage() {
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  if (!tripId) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <RewardsView tripId={tripId} />
    </View>
  );
}
