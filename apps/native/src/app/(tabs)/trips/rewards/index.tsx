import React from "react";
import { View } from "react-native";
import RewardsView from "~/components/rewards/RewardsView";

interface Props {
  tripId: string;
}

export default function RewardsPage({ tripId }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <RewardsView tripId={tripId} />
    </View>
  );
}
