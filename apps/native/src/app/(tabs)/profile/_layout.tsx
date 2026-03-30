import { Stack } from "expo-router";

const backgroundColor = "#17181c";
const headerTintColor = "#00ced1";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide by default; override per screen
        headerStyle: { backgroundColor },
        headerTintColor,
        headerTitleStyle: {
          fontFamily: "IBMPlexSans_600SemiBold",
          color: "#ffffff",
        },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: true,
          title: "Edit Profile",
        }}
      />
      <Stack.Screen
        name="admin-web"
        options={{
          headerShown: true,
          title: "Web Admin",
        }}
      />
    </Stack>
  );
}
