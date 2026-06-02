import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import RewardsHistoryView from "~/components/rewards/RewardsHistoryView";

export default function RewardsHistoryPage() {
  const params = useLocalSearchParams();
  const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];

  if (!tripId) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <RewardsHistoryView tripId={tripId} />
    </View>
  );
}
