import { Stack } from "expo-router";

const backgroundColor = "#17181c";
const headerTintColor = "#00ced1";

export default function TripsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor },
        headerTintColor: headerTintColor,
        headerTitleStyle: {
          fontFamily: "IBMPlexSans_600SemiBold",
          color: "#ffffff",
        },
        contentStyle: { backgroundColor },
        
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="details" options={{ headerShown: false }} />
      <Stack.Screen name="info" options={{ title: "Trip Info" }} />
      <Stack.Screen name="map/index" options={{ title: "Map" }} />
      <Stack.Screen name="groups/index" options={{ title: "Groups" }} />
      <Stack.Screen name="groups/[id]" options={{ title: "Group Details" }} />
      <Stack.Screen name="groups/create" options={{ title: "Create Group" }} />
      <Stack.Screen name="groups/edit/[id]" options={{ title: "Edit Group" }} />
      <Stack.Screen name="challenges/index" options={{ title: "Challenges" }} />
      <Stack.Screen name="challenges/[id]" options={{ title: "Challenge Details" }} />
      <Stack.Screen name="challenges/vote/[id]" options={{ title: "Peer Voting" }} />
      <Stack.Screen name="rewards/index" options={{ title: "Rewards" }} />
      <Stack.Screen name="rewards/history" options={{ title: "My Rewards" }} />
      <Stack.Screen name="leaderboard/index" options={{ title: "Leaderboard" }} />
      <Stack.Screen name="partners/[id]" options={{ title: "Partner" }} />
    </Stack>
  );
}
