import { Stack } from 'expo-router';

const backgroundColor = "#17181c";
const headerTintColor = "#00ced1";

export default function ProfileLayout() {
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
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="admin/index" options={{ headerShown: false }} />
      <Stack.Screen name="admin/challenges/index" options={{ title: "Manage Challenges", headerBackTitle: "Back" }} />
      <Stack.Screen name="admin/challenges/[id]" options={{ title: "Edit Challenge", headerBackTitle: "Back" }} />
    </Stack>
  );
}
